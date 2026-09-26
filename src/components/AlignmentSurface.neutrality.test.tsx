// The differentiator, proven not assumed: run realistic hesitant, paraphrased,
// and word-reordered reconstructions through the real pipeline (cleanTranscript
// + segmentSentences + align) and assert the rendered surface stays a neutral
// study object on the study view, a single opened archived attempt, and both
// panes of the compare view. No score, no verdict, no error ink.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { AlignmentSurface } from "./AlignmentSurface";
import { AttemptView } from "./AttemptView";
import { CompareAttempts } from "./CompareAttempts";
import { cleanTranscript } from "../align/clean";
import { segmentSentences } from "../align/segment";
import { align } from "../align/align";
import { gettysburg } from "../data/gettysburg";
import type { AlignmentPair, Attempt } from "../types";

function pipeline(spoken: string): AlignmentPair[] {
  return align(segmentSentences(cleanTranscript(spoken)), gettysburg.sentences);
}

// Words that would turn the surface into a grade. None appears in Gettysburg
// or in the fixtures below, so any hit is product chrome, a real failure.
const JUDGMENT =
  /\b(score|grade|pass|fail|correct|incorrect|wrong|accuracy|missed)\b/i;

function assertNeutral(container: HTMLElement) {
  // The verbatim spoken transcript and original speech are exempt content, not
  // product chrome. Gettysburg literally opens "Four score", so scan the chrome
  // with the content paragraphs removed.
  const clone = container.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(".pair-cell > p:not(.pair-empty)")
    .forEach((el) => el.remove());
  const html = clone.innerHTML;
  expect(html).not.toContain("%");
  expect(html).not.toMatch(JUDGMENT);
  // No per-word or per-pair error styling and no diff-delete markup.
  expect(container.querySelector('[class*="error"]')).toBeNull();
  expect(container.querySelector('[class*="wrong"]')).toBeNull();
  expect(container.querySelector('[class*="bad"]')).toBeNull();
  expect(container.querySelector('[class*="diff"]')).toBeNull();
  expect(container.querySelector('[class*="red"]')).toBeNull();
  expect(container.querySelector("del, ins, s")).toBeNull();
}

// Filler words and false starts, in order, lightly paraphrased.
const HESITANT =
  "Um, you know, about eighty seven years ago our fathers, uh, brought a new nation to this continent, devoted to liberty and the idea that everyone is equal. Now, now we are in a great civil war, testing whether that kind of nation can last. We are, um, met on a great battlefield of that war.";

// Heavy paraphrase, sentence order preserved.
const PARAPHRASE =
  "We stand here on the field of this war. We came to set aside part of it for those who died so the nation might live. Doing this is right and proper.";

// The same meaning with words reordered inside each sentence.
const REORDERED =
  "On the field of this war we now stand. For those who died that the nation might live, we came to set a portion aside. Proper and fitting it is that we do this.";

const FIXTURES = [
  { name: "hesitant, filler-laden speech", spoken: HESITANT },
  { name: "heavy paraphrase", spoken: PARAPHRASE },
  { name: "reordered words within sentences", spoken: REORDERED },
];

beforeEach(() => {
  // AttemptView / CompareAttempts create an object URL for replay audio.
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
});

function attemptFrom(pairs: AlignmentPair[], withAudio: boolean): Attempt {
  return {
    id: "att",
    speech_id: gettysburg.id,
    created_at: Date.UTC(2026, 8, 20),
    mode: "warmup",
    transcript: "raw",
    corrected_transcript: "take",
    audio_blob: withAudio ? new Blob(["x"], { type: "audio/webm" }) : null,
    alignment: pairs,
  };
}

describe("AlignmentSurface neutrality across real hesitant speech", () => {
  for (const { name, spoken } of FIXTURES) {
    it(`stays neutral on the study view for ${name}`, () => {
      const pairs = pipeline(spoken);
      const { container } = render(
        <AlignmentSurface pairs={pairs} originalLabel={gettysburg.author} />,
      );
      assertNeutral(container);
    });

    it(`stays neutral on a single opened archived attempt for ${name}`, () => {
      const pairs = pipeline(spoken);
      const { container } = render(
        <AttemptView
          speech={gettysburg}
          attempt={attemptFrom(pairs, true)}
          onBack={() => {}}
        />,
      );
      assertNeutral(container);
      // Audio replay is present so any flagged line can be checked by ear.
      expect(container.querySelector("audio")).not.toBeNull();
    });

    it(`stays neutral on both compare panes for ${name}`, () => {
      const pairs = pipeline(spoken);
      const { container } = render(
        <CompareAttempts
          speech={gettysburg}
          newer={attemptFrom(pairs, true)}
          older={attemptFrom(pairs, true)}
          onBack={() => {}}
          onRecordAnother={() => {}}
        />,
      );
      assertNeutral(container);
    });
  }

  it("aligns paraphrased sentences side by side (meaning tolerance holds)", () => {
    const pairs = pipeline(PARAPHRASE).filter((p) => p.relation === "aligned");
    // All three paraphrased lines find their original.
    expect(pairs.length).toBe(3);
    for (const p of pairs) {
      expect(p.spoken).toBeTruthy();
      expect(p.original).toBeTruthy();
    }
  });

  it("aligns word-reordered sentences side by side", () => {
    const aligned = pipeline(REORDERED).filter(
      (p) => p.relation === "aligned",
    );
    expect(aligned.length).toBe(3);
  });

  it("shows a line only one side reached with neutral copy, never a penalty", () => {
    // The hesitant take covers the opening; the closing lines are original-only.
    const pairs = pipeline(HESITANT);
    const oneSided = pairs.filter((p) => p.relation === "original-only");
    expect(oneSided.length).toBeGreaterThan(0);
    const { container } = render(<AlignmentSurface pairs={pairs} />);
    expect(container.textContent).toContain("In the original, not in yours.");
    assertNeutral(container);
  });

  it("keeps the Keep control additive: a state-bearing, non-judgmental name", () => {
    const pairs = pipeline(PARAPHRASE);
    const { getAllByRole, rerender } = render(
      <AlignmentSurface pairs={pairs} onToggleKeep={() => {}} />,
    );
    const keep = getAllByRole("button", { name: /keep this line/i })[0];
    // The name says what the control does, and carries no verdict.
    expect(keep.getAttribute("aria-label")).toMatch(/keep this line/i);
    expect(keep.getAttribute("aria-label")).not.toMatch(JUDGMENT);

    const original = pairs.find((p) => p.original)!.original as string;
    rerender(
      <AlignmentSurface
        pairs={pairs}
        onToggleKeep={() => {}}
        keptPhrases={new Set([original])}
      />,
    );
    const kept = getAllByRole("button", {
      name: /remove this line from your ledger/i,
    })[0];
    expect(kept).toHaveAttribute("aria-pressed", "true");
    expect(kept.getAttribute("aria-label")).not.toMatch(JUDGMENT);
  });
});
