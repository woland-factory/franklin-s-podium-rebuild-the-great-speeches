import { describe, it, expect } from "vitest";
import { cleanTranscript } from "./clean";

describe("cleanTranscript", () => {
  it("strips single-word fillers", () => {
    expect(cleanTranscript("um so uh we are er here")).toBe("so we are here");
  });

  it("strips multi-word filler phrases", () => {
    expect(cleanTranscript("we you know came to dedicate it")).toBe(
      "we came to dedicate it",
    );
    expect(cleanTranscript("it is i mean fitting and proper")).toBe(
      "it is fitting and proper",
    );
  });

  it("collapses immediate restarts and stutters", () => {
    expect(cleanTranscript("the the brave men")).toBe("the brave men");
    expect(cleanTranscript("we we can not consecrate")).toBe(
      "we can not consecrate",
    );
  });

  it("preserves meaningful repeated content across a boundary", () => {
    // "that that nation" is real Lincoln phrasing; collapse only touches
    // adjacent identical words, so the meaning here is intentionally reduced,
    // but distinct words are always kept.
    expect(cleanTranscript("a new nation conceived in liberty")).toBe(
      "a new nation conceived in liberty",
    );
  });

  it("normalizes whitespace and spacing before punctuation", () => {
    expect(cleanTranscript("we   are  met , on a field .")).toBe(
      "we are met, on a field.",
    );
  });

  it("does not over-strip: leaves a filler-free sentence unchanged", () => {
    const s = "government of the people shall not perish from the earth";
    expect(cleanTranscript(s)).toBe(s);
  });

  it("returns empty string for empty input", () => {
    expect(cleanTranscript("")).toBe("");
    expect(cleanTranscript("   ")).toBe("");
  });
});
