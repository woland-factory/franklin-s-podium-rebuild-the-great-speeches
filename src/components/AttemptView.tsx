import { useEffect, useState } from "react";
import type { Attempt, Speech } from "../types";
import { AlignmentSurface } from "./AlignmentSurface";
import { formatStamp, modeLabel } from "../lib/format";

interface AttemptViewProps {
  speech: Speech;
  attempt: Attempt;
  onBack: () => void;
  keptPhrases?: Set<string>;
  onToggleKeep?: (phrase: string) => void;
}

/** One archived attempt rendered on the neutral alignment surface. */
export function AttemptView({
  speech,
  attempt,
  onBack,
  keptPhrases,
  onToggleKeep,
}: AttemptViewProps) {
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
    <>
      <div className="btn-row" style={{ marginBottom: 12 }}>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Back to archive
        </button>
      </div>
      <p className="attempt-caption">
        {modeLabel(attempt.mode)} attempt, {formatStamp(attempt.created_at)}
      </p>
      <AlignmentSurface
        pairs={attempt.alignment}
        audioUrl={audioUrl}
        originalLabel={speech.author}
        keptPhrases={keptPhrases}
        onToggleKeep={onToggleKeep}
      />
    </>
  );
}
