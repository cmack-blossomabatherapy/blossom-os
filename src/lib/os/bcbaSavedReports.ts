export type BcbaSavedReport = {
  id: string;
  name: string;
  savedAt: number;
  billingFileName: string;
  authFileNames: string[];
  billingRaws: any[];
  authRecords: any[];
};

const SAVED_KEY = "bcba-productivity-saved-reports";
export const BCBA_LAST_SESSION_KEY = "bcba-productivity-last-session";

function safeParse<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

export function readSavedReports(): BcbaSavedReport[] {
  if (typeof window === "undefined") return [];
  return safeParse<BcbaSavedReport[]>(localStorage.getItem(SAVED_KEY), []);
}

export function writeSavedReports(list: BcbaSavedReport[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVED_KEY, JSON.stringify(list));
}

export function saveReport(entry: Omit<BcbaSavedReport, "id" | "savedAt"> & { id?: string }): BcbaSavedReport {
  const list = readSavedReports();
  const id = entry.id ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const record: BcbaSavedReport = {
    id,
    name: entry.name,
    savedAt: Date.now(),
    billingFileName: entry.billingFileName,
    authFileNames: entry.authFileNames,
    billingRaws: entry.billingRaws,
    authRecords: entry.authRecords,
  };
  const idx = list.findIndex(r => r.id === id);
  if (idx >= 0) list[idx] = record; else list.unshift(record);
  writeSavedReports(list);
  return record;
}

export function deleteSavedReport(id: string) {
  writeSavedReports(readSavedReports().filter(r => r.id !== id));
}

export function getSavedReport(id: string): BcbaSavedReport | undefined {
  return readSavedReports().find(r => r.id === id);
}