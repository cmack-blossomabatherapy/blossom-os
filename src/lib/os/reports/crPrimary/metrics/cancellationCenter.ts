/**
 * Phase 2A — Cancellation Command Center calculations.
 *
 * Pure, deterministic, and unit-testable: the page renders whatever this
 * module returns and never recomputes a number of its own.
 *
 * Deliberate omissions:
 * - No revenue or dollar estimates. CentralReach scheduling exports carry no
 *   rate, so any dollar figure would be invented.
 * - No reason guessing. Undocumented cancellations land in an explicit
 *   "Not documented" bucket that operators can act on.
 */
import { pct, weekStart } from "../format";
import {
  DAY_OF_WEEK_ORDER,
  cleanReasonText,
  dayOfWeekLabel,
  eventDurationHours,
  isCancelledEventStrict,
  isActiveScheduleEvent,
  isDeletedEvent,
  isNoShow,
  scheduleTruthCoverage,
  type ScheduleTruthRow,
  type TruthCoverage,
} from "../scheduleTruth";
import { normalizeCancellationReason } from "./cancellation";

export const NOT_DOCUMENTED = "Not documented";

export interface CancellationCenterRow extends ScheduleTruthRow {
  id?: string;
  client_name?: string | null;
  provider_name?: string | null;
  state?: string | null;
  payor?: string | null;
  location?: string | null;
  procedure_code?: string | null;
  service_code?: string | null;
  billing_code_name?: string | null;
}

/**
 * Reason bucket for a cancelled event. Undocumented reasons are never mapped
 * into "Other" — they are reported as undocumented so the team can fix the
 * documentation gap.
 */
export function cancellationReasonBucket(row: CancellationCenterRow): string {
  const reason = cleanReasonText(row.cancellation_reason);
  const by = cleanReasonText(row.cancelled_by);
  if (!reason && !by) return isNoShow(row) ? "No Show" : NOT_DOCUMENTED;
  return normalizeCancellationReason(reason, by);
}

export interface CancellationGroupRow {
  name: string;
  cancellations: number;
  cancelledHours: number;
  /** Nondeleted events in this group — the rate denominator. */
  activeScheduleEvents: number;
  cancellationRate: number | null;
  clients: number;
  share: number;
}

export interface CancellationFollowUpRow {
  key: string;
  client: string;
  state: string;
  payor: string;
  provider: string;
  cancellations: number;
  cancelledHours: number;
  activeScheduleEvents: number;
  cancellationRate: number | null;
  weeksAffected: number;
  lastCancellation: string | null;
  topReason: string;
  undocumented: number;
  risk: "critical" | "watch" | "monitor";
  reason: string;
}

/**
 * One cancelled source event, with everything staff need to act on it without
 * leaving the report. This is the queue operators asked for — the client-level
 * summary above it answers "who is a pattern", this answers "what do I chase".
 */
export interface CancellationFollowUpEventRow {
  key: string;
  eventDate: string | null;
  client: string;
  provider: string;
  cancelledHours: number;
  reason: string;
  /** Documented or not — drives the "needs documentation" action. */
  reasonDocumented: boolean;
  /** Whether CentralReach converted this event to a timesheet. */
  conversionState: string;
  state: string;
  payor: string;
  /** Human-readable service/billing code for the event. */
  code: string;
  followUpStatus: "Needs documentation" | "Repeat cancellation" | "Logged";
  action: string;
}

export interface CancellationCenterMetrics {
  /** Rows loaded, before deletion filtering. */
  loadedEvents: number;
  deletedEvents: number;
  /** Denominator: every nondeleted event, cancelled ones included. */
  activeScheduleEvents: number;
  /** Active schedule events minus cancellations. */
  keptEvents: number;
  cancelledEvents: number;
  noShowEvents: number;
  cancellationRate: number | null;
  cancelledHours: number;
  keptHours: number;
  affectedClients: number;
  affectedProviders: number;
  documentedReasons: number;
  undocumentedReasons: number;
  documentedPct: number | null;
  topReason: string | null;
  truth: TruthCoverage;
  weekly: { label: string; value: number; secondary?: number }[];
  byDayOfWeek: { label: string; value: number; secondary?: number }[];
  byReason: CancellationGroupRow[];
  byProvider: CancellationGroupRow[];
  byClient: CancellationGroupRow[];
  byState: CancellationGroupRow[];
  byPayor: CancellationGroupRow[];
  byCode: CancellationGroupRow[];
  followUps: CancellationFollowUpRow[];
  /** Event-level follow-up queue (one row per cancelled event). */
  followUpEvents: CancellationFollowUpEventRow[];
  /** Prior-period comparison, only when a comparison set is supplied. */
  comparison: {
    previousCancellations: number;
    previousRate: number | null;
    rateDelta: number | null;
    countDelta: number;
  } | null;
}


interface Bucket {
  cancellations: number;
  hours: number;
  countable: number;
  clients: Set<string>;
}

const blank = (): Bucket => ({ cancellations: 0, hours: 0, countable: 0, clients: new Set() });

const text = (v: string | null | undefined, fallback: string) =>
  (String(v ?? "").trim() || fallback);

export function eventCode(row: CancellationCenterRow): string {
  return (
    cleanReasonText(row.service_code) ??
    cleanReasonText(row.procedure_code) ??
    cleanReasonText(row.billing_code_name) ??
    "Unknown code"
  );
}

export interface CancellationCenterOptions {
  /** Rows for the immediately preceding window, for trend comparison. */
  previous?: CancellationCenterRow[];
  /** Minimum cancellations before a client enters the follow-up queue. */
  followUpThreshold?: number;
}

function summarize(rows: CancellationCenterRow[]) {
  const active = rows.filter(isActiveScheduleEvent);
  const cancelled = active.filter(isCancelledEventStrict);
  return {
    activeScheduleEvents: active.length,
    cancelled: cancelled.length,
    rate: active.length ? pct(cancelled.length, active.length) : null,
  };
}

export function computeCancellationCenter(
  rows: CancellationCenterRow[],
  opts: CancellationCenterOptions = {},
): CancellationCenterMetrics {
  const followUpThreshold = opts.followUpThreshold ?? 2;
  const deleted = rows.filter(isDeletedEvent);
  // Active schedule events = every nondeleted event. This is the denominator.
  const activeSchedule = rows.filter(isActiveScheduleEvent);
  const cancelled = activeSchedule.filter(isCancelledEventStrict);
  const kept = activeSchedule.filter((r) => !isCancelledEventStrict(r));


  const dims = {
    reason: new Map<string, Bucket>(),
    provider: new Map<string, Bucket>(),
    client: new Map<string, Bucket>(),
    state: new Map<string, Bucket>(),
    payor: new Map<string, Bucket>(),
    code: new Map<string, Bucket>(),
  };
  const weekly = new Map<string, { c: number; h: number }>();
  const daily = new Map<string, { c: number; countable: number }>();
  const clientDetail = new Map<
    string,
    {
      client: string;
      state: string;
      payor: string;
      providers: Map<string, number>;
      cancellations: number;
      hours: number;
      countable: number;
      weeks: Set<string>;
      reasons: Map<string, number>;
      undocumented: number;
      last: string | null;
    }
  >();

  const bump = (map: Map<string, Bucket>, key: string, client: string, hours: number, cancelledRow: boolean) => {
    if (!map.has(key)) map.set(key, blank());
    const b = map.get(key)!;
    b.countable += 1;
    if (cancelledRow) {
      b.cancellations += 1;
      b.hours += hours;
      b.clients.add(client);
    }
  };

  let cancelledHours = 0;
  let activeHours = 0;
  let documented = 0;
  let undocumented = 0;
  const clientSet = new Set<string>();
  const providerSet = new Set<string>();

  for (const row of activeSchedule) {
    const isCancelled = isCancelledEventStrict(row);
    const hours = eventDurationHours(row);
    const client = text(row.client_name, "Unknown client");
    const provider = text(row.provider_name, "Unassigned provider");
    const state = text(row.state, "Unknown");
    const payor = text(row.payor, "Unknown");
    const code = eventCode(row);
    const reason = isCancelled ? cancellationReasonBucket(row) : "";

    if (isCancelled) {
      cancelledHours += hours;
      clientSet.add(client);
      providerSet.add(provider);
      if (reason === NOT_DOCUMENTED) undocumented += 1;
      else documented += 1;
      bump(dims.reason, reason, client, hours, true);
    } else {
      activeHours += hours;
    }

    bump(dims.provider, provider, client, hours, isCancelled);
    bump(dims.client, client, client, hours, isCancelled);
    bump(dims.state, state, client, hours, isCancelled);
    bump(dims.payor, payor, client, hours, isCancelled);
    bump(dims.code, code, client, hours, isCancelled);

    const week = weekStart(row.event_date);
    if (week) {
      if (!weekly.has(week)) weekly.set(week, { c: 0, h: 0 });
      if (isCancelled) {
        const w = weekly.get(week)!;
        w.c += 1;
        w.h += hours;
      }
    }

    const day = dayOfWeekLabel(row.event_date);
    if (day) {
      if (!daily.has(day)) daily.set(day, { c: 0, countable: 0 });
      const d = daily.get(day)!;
      d.countable += 1;
      if (isCancelled) d.c += 1;
    }

    const key = client.toLowerCase();
    if (!clientDetail.has(key)) {
      clientDetail.set(key, {
        client,
        state,
        payor,
        providers: new Map(),
        cancellations: 0,
        hours: 0,
        countable: 0,
        weeks: new Set(),
        reasons: new Map(),
        undocumented: 0,
        last: null,
      });
    }
    const detail = clientDetail.get(key)!;
    detail.countable += 1;
    if (isCancelled) {
      detail.cancellations += 1;
      detail.hours += hours;
      if (week) detail.weeks.add(week);
      detail.reasons.set(reason, (detail.reasons.get(reason) ?? 0) + 1);
      if (reason === NOT_DOCUMENTED) detail.undocumented += 1;
      detail.providers.set(provider, (detail.providers.get(provider) ?? 0) + 1);
      const date = String(row.event_date ?? "").slice(0, 10);
      if (date && (!detail.last || date > detail.last)) detail.last = date;
    }
  }

  const totalCancellations = cancelled.length;
  const toGroups = (map: Map<string, Bucket>): CancellationGroupRow[] =>
    [...map.entries()]
      .filter(([, b]) => b.cancellations > 0)
      .map(([name, b]) => ({
        name,
        cancellations: b.cancellations,
        cancelledHours: Math.round(b.hours * 10) / 10,
        activeScheduleEvents: b.countable,
        cancellationRate: b.countable ? pct(b.cancellations, b.countable) : null,
        clients: b.clients.size,
        share: totalCancellations ? pct(b.cancellations, totalCancellations) : 0,
      }))
      .sort((a, b) => b.cancellations - a.cancellations || b.cancelledHours - a.cancelledHours);

  const followUps: CancellationFollowUpRow[] = [...clientDetail.values()]
    .filter((d) => d.cancellations >= followUpThreshold)
    .map((d) => {
      const rate = d.countable ? pct(d.cancellations, d.countable) : null;
      const topReason =
        [...d.reasons.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? NOT_DOCUMENTED;
      const provider =
        [...d.providers.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Unassigned provider";
      const risk: CancellationFollowUpRow["risk"] =
        rate != null && rate >= 30 && d.cancellations >= 4
          ? "critical"
          : rate != null && rate >= 20
            ? "watch"
            : "monitor";
      const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
      const reasonLine =
        risk === "critical"
          ? `${plural(d.cancellations, "cancellation")} across ${plural(d.weeks.size, "week")} — ${rate}% of this client's scheduled sessions`
          : d.undocumented > 0
            ? `${plural(d.undocumented, "cancellation")} without a documented reason`
            : `${plural(d.cancellations, "cancellation")} · top reason ${topReason}`;
      return {
        key: d.client.toLowerCase(),
        client: d.client,
        state: d.state,
        payor: d.payor,
        provider,
        cancellations: d.cancellations,
        cancelledHours: Math.round(d.hours * 10) / 10,
        activeScheduleEvents: d.countable,
        cancellationRate: rate,
        weeksAffected: d.weeks.size,
        lastCancellation: d.last,
        topReason,
        undocumented: d.undocumented,
        risk,
        reason: reasonLine,
      };
    })
    .sort(
      (a, b) =>
        b.cancellations - a.cancellations ||
        b.cancelledHours - a.cancelledHours ||
        a.client.localeCompare(b.client),
    );

  const byReason = toGroups(dims.reason);
  const previous = opts.previous ? summarize(opts.previous) : null;
  const rate = activeSchedule.length
    ? pct(totalCancellations, activeSchedule.length)
    : null;

  const repeatClients = new Set(
    [...clientDetail.values()]
      .filter((d) => d.cancellations >= followUpThreshold)
      .map((d) => d.client.toLowerCase()),
  );

  const followUpEvents: CancellationFollowUpEventRow[] = cancelled
    .map((row, index) => {
      const reason = cancellationReasonBucket(row);
      const documentedReason = reason !== NOT_DOCUMENTED;
      const client = text(row.client_name, "Unknown client");
      const repeat = repeatClients.has(client.toLowerCase());
      const followUpStatus: CancellationFollowUpEventRow["followUpStatus"] =
        !documentedReason ? "Needs documentation" : repeat ? "Repeat cancellation" : "Logged";
      return {
        key: `${row.id ?? "event"}-${index}`,
        eventDate: String(row.event_date ?? "").slice(0, 10) || null,
        client,
        provider: text(row.provider_name, "Unassigned provider"),
        cancelledHours: Math.round(eventDurationHours(row) * 10) / 10,
        reason,
        reasonDocumented: documentedReason,
        conversionState:
          row.converted_to_timesheet == null
            ? "Not reported"
            : row.converted_to_timesheet
              ? "Converted to timesheet"
              : "Not converted",
        state: text(row.state, "Unknown"),
        payor: text(row.payor, "Unknown"),
        code: eventCode(row),
        followUpStatus,
        action:
          followUpStatus === "Needs documentation"
            ? "Add the cancellation reason in CentralReach so this event can be categorized."
            : followUpStatus === "Repeat cancellation"
              ? "Repeat pattern for this client — confirm the plan with the family and BCBA."
              : "Reason documented — no action unless the pattern grows.",
      };
    })
    .sort(
      (a, b) =>
        String(b.eventDate ?? "").localeCompare(String(a.eventDate ?? "")) ||
        b.cancelledHours - a.cancelledHours ||
        a.client.localeCompare(b.client),
    );

  return {
    loadedEvents: rows.length,
    deletedEvents: deleted.length,
    activeScheduleEvents: activeSchedule.length,
    keptEvents: kept.length,
    cancelledEvents: totalCancellations,
    noShowEvents: cancelled.filter(isNoShow).length,
    cancellationRate: rate,
    cancelledHours: Math.round(cancelledHours * 10) / 10,
    keptHours: Math.round(keptHours * 10) / 10,

    affectedClients: clientSet.size,
    affectedProviders: providerSet.size,
    documentedReasons: documented,
    undocumentedReasons: undocumented,
    documentedPct: totalCancellations ? pct(documented, totalCancellations) : null,
    topReason: byReason[0]?.name ?? null,
    truth: scheduleTruthCoverage(rows),
    weekly: [...weekly.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, v]) => ({ label, value: v.c, secondary: Math.round(v.h * 10) / 10 })),
    byDayOfWeek: DAY_OF_WEEK_ORDER.filter((d) => daily.has(d)).map((d) => {
      const v = daily.get(d)!;
      return {
        label: d,
        value: v.c,
        secondary: v.countable ? pct(v.c, v.countable) : 0,
      };
    }),
    byReason,
    byProvider: toGroups(dims.provider),
    byClient: toGroups(dims.client),
    byState: toGroups(dims.state),
    byPayor: toGroups(dims.payor),
    byCode: toGroups(dims.code),
    followUps,
    comparison: previous
      ? {
          previousCancellations: previous.cancelled,
          previousRate: previous.rate,
          rateDelta:
            rate != null && previous.rate != null
              ? Math.round((rate - previous.rate) * 10) / 10
              : null,
          countDelta: totalCancellations - previous.cancelled,
        }
      : null,
  };
}
