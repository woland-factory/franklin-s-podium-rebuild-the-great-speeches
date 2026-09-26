import type {
  Attempt,
  AttemptMode,
  LedgerItem,
  ScheduleEntry,
  UserText,
} from "../types";

const DB_NAME = "franklins-podium";
const DB_VERSION = 3;
const ATTEMPTS = "attempts";
const SCHEDULES = "schedules";
const LEDGER = "ledger";
const USER_TEXTS = "user_texts";
const BY_SPEECH_CREATED = "by_speech_created";
const BY_SPEECH_SAVED = "by_speech_saved";
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
      // v3 adds two empty stores and touches nothing existing. The ledger's
      // compound index clusters kept lines by source, so grouping is a
      // contiguous cursor pass and one source's keep-state is a bounded scan.
      if (!db.objectStoreNames.contains(LEDGER)) {
        const ledger = db.createObjectStore(LEDGER, { keyPath: "id" });
        ledger.createIndex(BY_SPEECH_SAVED, ["speech_id", "saved_at"]);
      }
      if (!db.objectStoreNames.contains(USER_TEXTS)) {
        db.createObjectStore(USER_TEXTS, { keyPath: "id" });
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

// --- Ledger: kept lines, clustered by source on the compound index ---

const DEFAULT_LEDGER_PAGE = 30;

export interface LedgerPage {
  items: LedgerItem[];
  // The compound key [speech_id, saved_at] to continue from; null when done.
  nextCursor: [string, number] | null;
}

// Every kept line for one source. Bounded by how many lines the user kept for
// that source (small), read as an index range scan, never a full-store scan.
function ledgerSpeechRange(speechId: string): IDBKeyRange {
  return IDBKeyRange.bound([speechId], [speechId, []]);
}

export async function saveLedgerItem(item: LedgerItem): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(LEDGER, "readwrite");
      tx.objectStore(LEDGER).put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function removeLedgerItem(id: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(LEDGER, "readwrite");
      tx.objectStore(LEDGER).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function listLedgerBySpeech(
  speechId: string,
): Promise<LedgerItem[]> {
  const db = await openDb();
  try {
    return await new Promise<LedgerItem[]>((resolve, reject) => {
      const tx = db.transaction(LEDGER, "readonly");
      const idx = tx.objectStore(LEDGER).index(BY_SPEECH_SAVED);
      const req = idx.getAll(ledgerSpeechRange(speechId));
      req.onsuccess = () => resolve((req.result as LedgerItem[]) ?? []);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function listLedger(
  opts: { limit?: number; after?: [string, number] | null } = {},
): Promise<LedgerPage> {
  const limit = opts.limit ?? DEFAULT_LEDGER_PAGE;
  const db = await openDb();
  try {
    return await new Promise<LedgerPage>((resolve, reject) => {
      const tx = db.transaction(LEDGER, "readonly");
      const idx = tx.objectStore(LEDGER).index(BY_SPEECH_SAVED);
      // Iterate ascending so items arrive clustered by speech_id, then saved_at.
      const range = opts.after
        ? IDBKeyRange.lowerBound(opts.after, true)
        : undefined;
      const req = idx.openCursor(range ?? null, "next");
      const items: LedgerItem[] = [];
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) {
          resolve({ items, nextCursor: null });
          return;
        }
        if (items.length < limit) {
          items.push(cursor.value as LedgerItem);
          cursor.continue();
          return;
        }
        // A further row exists, so hand back the compound key to continue from.
        const last = items[items.length - 1];
        resolve({ items, nextCursor: [last.speech_id, last.saved_at] });
      };
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function countLedger(): Promise<number> {
  const db = await openDb();
  try {
    return await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(LEDGER, "readonly");
      const req = tx.objectStore(LEDGER).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

// --- User texts: opened by their exact id, so a primary-key store ---

export async function saveUserText(t: UserText): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(USER_TEXTS, "readwrite");
      tx.objectStore(USER_TEXTS).put(t);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function getUserText(id: string): Promise<UserText | null> {
  const db = await openDb();
  try {
    return await new Promise<UserText | null>((resolve, reject) => {
      const tx = db.transaction(USER_TEXTS, "readonly");
      const req = tx.objectStore(USER_TEXTS).get(id);
      req.onsuccess = () => resolve((req.result as UserText) ?? null);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

// --- Export: a deliberate, off-the-hot-path read of every store once ---

export interface ExportRows {
  attempts: Attempt[];
  ledger: LedgerItem[];
  userTexts: UserText[];
}

export async function readAllForExport(): Promise<ExportRows> {
  const db = await openDb();
  try {
    return await new Promise<ExportRows>((resolve, reject) => {
      const tx = db.transaction(
        [ATTEMPTS, LEDGER, USER_TEXTS],
        "readonly",
      );
      const attempts: Attempt[] = [];
      const ledger: LedgerItem[] = [];
      const userTexts: UserText[] = [];

      const ac = tx.objectStore(ATTEMPTS).openCursor();
      ac.onsuccess = () => {
        const c = ac.result;
        if (c) {
          // Audio never leaves the device: strip the blob from the record.
          attempts.push({ ...normalize(c.value), audio_blob: null });
          c.continue();
        }
      };
      const lc = tx.objectStore(LEDGER).openCursor();
      lc.onsuccess = () => {
        const c = lc.result;
        if (c) {
          ledger.push(c.value as LedgerItem);
          c.continue();
        }
      };
      const uc = tx.objectStore(USER_TEXTS).openCursor();
      uc.onsuccess = () => {
        const c = uc.result;
        if (c) {
          userTexts.push(c.value as UserText);
          c.continue();
        }
      };

      tx.oncomplete = () => resolve({ attempts, ledger, userTexts });
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
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
