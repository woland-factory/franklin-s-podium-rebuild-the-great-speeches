import { describe, it, expect } from "vitest";
import {
  validatePaste,
  extractDeck,
  deriveTitle,
  PASTE_MAX_CHARS,
  PASTE_MIN_CHARS,
} from "./hints";

describe("validatePaste", () => {
  it("rejects text over the maximum", () => {
    const long = "a".repeat(PASTE_MAX_CHARS + 1);
    expect(validatePaste(long)).toEqual({ ok: false, reason: "too-long" });
  });

  it("rejects text under the minimum", () => {
    expect(validatePaste("too short")).toEqual({
      ok: false,
      reason: "too-short",
    });
    expect(validatePaste("   ")).toEqual({ ok: false, reason: "too-short" });
  });

  it("accepts a normal paste and ignores surrounding whitespace", () => {
    const ok = "  " + "x".repeat(PASTE_MIN_CHARS) + "  ";
    expect(validatePaste(ok)).toEqual({ ok: true });
  });
});

describe("extractDeck", () => {
  it("returns one cue per sentence, equal length and order", () => {
    const text =
      "Four score and seven years ago our fathers brought forth a new nation. " +
      "Now we are engaged in a great civil war.";
    const { sentences, hints } = extractDeck(text);
    expect(sentences).toHaveLength(2);
    expect(hints).toHaveLength(2);
  });

  it("derives each cue only from its own sentence (a prefix, not a paraphrase)", () => {
    const text = "We hold these truths to be self evident, that all are equal.";
    const { sentences, hints } = extractDeck(text);
    const cue = hints[0];
    // The cue is the leading clause up to the first comma.
    expect(cue).toBe("We hold these truths to be self evident...");
    // Strip the ellipsis and it is a literal prefix of its sentence.
    const stem = cue.replace(/\.\.\.$/, "");
    expect(sentences[0].startsWith(stem)).toBe(true);
  });

  it("caps a long clause at the word budget", () => {
    const text =
      "Four score and seven years ago our fathers brought forth a nation.";
    const { hints } = extractDeck(text);
    // Eight words, then an ellipsis because the sentence runs longer.
    expect(hints[0]).toBe("Four score and seven years ago our fathers...");
  });

  it("collapses newlines and whitespace runs", () => {
    const text = "First line.\n\n   Second   line here.";
    const { sentences } = extractDeck(text);
    expect(sentences).toEqual(["First line.", "Second line here."]);
  });

  it("marks a clipped cue but not a whole-sentence one", () => {
    const { hints } = extractDeck(
      "Keep it short and simple please for everyone here now.",
    );
    // Ten words, so the cue stops at the budget and gets the trailing marker.
    expect(hints[0]).toBe("Keep it short and simple please for everyone...");
    const { hints: full } = extractDeck("Short enough already for a cue line.");
    // Seven words, whole sentence fits the budget, so no trailing marker.
    expect(full[0]).toBe("Short enough already for a cue line");
  });
});

describe("deriveTitle", () => {
  it("takes the first few words, trimmed of punctuation", () => {
    expect(deriveTitle("My speech about courage, and other things.")).toBe(
      "My speech about courage, and other",
    );
  });

  it("is deterministic for the same input", () => {
    const t = "A steady opening line to a talk.";
    expect(deriveTitle(t)).toBe(deriveTitle(t));
  });

  it("falls back to a positive default on empty input", () => {
    expect(deriveTitle("   ")).toBe("Your text");
    expect(deriveTitle("...")).toBe("Your text");
  });
});
