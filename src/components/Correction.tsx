import { useState } from "react";

interface CorrectionProps {
  initialText: string;
  onSubmit: (text: string) => void;
}

export function Correction({ initialText, onSubmit }: CorrectionProps) {
  const [text, setText] = useState(initialText);

  return (
    <section className="card correction" aria-labelledby="correction-heading">
      <h2 id="correction-heading">Fix any misheard words</h2>
      <label className="field-label" htmlFor="transcript">
        Your spoken reconstruction, as heard on your device.
      </label>
      <textarea
        id="transcript"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck
      />
      <div className="btn-row" style={{ marginTop: 12 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onSubmit(text)}
          disabled={text.trim().length === 0}
        >
          Study alignment
        </button>
      </div>
    </section>
  );
}
