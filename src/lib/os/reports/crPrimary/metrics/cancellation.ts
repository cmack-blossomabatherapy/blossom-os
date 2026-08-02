import { pct, weekStart } from "../format";
import type { CrScheduleEventRow } from "../types";
import { hoursOf, normalizeCode } from "./codes";

export const CANCELLATION_REASON_BUCKETS = [
  "Client Cancelled",
  "Provider Cancelled",
  "No Show",
  "Illness",
  "Weather",
  "Vacation / Travel",
  "Holiday",
  "Hospitalization",
  "Transportation",
  "Scheduling Conflict",
  "Other",
] as const;

export type CancellationReason = (typeof CANCELLATION_REASON_BUCKETS)[number];

/** Map free-text CentralReach cancellation text into a canonical bucket. */
export function normalizeCancellationReason(
  reason: string | null | undefined,
  cancelledBy?: string | null,
): CancellationReason {
  const s = `${reason ?? ""} ${cancelledBy ?? ""}`.toLowerCase();
  if (/no[\s-]?show/.test(s)) return "No Show";
  if (/sick|illness|ill\b|fever|covid/.test(s)) return "Illness";
  if (/hospital|inpatient|surgery/.test(s)) return "Hospitalization";
  if (/weather|snow|storm|hurricane/.test(s)) return "Weather";
  if (/vacation|travel|out of town|trip/.test(s)) return "Vacation / Travel";
  if (/holiday/.test(s)) return "Holiday";
  if (/transport|no ride|car\b|vehicle/.test(s)) return "Transportation";
  if (/conflict|double book|overlap|reschedul/.test(s)) return "Scheduling Conflict";
  if (/provider|rbt|bcba|staff|therapist|clinician/.test(s)) return "Provider Cancelled";
  if (/client|parent|guardian|family|caregiver/.test(s)) return "Client Cancelled";
  return "Other";
}

export function isCancelledEvent(row: CrScheduleEventRow): boolean {
  const s = `${row.status ?? ""}`.toLowerCase();
  if (/cancel|no[\s-]?show|missed/.test(s)) return true;
  return !!(row.cancellation_reason ?? "").trim();
}

export interface CancellationGroup {
  name: string;
  cancellations: number;
  lostHours: number;
  clients: number;
}

export interface CancellationMetrics {
  totalEvents: number;
  scheduledSessions: number;
  totalCancellations: number;
  cancellationRate: number | null;
  lostHours: number;
  lostRevenue: number | null;
  affectedClients: number;
  affectedProviders: number;
  topReason: CancellationReason | null;
  byReason: CancellationGroup[];
  byProvider: CancellationGroup[];
  byClient: CancellationGroup[];
  byState: CancellationGroup[];
  byPayor: CancellationGroup[];
  trend: { label: string; value: number; secondary?: number }[];
}

/** Optional blended hourly rate used for lost-revenue estimation. */
export interface CancellationOptions {
  hourlyRate?: number | null;
}

export function computeCancellationMetrics(
  rows: CrScheduleEventRow[],
  opts: CancellationOptions = {},
): CancellationMetrics {
  const cancelled = rows.filter(isCancelledEvent);
  const scheduled = rows.length;
  let lostHours = 0;
  const clients = new Set<string>();
  const providers = new Set<string>();
  const dims = {
    reason: new Map<string, { c: number; h: number; clients: Set<string> }>(),
    provider: new Map<string, { c: number; h: number; clients: Set<string> }>(),
    client: new Map<string, { c: number; h: number; clients: Set<string> }>(),
    state: new Map<string, { c: number; h: number; clients: Set<string> }>(),
    payor: new Map<string, { c: number; h: number; clients: Set<string> }>(),
  };
  const trend = new Map<string, { c: number; h: number }>();

  const bump = (
    map: Map<string, { c: number; h: number; clients: Set<string> }>,
    key: string,
    hours: number,
    client: string,
  ) => {
    const k = key || "Unknown";
    if (!map.has(k)) map.set(k, { c: 0, h: 0, clients: new Set() });
    const g = map.get(k)!;
    g.c += 1;
    g.h += hours;
    g.clients.add(client);
  };

  for (const r of cancelled) {
    const hours = hoursOf(r.scheduled_hours);
    const client = (r.client_name ?? "Unknown client").trim() || "Unknown client";
    const provider = (r.provider_name ?? "Unknown provider").trim() || "Unknown provider";
    lostHours += hours;
    clients.add(client);
    providers.add(provider);
    bump(dims.reason, normalizeCancellationReason(r.cancellation_reason, r.cancelled_by), hours, client);
    bump(dims.provider, provider, hours, client);
    bump(dims.client, client, hours, client);
    bump(dims.state, r.state ?? "", hours, client);
    bump(dims.payor, r.payor ?? "", hours, client);
    const wk = weekStart(r.event_date);
    if (wk) {
      if (!trend.has(wk)) trend.set(wk, { c: 0, h: 0 });
      const t = trend.get(wk)!;
      t.c += 1;
      t.h += hours;
    }
  }

  const toGroups = (
    map: Map<string, { c: number; h: number; clients: Set<string> }>,
  ): CancellationGroup[] =>
    [...map.entries()]
      .map(([name, g]) => ({
        name,
        cancellations: g.c,
        lostHours: Math.round(g.h * 10) / 10,
        clients: g.clients.size,
      }))
      .sort((a, b) => b.cancellations - a.cancellations);

  const byReason = toGroups(dims.reason);
  const rate = scheduled ? pct(cancelled.length, scheduled) : null;

  return {
    totalEvents: scheduled,
    scheduledSessions: scheduled,
    totalCancellations: cancelled.length,
    cancellationRate: rate,
    lostHours: Math.round(lostHours * 10) / 10,
    lostRevenue:
      opts.hourlyRate && Number.isFinite(opts.hourlyRate)
        ? Math.round(lostHours * opts.hourlyRate)
        : null,
    affectedClients: clients.size,
    affectedProviders: providers.size,
    topReason: (byReason[0]?.name as CancellationReason) ?? null,
    byReason,
    byProvider: toGroups(dims.provider),
    byClient: toGroups(dims.client),
    byState: toGroups(dims.state),
    byPayor: toGroups(dims.payor),
    trend: [...trend.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, v]) => ({
        label,
        value: v.c,
        secondary: Math.round(v.h * 10) / 10,
      })),
  };
}

export { normalizeCode };