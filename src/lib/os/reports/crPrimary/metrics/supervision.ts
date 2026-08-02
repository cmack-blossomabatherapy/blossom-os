import { pct } from "../format";
import type { CrBillingSessionRow } from "../types";
import {
  CODE_DIRECT,
  CODE_PARENT_TRAINING,
  CODE_SUPERVISION,
  hoursOf,
  isCode,
  isCountableStatus,
  normalizeCode,
} from "./codes";
import { monthKey } from "../format";

export type SupervisionBand = "red" | "yellow" | "green";

/** <5% red · 5-10% yellow · >=10% green (locked clinical thresholds). */
export function supervisionBand(supervisionPct: number): SupervisionBand {
  if (supervisionPct < 5) return "red";
  if (supervisionPct < 10) return "yellow";
  return "green";
}

export const SUPERVISION_TARGET_PCT = 5;

export interface SupervisionGroupMetric {
  name: string;
  hours97153: number;
  hours97155: number;
  supervisionPct: number;
  band: SupervisionBand;
  clients: number;
  rbts: number;
}

export interface SupervisionMetrics {
  hours97153: number;
  hours97155: number;
  hours97156: number;
  supervisionPct: number;
  rbtCount: number;
  bcbaCount: number;
  clientCount: number;
  bcbasBelowThreshold: number;
  clientsBelowThreshold: number;
  byBcba: SupervisionGroupMetric[];
  byClient: SupervisionGroupMetric[];
  trend: { label: string; value: number; secondary?: number }[];
  /** High direct-hours clients with dangerously low supervision. */
  highRiskClients: SupervisionGroupMetric[];
}

/**
 * Map each client to its supervising BCBA using 97155/97156 hours — the
 * provider with the most supervision/parent-training hours owns the client.
 */
export function buildClientBcbaMap(
  rows: CrBillingSessionRow[],
): Map<string, string> {
  const tally = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const code = normalizeCode(r.procedure_code);
    if (code !== CODE_SUPERVISION && code !== CODE_PARENT_TRAINING) continue;
    const client = (r.client_name ?? "").trim();
    const provider = (r.rendering_provider_name ?? "").trim();
    if (!client || !provider) continue;
    if (!tally.has(client)) tally.set(client, new Map());
    const inner = tally.get(client)!;
    inner.set(provider, (inner.get(provider) ?? 0) + hoursOf(r.hours));
  }
  const out = new Map<string, string>();
  for (const [client, providers] of tally) {
    const best = [...providers.entries()].sort((a, b) => b[1] - a[1])[0];
    if (best) out.set(client, best[0]);
  }
  return out;
}

function emptyGroup(name: string): SupervisionGroupMetric {
  return {
    name,
    hours97153: 0,
    hours97155: 0,
    supervisionPct: 0,
    band: "red",
    clients: 0,
    rbts: 0,
  };
}

export function computeSupervisionMetrics(
  rows: CrBillingSessionRow[],
): SupervisionMetrics {
  const countable = rows.filter((r) => isCountableStatus(r.status));
  const clientToBcba = buildClientBcbaMap(countable);

  let h153 = 0;
  let h155 = 0;
  let h156 = 0;
  const rbts = new Set<string>();
  const bcbas = new Set<string>();
  const clients = new Set<string>();
  const byBcba = new Map<string, SupervisionGroupMetric & { clientSet: Set<string>; rbtSet: Set<string> }>();
  const byClient = new Map<string, SupervisionGroupMetric & { clientSet: Set<string>; rbtSet: Set<string> }>();
  const trend = new Map<string, { d: number; s: number }>();

  const ensure = (
    map: Map<string, SupervisionGroupMetric & { clientSet: Set<string>; rbtSet: Set<string> }>,
    key: string,
  ) => {
    if (!map.has(key)) {
      map.set(key, { ...emptyGroup(key), clientSet: new Set(), rbtSet: new Set() });
    }
    return map.get(key)!;
  };

  for (const r of countable) {
    const code = normalizeCode(r.procedure_code);
    const hours = hoursOf(r.hours);
    const client = (r.client_name ?? "Unknown client").trim() || "Unknown client";
    const provider = (r.rendering_provider_name ?? "").trim();
    const bcba = clientToBcba.get(client) ?? (code === CODE_SUPERVISION ? provider : "Unassigned");
    clients.add(client);

    const gB = ensure(byBcba, bcba || "Unassigned");
    const gC = ensure(byClient, client);

    if (code === CODE_DIRECT) {
      h153 += hours;
      gB.hours97153 += hours;
      gC.hours97153 += hours;
      if (provider) {
        rbts.add(provider);
        gB.rbtSet.add(provider);
        gC.rbtSet.add(provider);
      }
    } else if (code === CODE_SUPERVISION) {
      h155 += hours;
      gB.hours97155 += hours;
      gC.hours97155 += hours;
      if (provider) bcbas.add(provider);
    } else if (code === CODE_PARENT_TRAINING) {
      h156 += hours;
      if (provider) bcbas.add(provider);
    }
    gB.clientSet.add(client);
    gC.clientSet.add(client);

    if (code === CODE_DIRECT || code === CODE_SUPERVISION) {
      const mk = monthKey(r.date_of_service);
      if (mk) {
        if (!trend.has(mk)) trend.set(mk, { d: 0, s: 0 });
        const t = trend.get(mk)!;
        if (code === CODE_DIRECT) t.d += hours;
        else t.s += hours;
      }
    }
  }

  const finalize = (
    map: Map<string, SupervisionGroupMetric & { clientSet: Set<string>; rbtSet: Set<string> }>,
  ): SupervisionGroupMetric[] =>
    [...map.values()]
      .map((g) => {
        const supervisionPct = pct(g.hours97155, g.hours97153);
        return {
          name: g.name,
          hours97153: Math.round(g.hours97153 * 10) / 10,
          hours97155: Math.round(g.hours97155 * 10) / 10,
          supervisionPct,
          band: supervisionBand(supervisionPct),
          clients: g.clientSet.size,
          rbts: g.rbtSet.size,
        };
      })
      .filter((g) => g.hours97153 > 0 || g.hours97155 > 0)
      .sort((a, b) => b.hours97153 - a.hours97153);

  const bcbaRows = finalize(byBcba);
  const clientRows = finalize(byClient);
  const supervisionPct = pct(h155, h153);

  return {
    hours97153: Math.round(h153 * 10) / 10,
    hours97155: Math.round(h155 * 10) / 10,
    hours97156: Math.round(h156 * 10) / 10,
    supervisionPct,
    rbtCount: rbts.size,
    bcbaCount: bcbas.size,
    clientCount: clients.size,
    bcbasBelowThreshold: bcbaRows.filter(
      (b) => b.hours97153 > 0 && b.supervisionPct < SUPERVISION_TARGET_PCT,
    ).length,
    clientsBelowThreshold: clientRows.filter(
      (c) => c.hours97153 > 0 && c.supervisionPct < SUPERVISION_TARGET_PCT,
    ).length,
    byBcba: bcbaRows,
    byClient: clientRows,
    trend: [...trend.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, v]) => ({
        label,
        value: pct(v.s, v.d),
        secondary: Math.round(v.d * 10) / 10,
      })),
    highRiskClients: clientRows
      .filter((c) => c.hours97153 >= 20 && c.supervisionPct < SUPERVISION_TARGET_PCT)
      .slice(0, 25),
  };
}

export { isCode };