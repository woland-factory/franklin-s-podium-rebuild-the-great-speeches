import type { Attempt } from "../types";

const DB_NAME = "franklins-podium";
const DB_VERSION = 1;
const STORE = "attempts";
const FIRST_RUN_KEY = "first_run_done";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    // Forward-only migrations: create stores here, never rewrite them.
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Persist the single latest attempt so its audio stays replayable across a
 * reload. One overwritable record per speech is the ceiling for this EPIC.
 */
export async function saveAttempt(attempt: Attempt): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ ...attempt, id: attempt.speech_id });
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
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(speechId);
      req.onsuccess = () => resolve((req.result as Attempt) ?? null);
      req.onerror = () => reject(req.error);
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
