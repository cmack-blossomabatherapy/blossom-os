import { monthKey, pct } from "../format";
import type { CrBillingSessionRow } from "../types";
import {
  CODE_DIRECT,
  CODE_PARENT_TRAINING,
  hoursOf,
  isCountableStatus,
  normalizeCode,
} from "./codes";
import { buildClientBcbaMap } from "./supervision";

export interface PtGroupMetric {
  name: string;
  hours: number;
  clients: number;
  clientsWithPt: number;
  coveragePct: number;
}

export interface ParentTrainingMetrics {
  ptHours: number;
  activeClients: number;
  clientsWithPt: number;
  clientsMissingPt: number;
  coveragePct: number;
  bcbaCount: number;
  byBcba: PtGroupMetric[];
  byClient: { name: string; hours: number; bcba: string; lastSession: string | null }[];
  byPayor: PtGroupMetric[];
  byState: PtGroupMetric[];
  trend: { label: string; value: number }[];
  gapClients: { name: string; bcba: string; directHours: number; ptHours: number }[];
}

export function computeParentTrainingMetrics(
  rows: CrBillingSessionRow[],
): ParentTrainingMetrics {
  const countable = rows.filter((r) => isCountableStatus(r.status));
  const clientToBcba = buildClientBcbaMap(countable);

  const activeClients = new Set<string>();
  const ptClients = new Set<string>();
  const bcbas = new Set<string>();
  const directHoursByClient = new Map<string, number>();
  const ptHoursByClient = new Map<string, number>();
  const lastPtByClient = new Map<string, string>();
  const trend = new Map<string, number>();
  const dim = {
    bcba: new Map<string, { hours: number; clients: Set<string>; pt: Set<string> }>(),
    payor: new Map<string, { hours: number; clients: Set<string>; pt: Set<string> }>(),
    state: new Map<string, { hours: number; clients: Set<string>; pt: Set<string> }>(),
  };
  const bump = (
    map: Map<string, { hours: number; clients: Set<string>; pt: Set<string> }>,
    key: string,
    hours: number,
    client: string,
    isPt: boolean,
  ) => {
    const k = key || "Unknown";
    if (!map.has(k)) map.set(k, { hours: 0, clients: new Set(), pt: new Set() });
    const g = map.get(k)!;
    if (isPt) {
      g.hours += hours;
      g.pt.add(client);
    }
    g.clients.add(client);
  };

  let ptHours = 0;

  for (const r of countable) {
    const code = normalizeCode(r.procedure_code);
    const hours = hoursOf(r.hours);
    const client = (r.client_name ?? "Unknown client").trim() || "Unknown client";
    const provider = (r.rendering_provider_name ?? "").trim();
    const bcba = clientToBcba.get(client) ?? (code === CODE_PARENT_TRAINING ? provider : "Unassigned");
    const isPt = code === CODE_PARENT_TRAINING;

    if (code === CODE_DIRECT || isPt) activeClients.add(client);
    if (code === CODE_DIRECT) {
      directHoursByClient.set(client, (directHoursByClient.get(client) ?? 0) + hours);
    }
    if (isPt) {
      ptHours += hours;
      ptClients.add(client);
      if (provider) bcbas.add(provider);
      ptHoursByClient.set(client, (ptHoursByClient.get(client) ?? 0) + hours);
      const dos = r.date_of_service ? String(r.date_of_service).slice(0, 10) : null;
      if (dos && (!lastPtByClient.get(client) || dos > lastPtByClient.get(client)!)) {
        lastPtByClient.set(client, dos);
      }
      const mk = monthKey(r.date_of_service);
      if (mk) trend.set(mk, (trend.get(mk) ?? 0) + hours);
    }
    bump(dim.bcba, bcba, hours, client, isPt);
    bump(dim.payor, r.payor ?? "", hours, client, isPt);
    bump(dim.state, r.state ?? "", hours, client, isPt);
  }

  const toGroups = (
    map: Map<string, { hours: number; clients: Set<string>; pt: Set<string> }>,
  ): PtGroupMetric[] =>
    [...map.entries()]
      .map(([name, g]) => ({
        name,
        hours: Math.round(g.hours * 10) / 10,
        clients: g.clients.size,
        clientsWithPt: g.pt.size,
        coveragePct: pct(g.pt.size, g.clients.size),
      }))
      .sort((a, b) => b.hours - a.hours);

  const gapClients = [...activeClients]
    .filter((c) => !ptClients.has(c))
    .map((c) => ({
      name: c,
      bcba: clientToBcba.get(c) ?? "Unassigned",
      directHours: Math.round((directHoursByClient.get(c) ?? 0) * 10) / 10,
      ptHours: 0,
    }))
    .sort((a, b) => b.directHours - a.directHours);

  return {
    ptHours: Math.round(ptHours * 10) / 10,
    activeClients: activeClients.size,
    clientsWithPt: ptClients.size,
    clientsMissingPt: gapClients.length,
    coveragePct: pct(ptClients.size, activeClients.size),
    bcbaCount: bcbas.size,
    byBcba: toGroups(dim.bcba),
    byPayor: toGroups(dim.payor),
    byState: toGroups(dim.state),
    byClient: [...ptHoursByClient.entries()]
      .map(([name, hours]) => ({
        name,
        hours: Math.round(hours * 10) / 10,
        bcba: clientToBcba.get(name) ?? "Unassigned",
        lastSession: lastPtByClient.get(name) ?? null,
      }))
      .sort((a, b) => b.hours - a.hours),
    trend: [...trend.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value: Math.round(value * 10) / 10 })),
    gapClients,
  };
}