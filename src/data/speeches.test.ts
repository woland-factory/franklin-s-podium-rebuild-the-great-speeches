import { describe, it, expect } from "vitest";
import { speeches, getSpeech, featuredSpeechId } from "./speeches";

// Product-voice strings (hint decks) are swept; verbatim speech text is exempt.
const BANNED_WORDS = [
  "seamlessly",
  "effortlessly",
  "unlock",
  "elevate",
  "empower",
  "leverage",
  "robust",
  "dive in",
  "we've got you covered",
];
const NEGATIVE_PHRASES = [
  /you don't have/i,
  /no .* yet\b/i,
  /nothing .* here/i,
  /unable to/i,
  /something went wrong/i,
];

describe("speech registry", () => {
  it("ships at least four curated speeches including Gettysburg", () => {
    expect(speeches.length).toBeGreaterThanOrEqual(4);
    expect(speeches.some((s) => s.id === "gettysburg")).toBe(true);
  });

  it("looks a speech up by id and misses gracefully", () => {
    expect(getSpeech("gettysburg")?.title).toMatch(/gettysburg/i);
    expect(getSpeech("does-not-exist")).toBeUndefined();
    expect(getSpeech(null)).toBeUndefined();
  });

  it("points the featured id at a real speech with a bundled demo", () => {
    expect(getSpeech(featuredSpeechId)).toBeDefined();
  });

  it("gives every speech unique, complete metadata", () => {
    const ids = new Set<string>();
    for (const s of speeches) {
      expect(s.id).toBeTruthy();
      expect(ids.has(s.id)).toBe(false);
      ids.add(s.id);
      expect(s.title.trim().length).toBeGreaterThan(0);
      expect(s.author.trim().length).toBeGreaterThan(0);
      expect(Number.isFinite(s.year)).toBe(true);
      expect(s.sentences.length).toBeGreaterThan(0);
      expect(s.hint_deck.length).toBeGreaterThan(0);
      expect(s.public_domain_basis.trim().length).toBeGreaterThan(0);
      expect(s.source_url).toMatch(/^https?:\/\//);
    }
  });

  it("keeps every speech clearly public domain", () => {
    for (const s of speeches) {
      const isGovWork = /government work|us history|public domain/i.test(
        s.public_domain_basis,
      );
      expect(s.year < 1929 || isGovWork).toBe(true);
    }
  });

  it("keeps hint decks in clean product voice", () => {
    for (const s of speeches) {
      for (const hint of s.hint_deck) {
        expect(hint).not.toContain("—");
        expect(hint).not.toContain("–");
        expect(hint).not.toContain("%");
        const lower = hint.toLowerCase();
        for (const word of BANNED_WORDS) {
          expect(lower.includes(word)).toBe(false);
        }
        for (const re of NEGATIVE_PHRASES) {
          expect(re.test(hint)).toBe(false);
        }
      }
    }
  });
});
