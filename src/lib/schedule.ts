import type { ScheduleEntry } from "../types";

// A forgetting gap has to be genuinely multi-day to be worth studying cold.
export const MIN_GAP_DAYS = 2;
export const MAX_GAP_DAYS = 30;
const DAY_MS = 86_400_000;

export type ScheduleState = "none" | "waiting" | "ready" | "done";

/**
 * Waiting vs ready is derived from the clock, never from stored status, so a
 * reload after the reveal reflects reality. Only "done" is durable.
 */
export function scheduleState(
  entry: ScheduleEntry | null,
  now: number,
): ScheduleState {
  if (!entry) return "none";
  if (entry.status === "done") return "done";
  return now >= entry.reveal_at ? "ready" : "waiting";
}

export function revealAtFromDays(now: number, days: number): number {
  return now + days * DAY_MS;
}

export function isValidGap(days: number): boolean {
  return Number.isInteger(days) && days >= MIN_GAP_DAYS && days <= MAX_GAP_DAYS;
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

/**
 * A short human string for the countdown, in product voice. For example
 * "2 days, 4 hours" or "under an hour". No dashes.
 */
export function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return "ready now";
  const days = Math.floor(msRemaining / DAY_MS);
  const hours = Math.floor((msRemaining % DAY_MS) / 3_600_000);
  if (days >= 1) {
    return hours > 0
      ? `${plural(days, "day")}, ${plural(hours, "hour")}`
      : plural(days, "day");
  }
  if (hours >= 1) return plural(hours, "hour");
  return "under an hour";
}
