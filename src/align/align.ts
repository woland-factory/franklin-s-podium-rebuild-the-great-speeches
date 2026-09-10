import type { AlignmentPair } from "../types";

// A tiny stopword set removed only when scoring similarity, so paraphrase and
// reordering still match on content words. The user never sees this normalization.
const STOPWORDS = new Set([
  "the", "a", "an", "of", "to", "and", "in", "on", "that", "this", "is",
  "are", "was", "were", "we", "our", "for", "it", "be", "as", "so", "or",
  "with", "by", "from", "at", "has", "have", "had", "who", "which", "not",
  "but", "i", "you", "they", "he", "she", "will", "shall", "can", "us",
  "here", "there", "these", "those", "their", "his", "her", "its", "do",
]);

// A pair is "aligned" only when meaning overlap clears this floor. Below it,
// the two sentences separate into their own gap rows instead of a forced match.
const MATCH_THRESHOLD = 0.2;

function tokens(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0 && !STOPWORDS.has(t));
}

/**
 * Dice similarity over content-word sets. Symmetric, tolerant of paraphrase
 * and of word reordering within a sentence.
 */
export function similarity(a: string, b: string): number {
  const setA = new Set(tokens(a));
  const setB = new Set(tokens(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter++;
  return (2 * inter) / (setA.size + setB.size);
}

/**
 * Order-preserving alignment of a spoken reconstruction against the original
 * sentences. Needleman-Wunsch over lexical overlap: position is honored
 * because the alignment is monotonic, overlap decides which sentences pair.
 *
 * Output is a neutral, ordered list of pairs. It carries no score, percentage,
 * grade, or pass/fail state. `relation` is a structural label, not a rating.
 */
export function align(
  spokenSentences: string[],
  originalSentences: string[],
): AlignmentPair[] {
  const spoken = spokenSentences.map((s) => s.trim()).filter(Boolean);
  const original = originalSentences.map((s) => s.trim()).filter(Boolean);
  const n = spoken.length;
  const m = original.length;

  // score[i][j] = best total over spoken[0..i) and original[0..j).
  // A gap contributes 0; a diagonal contributes (similarity - threshold), so a
  // weak pair scores below two gaps and is left unmatched.
  const score: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  const sim: number[][] = Array.from({ length: n }, () =>
    new Array<number>(m).fill(0),
  );

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const s = similarity(spoken[i - 1], original[j - 1]);
      sim[i - 1][j - 1] = s;
      const diag = score[i - 1][j - 1] + (s - MATCH_THRESHOLD);
      const up = score[i - 1][j]; // consume spoken (spoken-only)
      const left = score[i][j - 1]; // consume original (original-only)
      score[i][j] = Math.max(diag, up, left);
    }
  }

  // Traceback. On ties, prefer the diagonal so aligned pairs stay together,
  // which also breaks ties by position proximity.
  const pairs: AlignmentPair[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const s = sim[i - 1][j - 1];
      const diag = score[i - 1][j - 1] + (s - MATCH_THRESHOLD);
      if (score[i][j] === diag && s >= MATCH_THRESHOLD) {
        pairs.push({
          spoken: spoken[i - 1],
          original: original[j - 1],
          relation: "aligned",
        });
        i--;
        j--;
        continue;
      }
    }
    if (i > 0 && (j === 0 || score[i][j] === score[i - 1][j])) {
      pairs.push({
        spoken: spoken[i - 1],
        original: null,
        relation: "spoken-only",
      });
      i--;
      continue;
    }
    pairs.push({
      spoken: null,
      original: original[j - 1],
      relation: "original-only",
    });
    j--;
  }

  pairs.reverse();
  return pairs;
}
