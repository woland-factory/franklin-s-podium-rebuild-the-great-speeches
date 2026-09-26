import type { AttemptMode } from "../types";

/** A readable timestamp for an archived attempt, e.g. "Sep 20, 2026, 3:04 PM". */
export function formatStamp(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** A short date for compare headers, e.g. "Sep 20". */
export function formatShortDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function modeLabel(mode: AttemptMode): string {
  return mode === "cold" ? "Cold" : "Warm-up";
}

/** The first line of a transcript, trimmed to a short snippet for a row. */
export function firstLine(text: string, max = 80): string {
  const line = (text.trim().split(/\r?\n/)[0] ?? "").trim();
  return line.length > max ? `${line.slice(0, max).trimEnd()}…` : line;
}
