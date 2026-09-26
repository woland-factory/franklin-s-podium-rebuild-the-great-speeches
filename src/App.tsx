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
} from "./lib/db";
import { isDemoEnabled } from "./lib/env";
import { parseHash, buildHash, type View } from "./lib/nav";
import type { AlignmentPair } from "./types";
import { Library } from "./components/Library";
import { SpeechScreen } from "./components/SpeechScreen";
import { Recorder } from "./components/Recorder";
import { ModelProgress } from "./components/ModelProgress";
import { Correction } from "./components/Correction";
import { AlignmentSurface } from "./components/AlignmentSurface";
import { FirstRunWalk } from "./components/FirstRunWalk";
import { ErrorState, type ErrorKind } from "./components/ErrorState";

type Phase = "record" | "transcribing" | "correct" | "study";

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

  // Restore a speech's single saved attempt into the study surface, mirroring
  // the EPIC 1 restore but scoped to one speech. Returns true if one was found.
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
      void restoreLatest(route.speechId);
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
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function goLibrary() {
    setError(null);
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
    window.location.hash = buildHash("read", id);
    void restoreLatest(id);
  }

  function startWarmup() {
    if (!selectedSpeechId) return;
    setError(null);
    setIsSample(false);
    setPairs([]);
    setAudioUrl(null);
    blobRef.current = null;
    setPhase("record");
    setView("reconstruct");
    window.location.hash = buildHash("reconstruct", selectedSpeechId);
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

  function handleStudy(text: string) {
    const speech = getSpeech(selectedSpeechId);
    if (!speech) return;
    const spoken = segmentSentences(text);
    const result = align(spoken, speech.sentences);
    setPairs(result);
    setIsSample(false);

    const blob = blobRef.current;
    if (blob) setAudioUrl(URL.createObjectURL(blob));

    void saveAttempt({
      id: crypto.randomUUID(),
      speech_id: speech.id,
      created_at: Date.now(),
      mode: "warmup",
      transcript: rawTranscript,
      corrected_transcript: text,
      audio_blob: blob,
      alignment: result,
    }).catch(() => {
      // Persistence is best-effort; the surface still renders.
    });

    markFirstRunDone();
    setWalkVisible(false);
    setPhase("study");
  }

  function startFresh() {
    setError(null);
    setAudioUrl(null);
    setPairs([]);
    setIsSample(false);
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
      ) : view === "read" && selectedSpeech ? (
        <SpeechScreen
          speech={selectedSpeech}
          onStart={startWarmup}
          onBack={goLibrary}
        />
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
