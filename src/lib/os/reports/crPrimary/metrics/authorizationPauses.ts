/**
 * Derived "Services Paused — No RA" detection.
 *
 * A pause is inferred when a client that was actively receiving services has a
 * week with no billed service AND no authorization whose coverage window
 * includes that week. This is the only pause signal CentralReach data supports
 * on its own; every other workflow event is logged by the Authorization team.
 */
import { weekStart } from "../format";
import type { CrAuthorizationRow, CrBillingSessionRow } from "../types";

export interface DerivedPause {
  weekStart: string;
  clientKey: string;
  clientName: string;
  state: string | null;
  payor: string | null;
  lastAuthEnd: string | null;
}

function clientKeyOf(name: string | null | undefined, crId?: string | null): string {
  return (name ?? crId ?? "").trim().toLowerCase();
}

function addWeeks(week: string, count: number): string {
  const d = new Date(`${week}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + count * 7);
  return d.toISOString().slice(0, 10);
}

function coverageWindow(row: CrAuthorizationRow): [string, string] | null {
  const start = row.actual_start_date ?? row.start_date;
  const end = row.followup_end_date ?? row.actual_end_date ?? row.end_date;
  if (!start || !end) return null;
  const s = String(start).slice(0, 10);
  const e = String(end).slice(0, 10);
  return s <= e ? [s, e] : [e, s];
}

/** Weeks where an active client had no service and no covering authorization. */
export function deriveNoRaPauses(
  billing: CrBillingSessionRow[],
  authorizations: CrAuthorizationRow[],
): DerivedPause[] {
  const activeWeeks = new Map<string, Set<string>>();
  const meta = new Map<string, { name: string; state: string | null; payor: string | null }>();

  for (const row of billing) {
    const wk = weekStart(row.date_of_service);
    if (!wk) continue;
    const key = clientKeyOf(row.client_name, row.client_cr_id);
    if (!key) continue;
    if (!activeWeeks.has(key)) activeWeeks.set(key, new Set());
    activeWeeks.get(key)!.add(wk);
    if (!meta.has(key)) {
      meta.set(key, {
        name: (row.client_name ?? "Unknown client").trim() || "Unknown client",
        state: row.state ?? null,
        payor: row.payor ?? null,
      });
    }
  }

  const coverage = new Map<string, [string, string][]>();
  const lastEnd = new Map<string, string>();
  for (const auth of authorizations) {
    const key = clientKeyOf(auth.client_name, auth.client_cr_id);
    if (!key) continue;
    const window = coverageWindow(auth);
    if (!window) continue;
    if (!coverage.has(key)) coverage.set(key, []);
    coverage.get(key)!.push(window);
    const prev = lastEnd.get(key);
    if (!prev || window[1] > prev) lastEnd.set(key, window[1]);
  }

  const pauses: DerivedPause[] = [];
  for (const [key, weeks] of activeWeeks) {
    const sorted = [...weeks].sort();
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const windows = coverage.get(key) ?? [];
    for (let wk = first; wk <= last; wk = addWeeks(wk, 1)) {
      if (weeks.has(wk)) continue;
      const weekEnd = addWeeks(wk, 1);
      const covered = windows.some(([s, e]) => s < weekEnd && e >= wk);
      if (covered) continue;
      const info = meta.get(key)!;
      pauses.push({
        weekStart: wk,
        clientKey: key,
        clientName: info.name,
        state: info.state,
        payor: info.payor,
        lastAuthEnd: lastEnd.get(key) ?? null,
      });
    }
  }
  return pauses.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}
