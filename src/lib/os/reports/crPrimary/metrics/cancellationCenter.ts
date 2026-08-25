/**
 * Phase 2A / 4B2 — Cancellation Command Center calculations.
 *
 * Pure, deterministic, and unit-testable: the page renders whatever this
 * module returns and never recomputes a number of its own.
 *
 * Deliberate omissions:
 * - No revenue or dollar estimates. CentralReach scheduling exports carry no
 *   rate, so any dollar figure would be invented.
 * - No reason guessing. Undocumented cancellations land in an explicit
 *   "Not documented" bucket that operators can act on.
 * - No "converted late". The schedule source records *whether* an event was
 *   converted to a timesheet, never *when*, so conversion timing is reported as
 *   unavailable instead of being inferred.
 *
 * Phase 4B2 truth rules:
 * - Every nondeleted event in range is the denominator, cancellations included.
 * - Clients and providers are grouped CR-ID first, deterministically and
 *   independently of row order, so two different people who share a name are
 *   never merged and one person is never split across rows.
 * - Count, hour, and percentage series are returned separately. Nothing mixes
 *   two units on one axis.
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
import { buildClientIdentityResolver } from "./clientIdentity";
import { normalizeCancellationReason } from "./cancellation";

export const NOT_DOCUMENTED = "Not documented";

/**
 * The schedule source has no conversion timestamp, so this report can report
 * conversion *state* and never conversion *timing*.
 */
export const CONVERSION_TIMING_NOTE =
  "The schedule source records whether an event was converted to a timesheet, but not when, so late conversion cannot be measured here.";

export interface CancellationCenterRow extends ScheduleTruthRow {
  id?: string;
  client_name?: string | null;
  client_cr_id?: string | null;
  provider_name?: string | null;
  provider_cr_id?: string | null;
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
  /** Stable grouping key. For clients/providers this is the resolved identity. */
  key: string;
  /** Human-readable label — always a name, never an id. */
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
  /** CR client id when the source carries one, else empty. */
  clientCrId: string;
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
  /** Whether the schedule source converted this event to a timesheet. */
  conversionState: string;
  state: string;
  payor: string;
  /** Human-readable service/billing code for the event. */
  code: string;
  followUpStatus: "Needs documentation" | "Repeat cancellation" | "Logged";
  action: string;
}

/** Conversion state of the active (nondeleted) events in range. */
export interface CancellationConversionMetrics {
  converted: number;
  unconverted: number;
  /** Source reported no conversion flag — excluded from the rate. */
  unknown: number;
  /** converted ÷ (converted + unconverted). Null when neither is present. */
  conversionRate: number | null;
  /** Denominator actually used for the rate — known states only. */
  knownStates: number;
  /** Never inferred: this source has no conversion timestamp. */
  timingNote: string;
}

/** A count series point. Units are counts only. */
export interface CountPoint {
  label: string;
  value: number;
}

/** An hours series point. Units are hours only. */
export interface HoursPoint {
  label: string;
  value: number;
}

/**
 * A rate series point. `value` is null when the period has no active events to
 * divide by — the point is reported, never plotted as a zero percent.
 */
export interface RatePoint {
  label: string;
  value: number | null;
  cancellations: number;
  activeScheduleEvents: number;
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
  conversion: CancellationConversionMetrics;
  /** Weekly cancelled-session counts. Counts only. */
  weeklyCancellations: CountPoint[];
  /** Weekly cancelled hours. Hours only. */
  weeklyCancelledHours: HoursPoint[];
  /** Weekly cancellation rate against that week's active events. Percent only. */
  weeklyCancellationRate: RatePoint[];
  /** Weekday cancelled-session counts, Monday first. Counts only. */
  byDayOfWeek: CountPoint[];
  /** Weekday cancellation rate, Monday first. Percent only. */
  byDayOfWeekRate: RatePoint[];
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
  label: string;
  cancellations: number;
  hours: number;
  countable: number;
  clients: Set<string>;
}

const blank = (label: string): Bucket => ({
  label,
  cancellations: 0,
  hours: 0,
  countable: 0,
  clients: new Set(),
});

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

export const UNKNOWN_CLIENT_LABEL = "Unknown client";
export const UNASSIGNED_PROVIDER_LABEL = "Unassigned provider";

/**
 * Order-independent CR-ID-first identity for the people on a schedule event.
 *
 * Clients and providers are resolved separately over the *complete* row set, so
 * two distinct CR ids that happen to share a name stay distinct, while a unique
 * id-less name adopts the one CR id associated with it. Labels stay human
 * names; the id only ever forms the grouping key.
 */
export interface CancellationIdentity {
  clientKeyOf(row: CancellationCenterRow): string;
  providerKeyOf(row: CancellationCenterRow): string;
  clientLabelOf(row: CancellationCenterRow): string;
  providerLabelOf(row: CancellationCenterRow): string;
}

export function buildCancellationIdentity(
  ...rowGroups: (readonly CancellationCenterRow[] | undefined | null)[]
): CancellationIdentity {
  const rows = rowGroups.flatMap((g) => (g ? [...g] : []));
  const clientResolver = buildClientIdentityResolver(
    rows.map((r) => ({ client_name: r.client_name, client_cr_id: r.client_cr_id })),
  );
  // The provider resolver reuses the same pure algorithm on the provider
  // columns: identical determinism guarantees, different pair of fields.
  const providerResolver = buildClientIdentityResolver(
    rows.map((r) => ({ client_name: r.provider_name, client_cr_id: r.provider_cr_id })),
  );
  return {
    clientLabelOf: (row) => text(row.client_name, UNKNOWN_CLIENT_LABEL),
    providerLabelOf: (row) => text(row.provider_name, UNASSIGNED_PROVIDER_LABEL),
    clientKeyOf: (row) =>
      clientResolver.keyFor(row.client_cr_id, text(row.client_name, UNKNOWN_CLIENT_LABEL)),
    providerKeyOf: (row) =>
      providerResolver.keyFor(row.provider_cr_id, text(row.provider_name, UNASSIGNED_PROVIDER_LABEL)),
  };
}

export interface CancellationCenterOptions {
  /** Rows for the immediately preceding window, for trend comparison. */
  previous?: CancellationCenterRow[];
  /** Minimum cancellations before a client enters the follow-up queue. */
  followUpThreshold?: number;
  /**
   * Pre-built identity, when the caller already resolved it across a wider row
   * set (e.g. the unfiltered snapshot). Omitted, it is built from `rows`.
   */
  identity?: CancellationIdentity;
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
  const identity = opts.identity ?? buildCancellationIdentity(rows);
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
  const weekly = new Map<string, { c: number; h: number; countable: number }>();
  const daily = new Map<string, { c: number; countable: number }>();
  const clientDetail = new Map<
    string,
    {
      key: string;
      client: string;
      clientCrId: string;
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

  const bump = (
    map: Map<string, Bucket>,
    key: string,
    label: string,
    clientKey: string,
    hours: number,
    cancelledRow: boolean,
  ) => {
    if (!map.has(key)) map.set(key, blank(label));
    const b = map.get(key)!;
    b.countable += 1;
    if (cancelledRow) {
      b.cancellations += 1;
      b.hours += hours;
      b.clients.add(clientKey);
    }
  };

  let cancelledHours = 0;
  let keptHours = 0;
  let documented = 0;
  let undocumented = 0;
  let converted = 0;
  let unconverted = 0;
  let conversionUnknown = 0;
  const clientSet = new Set<string>();
  const providerSet = new Set<string>();

  for (const row of activeSchedule) {
    const isCancelled = isCancelledEventStrict(row);
    const hours = eventDurationHours(row);
    const clientKey = identity.clientKeyOf(row);
    const client = identity.clientLabelOf(row);
    const providerKey = identity.providerKeyOf(row);
    const provider = identity.providerLabelOf(row);
    const state = text(row.state, "Unknown");
    const payor = text(row.payor, "Unknown");
    const code = eventCode(row);
    const reason = isCancelled ? cancellationReasonBucket(row) : "";

    // Conversion is a property of every active event, cancelled or kept. A
    // missing flag is unknown — it is never counted as "not converted".
    if (row.converted_to_timesheet == null) conversionUnknown += 1;
    else if (row.converted_to_timesheet) converted += 1;
    else unconverted += 1;

    if (isCancelled) {
      cancelledHours += hours;
      clientSet.add(clientKey);
      providerSet.add(providerKey);
      if (reason === NOT_DOCUMENTED) undocumented += 1;
      else documented += 1;
      bump(dims.reason, reason, reason, clientKey, hours, true);
    } else {
      keptHours += hours;
    }

    bump(dims.provider, providerKey, provider, clientKey, hours, isCancelled);
    bump(dims.client, clientKey, client, clientKey, hours, isCancelled);
    bump(dims.state, state, state, clientKey, hours, isCancelled);
    bump(dims.payor, payor, payor, clientKey, hours, isCancelled);
    bump(dims.code, code, code, clientKey, hours, isCancelled);

    const week = weekStart(row.event_date);
    if (week) {
      if (!weekly.has(week)) weekly.set(week, { c: 0, h: 0, countable: 0 });
      const w = weekly.get(week)!;
      w.countable += 1;
      if (isCancelled) {
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

    if (!clientDetail.has(clientKey)) {
      clientDetail.set(clientKey, {
        key: clientKey,
        client,
        clientCrId: text(row.client_cr_id, ""),
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
    const detail = clientDetail.get(clientKey)!;
    if (!detail.clientCrId) detail.clientCrId = text(row.client_cr_id, "");
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
      .map(([key, b]) => ({
        key,
        name: b.label,
        cancellations: b.cancellations,
        cancelledHours: Math.round(b.hours * 10) / 10,
        activeScheduleEvents: b.countable,
        cancellationRate: b.countable ? pct(b.cancellations, b.countable) : null,
        clients: b.clients.size,
        share: totalCancellations ? pct(b.cancellations, totalCancellations) : 0,
      }))
      .sort(
        (a, b) =>
          b.cancellations - a.cancellations ||
          b.cancelledHours - a.cancelledHours ||
          a.name.localeCompare(b.name),
      );

  const followUps: CancellationFollowUpRow[] = [...clientDetail.values()]
    .filter((d) => d.cancellations >= followUpThreshold)
    .map((d) => {
      const rate = d.countable ? pct(d.cancellations, d.countable) : null;
      const topReason =
        [...d.reasons.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? NOT_DOCUMENTED;
      const provider =
        [...d.providers.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? UNASSIGNED_PROVIDER_LABEL;
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
        key: d.key,
        client: d.client,
        clientCrId: d.clientCrId,
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
      .map((d) => d.key),
  );

  const followUpEvents: CancellationFollowUpEventRow[] = cancelled
    .map((row, index) => {
      const reason = cancellationReasonBucket(row);
      const documentedReason = reason !== NOT_DOCUMENTED;
      const clientKey = identity.clientKeyOf(row);
      const repeat = repeatClients.has(clientKey);
      const followUpStatus: CancellationFollowUpEventRow["followUpStatus"] =
        !documentedReason ? "Needs documentation" : repeat ? "Repeat cancellation" : "Logged";
      const sourceId = text(row.id, "");
      return {
        // Source-id based and therefore stable across sorts and re-renders.
        key: sourceId ? `event:${sourceId}` : `event-index:${index}`,
        eventDate: String(row.event_date ?? "").slice(0, 10) || null,
        client: identity.clientLabelOf(row),
        provider: identity.providerLabelOf(row),
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

  const weekLabels = [...weekly.keys()].sort((a, b) => a.localeCompare(b));
  const knownConversion = converted + unconverted;

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
    conversion: {
      converted,
      unconverted,
      unknown: conversionUnknown,
      // Unknown states are excluded from the denominator, never counted as false.
      conversionRate: knownConversion ? pct(converted, knownConversion) : null,
      knownStates: knownConversion,
      timingNote: CONVERSION_TIMING_NOTE,
    },
    weeklyCancellations: weekLabels.map((label) => ({
      label,
      value: weekly.get(label)!.c,
    })),
    weeklyCancelledHours: weekLabels.map((label) => ({
      label,
      value: Math.round(weekly.get(label)!.h * 10) / 10,
    })),
    weeklyCancellationRate: weekLabels.map((label) => {
      const w = weekly.get(label)!;
      return {
        label,
        // No active events in the week means no rate — never a plotted zero.
        value: w.countable ? pct(w.c, w.countable) : null,
        cancellations: w.c,
        activeScheduleEvents: w.countable,
      };
    }),
    byDayOfWeek: DAY_OF_WEEK_ORDER.filter((d) => daily.has(d)).map((d) => ({
      label: d,
      value: daily.get(d)!.c,
    })),
    byDayOfWeekRate: DAY_OF_WEEK_ORDER.filter((d) => daily.has(d)).map((d) => {
      const v = daily.get(d)!;
      return {
        label: d,
        value: v.countable ? pct(v.c, v.countable) : null,
        cancellations: v.c,
        activeScheduleEvents: v.countable,
      };
    }),
    byReason,
    byProvider: toGroups(dims.provider),
    byClient: toGroups(dims.client),
    byState: toGroups(dims.state),
    byPayor: toGroups(dims.payor),
    byCode: toGroups(dims.code),
    followUps,
    followUpEvents,
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
