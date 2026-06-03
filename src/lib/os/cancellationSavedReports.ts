export type CancellationSavedReport = {
  id: string;
  name: string;
  savedAt: number;
  scheduleFileName: string;
  billingFileName?: string;
  authFileNames: string[];
  scheduleRaws: any[];
  billingRaws: any[];
  authRecords: any[];
  insights?: string[];
};

// Metadata in localStorage so ReportsHome renders synchronously.
// Heavy payloads (raw rows) live in IndexedDB.
const SAVED_KEY = "cancellation-cc-saved-reports";
export const CANCEL_LAST_SESSION_KEY = "cancellation-cc-last-session";
const LAST_SESSION_ID = "__last_session__";

const IDB_NAME = "blossom-cancellation-reports";
const IDB_STORE = "payloads";

type SavedMeta = Omit<CancellationSavedReport, "scheduleRaws" | "billingRaws" | "authRecords">;
type Payload = { scheduleRaws: any[]; billingRaws: any[]; authRecords: any[] };

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
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(list.slice(0, 25))); } catch {}
  }
}

export function readCancellationSavedReports(): CancellationSavedReport[] {
  return readMetaList().map((m) => ({ ...m, scheduleRaws: [], billingRaws: [], authRecords: [] }));
}

export async function saveCancellationReport(
  entry: Omit<CancellationSavedReport, "id" | "savedAt"> & { id?: string }
): Promise<CancellationSavedReport> {
  const list = readMetaList();
  const id = entry.id ?? (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const meta: SavedMeta = {
    id,
    name: entry.name,
    savedAt: Date.now(),
    scheduleFileName: entry.scheduleFileName,
    billingFileName: entry.billingFileName,
    authFileNames: entry.authFileNames,
    insights: entry.insights,
  };
  await idbPut(id, {
    scheduleRaws: entry.scheduleRaws,
    billingRaws: entry.billingRaws,
    authRecords: entry.authRecords,
  });
  const idx = list.findIndex((r) => r.id === id);
  if (idx >= 0) list[idx] = meta; else list.unshift(meta);
  writeMetaList(list);
  try { window.dispatchEvent(new CustomEvent("cancellation-saved-reports-changed")); } catch {}
  return { ...meta, scheduleRaws: entry.scheduleRaws, billingRaws: entry.billingRaws, authRecords: entry.authRecords };
}

export async function deleteCancellationSavedReport(id: string): Promise<void> {
  writeMetaList(readMetaList().filter((r) => r.id !== id));
  await idbDelete(id);
  try { window.dispatchEvent(new CustomEvent("cancellation-saved-reports-changed")); } catch {}
}

export async function getCancellationSavedReport(id: string): Promise<CancellationSavedReport | undefined> {
  const meta = readMetaList().find((r) => r.id === id);
  if (!meta) return undefined;
  const payload = (await idbGet(id)) ?? { scheduleRaws: [], billingRaws: [], authRecords: [] };
  return { ...meta, ...payload };
}

export async function saveCancellationLastSession(payload: {
  scheduleFileName: string;
  billingFileName?: string;
  authFileNames: string[];
  scheduleRaws: any[];
  billingRaws: any[];
  authRecords: any[];
}): Promise<void> {
  await idbPut(LAST_SESSION_ID, {
    scheduleRaws: payload.scheduleRaws,
    billingRaws: payload.billingRaws,
    authRecords: payload.authRecords,
  });
  try {
    localStorage.setItem(CANCEL_LAST_SESSION_KEY, JSON.stringify({
      scheduleFileName: payload.scheduleFileName,
      billingFileName: payload.billingFileName,
      authFileNames: payload.authFileNames,
    }));
  } catch {}
}

export async function loadCancellationLastSession(): Promise<{
  scheduleFileName: string;
  billingFileName?: string;
  authFileNames: string[];
  scheduleRaws: any[];
  billingRaws: any[];
  authRecords: any[];
} | null> {
  let meta: { scheduleFileName?: string; billingFileName?: string; authFileNames?: string[] } = {};
  try {
    const raw = localStorage.getItem(CANCEL_LAST_SESSION_KEY);
    if (raw) meta = JSON.parse(raw);
  } catch {}
  const payload = await idbGet(LAST_SESSION_ID);
  if (!payload || !payload.scheduleRaws?.length) return null;
  return {
    scheduleFileName: meta.scheduleFileName || "",
    billingFileName: meta.billingFileName,
    authFileNames: meta.authFileNames || [],
    scheduleRaws: payload.scheduleRaws,
    billingRaws: payload.billingRaws || [],
    authRecords: payload.authRecords || [],
  };
}

export async function clearCancellationLastSession(): Promise<void> {
  try { localStorage.removeItem(CANCEL_LAST_SESSION_KEY); } catch {}
  await idbDelete(LAST_SESSION_ID);
}