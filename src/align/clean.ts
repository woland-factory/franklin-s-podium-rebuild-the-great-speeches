// A short, fixed filler set. Multi-word phrases are removed first so their
// single-word parts do not strand. This is transcript cleanup, never a metric.
const FILLER_PHRASES = ["you know", "i mean", "sort of", "kind of"];
const FILLER_WORDS = ["um", "uh", "er", "ah", "hmm", "mm", "like"];

/**
 * Deterministic pre-alignment cleanup: drop the fixed filler set, collapse
 * immediate stutters/restarts, and normalize whitespace. The result is what
 * the user sees for one-tap correction.
 */
export function cleanTranscript(raw: string): string {
  if (!raw) return "";
  let text = raw;

  // Remove multi-word filler phrases first (case-insensitive, whole words).
  for (const phrase of FILLER_PHRASES) {
    const re = new RegExp(`\\b${phrase.replace(/ /g, "\\s+")}\\b`, "gi");
    text = text.replace(re, " ");
  }

  // Remove single filler words.
  const wordRe = new RegExp(`\\b(?:${FILLER_WORDS.join("|")})\\b`, "gi");
  text = text.replace(wordRe, " ");

  // Collapse immediate duplicated words ("the the", "we we can"), ignoring
  // case and any punctuation glued to the token.
  text = collapseRepeats(text);

  // Normalize whitespace and tidy spacing before punctuation.
  text = text
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

function collapseRepeats(text: string): string {
  const tokens = text.split(/\s+/);
  const out: string[] = [];
  const bare = (t: string) => t.toLowerCase().replace(/[^a-z0-9']/g, "");
  for (const tok of tokens) {
    const prev = out[out.length - 1];
    if (prev != null && bare(prev) !== "" && bare(prev) === bare(tok)) {
      continue;
    }
    out.push(tok);
  }
  return out.join(" ");
}
