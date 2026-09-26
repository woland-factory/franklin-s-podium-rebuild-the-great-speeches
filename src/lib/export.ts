// Build the user's data export as JSON and Markdown, and offer it as a local
// file download. Pure builders plus a download helper. Nothing here touches the
// network, and audio never enters an export.
import type { Attempt, LedgerItem, UserText } from "../types";

export interface ExportData {
  attempts: Attempt[];
  ledger: LedgerItem[];
  userTexts: UserText[];
  exportedAt: number; // caller supplies Date.now(), so builders stay pure
  // Resolve a source id to its display title (curated speech or user text).
  resolveTitle: (sourceId: string) => string;
}

const FILENAMES = {
  json: "franklins-podium.json",
  markdown: "franklins-podium.md",
} as const;

export const EXPORT_FILENAMES = FILENAMES;

function bySourceThenTime<T extends { speech_id: string }>(
  a: T,
  b: T,
  timeOf: (x: T) => number,
): number {
  return a.speech_id.localeCompare(b.speech_id) || timeOf(a) - timeOf(b);
}

// A stable calendar day from epoch ms, e.g. "2026-09-26". Deterministic in UTC
// so an export diffs cleanly.
function dayStamp(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** A stable, pretty-printed JSON export. Deterministic ordering, no audio. */
export function buildExportJson(data: ExportData): string {
  const attempts = [...data.attempts]
    .sort((a, b) => bySourceThenTime(a, b, (x) => x.created_at))
    .map((a) => ({
      source_id: a.speech_id,
      source_title: data.resolveTitle(a.speech_id),
      mode: a.mode,
      created_at: a.created_at,
      corrected_transcript: a.corrected_transcript,
      alignment: a.alignment.map((p) => ({
        spoken: p.spoken,
        original: p.original,
        relation: p.relation,
      })),
    }));

  const ledger = [...data.ledger]
    .sort((a, b) => bySourceThenTime(a, b, (x) => x.saved_at))
    .map((l) => ({
      phrase: l.phrase,
      source_id: l.speech_id,
      source_title: l.source_title,
      saved_at: l.saved_at,
    }));

  const your_texts = [...data.userTexts]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((t) => ({
      id: t.id,
      title: t.title,
      text: t.text,
      created_at: t.created_at,
    }));

  return JSON.stringify(
    {
      app: "Franklin's Podium",
      exported_at: data.exportedAt,
      attempts,
      ledger,
      your_texts,
    },
    null,
    2,
  );
}

// Group rows by source id, preserving the already-sorted order.
function groupBySource<T extends { speech_id: string }>(
  rows: T[],
): { speechId: string; rows: T[] }[] {
  const groups: { speechId: string; rows: T[] }[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.speechId === row.speech_id) last.rows.push(row);
    else groups.push({ speechId: row.speech_id, rows: [row] });
  }
  return groups;
}

/** A human-readable Markdown document the user keeps. Static labels are voice. */
export function buildExportMarkdown(data: ExportData): string {
  const lines: string[] = [];
  lines.push("# Franklin's Podium");
  lines.push("");
  lines.push(`Your practice record, saved ${dayStamp(data.exportedAt)}.`);
  lines.push("");

  // Ledger, grouped by source.
  lines.push("## Lines worth stealing");
  lines.push("");
  const ledger = [...data.ledger].sort((a, b) =>
    bySourceThenTime(a, b, (x) => x.saved_at),
  );
  if (ledger.length === 0) {
    lines.push("Keep a line from any alignment to start this list.");
    lines.push("");
  } else {
    for (const group of groupBySource(ledger)) {
      lines.push(`### ${group.rows[0].source_title}`);
      lines.push("");
      for (const item of group.rows) {
        lines.push(`- "${item.phrase}" (saved ${dayStamp(item.saved_at)})`);
      }
      lines.push("");
    }
  }

  // Attempts, grouped by source.
  lines.push("## Your attempts");
  lines.push("");
  const attempts = [...data.attempts].sort((a, b) =>
    bySourceThenTime(a, b, (x) => x.created_at),
  );
  if (attempts.length === 0) {
    lines.push("Record a reconstruction to fill this section.");
    lines.push("");
  } else {
    for (const group of groupBySource(attempts)) {
      lines.push(`### ${data.resolveTitle(group.speechId)}`);
      lines.push("");
      for (const attempt of group.rows) {
        const mode = attempt.mode === "cold" ? "Cold" : "Warm-up";
        lines.push(`**${mode}, ${dayStamp(attempt.created_at)}**`);
        lines.push("");
        for (const pair of attempt.alignment) {
          // The surface's own neutral captions for a line only one side reached.
          const you = pair.spoken ?? "(in the original, not in yours)";
          const original = pair.original ?? "(in yours, not the original)";
          lines.push(`- You said: ${you}`);
          lines.push(`  Original: ${original}`);
        }
        lines.push("");
      }
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}

/** Offer a string as a local file download. Touches no network. */
export function downloadTextFile(
  filename: string,
  contents: string,
  mime: string,
): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Build the JSON export and offer it as a download. */
export function downloadJson(data: ExportData): void {
  downloadTextFile(
    FILENAMES.json,
    buildExportJson(data),
    "application/json;charset=utf-8",
  );
}

/** Build the Markdown export and offer it as a download. */
export function downloadMarkdown(data: ExportData): void {
  downloadTextFile(
    FILENAMES.markdown,
    buildExportMarkdown(data),
    "text/markdown;charset=utf-8",
  );
}
