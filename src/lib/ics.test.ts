import { describe, it, expect } from "vitest";
import { buildIcs } from "./ics";

const REVEAL = Date.UTC(2026, 0, 15, 9, 30, 0); // 2026-01-15 09:30:00 UTC
const NOW = Date.UTC(2026, 0, 13, 8, 0, 0);

const BANNED =
  /\b(seamless|seamlessly|effortless|effortlessly|unlock|elevate|empower|leverage|robust|dive in)\b/i;

describe("buildIcs", () => {
  const ics = buildIcs({
    title: "The Gettysburg Address",
    revealAt: REVEAL,
    now: NOW,
    uid: "gettysburg-123@franklins-podium",
  });

  it("wraps one event in a valid VCALENDAR", () => {
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("sets DTSTART at the reveal and DTEND fifteen minutes later", () => {
    expect(ics).toContain("DTSTART:20260115T093000Z");
    expect(ics).toContain("DTEND:20260115T094500Z");
    expect(ics).toContain("DTSTAMP:20260113T080000Z");
  });

  it("carries a stable unique UID", () => {
    expect(ics).toContain("UID:gettysburg-123@franklins-podium");
  });

  it("uses CRLF line endings", () => {
    expect(ics.includes("\r\n")).toBe(true);
    // No bare LF that is not preceded by CR.
    expect(/[^\r]\n/.test(ics)).toBe(false);
  });

  it("escapes special characters in text values", () => {
    const withCommas = buildIcs({
      title: "Blood, Toil, Tears and Sweat",
      revealAt: REVEAL,
      now: NOW,
    });
    expect(withCommas).toContain(
      "SUMMARY:Cold attempt: rebuild Blood\\, Toil\\, Tears and Sweat from memory",
    );
  });

  it("keeps product-voice strings swept clean", () => {
    const summaryLine = ics
      .split("\r\n")
      .find((l) => l.startsWith("SUMMARY:"))!;
    const descLine = ics
      .split("\r\n")
      .find((l) => l.startsWith("DESCRIPTION:"))!;
    for (const line of [summaryLine, descLine]) {
      expect(line).not.toMatch(/[—–]/);
      expect(line).not.toMatch(BANNED);
    }
  });
});
