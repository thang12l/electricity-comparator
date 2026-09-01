import type { AmberUsageResult } from "@/lib/amber/fetchUsage";

const DB_NAME = "electricity-comparator";
const DB_VERSION = 1;
const STORE_NAME = "amber-usage";
const RECORD_KEY = "latest";

export type StoredAmberUsage = AmberUsageResult;

function isStoredAmberUsage(value: unknown): value is StoredAmberUsage {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.siteId === "string" &&
    typeof row.nmi === "string" &&
    typeof row.network === "string" &&
    Array.isArray(row.intervals)
  );
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () =>
      reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(STORE_NAME, mode);
    const result = run(tx.objectStore(STORE_NAME));
    const [value] = await Promise.all([
      requestToPromise(result),
      transactionDone(tx),
    ]);
    return value;
  } finally {
    db.close();
  }
}

export async function readAmberUsage(): Promise<StoredAmberUsage | null> {
  try {
    if (typeof indexedDB === "undefined") return null;
    const record = await withStore("readonly", (store) => store.get(RECORD_KEY));
    return isStoredAmberUsage(record) ? record : null;
  } catch {
    return null;
  }
}

export async function writeAmberUsage(usage: StoredAmberUsage): Promise<void> {
  try {
    if (typeof indexedDB === "undefined") return;
    await withStore("readwrite", (store) => store.put(usage, RECORD_KEY));
  } catch {
    // Privacy mode / quota — persistence is convenience only.
  }
}

export async function clearAmberUsage(): Promise<void> {
  try {
    if (typeof indexedDB === "undefined") return;
    await withStore("readwrite", (store) => store.delete(RECORD_KEY));
  } catch {
    // Privacy mode / quota — persistence is convenience only.
  }
}
