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
} from "./db";
import type { Attempt, ScheduleEntry } from "../types";

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
