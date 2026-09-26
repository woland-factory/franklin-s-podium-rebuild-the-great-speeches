import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompareAttempts } from "./CompareAttempts";
import { gettysburg } from "../data/gettysburg";
import type { Attempt } from "../types";

function makeAttempt(createdAt: number, over: Partial<Attempt> = {}): Attempt {
  return {
    id: `${gettysburg.id}:${createdAt}`,
    speech_id: gettysburg.id,
    created_at: createdAt,
    mode: "warmup",
    transcript: "raw",
    corrected_transcript: "my take",
    audio_blob: null,
    alignment: [
      { spoken: "Four score and seven years ago", original: gettysburg.sentences[0], relation: "aligned" },
    ],
    ...over,
  };
}

function noop() {}

describe("CompareAttempts", () => {
  it("renders two attempts on two surfaces with per-attempt headers", () => {
    render(
      <CompareAttempts
        speech={gettysburg}
        newer={makeAttempt(Date.UTC(2026, 8, 24), { mode: "cold" })}
        older={makeAttempt(Date.UTC(2026, 8, 20), { mode: "warmup" })}
        onBack={noop}
        onRecordAnother={noop}
      />,
    );

    // Two neutral alignment surfaces, one per attempt.
    expect(
      screen.getAllByRole("heading", { name: /your words beside the original/i }),
    ).toHaveLength(2);
    // Each column names its attempt by mode and date, neither ranks the other.
    expect(screen.getByText(/cold attempt, sep 24/i)).toBeInTheDocument();
    expect(screen.getByText(/warm-up attempt, sep 20/i)).toBeInTheDocument();
  });

  it("holds the differentiator guard: no score, pass/fail, or per-word error ink", () => {
    const { container } = render(
      <CompareAttempts
        speech={gettysburg}
        newer={makeAttempt(2000)}
        older={makeAttempt(1000)}
        onBack={noop}
        onRecordAnother={noop}
      />,
    );
    // Verbatim speech text is exempt; only the app's own chrome is guarded.
    const text = container.textContent ?? "";
    expect(text).not.toContain("%");
    expect(container.querySelectorAll("del, ins, s")).toHaveLength(0);
    expect(
      container.querySelectorAll('[class*="error"], [class*="diff"]'),
    ).toHaveLength(0);
  });

  it("shows the one-attempt state with a record-another control", async () => {
    const onRecordAnother = vi.fn();
    const user = userEvent.setup();
    render(
      <CompareAttempts
        speech={gettysburg}
        newer={makeAttempt(1000)}
        older={null}
        onBack={noop}
        onRecordAnother={onRecordAnother}
      />,
    );
    const line = screen.getByText(/record another take to set it beside this one/i);
    expect(line.textContent).not.toMatch(/nothing|unable|no attempts/i);
    await user.click(screen.getByRole("button", { name: /record another/i }));
    expect(onRecordAnother).toHaveBeenCalledTimes(1);
    // No second surface when there is nothing to compare.
    expect(
      screen.queryAllByRole("heading", { name: /your words beside the original/i }),
    ).toHaveLength(0);
  });
});
