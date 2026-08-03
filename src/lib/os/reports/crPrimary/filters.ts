import type {
  FilterableFact,
  PrimaryReportFilters,
} from "./types";
import { inDayRange, periodOverlapsDayRange } from "@/lib/os/reports/dateKey";

function eq(a: string | null | undefined, b: string): boolean {
  return (a ?? "").trim().toLowerCase() === b.trim().toLowerCase();
}

/** True when a projected fact row satisfies every active filter. */
export function matchesFilters(
  fact: FilterableFact,
  filters: PrimaryReportFilters,
): boolean {
  const dateMatches = fact.endDate !== undefined
    ? periodOverlapsDayRange(fact.date, fact.endDate, filters.from, filters.to)
    : inDayRange(fact.date, filters.from, filters.to);
  if (!dateMatches) return false;
  if (filters.state && !eq(fact.state, filters.state)) return false;
  if (filters.client && !eq(fact.client, filters.client)) return false;
  if (filters.provider && !eq(fact.provider, filters.provider)) return false;
  if (filters.payor && !eq(fact.payor, filters.payor)) return false;
  if (filters.code && !eq(fact.code, filters.code)) return false;
  if (filters.location && !eq(fact.location, filters.location)) return false;
  if (filters.status && !eq(fact.status, filters.status)) return false;
  return true;
}

export function applyFilters<T>(
  rows: T[],
  filters: PrimaryReportFilters,
  project: (row: T) => FilterableFact,
): T[] {
  return rows.filter((r) => matchesFilters(project(r), filters));
}

/** Distinct, sorted, non-empty option list for a filter dropdown. */
export function optionsFor<T>(
  rows: T[],
  pick: (row: T) => string | null | undefined,
): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const v = (pick(r) ?? "").trim();
    if (v) set.add(v);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function activeFilterCount(filters: PrimaryReportFilters): number {
  return Object.values(filters).filter((v) => !!v).length;
}