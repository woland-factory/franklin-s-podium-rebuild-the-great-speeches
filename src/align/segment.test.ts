import { describe, it, expect } from "vitest";
import { segmentSentences } from "./segment";

describe("segmentSentences", () => {
  it("splits a multi-sentence transcript on terminal punctuation", () => {
    const out = segmentSentences(
      "We are met on a field. We came to dedicate it. Is this proper? Yes!",
    );
    expect(out).toEqual([
      "We are met on a field.",
      "We came to dedicate it.",
      "Is this proper?",
      "Yes!",
    ]);
  });

  it("keeps a trailing sentence with no terminal punctuation", () => {
    expect(segmentSentences("we resolve these dead did not die in vain")).toEqual(
      ["we resolve these dead did not die in vain"],
    );
  });

  it("does not split on common abbreviations", () => {
    const out = segmentSentences("Mr. Lincoln spoke here. It was brief.");
    expect(out).toEqual(["Mr. Lincoln spoke here.", "It was brief."]);
  });

  it("returns an empty array for empty input", () => {
    expect(segmentSentences("")).toEqual([]);
    expect(segmentSentences("   ")).toEqual([]);
  });

  it("handles multiple terminal marks", () => {
    expect(segmentSentences("Really?! Yes.")).toEqual(["Really?!", "Yes."]);
  });
});
