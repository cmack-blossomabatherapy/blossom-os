import type { ClinicalFilters } from "./types";

export function buildFacets(rows: Array<Record<string, any>>, bcbaNameKey = "assigned_bcba_name", bcbaIdKey = "assigned_bcba_id") {
  const states = new Map<string, string>();
  const clinics = new Map<string, string>();
  const bcbas = new Map<string, string>();
  for (const r of rows) {
    if (r.state) states.set(String(r.state), String(r.state));
    if (r.clinic) clinics.set(String(r.clinic), String(r.clinic));
    const id = r[bcbaIdKey];
    const name = r[bcbaNameKey];
    if (id) bcbas.set(String(id), String(name ?? id));
  }
  const toOptions = (m: Map<string, string>) =>
    Array.from(m.entries()).map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  return { states: toOptions(states), clinics: toOptions(clinics), bcbas: toOptions(bcbas) };
}

export function matchesFilters(row: Record<string, any>, filters: ClinicalFilters, bcbaIdKey = "assigned_bcba_id"): boolean {
  if (filters.state && (row.state ?? "") !== filters.state) return false;
  if (filters.clinic && (row.clinic ?? "") !== filters.clinic) return false;
  if (filters.bcbaId && (row[bcbaIdKey] ?? "") !== filters.bcbaId) return false;
  return true;
}