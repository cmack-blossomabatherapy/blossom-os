/**
 * BCBA Productivity V3 — persistent Assignment History plus saved report payloads.
 * Assignment History is the source of truth for ownership at DOS. No seeded production data.
 */

import { supabase } from "@/integrations/supabase/client";

export interface BcbaAssignmentV3 {
  id: string;
  clientId: string;       // canonical client id (may be empty)
  clientName: string;     // raw display name
  bcbaName: string;
  startDate: string;      // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD or null = open
  note?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface BcbaSavedReportV3 {
  id: string;
  name: string;
  savedAt: number;
  fileName: string;
  rowCount: number;
}

const ASSIGN_KEY = "bcba-prod-v3-assignments-cache";
const SAVED_KEY  = "bcba-prod-v3-saved";
const LAST_KEY   = "bcba-prod-v3-last-meta";
const IDB_NAME   = "blossom-bcba-v3";
const IDB_STORE  = "payloads";
const ASSIGNMENT_TABLE = "bcba_assignment_history";

type DbAssignmentV3 = {
  id: string;
  client_id: string | null;
  client_name: string;
  bcba_name: string;
  start_date: string;
  end_date: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

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

/* ---- name normalization ---- */
export function normalizeName(s: string): string {
  if (!s) return "";
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/* ---------------- Assignment History ---------------- */
export function readAssignmentsV3(): BcbaAssignmentV3[] {
  if (typeof window === "undefined") return [];
  return safeParse<BcbaAssignmentV3[]>(localStorage.getItem(ASSIGN_KEY), []);
}
function cacheAssignmentsV3(list: BcbaAssignmentV3[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(ASSIGN_KEY, JSON.stringify(list)); } catch {}
  try { window.dispatchEvent(new CustomEvent("bcba-prod-v3-assignments-changed")); } catch {}
}
const toMs = (s?: string | null) => {
  const t = s ? Date.parse(s) : NaN;
  return isFinite(t) ? t : Date.now();
};
const fromDbAssignmentV3 = (r: DbAssignmentV3): BcbaAssignmentV3 => ({
  id: r.id,
  clientId: r.client_id ?? "",
  clientName: r.client_name,
  bcbaName: r.bcba_name,
  startDate: r.start_date,
  endDate: r.end_date,
  note: r.note ?? "",
  createdAt: toMs(r.created_at),
  updatedAt: toMs(r.updated_at),
});
const toDbAssignmentV3 = (a: Omit<BcbaAssignmentV3, "id" | "createdAt" | "updatedAt">) => ({
  client_id: a.clientId?.trim() || null,
  client_name: a.clientName.trim(),
  bcba_name: a.bcbaName.trim(),
  start_date: a.startDate,
  end_date: a.endDate || null,
  note: a.note?.trim() || null,
});

export async function loadAssignmentsV3(): Promise<BcbaAssignmentV3[]> {
  const { data, error } = await supabase
    .from(ASSIGNMENT_TABLE as any)
    .select("id, client_id, client_name, bcba_name, start_date, end_date, note, created_at, updated_at")
    .order("start_date", { ascending: false });
  if (error) throw error;
  const list = ((data ?? []) as DbAssignmentV3[]).map(fromDbAssignmentV3);
  cacheAssignmentsV3(list);
  return list;
}
export async function addAssignmentV3(a: Omit<BcbaAssignmentV3, "id" | "createdAt" | "updatedAt">): Promise<BcbaAssignmentV3> {
  const { data, error } = await supabase
    .from(ASSIGNMENT_TABLE as any)
    .insert(toDbAssignmentV3(a) as any)
    .select("id, client_id, client_name, bcba_name, start_date, end_date, note, created_at, updated_at")
    .single();
  if (error) throw error;
  const fresh = fromDbAssignmentV3(data as DbAssignmentV3);
  cacheAssignmentsV3([fresh, ...readAssignmentsV3().filter(x => x.id !== fresh.id)]);
  return fresh;
}
export async function updateAssignmentV3(id: string, patch: Partial<BcbaAssignmentV3>): Promise<void> {
  const clean: Record<string, unknown> = {};
  if (patch.clientId !== undefined) clean.client_id = patch.clientId.trim() || null;
  if (patch.clientName !== undefined) clean.client_name = patch.clientName.trim();
  if (patch.bcbaName !== undefined) clean.bcba_name = patch.bcbaName.trim();
  if (patch.startDate !== undefined) clean.start_date = patch.startDate;
  if (patch.endDate !== undefined) clean.end_date = patch.endDate || null;
  if (patch.note !== undefined) clean.note = patch.note?.trim() || null;
  const { error } = await supabase.from(ASSIGNMENT_TABLE as any).update(clean as any).eq("id", id);
  if (error) throw error;
  const list = readAssignmentsV3();
  const i = list.findIndex(x => x.id === id);
  if (i >= 0) { list[i] = { ...list[i], ...patch, updatedAt: Date.now() }; cacheAssignmentsV3(list); }
}
export async function deleteAssignmentV3(id: string): Promise<void> {
  const { error } = await supabase.from(ASSIGNMENT_TABLE as any).delete().eq("id", id);
  if (error) throw error;
  cacheAssignmentsV3(readAssignmentsV3().filter(x => x.id !== id));
}
export async function bulkInsertAssignmentsV3(list: Omit<BcbaAssignmentV3, "id" | "createdAt" | "updatedAt">[]): Promise<BcbaAssignmentV3[]> {
  if (!list.length) return readAssignmentsV3();
  const { error } = await supabase.from(ASSIGNMENT_TABLE as any).insert(list.map(toDbAssignmentV3) as any);
  if (error) throw error;
  return loadAssignmentsV3();
}

/**
 * Resolve which BCBA owned a client on a given DOS.
 * Matching:
 *   - If both billing.clientId and assignment.clientId are present and equal -> match.
 *   - Else if normalized client names equal -> match.
 * Date window: startDate <= dos AND (endDate is null OR dos <= endDate).
 * If multiple match, pick the one with the latest startDate.
 */
export function ownerForClientAtDateV3(
  assignments: BcbaAssignmentV3[],
  billingClientId: string,
  billingClientName: string,
  dos: string,
): { bcba: string; assignmentId: string } | null {
  if (!dos) return null;
  const t = Date.parse(dos);
  if (!isFinite(t)) return null;
  const idKey = (billingClientId || "").trim();
  const nameKey = normalizeName(billingClientName);
  let best: BcbaAssignmentV3 | null = null;
  for (const a of assignments) {
    const idMatch = !!(idKey && a.clientId && a.clientId.trim() === idKey);
    const nameMatch = !!(nameKey && normalizeName(a.clientName) === nameKey);
    if (!idMatch && !nameMatch) continue;
    const s = Date.parse(a.startDate);
    if (!isFinite(s) || t < s) continue;
    const e = a.endDate ? Date.parse(a.endDate) : Number.POSITIVE_INFINITY;
    if (t > e) continue;
    if (!best || Date.parse(best.startDate) < s) best = a;
  }
  return best ? { bcba: best.bcbaName, assignmentId: best.id } : null;
}

/** Derive transfer events from assignment history. */
export interface BcbaTransferV3 {
  clientId: string;
  clientName: string;
  previousBcba: string;
  newBcba: string;
  transferDate: string;
}
export function deriveTransfersV3(assignments: BcbaAssignmentV3[]): BcbaTransferV3[] {
  const byClient = new Map<string, BcbaAssignmentV3[]>();
  for (const a of assignments) {
    const k = a.clientId || normalizeName(a.clientName);
    if (!byClient.has(k)) byClient.set(k, []);
    byClient.get(k)!.push(a);
  }
  const out: BcbaTransferV3[] = [];
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
export function readSavedReportsV3(): BcbaSavedReportV3[] {
  if (typeof window === "undefined") return [];
  return safeParse<BcbaSavedReportV3[]>(localStorage.getItem(SAVED_KEY), []);
}
function writeSavedV3(list: BcbaSavedReportV3[]) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch {}
  try { window.dispatchEvent(new CustomEvent("bcba-prod-v3-saved-changed")); } catch {}
}

export function findDuplicateSavedV3(fileName: string, rowCount: number): BcbaSavedReportV3 | undefined {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return readSavedReportsV3().find(r =>
    r.fileName === fileName && r.rowCount === rowCount && r.savedAt >= cutoff
  );
}

export async function saveReportV3(opts: {
  name: string; fileName: string; rows: any[];
}): Promise<BcbaSavedReportV3> {
  const id = `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const meta: BcbaSavedReportV3 = {
    id, name: opts.name, savedAt: Date.now(),
    fileName: opts.fileName, rowCount: opts.rows.length,
  };
  await idbPut(id, { rows: opts.rows });
  const list = readSavedReportsV3();
  list.unshift(meta);
  writeSavedV3(list);
  return meta;
}
export async function getSavedReportRowsV3(id: string): Promise<any[]> {
  const v = await idbGet<{ rows: any[] }>(id);
  return v?.rows ?? [];
}
export async function deleteSavedReportV3(id: string) {
  writeSavedV3(readSavedReportsV3().filter(r => r.id !== id));
  await idbDel(id);
}

/* Last session persistence */
export async function saveLastBillingV3(fileName: string, rows: any[]) {
  try { localStorage.setItem(LAST_KEY, JSON.stringify({ fileName, rowCount: rows.length })); } catch {}
  await idbPut("__last__", { rows });
}
export async function loadLastBillingV3(): Promise<{ fileName: string; rows: any[] } | null> {
  let meta: { fileName?: string } = {};
  try { const raw = localStorage.getItem(LAST_KEY); if (raw) meta = JSON.parse(raw); } catch {}
  const v = await idbGet<{ rows: any[] }>("__last__");
  if (!v?.rows?.length) return null;
  return { fileName: meta.fileName || "", rows: v.rows };
}
export async function clearLastBillingV3() {
  try { localStorage.removeItem(LAST_KEY); } catch {}
  await idbDel("__last__");
}