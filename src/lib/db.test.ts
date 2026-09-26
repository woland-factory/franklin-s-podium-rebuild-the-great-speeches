import { describe, it, expect, beforeEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import "fake-indexeddb/auto";
import {
  saveAttempt,
  getLatestAttempt,
  listAttempts,
  countAttempts,
  getAttempt,
  saveSchedule,
  getSchedule,
  markScheduleDone,
  clearSchedule,
  saveLedgerItem,
  removeLedgerItem,
  listLedgerBySpeech,
  listLedger,
  countLedger,
  saveUserText,
  getUserText,
  readAllForExport,
} from "./db";
import type { Attempt, LedgerItem, ScheduleEntry, UserText } from "../types";

function makeAttempt(
  speechId: string,
  createdAt: number,
  overrides: Partial<Attempt> = {},
): Attempt {
  return {
    id: `${speechId}:${createdAt}`,
    speech_id: speechId,
    created_at: createdAt,
    mode: "warmup",
    transcript: "raw",
    corrected_transcript: `take at ${createdAt}`,
    audio_blob: null,
    alignment: [{ spoken: "hi", original: "hi", relation: "aligned" }],
    ...overrides,
  };
}

// A fresh in-memory IndexedDB per test so no state leaks between them.
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

describe("attempts archive", () => {
  it("keeps two attempts for one speech instead of overwriting", async () => {
    await saveAttempt(makeAttempt("gettysburg", 1000));
    await saveAttempt(makeAttempt("gettysburg", 2000));
    expect(await countAttempts("gettysburg")).toBe(2);
    const page = await listAttempts("gettysburg");
    expect(page.items).toHaveLength(2);
  });

  it("returns the newest attempt from getLatestAttempt", async () => {
    await saveAttempt(makeAttempt("gettysburg", 1000));
    await saveAttempt(makeAttempt("gettysburg", 3000));
    await saveAttempt(makeAttempt("gettysburg", 2000));
    const latest = await getLatestAttempt("gettysburg");
    expect(latest?.created_at).toBe(3000);
  });

  it("lists newest-first, caps the page, and pages back with the cursor", async () => {
    for (let i = 1; i <= 25; i++) {
      await saveAttempt(makeAttempt("gettysburg", i * 1000));
    }
    const first = await listAttempts("gettysburg", { limit: 10 });
    expect(first.items).toHaveLength(10);
    expect(first.items[0].created_at).toBe(25000);
    expect(first.items[9].created_at).toBe(16000);
    expect(first.nextCursor).toBe(16000);

    const second = await listAttempts("gettysburg", {
      limit: 10,
      before: first.nextCursor,
    });
    expect(second.items).toHaveLength(10);
    expect(second.items[0].created_at).toBe(15000);
    expect(second.items[9].created_at).toBe(6000);

    const third = await listAttempts("gettysburg", {
      limit: 10,
      before: second.nextCursor,
    });
    expect(third.items).toHaveLength(5);
    expect(third.nextCursor).toBeNull();
  });

  it("fetches a single attempt by its unique id", async () => {
    await saveAttempt(makeAttempt("gettysburg", 1000));
    const fetched = await getAttempt("gettysburg:1000");
    expect(fetched?.created_at).toBe(1000);
    expect(await getAttempt("missing")).toBeNull();
  });

  it("does not let other speeches enlarge or slow one speech's query", async () => {
    for (let i = 1; i <= 200; i++) {
      await saveAttempt(makeAttempt("other-speech", i));
    }
    await saveAttempt(makeAttempt("gettysburg", 5000));
    await saveAttempt(makeAttempt("gettysburg", 6000));

    expect(await countAttempts("gettysburg")).toBe(2);
    const page = await listAttempts("gettysburg", { limit: 10 });
    expect(page.items).toHaveLength(2);
    expect(page.items.every((a) => a.speech_id === "gettysburg")).toBe(true);
    expect(page.nextCursor).toBeNull();
  });

  it("reads a mode-less record as a warm-up without crashing", async () => {
    // A record written before `mode` existed still normalizes on read.
    const legacy = makeAttempt("gettysburg", 1000);
    delete (legacy as Partial<Attempt>).mode;
    await saveAttempt(legacy as Attempt);
    const latest = await getLatestAttempt("gettysburg");
    expect(latest?.mode).toBe("warmup");
  });
});

describe("v1 to v2 migration", () => {
  it("keeps a pre-v2 record and lists it as that speech's oldest attempt", async () => {
    // Seed a v1 database exactly as EPIC 2 wrote it: id forced to speech_id,
    // one overwritable record, no `mode` field.
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open("franklins-podium", 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore("attempts", { keyPath: "id" });
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction("attempts", "readwrite");
        tx.objectStore("attempts").put({
          id: "gettysburg",
          speech_id: "gettysburg",
          created_at: 500,
          transcript: "raw",
          corrected_transcript: "the old single take",
          audio_blob: null,
          alignment: [],
        });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });

    // Opening through the app now upgrades to v2 and appends a new attempt.
    await saveAttempt(makeAttempt("gettysburg", 900));

    expect(await countAttempts("gettysburg")).toBe(2);
    const page = await listAttempts("gettysburg");
    expect(page.items).toHaveLength(2);
    // Newest first: the appended one leads, the migrated one is oldest.
    expect(page.items[0].created_at).toBe(900);
    expect(page.items[1].created_at).toBe(500);
    expect(page.items[1].mode).toBe("warmup");
    // The migrated record kept its original primary key.
    expect(await getAttempt("gettysburg")).not.toBeNull();
  });
});

function makeLedgerItem(
  speechId: string,
  savedAt: number,
  overrides: Partial<LedgerItem> = {},
): LedgerItem {
  return {
    id: `${speechId}:${savedAt}`,
    phrase: `a line saved at ${savedAt}`,
    speech_id: speechId,
    source_title: speechId === "gettysburg" ? "The Gettysburg Address" : speechId,
    saved_at: savedAt,
    ...overrides,
  };
}

describe("ledger", () => {
  it("round-trips a kept line", async () => {
    await saveLedgerItem(makeLedgerItem("gettysburg", 1000));
    const items = await listLedgerBySpeech("gettysburg");
    expect(items).toHaveLength(1);
    expect(items[0].phrase).toBe("a line saved at 1000");
  });

  it("listLedgerBySpeech returns only one source's items", async () => {
    await saveLedgerItem(makeLedgerItem("gettysburg", 1000));
    await saveLedgerItem(makeLedgerItem("gettysburg", 2000));
    await saveLedgerItem(makeLedgerItem("fight-no-more", 1500));
    const g = await listLedgerBySpeech("gettysburg");
    expect(g).toHaveLength(2);
    expect(g.every((i) => i.speech_id === "gettysburg")).toBe(true);
  });

  it("does not let a large ledger for other sources leak into one source", async () => {
    for (let i = 1; i <= 200; i++) {
      await saveLedgerItem(makeLedgerItem("other", i));
    }
    await saveLedgerItem(makeLedgerItem("gettysburg", 5000));
    const g = await listLedgerBySpeech("gettysburg");
    expect(g).toHaveLength(1);
    expect(g[0].speech_id).toBe("gettysburg");
  });

  it("listLedger returns a capped page clustered by source and pages with the cursor", async () => {
    // Two sources, interleaved save times, so ordering by source is visible.
    for (let i = 1; i <= 20; i++) {
      await saveLedgerItem(makeLedgerItem("aaa", i * 10));
      await saveLedgerItem(makeLedgerItem("bbb", i * 10 + 5));
    }
    const first = await listLedger({ limit: 25 });
    expect(first.items).toHaveLength(25);
    // Clustered by source: the first 20 are "aaa", ascending by saved_at.
    expect(first.items.slice(0, 20).every((i) => i.speech_id === "aaa")).toBe(true);
    expect(first.items[0].saved_at).toBe(10);
    expect(first.items[20].speech_id).toBe("bbb");
    expect(first.nextCursor).not.toBeNull();

    const second = await listLedger({ limit: 25, after: first.nextCursor });
    expect(second.items).toHaveLength(15);
    expect(second.items.every((i) => i.speech_id === "bbb")).toBe(true);
    expect(second.nextCursor).toBeNull();
  });

  it("removes a kept line by id and counts the whole store", async () => {
    await saveLedgerItem(makeLedgerItem("gettysburg", 1000));
    await saveLedgerItem(makeLedgerItem("gettysburg", 2000));
    expect(await countLedger()).toBe(2);
    await removeLedgerItem("gettysburg:1000");
    expect(await countLedger()).toBe(1);
    const items = await listLedgerBySpeech("gettysburg");
    expect(items).toHaveLength(1);
    expect(items[0].saved_at).toBe(2000);
  });
});

describe("user texts", () => {
  const t: UserText = {
    id: "paste:abc",
    title: "A pasted opening",
    text: "A pasted opening. And a second sentence.",
    sentences: ["A pasted opening.", "And a second sentence."],
    hints: ["A pasted opening", "And a second sentence"],
    created_at: 4242,
  };

  it("round-trips by id", async () => {
    await saveUserText(t);
    const got = await getUserText("paste:abc");
    expect(got).toEqual(t);
    expect(await getUserText("paste:missing")).toBeNull();
  });
});

describe("export read", () => {
  it("returns attempts with no audio blob, plus ledger and user texts", async () => {
    const blob = new Blob(["fake audio"], { type: "audio/webm" });
    await saveAttempt(makeAttempt("gettysburg", 1000, { audio_blob: blob }));
    await saveLedgerItem(makeLedgerItem("gettysburg", 1200));
    await saveUserText({
      id: "paste:zed",
      title: "Mine",
      text: "Mine to keep.",
      sentences: ["Mine to keep."],
      hints: ["Mine to keep"],
      created_at: 10,
    });

    const rows = await readAllForExport();
    expect(rows.attempts).toHaveLength(1);
    expect(rows.attempts[0].audio_blob).toBeNull();
    expect(rows.attempts[0].corrected_transcript).toBe("take at 1000");
    expect(rows.ledger).toHaveLength(1);
    expect(rows.userTexts).toHaveLength(1);
    expect(rows.userTexts[0].id).toBe("paste:zed");
  });
});

describe("v2 to v3 migration", () => {
  it("opens a v2 database at v3 with existing rows intact and the new stores present", async () => {
    // Seed a v2 database exactly as EPIC 3 wrote it: attempts + schedules.
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open("franklins-podium", 2);
      req.onupgradeneeded = () => {
        const db = req.result;
        const store = db.createObjectStore("attempts", { keyPath: "id" });
        store.createIndex("by_speech_created", ["speech_id", "created_at"]);
        db.createObjectStore("schedules", { keyPath: "speech_id" });
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(["attempts", "schedules"], "readwrite");
        tx.objectStore("attempts").put({
          id: "gettysburg:1",
          speech_id: "gettysburg",
          created_at: 1,
          mode: "warmup",
          transcript: "raw",
          corrected_transcript: "kept take",
          audio_blob: null,
          alignment: [],
        });
        tx.objectStore("schedules").put({
          speech_id: "gettysburg",
          condensed_at: 1,
          reveal_at: 2,
          status: "waiting",
        });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });

    // Opening through the app upgrades to v3. Existing rows survive and the
    // new stores are usable.
    expect(await countAttempts("gettysburg")).toBe(1);
    expect((await getSchedule("gettysburg"))?.status).toBe("waiting");
    await saveLedgerItem(makeLedgerItem("gettysburg", 3000));
    expect(await countLedger()).toBe(1);
    await saveUserText({
      id: "paste:new",
      title: "New",
      text: "New source.",
      sentences: ["New source."],
      hints: ["New source"],
      created_at: 1,
    });
    expect((await getUserText("paste:new"))?.title).toBe("New");
  });
});

describe("schedules", () => {
  const entry: ScheduleEntry = {
    speech_id: "gettysburg",
    condensed_at: 1000,
    reveal_at: 200000,
    status: "waiting",
  };

  it("round-trips a schedule by speech id", async () => {
    await saveSchedule(entry);
    const got = await getSchedule("gettysburg");
    expect(got).toEqual(entry);
    expect(await getSchedule("other")).toBeNull();
  });

  it("overwrites the schedule when scheduling again", async () => {
    await saveSchedule(entry);
    await saveSchedule({ ...entry, reveal_at: 999999 });
    const got = await getSchedule("gettysburg");
    expect(got?.reveal_at).toBe(999999);
  });

  it("flips status to done", async () => {
    await saveSchedule(entry);
    await markScheduleDone("gettysburg");
    expect((await getSchedule("gettysburg"))?.status).toBe("done");
  });

  it("clears a schedule", async () => {
    await saveSchedule(entry);
    await clearSchedule("gettysburg");
    expect(await getSchedule("gettysburg")).toBeNull();
  });
});
