// A small set of abbreviations that carry a period without ending a sentence.
const ABBREVIATIONS = new Set([
  "mr",
  "mrs",
  "ms",
  "dr",
  "st",
  "vs",
  "etc",
  "jr",
  "sr",
  "gen",
  "gov",
  "sen",
  "no",
]);

/**
 * Split free text into sentences on terminal punctuation. Robust to trailing
 * quotes and a small abbreviation set. Deterministic and model-independent.
 */
export function segmentSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const out: string[] = [];
  let current = "";

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    current += ch;

    if (ch === "." || ch === "!" || ch === "?") {
      // Absorb any run of terminal punctuation and closing quotes/brackets.
      while (i + 1 < trimmed.length && /[.!?"')\]]/.test(trimmed[i + 1])) {
        i++;
        current += trimmed[i];
      }

      const lastWord = current
        .slice(0, current.length)
        .replace(/[.!?"')\]]+$/, "")
        .split(/\s+/)
        .pop();

      const isAbbrev =
        ch === "." &&
        lastWord != null &&
        ABBREVIATIONS.has(lastWord.toLowerCase());

      // A sentence ends when the next non-space starts a new sentence
      // (or the text ends), and we are not sitting on a known abbreviation.
      const rest = trimmed.slice(i + 1);
      const endsHere = rest.trim().length === 0 || !isAbbrev;

      if (endsHere) {
        const s = current.trim();
        if (s) out.push(s);
        current = "";
      }
    }
  }

  const tail = current.trim();
  if (tail) out.push(tail);
  return out;
}
