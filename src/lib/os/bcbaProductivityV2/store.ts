/**
 * BCBA Productivity V2 — local store for assignment history and saved reports.
 * Assignment history is the source of truth for ownership at DOS.
 */

export interface BcbaAssignment {
  id: string;
  clientId: string;       // canonical client id (or normalized client name when id missing)
  clientName: string;
  bcbaName: string;
  startDate: string;      // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD or null = open
  note?: string;
  createdAt: number;
}

export interface BcbaSavedReportV2 {
  id: string;
  name: string;
  savedAt: number;
  fileName: string;
  rowCount: number;
  // For demo simplicity we persist the parsed billing rows JSON in IDB.
}

const ASSIGN_KEY = "bcba-prod-v2-assignments";
const SAVED_KEY = "bcba-prod-v2-saved";
const LAST_KEY  = "bcba-prod-v2-last-meta";
const IDB_NAME = "blossom-bcba-v2";
const IDB_STORE = "payloads";

function safeParse<T>(s: string | null, fb: T): T {
  if (!s) return fb;
  try { return JSON.parse(s) as T; } catch { return fb; }
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((res) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => res(req.result);
      req.onerror = () => res(null);
    } catch { res(null); }
  });
}
async function idbPut(id: string, value: unknown) {
  const db = await openDb(); if (!db) return;
  await new Promise<void>((res) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, id);
    tx.oncomplete = () => res(); tx.onerror = () => res(); tx.onabort = () => res();
  });
  db.close();
}
async function idbGet<T = unknown>(id: string): Promise<T | undefined> {
  const db = await openDb(); if (!db) return undefined;
  const r = await new Promise<T | undefined>((res) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(id);
    req.onsuccess = () => res(req.result as T); req.onerror = () => res(undefined);
  });
  db.close();
  return r;
}
async function idbDel(id: string) {
  const db = await openDb(); if (!db) return;
  await new Promise<void>((res) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(id);
    tx.oncomplete = () => res(); tx.onerror = () => res();
  });
  db.close();
}

/* ---------------- Assignment History ---------------- */
export function readAssignments(): BcbaAssignment[] {
  if (typeof window === "undefined") return [];
  return safeParse<BcbaAssignment[]>(localStorage.getItem(ASSIGN_KEY), []);
}
export function writeAssignments(list: BcbaAssignment[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(ASSIGN_KEY, JSON.stringify(list)); } catch {}
  try { window.dispatchEvent(new CustomEvent("bcba-prod-v2-assignments-changed")); } catch {}
}
export function addAssignment(a: Omit<BcbaAssignment, "id" | "createdAt">): BcbaAssignment {
  const list = readAssignments();
  const id = `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const entry: BcbaAssignment = { ...a, id, createdAt: Date.now() };
  list.unshift(entry);
  writeAssignments(list);
  return entry;
}
export function updateAssignment(id: string, patch: Partial<BcbaAssignment>) {
  const list = readAssignments();
  const i = list.findIndex(x => x.id === id);
  if (i < 0) return;
  list[i] = { ...list[i], ...patch };
  writeAssignments(list);
}
export function deleteAssignment(id: string) {
  writeAssignments(readAssignments().filter(x => x.id !== id));
}

/** Resolve which BCBA owned a client on a given DOS. */
export function ownerForClientAtDate(
  assignments: BcbaAssignment[],
  clientKey: string,
  dos: string,
): string | null {
  if (!clientKey || !dos) return null;
  const t = Date.parse(dos);
  if (!isFinite(t)) return null;
  let best: BcbaAssignment | null = null;
  for (const a of assignments) {
    if (a.clientId !== clientKey && a.clientName.toLowerCase() !== clientKey.toLowerCase()) continue;
    const s = Date.parse(a.startDate);
    const e = a.endDate ? Date.parse(a.endDate) : Number.POSITIVE_INFINITY;
    if (!isFinite(s)) continue;
    if (t >= s && t <= e) {
      if (!best || Date.parse(best.startDate) < s) best = a;
    }
  }
  return best?.bcbaName ?? null;
}

/** Derive transfer events from assignment history. */
export interface BcbaTransfer {
  clientId: string;
  clientName: string;
  previousBcba: string;
  newBcba: string;
  transferDate: string;
}
export function deriveTransfers(assignments: BcbaAssignment[]): BcbaTransfer[] {
  const byClient = new Map<string, BcbaAssignment[]>();
  for (const a of assignments) {
    const k = a.clientId || a.clientName.toLowerCase();
    if (!byClient.has(k)) byClient.set(k, []);
    byClient.get(k)!.push(a);
  }
  const out: BcbaTransfer[] = [];
  for (const [, list] of byClient) {
    const sorted = [...list].sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate));
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      if (prev.bcbaName === cur.bcbaName) continue;
      out.push({
        clientId: cur.clientId,
        clientName: cur.clientName,
        previousBcba: prev.bcbaName,
        newBcba: cur.bcbaName,
        transferDate: cur.startDate,
      });
    }
  }
  return out.sort((a, b) => Date.parse(b.transferDate) - Date.parse(a.transferDate));
}

/* ---------------- Saved reports ---------------- */
export function readSavedReports(): BcbaSavedReportV2[] {
  if (typeof window === "undefined") return [];
  return safeParse<BcbaSavedReportV2[]>(localStorage.getItem(SAVED_KEY), []);
}
function writeSaved(list: BcbaSavedReportV2[]) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch {}
  try { window.dispatchEvent(new CustomEvent("bcba-prod-v2-saved-changed")); } catch {}
}

/** Duplicate prevention: same filename + same row count within last 24h. */
export function findDuplicateSaved(fileName: string, rowCount: number): BcbaSavedReportV2 | undefined {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return readSavedReports().find(r =>
    r.fileName === fileName && r.rowCount === rowCount && r.savedAt >= cutoff
  );
}

export async function saveReportV2(opts: {
  name: string; fileName: string; rows: any[];
}): Promise<BcbaSavedReportV2> {
  const id = `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const meta: BcbaSavedReportV2 = {
    id, name: opts.name, savedAt: Date.now(),
    fileName: opts.fileName, rowCount: opts.rows.length,
  };
  await idbPut(id, { rows: opts.rows });
  const list = readSavedReports();
  list.unshift(meta);
  writeSaved(list);
  return meta;
}
export async function getSavedReportRows(id: string): Promise<any[]> {
  const v = await idbGet<{ rows: any[] }>(id);
  return v?.rows ?? [];
}
export async function deleteSavedReportV2(id: string) {
  writeSaved(readSavedReports().filter(r => r.id !== id));
  await idbDel(id);
}

/* Last session (so a refresh keeps the user's parsed data) */
export async function saveLastBilling(fileName: string, rows: any[]) {
  try { localStorage.setItem(LAST_KEY, JSON.stringify({ fileName, rowCount: rows.length })); } catch {}
  await idbPut("__last__", { rows });
}
export async function loadLastBilling(): Promise<{ fileName: string; rows: any[] } | null> {
  let meta: { fileName?: string } = {};
  try { const raw = localStorage.getItem(LAST_KEY); if (raw) meta = JSON.parse(raw); } catch {}
  const v = await idbGet<{ rows: any[] }>("__last__");
  if (!v?.rows?.length) return null;
  return { fileName: meta.fileName || "", rows: v.rows };
}
export async function clearLastBilling() {
  try { localStorage.removeItem(LAST_KEY); } catch {}
  await idbDel("__last__");
}

/* Demo seed for assignment history if empty */
export function seedAssignmentsIfEmpty(samples: { clientId: string; clientName: string }[]) {
  if (readAssignments().length > 0 || samples.length === 0) return;
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const oneYrAgo = new Date(today); oneYrAgo.setFullYear(today.getFullYear() - 1);
  const seeded: BcbaAssignment[] = samples.slice(0, 8).map((s, i) => ({
    id: `seed_${i}`,
    clientId: s.clientId,
    clientName: s.clientName,
    bcbaName: ["Avery Thompson", "Jordan Lee", "Morgan Patel"][i % 3],
    startDate: iso(oneYrAgo),
    endDate: null,
    note: "Seed",
    createdAt: Date.now(),
  }));
  writeAssignments(seeded);
}