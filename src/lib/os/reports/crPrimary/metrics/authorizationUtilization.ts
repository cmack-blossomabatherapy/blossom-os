import { pct } from "../format";
import type { CrAuthorizationRow, CrUtilizationRow } from "../types";

export const OVER_UTILIZED_PCT = 100;
export const UNDER_UTILIZED_PCT = 70;
export const EXPIRING_SOON_DAYS = 30;

/** Utilization percentage (0-100+) from authorized + used hours. */
export function utilizationPct(used: number, authorized: number): number {
  if (!authorized) return 0;
  return Math.round((used / authorized) * 1000) / 10;
}

export type UtilizationBand = "under" | "on_track" | "over";

export function utilizationBand(p: number): UtilizationBand {
  if (p > OVER_UTILIZED_PCT) return "over";
  if (p < UNDER_UTILIZED_PCT) return "under";
  return "on_track";
}

export interface UtilizationGroup {
  name: string;
  authorizedHours: number;
  usedHours: number;
  remainingHours: number;
  utilizationPct: number;
  band: UtilizationBand;
  auths: number;
}

export interface UtilizationMetrics {
  authorizedHours: number;
  usedHours: number;
  remainingHours: number;
  utilizationPct: number;
  overUtilized: number;
  underUtilized: number;
  expiringSoon: number;
  authCount: number;
  byClient: UtilizationGroup[];
  byPayor: UtilizationGroup[];
  byState: UtilizationGroup[];
  byCode: UtilizationGroup[];
  weeklyTrend: { label: string; value: number; secondary?: number }[];
  riskAuths: {
    authorizationNumber: string;
    client: string;
    payor: string;
    state: string;
    code: string;
    authorizedHours: number;
    usedHours: number;
    remainingHours: number;
    utilizationPct: number;
    band: UtilizationBand;
    endDate: string | null;
    daysToExpiry: number | null;
    status: string;
  }[];
}

function num(v: number | null | undefined): number {
  return Number.isFinite(Number(v)) ? Number(v) : 0;
}

function daysUntil(date: string | null | undefined, now = new Date()): number | null {
  if (!date) return null;
  const d = new Date(`${String(date).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - now.getTime()) / 86_400_000);
}

/**
 * Hour-based utilization. `utilization` rows drive the weekly trend, while
 * `auths` drive per-authorization risk, expirations, and remaining hours.
 */
export function computeUtilizationMetrics(
  auths: CrAuthorizationRow[],
  utilization: CrUtilizationRow[],
  now = new Date(),
): UtilizationMetrics {
  const dims = {
    client: new Map<string, UtilizationGroup>(),
    payor: new Map<string, UtilizationGroup>(),
    state: new Map<string, UtilizationGroup>(),
    code: new Map<string, UtilizationGroup>(),
  };
  const ensure = (map: Map<string, UtilizationGroup>, key: string) => {
    const k = (key || "Unknown").trim() || "Unknown";
    if (!map.has(k)) {
      map.set(k, {
        name: k,
        authorizedHours: 0,
        usedHours: 0,
        remainingHours: 0,
        utilizationPct: 0,
        band: "on_track",
        auths: 0,
      });
    }
    return map.get(k)!;
  };

  let authorized = 0;
  let used = 0;
  let overUtilized = 0;
  let underUtilized = 0;
  let expiringSoon = 0;

  const riskAuths: UtilizationMetrics["riskAuths"] = [];

  for (const a of auths) {
    const authHours = num(a.authorized_hours);
    const usedHours = num(a.worked_hours);
    const remaining = a.remaining_hours != null ? num(a.remaining_hours) : authHours - usedHours;
    const p = utilizationPct(usedHours, authHours);
    const band = utilizationBand(p);
    authorized += authHours;
    used += usedHours;
    if (band === "over") overUtilized += 1;
    if (band === "under" && authHours > 0) underUtilized += 1;
    const dte = daysUntil(a.end_date, now);
    if (dte != null && dte >= 0 && dte <= EXPIRING_SOON_DAYS) expiringSoon += 1;

    for (const [map, key] of [
      [dims.client, a.client_name ?? ""],
      [dims.payor, a.payor ?? ""],
      [dims.state, a.state ?? ""],
      [dims.code, a.procedure_code ?? ""],
    ] as const) {
      const g = ensure(map as Map<string, UtilizationGroup>, key);
      g.authorizedHours += authHours;
      g.usedHours += usedHours;
      g.remainingHours += remaining;
      g.auths += 1;
    }

    riskAuths.push({
      authorizationNumber: a.authorization_number ?? "—",
      client: a.client_name ?? "Unknown client",
      payor: a.payor ?? "Unknown",
      state: a.state ?? "—",
      code: a.procedure_code ?? "—",
      authorizedHours: Math.round(authHours * 10) / 10,
      usedHours: Math.round(usedHours * 10) / 10,
      remainingHours: Math.round(remaining * 10) / 10,
      utilizationPct: p,
      band,
      endDate: a.end_date ?? null,
      daysToExpiry: dte,
      status: a.status ?? "—",
    });
  }

  const finish = (map: Map<string, UtilizationGroup>) =>
    [...map.values()]
      .map((g) => {
        const p = utilizationPct(g.usedHours, g.authorizedHours);
        return {
          ...g,
          authorizedHours: Math.round(g.authorizedHours * 10) / 10,
          usedHours: Math.round(g.usedHours * 10) / 10,
          remainingHours: Math.round(g.remainingHours * 10) / 10,
          utilizationPct: p,
          band: utilizationBand(p),
        };
      })
      .sort((a, b) => b.authorizedHours - a.authorizedHours);

  const weeks = new Map<string, { a: number; u: number }>();
  for (const u of utilization) {
    const wk = u.week_start ? String(u.week_start).slice(0, 10) : null;
    if (!wk) continue;
    if (!weeks.has(wk)) weeks.set(wk, { a: 0, u: 0 });
    const w = weeks.get(wk)!;
    w.a += num(u.authorized_hours);
    w.u += num(u.used_hours);
  }

  return {
    authorizedHours: Math.round(authorized * 10) / 10,
    usedHours: Math.round(used * 10) / 10,
    remainingHours: Math.round((authorized - used) * 10) / 10,
    utilizationPct: pct(used, authorized),
    overUtilized,
    underUtilized,
    expiringSoon,
    authCount: auths.length,
    byClient: finish(dims.client),
    byPayor: finish(dims.payor),
    byState: finish(dims.state),
    byCode: finish(dims.code),
    weeklyTrend: [...weeks.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, v]) => ({
        label,
        value: utilizationPct(v.u, v.a),
        secondary: Math.round(v.u * 10) / 10,
      })),
    riskAuths: riskAuths
      .sort((a, b) => {
        const aRisk = a.band === "over" ? 2 : a.band === "under" ? 1 : 0;
        const bRisk = b.band === "over" ? 2 : b.band === "under" ? 1 : 0;
        if (aRisk !== bRisk) return bRisk - aRisk;
        return b.utilizationPct - a.utilizationPct;
      })
      .slice(0, 200),
  };
}