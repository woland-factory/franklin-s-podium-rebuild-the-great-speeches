import type { Attempt, AttemptMode, ScheduleEntry } from "../types";

const DB_NAME = "franklins-podium";
const DB_VERSION = 2;
const ATTEMPTS = "attempts";
const SCHEDULES = "schedules";
const BY_SPEECH_CREATED = "by_speech_created";
const FIRST_RUN_KEY = "first_run_done";

// A page of attempts plus the cursor to fetch the page before it. The cursor
// is the `created_at` of the oldest row on this page; null means no more.
export interface AttemptPage {
  items: Attempt[];
  nextCursor: number | null;
}

export interface ListOpts {
  limit?: number;
  before?: number | null; // created_at to page before (exclusive), newest-first
}

const DEFAULT_PAGE = 10;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    // Forward-only migrations: create stores and indexes here, never rewrite
    // existing rows. Bumping to v2 turns the single saved attempt into the
    // archive's first entry for free, because the new index covers it.
    req.onupgradeneeded = () => {
      const db = req.result;
      const store = db.objectStoreNames.contains(ATTEMPTS)
        ? req.transaction!.objectStore(ATTEMPTS)
        : db.createObjectStore(ATTEMPTS, { keyPath: "id" });
      if (!store.indexNames.contains(BY_SPEECH_CREATED)) {
        // The workhorse: per-speech, newest-first pagination and "latest" as
        // the first row of a "prev" cursor. Both are index range scans.
        store.createIndex(BY_SPEECH_CREATED, ["speech_id", "created_at"]);
      }
      if (!db.objectStoreNames.contains(SCHEDULES)) {
        db.createObjectStore(SCHEDULES, { keyPath: "speech_id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// A pre-v2 record was written before `mode` existed; EPIC 2 only recorded
// warm-ups, so a missing mode reads as "warmup". Never crash on the old shape.
function normalize(raw: unknown): Attempt {
  const a = raw as Attempt & { mode?: AttemptMode };
  return { ...a, mode: a.mode ?? "warmup" };
}

// Range covering every attempt for one speech on the compound index. The empty
// array sorts after any real key, so it is the exclusive-enough upper bound.
function speechRange(speechId: string, before?: number | null): IDBKeyRange {
  if (before != null) {
    return IDBKeyRange.bound([speechId], [speechId, before], false, true);
  }
  return IDBKeyRange.bound([speechId], [speechId, []]);
}

export async function saveAttempt(attempt: Attempt): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(ATTEMPTS, "readwrite");
      // Unique per attempt now: two takes for one speech coexist instead of
      // overwriting. The caller supplies the id.
      tx.objectStore(ATTEMPTS).put(attempt);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function getLatestAttempt(
  speechId: string,
): Promise<Attempt | null> {
  const db = await openDb();
  try {
    return await new Promise<Attempt | null>((resolve, reject) => {
      const tx = db.transaction(ATTEMPTS, "readonly");
      const idx = tx.objectStore(ATTEMPTS).index(BY_SPEECH_CREATED);
      const req = idx.openCursor(speechRange(speechId), "prev");
      req.onsuccess = () => {
        const cursor = req.result;
        resolve(cursor ? normalize(cursor.value) : null);
      };
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function listAttempts(
  speechId: string,
  opts: ListOpts = {},
): Promise<AttemptPage> {
  const limit = opts.limit ?? DEFAULT_PAGE;
  const db = await openDb();
  try {
    return await new Promise<AttemptPage>((resolve, reject) => {
      const tx = db.transaction(ATTEMPTS, "readonly");
      const idx = tx.objectStore(ATTEMPTS).index(BY_SPEECH_CREATED);
      const range = speechRange(speechId, opts.before);
      const req = idx.openCursor(range, "prev");
      const items: Attempt[] = [];
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) {
          resolve({ items, nextCursor: null });
          return;
        }
        if (items.length < limit) {
          items.push(normalize(cursor.value));
          cursor.continue();
          return;
        }
        // One row exists beyond this page, so hand back a cursor to it.
        resolve({ items, nextCursor: items[items.length - 1].created_at });
      };
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function countAttempts(speechId: string): Promise<number> {
  const db = await openDb();
  try {
    return await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(ATTEMPTS, "readonly");
      const idx = tx.objectStore(ATTEMPTS).index(BY_SPEECH_CREATED);
      const req = idx.count(speechRange(speechId));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function getAttempt(id: string): Promise<Attempt | null> {
  const db = await openDb();
  try {
    return await new Promise<Attempt | null>((resolve, reject) => {
      const tx = db.transaction(ATTEMPTS, "readonly");
      const req = tx.objectStore(ATTEMPTS).get(id);
      req.onsuccess = () =>
        resolve(req.result ? normalize(req.result) : null);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function saveSchedule(entry: ScheduleEntry): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SCHEDULES, "readwrite");
      tx.objectStore(SCHEDULES).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function getSchedule(
  speechId: string,
): Promise<ScheduleEntry | null> {
  const db = await openDb();
  try {
    return await new Promise<ScheduleEntry | null>((resolve, reject) => {
      const tx = db.transaction(SCHEDULES, "readonly");
      const req = tx.objectStore(SCHEDULES).get(speechId);
      req.onsuccess = () => resolve((req.result as ScheduleEntry) ?? null);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function clearSchedule(speechId: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SCHEDULES, "readwrite");
      tx.objectStore(SCHEDULES).delete(speechId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function markScheduleDone(speechId: string): Promise<void> {
  const existing = await getSchedule(speechId);
  if (!existing) return;
  await saveSchedule({ ...existing, status: "done" });
}

export function isFirstRunDone(): boolean {
  try {
    return localStorage.getItem(FIRST_RUN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markFirstRunDone(): void {
  try {
    localStorage.setItem(FIRST_RUN_KEY, "1");
  } catch {
    // Storage may be blocked; the walk simply reappears next visit.
  }
}
