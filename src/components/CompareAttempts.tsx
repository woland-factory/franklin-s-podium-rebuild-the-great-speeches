import { useEffect, useState } from "react";
import type { Attempt, Speech } from "../types";
import { AlignmentSurface } from "./AlignmentSurface";
import { formatShortDate, modeLabel } from "../lib/format";

interface CompareAttemptsProps {
  speech: Speech;
  newer: Attempt;
  older: Attempt | null;
  onBack: () => void;
  onRecordAnother: () => void;
  keptPhrases?: Set<string>;
  onToggleKeep?: (phrase: string) => void;
}

function CompareColumn({
  speech,
  attempt,
  keptPhrases,
  onToggleKeep,
}: {
  speech: Speech;
  attempt: Attempt;
  keptPhrases?: Set<string>;
  onToggleKeep?: (phrase: string) => void;
}) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!attempt.audio_blob) {
      setAudioUrl(null);
      return;
    }
    const url = URL.createObjectURL(attempt.audio_blob);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [attempt.audio_blob]);

  return (
    <div className="compare-col">
      <h2 className="compare-col-head">
        {modeLabel(attempt.mode)} attempt, {formatShortDate(attempt.created_at)}
      </h2>
      <AlignmentSurface
        pairs={attempt.alignment}
        audioUrl={audioUrl}
        originalLabel={speech.author}
        keptPhrases={keptPhrases}
        onToggleKeep={onToggleKeep}
      />
    </div>
  );
}

/**
 * Two of the user's own takes on the same neutral surface. No ranking, no
 * aggregate, no "better" verdict. The user reads the gap for themselves.
 */
export function CompareAttempts({
  speech,
  newer,
  older,
  onBack,
  onRecordAnother,
  keptPhrases,
  onToggleKeep,
}: CompareAttemptsProps) {
  return (
    <section aria-labelledby="compare-heading">
      <div className="btn-row" style={{ marginBottom: 10 }}>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Back to archive
        </button>
      </div>
      <h1 id="compare-heading" className="speech-title">
        Two takes on {speech.title}
      </h1>

      {older ? (
        <div className="compare-grid">
          <CompareColumn
            speech={speech}
            attempt={newer}
            keptPhrases={keptPhrases}
            onToggleKeep={onToggleKeep}
          />
          <CompareColumn
            speech={speech}
            attempt={older}
            keptPhrases={keptPhrases}
            onToggleKeep={onToggleKeep}
          />
        </div>
      ) : (
        <div className="card">
          <p className="muted">
            Record another take to set it beside this one.
          </p>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onRecordAnother}
            >
              Record another
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
