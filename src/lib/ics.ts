// A local calendar reminder for the cold attempt. Built in memory and offered
// as a download; it never touches the network.

const EVENT_MINUTES = 15;

export interface IcsInput {
  title: string; // the speech title (verbatim, exempt from the copy sweep)
  revealAt: number; // epoch ms when the cold attempt opens
  now: number; // epoch ms, used for DTSTAMP
  uid?: string; // stable per schedule
}

function icsDate(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Fold lines longer than 75 octets per RFC 5545: continuation lines begin with
// a single space. Content here is ASCII, so character length equals octets.
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  parts.push(" " + rest);
  return parts.join("\r\n");
}

export function buildIcs({ title, revealAt, now, uid }: IcsInput): string {
  const summary = `Cold attempt: rebuild ${title} from memory`;
  const description =
    "Open Franklin's Podium and speak this speech from memory before you look at it.";
  const eventUid = uid ?? `fp-${revealAt}@franklins-podium`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Franklins Podium//Cold attempt//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${eventUid}`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(revealAt)}`,
    `DTEND:${icsDate(revealAt + EVENT_MINUTES * 60_000)}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Offer the calendar string as a local file download. Touches no network. */
export function downloadIcs(filename: string, contents: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([contents], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
