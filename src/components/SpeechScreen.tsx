import type { Speech } from "../types";

interface SpeechScreenProps {
  speech: Speech;
  onStart?: () => void;
  onBack?: () => void;
}

export function SpeechScreen({ speech, onStart, onBack }: SpeechScreenProps) {
  return (
    <section className="card" aria-labelledby="speech-heading">
      <h1 id="speech-heading" className="speech-title">
        {speech.title}
      </h1>
      <p className="speech-byline">
        {speech.author}, {speech.year}
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
            <button type="button" className="btn btn-primary" onClick={onStart}>
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
