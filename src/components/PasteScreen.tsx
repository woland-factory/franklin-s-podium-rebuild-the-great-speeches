import { useState } from "react";
import type { UserText } from "../types";
import {
  validatePaste,
  extractDeck,
  deriveTitle,
  PASTE_MAX_CHARS,
} from "../lib/hints";
import { saveUserText } from "../lib/db";

interface PasteScreenProps {
  onCreated: (t: UserText) => void;
  onBack: () => void;
}

const PLACEHOLDER = `Paste a passage you want to practice. For example:

We choose to go to the moon in this decade and do the other things, not because they are easy, but because they are hard.`;

type ErrKind = "too-long" | "too-short" | null;

export function PasteScreen({ onCreated, onBack }: PasteScreenProps) {
  const [text, setText] = useState("");
  const [err, setErr] = useState<ErrKind>(null);
  const [working, setWorking] = useState(false);

  async function submit() {
    const check = validatePaste(text);
    if (!check.ok) {
      setErr(check.reason);
      return;
    }
    setErr(null);
    setWorking(true);
    try {
      const { sentences, hints } = extractDeck(text);
      const userText: UserText = {
        id: "paste:" + crypto.randomUUID(),
        title: deriveTitle(text),
        text: text.trim(),
        sentences,
        hints,
        created_at: Date.now(),
      };
      await saveUserText(userText);
      onCreated(userText);
    } catch {
      setWorking(false);
      setErr("too-short");
    }
  }

  return (
    <section className="card" aria-labelledby="paste-heading">
      <h1 id="paste-heading" className="speech-title">
        Practice your own text
      </h1>
      <p className="library-intro">
        Paste a passage. We turn it into the same read, speak, and study loop.
      </p>

      <label className="field-label" htmlFor="paste-input">
        Your text
      </label>
      <textarea
        id="paste-input"
        className="paste-input"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (err) setErr(null);
        }}
        placeholder={PLACEHOLDER}
        rows={10}
      />

      {err === "too-long" ? (
        <p className="paste-error" role="alert">
          That passage runs long. Keep it under {PASTE_MAX_CHARS.toLocaleString()}{" "}
          characters, then try again.
        </p>
      ) : null}
      {err === "too-short" ? (
        <p className="paste-error" role="alert">
          Add a few more sentences to give the loop something to work with.
        </p>
      ) : null}

      <div className="btn-row" style={{ marginTop: 12 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void submit()}
          disabled={working}
        >
          {working ? "Building" : "Find the moves"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Back
        </button>
      </div>
    </section>
  );
}
