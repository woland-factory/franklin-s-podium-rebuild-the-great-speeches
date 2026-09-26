import { describe, it, expect } from "vitest";
import { buildExportJson, buildExportMarkdown, type ExportData } from "./export";
import type { Attempt, LedgerItem, UserText } from "../types";

const attempts: Attempt[] = [
  {
    id: "b2",
    speech_id: "gettysburg",
    created_at: 2000,
    mode: "cold",
    transcript: "raw two",
    corrected_transcript: "second take",
    audio_blob: new Blob(["audio"], { type: "audio/webm" }),
    alignment: [
      { spoken: "we are met", original: "We are met here", relation: "aligned" },
      { spoken: null, original: "A missed line", relation: "original-only" },
    ],
  },
  {
    id: "a1",
    speech_id: "gettysburg",
    created_at: 1000,
    mode: "warmup",
    transcript: "raw one",
    corrected_transcript: "first take",
    audio_blob: null,
    alignment: [{ spoken: "four score", original: "Four score", relation: "aligned" }],
  },
];

const ledger: LedgerItem[] = [
  {
    id: "l2",
    phrase: "government of the people",
    speech_id: "gettysburg",
    source_title: "The Gettysburg Address",
    saved_at: 3000,
  },
  {
    id: "l1",
    phrase: "my own courage",
    speech_id: "paste:x",
    source_title: "My own words",
    saved_at: 1500,
  },
];

const userTexts: UserText[] = [
  {
    id: "paste:x",
    title: "My own words",
    text: "My own courage carried me.",
    sentences: ["My own courage carried me."],
    hints: ["My own courage carried me"],
    created_at: 500,
  },
];

const data: ExportData = {
  attempts,
  ledger,
  userTexts,
  exportedAt: 1_600_000_000_000,
  resolveTitle: (id) =>
    id === "gettysburg"
      ? "The Gettysburg Address"
      : userTexts.find((t) => t.id === id)?.title ?? id,
};

describe("buildExportJson", () => {
  it("emits valid JSON with attempts, ledger, and user texts", () => {
    const parsed = JSON.parse(buildExportJson(data));
    expect(parsed.app).toBe("Franklin's Podium");
    expect(parsed.exported_at).toBe(1_600_000_000_000);
    expect(parsed.attempts).toHaveLength(2);
    expect(parsed.ledger).toHaveLength(2);
    expect(parsed.your_texts).toHaveLength(1);
  });

  it("never includes audio", () => {
    const json = buildExportJson(data);
    expect(json).not.toContain("audio");
    const parsed = JSON.parse(json);
    for (const a of parsed.attempts) {
      expect("audio_blob" in a).toBe(false);
    }
  });

  it("orders attempts and ledger deterministically by source then time", () => {
    const parsed = JSON.parse(buildExportJson(data));
    // Same source, oldest first.
    expect(parsed.attempts[0].created_at).toBe(1000);
    expect(parsed.attempts[1].created_at).toBe(2000);
    // Ledger clusters by source id: "gettysburg" sorts before "paste:x".
    expect(parsed.ledger[0].source_id).toBe("gettysburg");
    expect(parsed.ledger[1].source_id).toBe("paste:x");
    expect(parsed.attempts[0].source_title).toBe("The Gettysburg Address");
  });
});

describe("buildExportMarkdown", () => {
  it("groups the ledger and attempts by source with readable pairs", () => {
    const md = buildExportMarkdown(data);
    expect(md).toContain("# Franklin's Podium");
    expect(md).toContain("## Lines worth stealing");
    expect(md).toContain("### The Gettysburg Address");
    expect(md).toContain("### My own words");
    expect(md).toContain('"government of the people"');
    expect(md).toContain("## Your attempts");
    expect(md).toContain("You said: four score");
    expect(md).toContain("Original: Four score");
  });

  it("handles empty data with a positive prompt, not an apology", () => {
    const empty = buildExportMarkdown({
      ...data,
      attempts: [],
      ledger: [],
      userTexts: [],
    });
    expect(empty).toContain("Keep a line from any alignment to start this list.");
    expect(empty).toContain("Record a reconstruction to fill this section.");
  });

  it("keeps its static labels free of banned copy tells", () => {
    const md = buildExportMarkdown(data);
    const json = buildExportJson(data);
    for (const doc of [md, json]) {
      expect(doc).not.toContain("—");
      expect(doc).not.toContain("–");
      expect(doc.toLowerCase()).not.toContain("unlock");
      expect(doc.toLowerCase()).not.toContain("seamless");
    }
  });
});
