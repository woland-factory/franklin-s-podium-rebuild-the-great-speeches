import { describe, it, expect } from "vitest";
import { align, similarity } from "./align";

describe("similarity", () => {
  it("is high for paraphrase and reordering, low for unrelated text", () => {
    expect(similarity("all men are created equal", "equal created men all")).toBe(
      1,
    );
    expect(
      similarity("we stand on the battlefield", "pizza toppings and soda"),
    ).toBe(0);
  });
});

describe("align", () => {
  it("maps a paraphrased sentence to its original as aligned", () => {
    const original = [
      "Four score and seven years ago our fathers brought forth a new nation, conceived in Liberty, dedicated to the proposition that all men are created equal.",
    ];
    const spoken = [
      "Eighty seven years ago our founders created a new nation devoted to liberty and equality.",
    ];
    const pairs = align(spoken, original);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].relation).toBe("aligned");
    expect(pairs[0].spoken).toBe(spoken[0]);
    expect(pairs[0].original).toBe(original[0]);
  });

  it("matches sentences whose words are reordered", () => {
    const pairs = align(["equal created are men all"], ["all men are created equal"]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].relation).toBe("aligned");
  });

  it("marks a missing original as original-only and an extra spoken as spoken-only", () => {
    const original = [
      "all men are created equal",
      "it is fitting and proper",
      "the world will not forget",
    ];
    const spoken = [
      "all men created equal",
      "something totally unrelated about pizza",
    ];
    const pairs = align(spoken, original);

    const aligned = pairs.filter((p) => p.relation === "aligned");
    expect(aligned).toHaveLength(1);
    expect(aligned[0].original).toBe("all men are created equal");

    const originalOnly = pairs.filter((p) => p.relation === "original-only");
    expect(originalOnly.map((p) => p.original)).toEqual([
      "it is fitting and proper",
      "the world will not forget",
    ]);
    originalOnly.forEach((p) => expect(p.spoken).toBeNull());

    const spokenOnly = pairs.filter((p) => p.relation === "spoken-only");
    expect(spokenOnly).toHaveLength(1);
    expect(spokenOnly[0].spoken).toBe("something totally unrelated about pizza");
    expect(spokenOnly[0].original).toBeNull();
  });

  it("preserves order across a multi-sentence case (monotonic)", () => {
    const original = [
      "the cat sat on the mat",
      "a dog ran through the yard",
      "birds fly over the trees",
    ];
    const spoken = ["cat mat sat", "dog yard ran", "birds trees fly"];
    const pairs = align(spoken, original);
    expect(pairs.map((p) => p.relation)).toEqual([
      "aligned",
      "aligned",
      "aligned",
    ]);
    expect(pairs.map((p) => p.original)).toEqual(original);
  });

  it("carries no score, percentage, or pass/fail field in the output shape", () => {
    const pairs = align(["all men created equal"], ["all men are created equal"]);
    for (const p of pairs) {
      expect(Object.keys(p).sort()).toEqual(["original", "relation", "spoken"]);
      expect(["aligned", "original-only", "spoken-only"]).toContain(p.relation);
    }
    expect(JSON.stringify(pairs)).not.toContain("%");
    expect(JSON.stringify(pairs)).not.toMatch(/score|percent|grade|pass|fail/i);
  });

  it("returns an empty list for empty input", () => {
    expect(align([], [])).toEqual([]);
  });
});
