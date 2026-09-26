import type { Speech } from "../types";

interface SpeechScreenProps {
  speech: Speech;
  onStart?: () => void;
  onBack?: () => void;
  // Warm-up is the read screen's primary action until a scheduled reveal
  // arrives, then it steps down to secondary so the cold attempt can lead.
  startVariant?: "primary" | "secondary";
}

export function SpeechScreen({
  speech,
  onStart,
  onBack,
  startVariant = "primary",
}: SpeechScreenProps) {
  return (
    <section className="card" aria-labelledby="speech-heading">
      <h1 id="speech-heading" className="speech-title">
        {speech.title}
      </h1>
      <p className="speech-byline">
        {speech.year > 0 ? `${speech.author}, ${speech.year}` : speech.author}
      </p>

      <h2>The moves</h2>
      <ol className="hint-deck">
        {speech.hint_deck.map((hint, i) => (
          <li key={i}>{hint}</li>
        ))}
      </ol>

      <details className="speech-full">
        <summary>Read the full speech</summary>
        <div className="speech-text">
          {speech.sentences.map((s, i) => (
            <p key={i}>{s}</p>
          ))}
        </div>
      </details>

      {onStart || onBack ? (
        <div className="btn-row" style={{ marginTop: 16 }}>
          {onStart ? (
            <button
              type="button"
              className={startVariant === "primary" ? "btn btn-primary" : "btn"}
              onClick={onStart}
            >
              Start warm-up
            </button>
          ) : null}
          {onBack ? (
            <button type="button" className="btn btn-ghost" onClick={onBack}>
              All speeches
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
