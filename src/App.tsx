import { useEffect, useRef, useState } from "react";
import { gettysburg } from "./data/gettysburg";
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
import type { AlignmentPair } from "./types";
import { SpeechScreen } from "./components/SpeechScreen";
import { Recorder } from "./components/Recorder";
import { ModelProgress } from "./components/ModelProgress";
import { Correction } from "./components/Correction";
import { AlignmentSurface } from "./components/AlignmentSurface";
import { FirstRunWalk } from "./components/FirstRunWalk";
import { ErrorState, type ErrorKind } from "./components/ErrorState";

type Phase = "record" | "transcribing" | "correct" | "study";

export function App() {
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

  function setAudioUrl(url: string | null) {
    setAudioUrlState((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }

  function runSample() {
    const spoken = segmentSentences(cleanTranscript(sampleReconstruction));
    setPairs(align(spoken, gettysburg.sentences));
    setIsSample(true);
    setAudioUrl(null);
    setPhase("study");
  }

  useEffect(() => {
    setWalkVisible(!isFirstRunDone());

    let cancelled = false;
    (async () => {
      if (isDemoEnabled()) {
        runSample();
        return;
      }
      try {
        const latest = await getLatestAttempt(gettysburg.id);
        if (!cancelled && latest && latest.alignment.length > 0) {
          setPairs(latest.alignment);
          if (latest.audio_blob) {
            setAudioUrl(URL.createObjectURL(latest.audio_blob));
          }
          setIsSample(false);
          setPhase("study");
        }
      } catch {
        // No prior attempt to restore; start fresh.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const spoken = segmentSentences(text);
    const result = align(spoken, gettysburg.sentences);
    setPairs(result);
    setIsSample(false);

    const blob = blobRef.current;
    if (blob) setAudioUrl(URL.createObjectURL(blob));

    void saveAttempt({
      id: gettysburg.id,
      speech_id: gettysburg.id,
      created_at: Date.now(),
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
  }

  const activeStep =
    phase === "record" ? 1 : phase === "study" ? 3 : 2;
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

      {phase !== "study" ? <SpeechScreen speech={gettysburg} /> : null}

      {phase === "record" ? (
        <section className="card">
          <h2>Record your reconstruction</h2>
          <p className="muted">
            Read the hints, then speak the speech in your own words. Your audio
            stays on your device.
          </p>
          {error ? (
            <ErrorState kind={error} onRetry={() => setError(null)} />
          ) : (
            <Recorder onComplete={handleRecorded} onDenied={() => setError("mic-denied")} />
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
                This is a sample reconstruction. Record your own to study your
                version.
              </p>
              <button type="button" className="btn btn-primary" onClick={startFresh}>
                Record your version
              </button>
            </div>
          ) : null}
          <AlignmentSurface pairs={pairs} audioUrl={audioUrl} />
          {!isSample ? (
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button type="button" className="btn" onClick={startFresh}>
                Record again
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
