import type { Speech } from "../types";

interface LibraryProps {
  speeches: Speech[];
  onSelect: (id: string) => void;
}

export function Library({ speeches, onSelect }: LibraryProps) {
  return (
    <section className="card" aria-labelledby="library-heading">
      <h1 id="library-heading" className="speech-title">
        The speech library
      </h1>
      <p className="library-intro">Pick a speech to rebuild from memory.</p>

      <ul className="speech-list">
        {speeches.map((speech) => (
          <li key={speech.id}>
            <button
              type="button"
              className="speech-row"
              onClick={() => onSelect(speech.id)}
            >
              <span className="speech-row-title">{speech.title}</span>
              <span className="speech-row-meta">
                {speech.author}, {speech.year}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <p className="paste-entry-line">
        <a className="paste-entry" href="#/paste">
          Practice your own text
        </a>
      </p>
    </section>
  );
}
