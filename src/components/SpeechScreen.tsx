import type { Speech } from "../types";

export function SpeechScreen({ speech }: { speech: Speech }) {
  return (
    <section className="card" aria-labelledby="speech-heading">
      <h1 id="speech-heading" className="speech-title">
        {speech.title}
      </h1>
      <p className="speech-byline">
        {speech.author}, {speech.year}
      </p>

      <h2>The ten moves</h2>
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
    </section>
  );
}
