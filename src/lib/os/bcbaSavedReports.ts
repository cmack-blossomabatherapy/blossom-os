export type BcbaSavedReport = {
  id: string;
  name: string;
  savedAt: number;
  billingFileName: string;
  authFileNames: string[];
  billingRaws: any[];
  authRecords: any[];
  insights?: string[];
};

// Metadata-only list lives in localStorage so ReportsHome can render synchronously.
// Heavy payloads (billingRaws / authRecords) live in IndexedDB to avoid the
// ~5 MB localStorage quota that was silently dropping the uploaded rows.
const SAVED_KEY = "bcba-productivity-saved-reports";
export const BCBA_LAST_SESSION_KEY = "bcba-productivity-last-session";
const LAST_SESSION_ID = "__last_session__";

const IDB_NAME = "blossom-bcba-reports";
const IDB_STORE = "payloads";

type SavedMeta = Omit<BcbaSavedReport, "billingRaws" | "authRecords">;
type Payload = { billingRaws: any[]; authRecords: any[] };

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbPut(id: string, value: Payload): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  db.close();
}

async function idbGet(id: string): Promise<Payload | undefined> {
  const db = await openDb();
  if (!db) return undefined;
  const result = await new Promise<Payload | undefined>((resolve) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(id);
    req.onsuccess = () => resolve(req.result as Payload | undefined);
    req.onerror = () => resolve(undefined);
  });
  db.close();
  return result;
}

async function idbDelete(id: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

function safeParse<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

function readMetaList(): SavedMeta[] {
  if (typeof window === "undefined") return [];
  return safeParse<SavedMeta[]>(localStorage.getItem(SAVED_KEY), []);
}

function writeMetaList(list: SavedMeta[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list));
  } catch {
    // Metadata is small; if even this fails, trim to the most recent 25.
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(list.slice(0, 25))); } catch {}
  }
}

/** Sync metadata-only list for ReportsHome. billingRaws/authRecords are empty here. */
export function readSavedReports(): BcbaSavedReport[] {
  return readMetaList().map((m) => ({ ...m, billingRaws: [], authRecords: [] }));
}

export async function saveReport(
  entry: Omit<BcbaSavedReport, "id" | "savedAt"> & { id?: string }
): Promise<BcbaSavedReport> {
  const list = readMetaList();
  const id = entry.id ?? (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const meta: SavedMeta = {
    id,
    name: entry.name,
    savedAt: Date.now(),
    billingFileName: entry.billingFileName,
    authFileNames: entry.authFileNames,
    insights: entry.insights,
  };
  await idbPut(id, { billingRaws: entry.billingRaws, authRecords: entry.authRecords });
  const idx = list.findIndex((r) => r.id === id);
  if (idx >= 0) list[idx] = meta; else list.unshift(meta);
  writeMetaList(list);
  try { window.dispatchEvent(new CustomEvent("bcba-saved-reports-changed")); } catch {}
  return { ...meta, billingRaws: entry.billingRaws, authRecords: entry.authRecords };
}

export async function deleteSavedReport(id: string): Promise<void> {
  writeMetaList(readMetaList().filter((r) => r.id !== id));
  await idbDelete(id);
  try { window.dispatchEvent(new CustomEvent("bcba-saved-reports-changed")); } catch {}
}

export async function getSavedReport(id: string): Promise<BcbaSavedReport | undefined> {
  const meta = readMetaList().find((r) => r.id === id);
  if (!meta) return undefined;
  const payload = (await idbGet(id)) ?? { billingRaws: [], authRecords: [] };
  return { ...meta, ...payload };
}

/** Last-session helpers using IndexedDB so large uploads survive a reload. */
export async function saveLastSession(payload: {
  billingFileName: string;
  authFileNames: string[];
  billingRaws: any[];
  authRecords: any[];
}): Promise<void> {
  await idbPut(LAST_SESSION_ID, {
    billingRaws: payload.billingRaws,
    authRecords: payload.authRecords,
  });
  try {
    localStorage.setItem(BCBA_LAST_SESSION_KEY, JSON.stringify({
      billingFileName: payload.billingFileName,
      authFileNames: payload.authFileNames,
    }));
  } catch {}
}

export async function loadLastSession(): Promise<{
  billingFileName: string;
  authFileNames: string[];
  billingRaws: any[];
  authRecords: any[];
} | null> {
  let meta: { billingFileName?: string; authFileNames?: string[] } = {};
  try {
    const raw = localStorage.getItem(BCBA_LAST_SESSION_KEY);
    if (raw) meta = JSON.parse(raw);
  } catch {}
  const payload = await idbGet(LAST_SESSION_ID);
  if (!payload || !payload.billingRaws?.length) return null;
  return {
    billingFileName: meta.billingFileName || "",
    authFileNames: meta.authFileNames || [],
    billingRaws: payload.billingRaws,
    authRecords: payload.authRecords || [],
  };
}

export async function clearLastSession(): Promise<void> {
  try { localStorage.removeItem(BCBA_LAST_SESSION_KEY); } catch {}
  await idbDelete(LAST_SESSION_ID);
}