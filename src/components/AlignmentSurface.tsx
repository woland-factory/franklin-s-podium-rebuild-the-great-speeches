import type { AlignmentPair } from "../types";

interface AlignmentSurfaceProps {
  pairs: AlignmentPair[];
  audioUrl?: string | null;
  originalLabel?: string;
  // Originals already kept to the ledger for this source. When onToggleKeep is
  // provided, each original-bearing pair shows a keep toggle. The control is
  // additive and positive: it marks a line worth taking, never a line marked
  // wrong. No score, no count, no error styling.
  keptPhrases?: Set<string>;
  onToggleKeep?: (phrase: string) => void;
}

export function AlignmentSurface({
  pairs,
  audioUrl,
  originalLabel = "The original",
  keptPhrases,
  onToggleKeep,
}: AlignmentSurfaceProps) {
  return (
    <section className="card" aria-labelledby="align-heading">
      <h2 id="align-heading">Your words beside the original</h2>
      <p className="muted">
        Read each pair across. An empty side is a line that only one of you
        reached.
      </p>

      {audioUrl ? (
        <div className="audio-replay">
          <label className="field-label" htmlFor="replay">
            Play your take back to check any line.
          </label>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio id="replay" src={audioUrl} controls preload="metadata" />
        </div>
      ) : null}

      <div className="align-cols-head" aria-hidden="true">
        <span>You said</span>
        <span>{originalLabel}</span>
      </div>

      <div className="align-list">
        {pairs.map((pair, i) => (
          <article className="pair" key={i}>
            <div className="pair-cols">
              <div className="pair-cell">
                <div className="pair-role">You said</div>
                {pair.spoken ? (
                  <p>{pair.spoken}</p>
                ) : (
                  <p className="pair-empty">In the original, not in yours.</p>
                )}
              </div>
              <div className="pair-cell">
                <div className="pair-role">{originalLabel}</div>
                {pair.original ? (
                  <p>{pair.original}</p>
                ) : (
                  <p className="pair-empty">In yours, not the original.</p>
                )}
                {onToggleKeep && pair.original ? (
                  <KeepToggle
                    phrase={pair.original}
                    kept={keptPhrases?.has(pair.original) ?? false}
                    onToggle={onToggleKeep}
                  />
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function KeepToggle({
  phrase,
  kept,
  onToggle,
}: {
  phrase: string;
  kept: boolean;
  onToggle: (phrase: string) => void;
}) {
  return (
    <button
      type="button"
      className={kept ? "keep-btn kept" : "keep-btn"}
      aria-pressed={kept}
      aria-label={
        kept ? "Remove this line from your ledger" : "Keep this line"
      }
      onClick={() => onToggle(phrase)}
    >
      {kept ? "Kept" : "Keep"}
    </button>
  );
}
