/**
 * Phase 2B1 repair B — Parent Training (97156), staff-facing.
 *
 * There is **no universal one-hour parent-training target**. The target comes
 * only from what the source documents for that client:
 *   1. a positive `authorized_hours_month` on an active 97156 authorization, or
 *   2. an *unambiguous* frequency requirement (`2/week`, `weekly`, `4 per month`,
 *      `monthly`), preserving whether it is stated in hours or sessions.
 * Anything else is exactly "No target" — and a client with no target is never
 * called below target or noncompliant.
 *
 * Buckets keep their sources separate:
 *   - **Completed** — billed 97156 facts (nonvoid, nondeleted).
 *   - **Upcoming**  — kept future 97156 schedule events (strict schedule truth).
 *   - **Cancelled** — 97156 events the source explicitly cancelled.
 * A scheduled session is never counted as delivered.
 */
import { CODE_PARENT_TRAINING, hoursOf, normalizeCode } from "./codes";
import { localIsoDate } from "../reportWindow";
import { buildClientIdentityResolver } from "./clientIdentity";
import { finiteNumberOrNull } from "./numeric";
import {
  selectCoveragePair,
  type ContinuityAuthRow,
} from "./authorizationContinuity";

export const NO_TARGET_LABEL = "No target";

export type PtTargetType = "hours" | "sessions";
export type PtTargetSourceKind = "authorized_hours_month" | "frequency" | "none";

export interface PtClientTarget {
  /** Null when the source documents nothing usable. */
  type: PtTargetType | null;
  /** Target per month, in hours or sessions depending on `type`. */
  perMonth: number | null;
  /** Human cadence, e.g. "2 sessions per week" — `No target` when unknown. */
  cadence: string;
  source: PtTargetSourceKind;
  /** Authorized monthly 97156 hours when the snapshot documents them. */
  authorizedMonthlyHours: number | null;
}

export const NO_TARGET: PtClientTarget = {
  type: null,
  perMonth: null,
  cadence: NO_TARGET_LABEL,
  source: "none",
  authorizedMonthlyHours: null,
};

/**
 * Parse only an unambiguous cadence. Prose such as "as clinically indicated"
 * or "per treatment plan" returns null so the report says "No target" instead
 * of inventing one.
 */
export function parseFrequencyTarget(text: string | null | undefined): PtClientTarget | null {
  const raw = String(text ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return null;

  const unitOf = (s: string): PtTargetType => (/(hour|hr)/.test(s) ? "hours" : "sessions");

  // N/week, N per week, N x week, N hours per month, N sessions/month
  const numbered = raw.match(
    /(\d+(?:\.\d+)?)\s*(hours?|hrs?|sessions?|visits?|units?)?\s*(?:\/|per|x|every)\s*(week|wk|month|mo)\b/,
  );
  if (numbered) {
    const value = Number(numbered[1]);
    if (!Number.isFinite(value) || value <= 0) return null;
    const type = unitOf(numbered[2] ?? "session");
    const weekly = /^(week|wk)$/.test(numbered[3]);
    // 4.345 weeks per month keeps a weekly cadence honest across month lengths.
    const perMonth = weekly ? Math.round(value * 4.345 * 100) / 100 : value;
    return {
      type,
      perMonth,
      cadence: `${value} ${type === "hours" ? "hour" : "session"}${value === 1 ? "" : "s"} per ${weekly ? "week" : "month"}`,
      source: "frequency",
      authorizedMonthlyHours: null,
    };
  }

  // Bare "weekly" / "monthly" — one session per period, still unambiguous.
  if (/\bweekly\b/.test(raw) && !/\bbi-?weekly\b/.test(raw)) {
    return {
      type: "sessions",
      perMonth: 4.345,
      cadence: "1 session per week",
      source: "frequency",
      authorizedMonthlyHours: null,
    };
  }
  if (/\bmonthly\b/.test(raw)) {
    return {
      type: "sessions",
      perMonth: 1,
      cadence: "1 session per month",
      source: "frequency",
      authorizedMonthlyHours: null,
    };
  }
  return null;
}

export interface PtAuthorizationInput {
  clientName: string | null | undefined;
  clientCrId?: string | null;
  payor?: string | null;
  state?: string | null;
  procedureCode?: string | null;
  serviceCodes?: string | null;
  frequency?: string | null;
  authorizedHoursMonth?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  /** Matched source pairs — never crossed with the base start/end columns. */
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  followupStartDate?: string | null;
  followupEndDate?: string | null;
  isActive?: boolean | null;
}

/** True when the authorization carries a 97156 service scope. */
export function isParentTrainingAuth(auth: PtAuthorizationInput): boolean {
  return /97156/.test(`${auth.procedureCode ?? ""} ${auth.serviceCodes ?? ""}`);
}

/**
 * Pure date-scope rule for a parent-training target authorization.
 *
 * A target may only come from a 97156 authorization that the source has not
 * marked inactive and that has ONE valid matched coverage pair overlapping the
 * applicable scope — the selected window when given, otherwise today. Column
 * types are never crossed (an actual start only pairs with an actual end), and
 * reversed, malformed, future, expired or pairless rows can never set a target.
 */
export function isAuthTargetInScope(
  auth: Pick<
    PtAuthorizationInput,
    | "startDate"
    | "endDate"
    | "actualStartDate"
    | "actualEndDate"
    | "followupStartDate"
    | "followupEndDate"
    | "isActive"
  >,
  scope: { from?: string | null; to?: string | null },
  today: string,
): boolean {
  if (auth.isActive === false) return false;
  const row: ContinuityAuthRow = {
    start_date: auth.startDate ?? null,
    end_date: auth.endDate ?? null,
    actual_start_date: auth.actualStartDate ?? null,
    actual_end_date: auth.actualEndDate ?? null,
    followup_start_date: auth.followupStartDate ?? null,
    followup_end_date: auth.followupEndDate ?? null,
    is_active: auth.isActive ?? null,
  };
  const from = scope.from ? String(scope.from).slice(0, 10) : today;
  const to = scope.to ? String(scope.to).slice(0, 10) : today;
  const pair = selectCoveragePair(row, { from, to, today });
  if (!pair) return false; // no valid matched pair at all
  return pair.overlapDays != null && pair.overlapDays > 0;
}

/**
 * Strict positive authorized monthly hours. Blank, null, boolean and nonfinite
 * source values are missing — never zero and never a target.
 */
export function strictAuthorizedHoursMonth(value: unknown): number | null {
  const parsed = finiteNumberOrNull(value);
  return parsed != null && parsed > 0 ? parsed : null;
}

/** Prefer documented authorized monthly hours; fall back to a clear cadence. */
export function resolveClientTarget(auths: PtAuthorizationInput[]): PtClientTarget {
  let best: PtClientTarget = NO_TARGET;
  for (const a of auths) {
    const hours = strictAuthorizedHoursMonth(a.authorizedHoursMonth);
    if (hours != null) {
      return {
        type: "hours",
        perMonth: Math.round(hours * 10) / 10,
        cadence: `${Math.round(hours * 10) / 10} authorized hour(s) per month`,
        source: "authorized_hours_month",
        authorizedMonthlyHours: Math.round(hours * 10) / 10,
      };
    }
    if (best.source === "none") {
      const parsed =
        parseFrequencyTarget(a.frequency) ?? parseFrequencyTarget(a.serviceCodes ?? null);
      if (parsed) best = parsed;
    }
  }
  return best;
}


export interface PtSessionInput {
  date: string | null | undefined;
  procedureCode: string | null | undefined;
  hours: number | null | undefined;
  clientName: string | null | undefined;
  clientCrId?: string | null;
  providerName?: string | null;
  payor?: string | null;
  state?: string | null;
  /** Only meaningful for schedule rows. */
  cancelled?: boolean;
  cancellationReason?: string | null;
}

export type PtBucket = "completed" | "upcoming" | "cancelled";

export interface PtEventRow {
  key: string;
  bucket: PtBucket;
  date: string | null;
  clientKey: string;
  client: string;
  clientCrId: string;
  bcba: string;

  provider: string;
  payor: string;
  state: string;
  hours: number;
  reason: string | null;
}

export type PtClientStatus =
  | "no_target"
  | "no_appointment"
  | "below_target"
  | "on_track"
  | "needs_reschedule";

export const PT_STATUS_LABELS: Record<PtClientStatus, string> = {
  no_target: NO_TARGET_LABEL,
  no_appointment: "No upcoming appointment",
  below_target: "Below target pace",
  on_track: "On track",
  needs_reschedule: "Needs reschedule",
};

export interface PtClientRow {
  /** Stable identity key: CR client id when known, else normalized name. */
  clientKey: string;
  client: string;
  clientCrId: string;
  bcba: string;

  payor: string;
  state: string;
  completedHours: number;
  completedSessions: number;
  upcomingSessions: number;
  upcomingHours: number;
  cancelledSessions: number;
  lastCompleted: string | null;
  nextScheduled: string | null;
  authorizedMonthlyHours: number | null;
  expectedCadence: string;
  targetType: PtTargetType | null;
  targetValue: number | null;
  targetSource: PtTargetSourceKind;
  /** Target scaled to the selected window; null when there is no target. */
  windowTarget: number | null;
  /** Target expected by today (elapsed share for an open current month). */
  expectedToDate: number | null;
  /** Delivered ÷ expected-to-date, as a percentage. Null without a target. */
  pacePct: number | null;
  hasTarget: boolean;
  noUpcoming: boolean;
  belowTarget: boolean;
  needsReschedule: boolean;
  ownershipGap: boolean;
  status: PtClientStatus;
  reason: string;
}

export interface PtGroupRow {
  name: string;
  completedHours: number;
  clients: number;
  clientsWithPt: number;
  coveragePct: number | null;
  cancelledSessions: number;
}

export interface ParentTrainingAnalysis {
  completedHours: number;
  completedSessions: number;
  upcomingSessions: number;
  upcomingHours: number;
  cancelledSessions: number;
  cancellationRatePct: number | null;
  clients: number;
  clientsWithCompleted: number;
  coveragePct: number | null;
  monthsInWindow: number;
  clientsWithTarget: number;
  clientsWithoutTarget: number;
  byBcba: PtGroupRow[];
  byPayor: PtGroupRow[];
  byState: PtGroupRow[];
  clientRows: PtClientRow[];
  events: PtEventRow[];
  /** Zero future kept 97156 sessions, even if one was completed earlier. */
  noUpcomingQueue: PtClientRow[];
  /** Below a usable target's expected pace. Never contains no-target clients. */
  belowTargetQueue: PtClientRow[];
  /** Cancelled with no later replacement session on the calendar. */
  needsRescheduleQueue: PtClientRow[];
  /** Ownership or client-identity gaps that block attribution. */
  dataGapQueue: PtClientRow[];
  trend: { label: string; value: number }[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const iso = (d: string | null | undefined) => (d ? String(d).slice(0, 10) : null);
const isPt = (code: string | null | undefined) => normalizeCode(code) === CODE_PARENT_TRAINING;

/** Whole months (inclusive) a window spans; at least 1. */
export function monthsInWindow(from?: string | null, to?: string | null): number {
  if (!from || !to) return 1;
  const [fy, fm] = from.slice(0, 7).split("-").map(Number);
  const [ty, tm] = to.slice(0, 7).split("-").map(Number);
  if (!fy || !ty) return 1;
  return Math.max(1, (ty - fy) * 12 + (tm - fm) + 1);
}

/**
 * Share of the window already elapsed, 0–1. A closed window is 1 so a finished
 * period is judged against its full target, not a partial one.
 */
export function elapsedProportion(
  from: string | null | undefined,
  to: string | null | undefined,
  today: string,
): number {
  if (!from || !to) return 1;
  if (today >= to) return 1;
  if (today < from) return 0;
  const day = (d: string) => new Date(`${d}T00:00:00Z`).getTime() / 86400000;
  const total = day(to) - day(from) + 1;
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (day(today) - day(from) + 1) / total));
}

export interface ParentTrainingInput {
  /** Billed 97156 facts (completed). */
  billed: PtSessionInput[];
  /** Schedule 97156 events, cancelled ones flagged, deleted already removed. */
  scheduled: PtSessionInput[];
  /** Active 97156 authorizations — the only source of a target. */
  authorizations: PtAuthorizationInput[];
  /** Every client active in the window, so gaps are visible. */
  activeClients: {
    client: string;
    clientCrId?: string | null;
    payor?: string | null;
    state?: string | null;
  }[];
  resolveOwner: (s: {
    clientName?: string | null;
    clientCrId?: string | null;
    date?: string | null;
  }) => string | null;
  window?: { from?: string | null; to?: string | null };
  today?: string;
}

export function computeParentTrainingAnalysis({
  billed,
  scheduled,
  authorizations,
  activeClients,
  resolveOwner,
  window,
  today = localIsoDate(),
}: ParentTrainingInput): ParentTrainingAnalysis {
  const months = monthsInWindow(window?.from, window?.to);
  const elapsed = elapsedProportion(window?.from, window?.to, today);

  const clients = new Map<string, PtClientRow>();
  const events: PtEventRow[] = [];

  /**
   * Client identity is resolved from the COMPLETE input before any grouping,
   * so output never depends on row order. A CR client id always wins; an
   * id-less row adopts an id only when that name maps to exactly one id.
   */
  const identity = buildClientIdentityResolver(
    authorizations.map((a) => ({ client: a.clientName, clientCrId: a.clientCrId })),
    billed,
    scheduled,
    activeClients,
  );
  const identityKey = (crId: string | null | undefined, client: string): string =>
    identity.keyFor(crId, client);

  // Targets are grouped per client identity from the authorization snapshot.
  const authsByClient = new Map<string, PtAuthorizationInput[]>();
  for (const a of authorizations) {
    const name = String(a.clientName ?? "").trim();
    if (!name) continue;
    // 97156 authorizations only; an unrelated code can never set a PT target.
    if (!isParentTrainingAuth(a)) continue;
    // Only a usable in-scope matched coverage pair may set a target: never
    // inactive, never future, never expired, never reversed or pairless.
    if (!isAuthTargetInScope(a, { from: window?.from, to: window?.to }, today)) continue;
    const key = identityKey(a.clientCrId, name);
    if (!authsByClient.has(key)) authsByClient.set(key, []);
    authsByClient.get(key)!.push(a);
  }

  const ensure = (input: {
    client?: string | null;
    clientCrId?: string | null;
    payor?: string | null;
    state?: string | null;
    date?: string | null;
  }): PtClientRow => {
    const client = String(input.client ?? "").trim() || "Unknown client";
    const key = identityKey(input.clientCrId, client);
    if (!clients.has(key)) {
      const target = resolveClientTarget(authsByClient.get(key) ?? []);
      const owner = resolveOwner({
        clientName: client,
        clientCrId: input.clientCrId,
        date: input.date,
      });
      clients.set(key, {
        clientKey: key,
        client,
        clientCrId: String(input.clientCrId ?? "").trim(),
        bcba: owner ?? "Unassigned",
        payor: String(input.payor ?? "").trim() || "Unknown",
        state: String(input.state ?? "").trim() || "Unknown",
        completedHours: 0,
        completedSessions: 0,
        upcomingSessions: 0,
        upcomingHours: 0,
        cancelledSessions: 0,
        lastCompleted: null,
        nextScheduled: null,
        authorizedMonthlyHours: target.authorizedMonthlyHours,
        expectedCadence: target.cadence,
        targetType: target.type,
        targetValue: target.perMonth,
        targetSource: target.source,
        windowTarget: target.perMonth != null ? round1(target.perMonth * months) : null,
        expectedToDate: null,
        pacePct: null,
        hasTarget: target.perMonth != null,
        noUpcoming: true,
        belowTarget: false,
        needsReschedule: false,
        ownershipGap: owner == null,
        status: "on_track",
        reason: "",
      });
    }
    const row = clients.get(key)!;
    if (!row.clientCrId && input.clientCrId) row.clientCrId = String(input.clientCrId).trim();
    return row;
  };


  for (const c of activeClients) ensure(c);
  // Auth-only clients must appear even with no billing or schedule activity.
  for (const [, list] of authsByClient) {
    const a = list[0];
    ensure({
      client: a.clientName,
      clientCrId: a.clientCrId,
      payor: a.payor,
      state: a.state,
      date: a.startDate ?? window?.from ?? null,
    });
  }

  /** Latest kept 97156 appointment per client: billed fact or noncancelled event. */
  const latestKept = new Map<string, string | null>();
  const noteKept = (key: string, date: string | null) => {
    if (!date) return;
    const prev = latestKept.get(key) ?? null;
    if (!prev || date > prev) latestKept.set(key, date);
  };

  billed.forEach((s, i) => {
    if (!isPt(s.procedureCode)) return;
    const row = ensure({
      client: s.clientName,
      clientCrId: s.clientCrId,
      payor: s.payor,
      state: s.state,
      date: s.date,
    });
    const hours = hoursOf(s.hours);
    const date = iso(s.date);
    row.completedHours = round1(row.completedHours + hours);
    row.completedSessions += 1;
    if (date && (!row.lastCompleted || date > row.lastCompleted)) row.lastCompleted = date;
    noteKept(row.clientKey, date);
    events.push({
      key: `billed-${i}`,
      bucket: "completed",
      date,
      clientKey: row.clientKey,
      client: row.client,
      clientCrId: row.clientCrId,
      bcba: row.bcba,
      provider: String(s.providerName ?? "").trim(),
      payor: row.payor,
      state: row.state,
      hours: round1(hours),
      reason: null,
    });
  });

  const lastCancelled = new Map<string, string | null>();

  scheduled.forEach((s, i) => {
    if (!isPt(s.procedureCode)) return;
    const row = ensure({
      client: s.clientName,
      clientCrId: s.clientCrId,
      payor: s.payor,
      state: s.state,
      date: s.date,
    });
    const date = iso(s.date);
    const hours = hoursOf(s.hours);
    if (s.cancelled) {
      row.cancelledSessions += 1;
      const key = row.clientKey;
      const prev = lastCancelled.get(key) ?? null;
      if (date && (!prev || date > prev)) lastCancelled.set(key, date);
      else if (!lastCancelled.has(key)) lastCancelled.set(key, date);
      events.push({
        key: `sched-${i}`,
        bucket: "cancelled",
        date,
        clientKey: row.clientKey,
        client: row.client,
        clientCrId: row.clientCrId,
        bcba: row.bcba,
        provider: String(s.providerName ?? "").trim(),
        payor: row.payor,
        state: row.state,
        hours: round1(hours),
        reason: s.cancellationReason ?? null,
      });
      return;
    }
    noteKept(row.clientKey, date);
    // Only events still ahead of today are "upcoming"; a kept past event is
    // proven by the billed facts, not by the calendar.
    if (date && date >= today) {
      row.upcomingSessions += 1;
      row.upcomingHours = round1(row.upcomingHours + hours);
      if (!row.nextScheduled || date < row.nextScheduled) row.nextScheduled = date;
      events.push({
        key: `sched-${i}`,
        bucket: "upcoming",
        date,
        clientKey: row.clientKey,
        client: row.client,
        clientCrId: row.clientCrId,
        bcba: row.bcba,
        provider: String(s.providerName ?? "").trim(),
        payor: row.payor,
        state: row.state,
        hours: round1(hours),
        reason: null,
      });
    }
  });

  const clientRows = [...clients.values()].map((r) => {
    const delivered = r.targetType === "sessions" ? r.completedSessions : r.completedHours;
    r.expectedToDate =
      r.windowTarget != null ? Math.round(r.windowTarget * elapsed * 10) / 10 : null;
    r.pacePct =
      r.expectedToDate != null && r.expectedToDate > 0
        ? Math.round((delivered / r.expectedToDate) * 1000) / 10
        : null;

    // A client with nothing on the calendar ahead of today needs an
    // appointment even if a session was already completed this month.
    r.noUpcoming = r.upcomingSessions === 0;
    r.belowTarget = r.hasTarget && r.pacePct != null && r.pacePct < 100;

    /**
     * A cancelled session only needs rescheduling when NO later kept 97156
     * appointment exists — a later billed fact or a later noncancelled event
     * both prove the replacement, so the queue never nags about work already
     * made up.
     */
    const cancelledOn = lastCancelled.get(r.clientKey) ?? null;
    const keptOn = latestKept.get(r.clientKey) ?? null;
    r.needsReschedule =
      r.cancelledSessions > 0 &&
      (cancelledOn == null ? keptOn == null : !(keptOn != null && keptOn > cancelledOn));

    const unit = r.targetType === "sessions" ? "session(s)" : "hour(s)";
    r.status = !r.hasTarget
      ? "no_target"
      : r.noUpcoming
        ? "no_appointment"
        : r.needsReschedule
          ? "needs_reschedule"
          : r.belowTarget
            ? "below_target"
            : "on_track";
    r.reason = !r.hasTarget
      ? "No authorized monthly hours and no unambiguous cadence documented, so no target applies."
      : r.noUpcoming
        ? `No future kept 97156 session on the calendar (${round1(delivered)} of ${r.expectedToDate} expected ${unit} so far).`
        : r.needsReschedule
          ? "A cancelled 97156 session has no later replacement on the calendar."
          : r.belowTarget
            ? `${round1(delivered)} of ${r.expectedToDate} expected ${unit} delivered so far (${r.pacePct}% of pace).`
            : `${round1(delivered)} of ${r.expectedToDate} expected ${unit} delivered — at or above pace.`;
    return r;
  });

  return summarizeParentTraining(clientRows, events, months);
}

/**
 * Build the full analysis (KPIs, groups, queues, trend) from a set of client
 * and event rows. Selecting a BCBA rescopes every number through this function,
 * so no KPI, chart, queue, or export can keep describing the unfiltered set.
 */
export function summarizeParentTraining(
  clientRows: PtClientRow[],
  events: PtEventRow[],
  months: number,
): ParentTrainingAnalysis {
  const group = (pick: (r: PtClientRow) => string): PtGroupRow[] => {
    const map = new Map<string, PtGroupRow>();
    for (const r of clientRows) {
      const name = pick(r) || "Unknown";
      if (!map.has(name)) {
        map.set(name, {
          name,
          completedHours: 0,
          clients: 0,
          clientsWithPt: 0,
          coveragePct: null,
          cancelledSessions: 0,
        });
      }
      const g = map.get(name)!;
      g.completedHours = round1(g.completedHours + r.completedHours);
      g.clients += 1;
      if (r.completedSessions > 0) g.clientsWithPt += 1;
      g.cancelledSessions += r.cancelledSessions;
    }
    return [...map.values()]
      .map((g) => ({
        ...g,
        coveragePct: g.clients > 0 ? Math.round((g.clientsWithPt / g.clients) * 1000) / 10 : null,
      }))
      .sort((a, b) => b.completedHours - a.completedHours);
  };

  const completedSessions = clientRows.reduce((s, r) => s + r.completedSessions, 0);
  const cancelledSessions = clientRows.reduce((s, r) => s + r.cancelledSessions, 0);
  const upcomingSessions = clientRows.reduce((s, r) => s + r.upcomingSessions, 0);
  const withCompleted = clientRows.filter((r) => r.completedSessions > 0).length;
  const denom = completedSessions + cancelledSessions;

  const trend = new Map<string, number>();
  for (const e of events) {
    if (e.bucket !== "completed" || !e.date) continue;
    const month = e.date.slice(0, 7);
    trend.set(month, round1((trend.get(month) ?? 0) + e.hours));
  }

  return {
    completedHours: round1(clientRows.reduce((s, r) => s + r.completedHours, 0)),
    completedSessions,
    upcomingSessions,
    upcomingHours: round1(clientRows.reduce((s, r) => s + r.upcomingHours, 0)),
    cancelledSessions,
    cancellationRatePct: denom > 0 ? Math.round((cancelledSessions / denom) * 1000) / 10 : null,
    clients: clientRows.length,
    clientsWithCompleted: withCompleted,
    coveragePct:
      clientRows.length > 0 ? Math.round((withCompleted / clientRows.length) * 1000) / 10 : null,
    monthsInWindow: months,
    clientsWithTarget: clientRows.filter((r) => r.hasTarget).length,
    clientsWithoutTarget: clientRows.filter((r) => !r.hasTarget).length,
    byBcba: group((r) => r.bcba),
    byPayor: group((r) => r.payor),
    byState: group((r) => r.state),
    clientRows: [...clientRows].sort((a, b) => b.completedHours - a.completedHours),
    events: [...events].sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? ""))),
    noUpcomingQueue: clientRows.filter((r) => r.noUpcoming),
    belowTargetQueue: clientRows.filter((r) => r.belowTarget),
    needsRescheduleQueue: clientRows.filter((r) => r.needsReschedule),
    dataGapQueue: clientRows.filter((r) => r.ownershipGap),
    trend: [...trend.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value })),
  };
}

/** Rescope a computed analysis to one BCBA — every KPI, queue, and group. */
export function scopeParentTrainingToBcba(
  analysis: ParentTrainingAnalysis,
  bcba: string,
): ParentTrainingAnalysis {
  if (!bcba) return analysis;
  const clientRows = analysis.clientRows.filter((r) => r.bcba === bcba);
  const keys = new Set(clientRows.map((r) => r.clientKey));
  const events = analysis.events.filter((e) => keys.has(e.clientKey));
  return summarizeParentTraining(clientRows, events, analysis.monthsInWindow);
}
