import { describe, it, expect } from "vitest";
import {
  scheduleState,
  revealAtFromDays,
  isValidGap,
  formatCountdown,
  MIN_GAP_DAYS,
  MAX_GAP_DAYS,
} from "./schedule";
import type { ScheduleEntry } from "../types";

const NOW = 1_000_000_000_000;

function entry(overrides: Partial<ScheduleEntry> = {}): ScheduleEntry {
  return {
    speech_id: "gettysburg",
    condensed_at: NOW,
    reveal_at: NOW + 2 * 86_400_000,
    status: "waiting",
    ...overrides,
  };
}

describe("scheduleState", () => {
  it("is none with no entry", () => {
    expect(scheduleState(null, NOW)).toBe("none");
  });

  it("is waiting before the reveal", () => {
    expect(scheduleState(entry({ reveal_at: NOW + 1000 }), NOW)).toBe("waiting");
  });

  it("is ready at or after the reveal", () => {
    expect(scheduleState(entry({ reveal_at: NOW }), NOW)).toBe("ready");
    expect(scheduleState(entry({ reveal_at: NOW - 1 }), NOW)).toBe("ready");
  });

  it("is done regardless of the clock when status is done", () => {
    expect(
      scheduleState(entry({ status: "done", reveal_at: NOW - 100 }), NOW),
    ).toBe("done");
  });
});

describe("revealAtFromDays", () => {
  it("adds whole days in ms", () => {
    expect(revealAtFromDays(NOW, 3)).toBe(NOW + 3 * 86_400_000);
  });
});

describe("isValidGap", () => {
  it("accepts a value inside the multi-day bounds", () => {
    expect(isValidGap(MIN_GAP_DAYS)).toBe(true);
    expect(isValidGap(7)).toBe(true);
    expect(isValidGap(MAX_GAP_DAYS)).toBe(true);
  });

  it("rejects sub-minimum, over-maximum, and non-integer gaps", () => {
    expect(isValidGap(1)).toBe(false);
    expect(isValidGap(0)).toBe(false);
    expect(isValidGap(MAX_GAP_DAYS + 1)).toBe(false);
    expect(isValidGap(2.5)).toBe(false);
    expect(isValidGap(Number.NaN)).toBe(false);
  });
});

describe("formatCountdown", () => {
  it("renders days and hours", () => {
    expect(formatCountdown(2 * 86_400_000 + 4 * 3_600_000)).toBe(
      "2 days, 4 hours",
    );
  });

  it("renders a single day and singular units", () => {
    expect(formatCountdown(86_400_000 + 3_600_000)).toBe("1 day, 1 hour");
    expect(formatCountdown(86_400_000)).toBe("1 day");
  });

  it("renders hours only under a day", () => {
    expect(formatCountdown(5 * 3_600_000)).toBe("5 hours");
  });

  it("says under an hour near the reveal", () => {
    expect(formatCountdown(59 * 60_000)).toBe("under an hour");
  });

  it("has no dashes in any output", () => {
    for (const ms of [
      0,
      59 * 60_000,
      5 * 3_600_000,
      86_400_000,
      2 * 86_400_000 + 4 * 3_600_000,
    ]) {
      const out = formatCountdown(ms);
      expect(out).not.toMatch(/[—–]/);
    }
  });
});
