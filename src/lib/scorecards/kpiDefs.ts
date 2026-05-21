// KPI definitions for the State Director scorecard.
// Keep the order — drives copy-for-Bloom output and tile sort.

export type KpiUnit = "hours" | "clients" | "count" | "percent";
export type KpiStatus = "healthy" | "watch" | "at_risk";

export interface KpiDef {
  key: string;
  label: string;
  unit: KpiUnit;
  /** Higher is better? false means dropping is OK (e.g. restaffing needed). */
  higherIsBetter: boolean;
  /** Optional short description that appears on hover. */
  hint?: string;
  /** Operational thresholds. For higherIsBetter: healthy >= healthy, watch >= watch, else at_risk.
   *  For !higherIsBetter: healthy <= healthy, watch <= watch, else at_risk. */
  thresholds?: { healthy: number; watch: number };
}

export const SD_KPIS: KpiDef[] = [
  { key: "hours_51", label: "51 Hours", unit: "hours", higherIsBetter: true, hint: "Assessment hours", thresholds: { healthy: 20, watch: 10 } },
  { key: "hours_53", label: "53 Hours", unit: "hours", higherIsBetter: true, hint: "Direct therapy hours", thresholds: { healthy: 800, watch: 600 } },
  { key: "hours_55", label: "55 Hours", unit: "hours", higherIsBetter: true, hint: "Protocol modification", thresholds: { healthy: 50, watch: 25 } },
  { key: "hours_56", label: "56 Hours", unit: "hours", higherIsBetter: true, hint: "Parent training", thresholds: { healthy: 100, watch: 50 } },
  { key: "total_hours", label: "Total Hours", unit: "hours", higherIsBetter: true, thresholds: { healthy: 1000, watch: 750 } },
  { key: "total_potential_hours", label: "Total Potential Hours", unit: "hours", higherIsBetter: true, thresholds: { healthy: 1200, watch: 900 } },
  { key: "active_clients", label: "Active Clients", unit: "clients", higherIsBetter: true, thresholds: { healthy: 60, watch: 45 } },
  { key: "avg_client_hours", label: "Avg Client Hours", unit: "hours", higherIsBetter: true, thresholds: { healthy: 15, watch: 10 } },
  { key: "ccs_sent_out", label: "CC's Sent Out", unit: "count", higherIsBetter: true, thresholds: { healthy: 5, watch: 3 } },
  { key: "ongoing_ias", label: "Ongoing IAs", unit: "count", higherIsBetter: true, thresholds: { healthy: 8, watch: 5 } },
  { key: "restaffing_needed", label: "Restaffing Needed", unit: "count", higherIsBetter: false, thresholds: { healthy: 0, watch: 2 } },
  { key: "tx_auth_received", label: "TX Auth Received", unit: "count", higherIsBetter: true, thresholds: { healthy: 4, watch: 2 } },
  { key: "pct_bcba_hours", label: "% of BCBA Hours", unit: "percent", higherIsBetter: true, thresholds: { healthy: 12, watch: 8 } },
  { key: "bcbas_hired", label: "BCBAs Hired", unit: "count", higherIsBetter: true, thresholds: { healthy: 6, watch: 4 } },
  { key: "cases_started", label: "Cases Started That Week", unit: "count", higherIsBetter: true, thresholds: { healthy: 3, watch: 1 } },
];

export function formatKpiValue(v: number | null | undefined, unit: KpiUnit): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  switch (unit) {
    case "percent": return v.toFixed(2);
    case "hours":   return Number.isInteger(v) ? String(v) : v.toFixed(1);
    default:        return Number.isInteger(v) ? String(v) : v.toFixed(2);
  }
}

export function pctChange(curr: number, prev: number): number | null {
  if (prev === 0 || prev === null || prev === undefined) return null;
  return ((curr - prev) / prev) * 100;
}

export function statusFor(def: KpiDef, change: number | null): KpiStatus {
  if (change === null) return "healthy";
  const swing = def.higherIsBetter ? change : -change;
  if (swing >= -2) return "healthy";
  if (swing >= -10) return "watch";
  return "at_risk";
}