import { useEffect, useRef, useState } from "react";
import { speeches, getSpeech, featuredSpeechId } from "./data/speeches";
import { sampleReconstruction } from "./data/sampleReconstruction";
import { align } from "./align/align";
import { cleanTranscript } from "./align/clean";
import { segmentSentences } from "./align/segment";
import { getTranscript, type LoadProgress } from "./lib/transcribe";
import {
  getLatestAttempt,
  isFirstRunDone,
  markFirstRunDone,
  saveAttempt,
  saveSchedule,
  getSchedule,
  clearSchedule,
  markScheduleDone,
  countAttempts,
  listAttempts,
} from "./lib/db";
import { revealAtFromDays, scheduleState, isValidGap } from "./lib/schedule";
import { isDemoEnabled } from "./lib/env";
import { parseHash, buildHash, type View } from "./lib/nav";
import type { AlignmentPair, Attempt, AttemptMode, ScheduleEntry } from "./types";
import { Library } from "./components/Library";
import { SpeechScreen } from "./components/SpeechScreen";
import { SchedulePanel } from "./components/SchedulePanel";
import { Archive } from "./components/Archive";
import { AttemptView } from "./components/AttemptView";
import { CompareAttempts } from "./components/CompareAttempts";
import { Recorder } from "./components/Recorder";
import { ModelProgress } from "./components/ModelProgress";
import { Correction } from "./components/Correction";
import { AlignmentSurface } from "./components/AlignmentSurface";
import { FirstRunWalk } from "./components/FirstRunWalk";
import { ErrorState, type ErrorKind } from "./components/ErrorState";

type Phase = "record" | "transcribing" | "correct" | "study";
type ComparePair = { newer: Attempt; older: Attempt | null };

export function App() {
  const [view, setView] = useState<View>("library");
  const [selectedSpeechId, setSelectedSpeechId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("record");
  const [error, setError] = useState<ErrorKind | null>(null);
  const [rawTranscript, setRawTranscript] = useState("");
  const [cleaned, setCleaned] = useState("");
  const [pairs, setPairs] = useState<AlignmentPair[]>([]);
  const [audioUrl, setAudioUrlState] = useState<string | null>(null);
  const [progress, setProgress] = useState<LoadProgress>({
    progress: null,
    backend: null,
    phase: "loading",
  });
  const [walkVisible, setWalkVisible] = useState(false);
  const [isSample, setIsSample] = useState(false);
  const [attemptMode, setAttemptMode] = useState<AttemptMode>("warmup");
  const [schedule, setSchedule] = useState<ScheduleEntry | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [openedAttempt, setOpenedAttempt] = useState<Attempt | null>(null);
  const [compare, setCompare] = useState<ComparePair | null>(null);

  const blobRef = useRef<Blob | null>(null);
  const selectedSpeech = getSpeech(selectedSpeechId);

  function setAudioUrl(url: string | null) {
    setAudioUrlState((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }

  function runSample() {
    const featured = getSpeech(featuredSpeechId);
    if (!featured) return;
    const spoken = segmentSentences(cleanTranscript(sampleReconstruction));
    setSelectedSpeechId(featured.id);
    setPairs(align(spoken, featured.sentences));
    setIsSample(true);
    setAudioUrl(null);
    setPhase("study");
    setView("reconstruct");
  }

  // Load the schedule and attempt count that the read screen shows. Never
  // changes the view, so it is safe to call on Back/Forward too.
  async function loadReadMeta(id: string) {
    setScheduleLoading(true);
    try {
      const [entry, count] = await Promise.all([
        getSchedule(id),
        countAttempts(id),
      ]);
      setSchedule(entry);
      setAttemptCount(count);
    } catch {
      setSchedule(null);
      setAttemptCount(0);
    } finally {
      setScheduleLoading(false);
    }
  }

  // Restore a speech's newest saved attempt into the study surface. Returns
  // true if one was found.
  async function restoreLatest(id: string): Promise<boolean> {
    try {
      const latest = await getLatestAttempt(id);
      if (latest && latest.alignment.length > 0) {
        setPairs(latest.alignment);
        setAudioUrl(latest.audio_blob ? URL.createObjectURL(latest.audio_blob) : null);
        setIsSample(false);
        setPhase("study");
        setView("reconstruct");
        window.location.hash = buildHash("reconstruct", id);
        return true;
      }
    } catch {
      // No prior attempt to restore; the read screen stays put.
    }
    return false;
  }

  // Initial load: demo path, else the deep-linked view with a restore attempt.
  useEffect(() => {
    setWalkVisible(!isFirstRunDone());
    if (isDemoEnabled()) {
      runSample();
      return;
    }
    const route = parseHash(window.location.hash);
    setView(route.view);
    setSelectedSpeechId(route.speechId);
    if (route.speechId && getSpeech(route.speechId)) {
      void loadReadMeta(route.speechId);
      // A reconstruct deep link (a reload after an attempt) restores the study
      // surface. The read screen stays put so its schedule panel shows.
      if (route.view === "reconstruct") void restoreLatest(route.speechId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Back/Forward: reflect the hash into the view. The reconstruction phase is
  // in-memory, so it survives; this never re-restores (that would fight Back).
  useEffect(() => {
    function onHash() {
      const route = parseHash(window.location.hash);
      setView(route.view);
      setSelectedSpeechId(route.speechId);
      if (route.view !== "archive") {
        setOpenedAttempt(null);
        setCompare(null);
      }
      if (route.view === "read" && route.speechId && getSpeech(route.speechId)) {
        void loadReadMeta(route.speechId);
      }
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goLibrary() {
    setError(null);
    setOpenedAttempt(null);
    setCompare(null);
    setView("library");
    window.location.hash = buildHash("library", null);
  }

  function openSpeech(id: string) {
    setSelectedSpeechId(id);
    setError(null);
    setIsSample(false);
    setPairs([]);
    setAudioUrl(null);
    setPhase("record");
    setView("read");
    setOpenedAttempt(null);
    setCompare(null);
    window.location.hash = buildHash("read", id);
    void loadReadMeta(id);
    void restoreLatest(id);
  }

  function beginAttempt(mode: AttemptMode) {
    if (!selectedSpeechId) return;
    setAttemptMode(mode);
    setError(null);
    setIsSample(false);
    setPairs([]);
    setAudioUrl(null);
    blobRef.current = null;
    setPhase("record");
    setView("reconstruct");
    window.location.hash = buildHash("reconstruct", selectedSpeechId);
  }

  function startWarmup() {
    beginAttempt("warmup");
  }

  // Return to the read screen (the moves and the schedule) without restoring,
  // so a user who landed on a restored attempt can still reach scheduling.
  function goToRead() {
    if (!selectedSpeechId) return;
    setError(null);
    setIsSample(false);
    setPhase("record");
    setView("read");
    window.location.hash = buildHash("read", selectedSpeechId);
    void loadReadMeta(selectedSpeechId);
  }

  function startCold() {
    beginAttempt("cold");
  }

  function scheduleGap(days: number) {
    if (!selectedSpeechId || !isValidGap(days)) return;
    const now = Date.now();
    const entry: ScheduleEntry = {
      speech_id: selectedSpeechId,
      condensed_at: now,
      reveal_at: revealAtFromDays(now, days),
      status: "waiting",
    };
    setSchedule(entry); // optimistic: the panel moves to waiting at once
    void saveSchedule(entry).catch(() => {});
  }

  function clearScheduleFor() {
    if (!selectedSpeechId) return;
    setSchedule(null);
    void clearSchedule(selectedSpeechId).catch(() => {});
  }

  function openArchive() {
    if (!selectedSpeechId) return;
    setOpenedAttempt(null);
    setCompare(null);
    setView("archive");
    window.location.hash = buildHash("archive", selectedSpeechId);
  }

  async function compareWithLast() {
    if (!selectedSpeechId) return;
    const page = await listAttempts(selectedSpeechId, { limit: 2 });
    if (page.items.length === 0) return;
    setCompare({ newer: page.items[0], older: page.items[1] ?? null });
    setOpenedAttempt(null);
    setView("archive");
    window.location.hash = buildHash("archive", selectedSpeechId);
  }

  async function handleRecorded(blob: Blob) {
    blobRef.current = blob;
    setError(null);
    setProgress({ progress: null, backend: null, phase: "loading" });
    setPhase("transcribing");
    try {
      const text = await getTranscript(blob, setProgress);
      const clean = cleanTranscript(text);
      if (clean.trim().length < 2) {
        setError("no-speech");
        setPhase("record");
        return;
      }
      setRawTranscript(text);
      setCleaned(clean);
      setPhase("correct");
    } catch {
      setError("transcribe-failed");
      setPhase("record");
    }
  }

  async function handleStudy(text: string) {
    const speech = getSpeech(selectedSpeechId);
    if (!speech) return;
    const spoken = segmentSentences(text);
    const result = align(spoken, speech.sentences);
    setPairs(result);
    setIsSample(false);

    const blob = blobRef.current;
    if (blob) setAudioUrl(URL.createObjectURL(blob));

    // A previous attempt existing before this save enables "compare with last".
    setHasPrevious(attemptCount > 0);

    const mode = attemptMode;
    try {
      await saveAttempt({
        id: crypto.randomUUID(),
        speech_id: speech.id,
        created_at: Date.now(),
        mode,
        transcript: rawTranscript,
        corrected_transcript: text,
        audio_blob: blob,
        alignment: result,
      });
      if (mode === "cold") {
        await markScheduleDone(speech.id);
        setSchedule((prev) => (prev ? { ...prev, status: "done" } : prev));
      }
      const count = await countAttempts(speech.id);
      setAttemptCount(count);
    } catch {
      // Persistence is best-effort; the surface still renders.
    }

    markFirstRunDone();
    setWalkVisible(false);
    setPhase("study");
  }

  function startFresh() {
    setError(null);
    setAudioUrl(null);
    setPairs([]);
    setIsSample(false);
    setAttemptMode("warmup");
    blobRef.current = null;
    setPhase("record");
    if (selectedSpeechId) {
      window.location.hash = buildHash("reconstruct", selectedSpeechId);
    }
  }

  const notFound = view !== "library" && !selectedSpeech;
  const originalLabel = selectedSpeech?.author ?? "The original";
  const activeStep =
    view === "library" ? 0 : view === "read" ? 1 : phase === "study" ? 3 : 2;
  const showWalk = walkVisible && !isSample;
  const scheduleReady =
    scheduleState(schedule, Date.now()) === "ready";

  function pastAttemptsButton() {
    if (attemptCount <= 0) return null;
    return (
      <button type="button" className="btn btn-ghost" onClick={openArchive}>
        Past attempts ({attemptCount})
      </button>
    );
  }

  return (
    <main className="app">
      <header className="masthead">
        <h1>Franklin's Podium</h1>
        <p>Speak a great speech from memory, then study your words beside it.</p>
      </header>

      {showWalk ? (
        <FirstRunWalk
          activeStep={activeStep}
          onSkip={() => {
            markFirstRunDone();
            setWalkVisible(false);
          }}
        />
      ) : null}

      {notFound ? (
        <section className="card" aria-labelledby="notfound-heading">
          <h1 id="notfound-heading" className="speech-title">
            Choose a speech
          </h1>
          <p className="library-intro">
            Pick one from the library to start your warm-up.
          </p>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-primary" onClick={goLibrary}>
              All speeches
            </button>
          </div>
        </section>
      ) : view === "library" ? (
        <Library speeches={speeches} onSelect={openSpeech} />
      ) : view === "archive" && selectedSpeech ? (
        compare ? (
          <CompareAttempts
            speech={selectedSpeech}
            newer={compare.newer}
            older={compare.older}
            onBack={() => setCompare(null)}
            onRecordAnother={startWarmup}
          />
        ) : openedAttempt ? (
          <AttemptView
            speech={selectedSpeech}
            attempt={openedAttempt}
            onBack={() => setOpenedAttempt(null)}
          />
        ) : (
          <Archive
            speech={selectedSpeech}
            onOpen={setOpenedAttempt}
            onCompare={(newer, older) => setCompare({ newer, older })}
            onBack={() => openSpeech(selectedSpeech.id)}
            onStartWarmup={startWarmup}
          />
        )
      ) : view === "read" && selectedSpeech ? (
        <>
          <SpeechScreen
            speech={selectedSpeech}
            onStart={startWarmup}
            onBack={goLibrary}
            startVariant={scheduleReady ? "secondary" : "primary"}
          />
          {scheduleLoading ? (
            <section className="card schedule-panel" aria-hidden="true">
              <div className="skeleton" style={{ width: "50%" }} />
              <div className="skeleton" style={{ width: "80%" }} />
            </section>
          ) : (
            <SchedulePanel
              speech={selectedSpeech}
              schedule={schedule}
              onSchedule={scheduleGap}
              onStartCold={startCold}
              onClear={clearScheduleFor}
            />
          )}
          {attemptCount > 0 ? (
            <div className="btn-row">{pastAttemptsButton()}</div>
          ) : null}
        </>
      ) : selectedSpeech ? (
        <>
          {phase !== "study" ? (
            <SpeechScreen speech={selectedSpeech} onBack={goLibrary} />
          ) : null}

          {phase === "record" ? (
            <section className="card">
              <h2>Record your reconstruction</h2>
              <p className="muted">
                Read the moves, then speak the speech in your own words. Your
                audio stays on your device.
              </p>
              {error ? (
                <ErrorState kind={error} onRetry={() => setError(null)} />
              ) : (
                <Recorder
                  onComplete={handleRecorded}
                  onDenied={() => setError("mic-denied")}
                />
              )}
            </section>
          ) : null}

          {phase === "transcribing" ? <ModelProgress {...progress} /> : null}

          {phase === "correct" ? (
            <Correction initialText={cleaned} onSubmit={handleStudy} />
          ) : null}

          {phase === "study" ? (
            <>
              {isSample ? (
                <div className="banner">
                  <p className="muted">
                    This is a sample reconstruction. Record your own to study
                    your version.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={startWarmup}
                  >
                    Record your version
                  </button>
                </div>
              ) : null}
              <AlignmentSurface
                pairs={pairs}
                audioUrl={audioUrl}
                originalLabel={originalLabel}
              />
              <div className="btn-row" style={{ marginTop: 12 }}>
                {!isSample ? (
                  <button type="button" className="btn" onClick={startFresh}>
                    Record again
                  </button>
                ) : null}
                {!isSample && hasPrevious ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void compareWithLast()}
                  >
                    Compare with your last attempt
                  </button>
                ) : null}
                {!isSample ? pastAttemptsButton() : null}
                {!isSample ? (
                  <button type="button" className="btn btn-ghost" onClick={goToRead}>
                    The moves
                  </button>
                ) : null}
                <button type="button" className="btn btn-ghost" onClick={goLibrary}>
                  All speeches
                </button>
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
