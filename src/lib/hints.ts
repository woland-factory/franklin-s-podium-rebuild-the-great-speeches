// Deterministic hint extraction for pasted text. No LLM: every cue is drawn
// from its own sentence, never a paraphrase produced by a model. All functions
// are pure and unit-testable.
import { segmentSentences } from "../align/segment";

export const PASTE_MAX_CHARS = 10000;
export const PASTE_MIN_CHARS = 40;
export const HINT_WORDS = 8;

export type PasteValidation =
  | { ok: true }
  | { ok: false; reason: "too-long" | "too-short" };

/** Bounds-check pasted text. Rejects rather than silently truncating. */
export function validatePaste(text: string): PasteValidation {
  const trimmed = text.trim();
  if (trimmed.length > PASTE_MAX_CHARS) return { ok: false, reason: "too-long" };
  if (trimmed.length < PASTE_MIN_CHARS) return { ok: false, reason: "too-short" };
  return { ok: true };
}

// Source text, not a spoken transcript, so collapse whitespace only. The
// spoken-transcript filler cleanup does not run here.
function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

const TRAILING_PUNCT = /[.!?;:,"')\]]+$/;

// One memory cue per sentence: the leading clause up to the first , ; or :,
// or the first HINT_WORDS words, whichever is shorter. An ellipsis marks a cue
// that stops short of its sentence, so it reads as a prompt, not a paraphrase.
function cueFromSentence(sentence: string): string {
  const s = sentence.trim();
  const clauseMatch = s.match(/^[^,;:]+/);
  const clause = (clauseMatch ? clauseMatch[0] : s).trim();
  const firstWords = s.split(/\s+/).slice(0, HINT_WORDS).join(" ");
  let cue = (clause.length <= firstWords.length ? clause : firstWords).trim();
  cue = cue.replace(TRAILING_PUNCT, "").trim();

  const core = s.replace(TRAILING_PUNCT, "").trim();
  if (cue.length > 0 && cue.length < core.length) cue = `${cue}...`;
  return cue;
}

/** Segment pasted text into sentences and a matching one-line cue each. */
export function extractDeck(text: string): {
  sentences: string[];
  hints: string[];
} {
  const sentences = segmentSentences(normalizeText(text));
  const hints = sentences.map(cueFromSentence);
  return { sentences, hints };
}

/** A short, deterministic title from the opening words. */
export function deriveTitle(text: string): string {
  const sentences = segmentSentences(normalizeText(text));
  const first = sentences[0] ?? normalizeText(text);
  const words = first.split(/\s+/).filter(Boolean).slice(0, 6);
  const title = words.join(" ").replace(TRAILING_PUNCT, "").trim();
  return title || "Your text";
}
