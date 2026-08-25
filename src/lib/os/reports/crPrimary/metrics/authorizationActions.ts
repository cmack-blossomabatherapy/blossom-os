/**
 * Phase 2A repair — Progress Report and Pause operations, from authoritative
 * sources only.
 *
 * Two hard rules live here:
 *
 * 1. **Overdue is never inferred.** A row may only be called overdue when the
 *    curated operational record carries an authoritative due date
 *    (`next_action_due_date` or `appeal_due_date`). When neither exists the row
 *    is reported as "No authoritative due date" — an authorization *start*
 *    date is never repurposed as a progress-report due date.
 * 2. **A pause must be logged.** Confirmed pauses come from real pause events.
 *    Coverage gaps derived from a snapshot are a separate, clearly labeled
 *    "Needs Confirmation" list — they are a question, not a pause.
 */
import type { LifecycleEventRow } from "./authorizationLifecycle";
import { classifyLifecycleEvent, classifyLifecycleKind } from "./authorizationLifecycle";
import { cleanReasonText } from "../scheduleTruth";
import { strictDay, strictDaysBetween } from "./calendarDate";
import { inDayRange } from "@/lib/os/reports/dateKey";

export interface AuthorizationActionRow {
  record_id: string;
  client_name?: string | null;
  client_cr_id?: string | null;
  authorization_number?: string | null;
  auth_type?: string | null;
  state?: string | null;
  payor?: string | null;
  service_code?: string | null;
  status?: string | null;
  workflow_stage?: string | null;
  submitted_date?: string | null;
  approved_date?: string | null;
  denied_date?: string | null;
  resubmitted_date?: string | null;
  expiration_date?: string | null;
  denial_reason?: string | null;
  missing_info?: string | null;
  next_action?: string | null;
  next_action_due_date?: string | null;
  appeal_due_date?: string | null;
  received_date?: string | null;
}

export const NO_AUTHORITATIVE_DUE = "No authoritative due date";
export const NOT_DOCUMENTED = "Not documented";

/**
 * Valid `YYYY-MM-DD` day, or null. A malformed source date is never a date,
 * and an impossible calendar date (2026-02-31, non-leap 2026-02-29) is never a
 * date either — `strictDay` round-trips the day to reject JavaScript's silent
 * month rollover.
 */
export function validDay(value: unknown): string | null {
  return strictDay(value);
}

const RESOLVED_STATUS =
  /\b(resolved|complete|completed|approved|closed|withdrawn|cancell?ed|canceled)\b/i;

const DENIED_STATUS = /\bdenie[dt]?\b|\bdenial\b/i;

/** Placeholder next-action text that documents no real outstanding work. */
const NO_MEANINGFUL_ACTION =
  /^(n\/?a|none|no action|no action needed|no action required|not documented|not applicable|tbd|-|—)$/i;

function hasMeaningfulNextAction(value: unknown): boolean {
  const raw = String(value ?? "").trim();
  if (!raw) return false;
  return !NO_MEANINGFUL_ACTION.test(raw);
}

/**
 * A resolved action is finished work: it must never appear as overdue, no
 * matter how old its recorded due date is. Merely submitted / pending /
 * denied-with-next-action rows are NOT resolved — that appeal work is live,
 * even when the source status also says "Completed - Denied".
 */
export function isActionResolved(action: AuthorizationActionRow): boolean {
  // A real approved date is definitive.
  if (validDay(action.approved_date)) return true;

  const statusText = [action.workflow_stage, action.status].map((v) => String(v ?? ""));
  const denied =
    validDay(action.denied_date) != null || statusText.some((v) => DENIED_STATUS.test(v));
  if (denied) {
    const liveAppeal =
      hasMeaningfulNextAction(action.next_action) || validDay(action.appeal_due_date) != null;
    if (liveAppeal) return false;
  }

  return statusText.some((v) => RESOLVED_STATUS.test(v));
}


export interface ProgressReportEventRow {
  key: string;
  eventDate: string | null;
  client: string;
  authorizationNumber: string;
  payor: string;
  state: string;
  outcome: "submitted" | "approved" | "denied" | "resubmitted" | "other";
  reason: string;
  source: string;
}

export interface ProgressReportDueRow {
  key: string;
  client: string;
  /** CentralReach client id when the source row carries one, else "". */
  clientCrId: string;
  authorizationNumber: string;
  state: string;
  payor: string;
  status: string;
  nextAction: string;
  /** Authoritative due date, or null when no usable due source exists. */
  dueDate: string | null;
  dueSource: "next_action_due_date" | "appeal_due_date" | "none";
  /**
   * A real recorded workflow date on this row (submitted / approved / denied /
   * received). Used ONLY as an ownership-resolution fallback — it is never a
   * due date and never creates a deadline.
   */
  recordedDate: string | null;
  daysUntilDue: number | null;
  overdue: boolean;
  /** Finished work. Kept visible for history, excluded from the overdue queue. */
  resolved: boolean;
  resolvedNote: string | null;
  note: string;
}

export interface ProgressReportOps {
  hasEvents: boolean;
  submitted: number;
  approved: number;
  denied: number;
  resubmitted: number;
  events: ProgressReportEventRow[];
  dueRows: ProgressReportDueRow[];
  overdueCount: number;
  withoutDueSource: number;
  resolvedCount: number;
}

const text = (v: unknown, fallback: string) => String(v ?? "").trim() || fallback;

const daysBetween = (from: string, to: string): number | null =>
  strictDaysBetween(from, to);

/**
 * True only for authorization records that are actually progress-report work.
 *
 * Two authoritative signals are accepted, in order:
 *  1. an explicit `auth_type` that classifies as `progress_report`; or
 *  2. a workflow/status/next-action string that explicitly names a progress
 *     report (or carries a standalone `PR` token).
 *
 * A generic authorization action — "submit reauth", "await payor" — is *not*
 * progress-report work and must stay out of the PR due queue.
 */
export function isProgressReportAction(action: AuthorizationActionRow): boolean {
  if (classifyLifecycleKind(action.auth_type) === "progress_report") return true;
  const text = [action.workflow_stage, action.status, action.next_action]
    .map((v) => String(v ?? ""))
    .join(" ")
    .toLowerCase();
  if (!text.trim()) return false;
  return /progress\s*report|\bprogress[_-]report\b|(?:^|[^a-z])pr(?:$|[^a-z])/.test(text);
}

/** True progress-report events, split by real outcome (never manufactured). */

export function computeProgressReportOps(
  events: LifecycleEventRow[],
  actions: AuthorizationActionRow[],
  today = new Date(),
): ProgressReportOps {
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;

  const prEvents: ProgressReportEventRow[] = [];
  for (const [i, e] of events.entries()) {
    const c = classifyLifecycleEvent(e.event_type, e.lifecycle_kind ?? e.auth_type);
    if (c.kind !== "progress_report") continue;
    prEvents.push({
      key: `${e.record_id ?? e.id ?? "pr"}-${i}`,
      eventDate: e.event_date ? String(e.event_date).slice(0, 10) : null,
      client: text(e.client_name, "Unknown client"),
      authorizationNumber: text(e.authorization_number, "Not documented"),
      payor: text(e.payor, "Unknown"),
      state: text(e.state, "Unknown"),
      outcome:
        c.action === "approved" ||
        c.action === "denied" ||
        c.action === "submitted" ||
        c.action === "resubmitted"
          ? c.action
          : "other",
      reason: cleanReasonText(e.reason) ?? "Not documented",
      source: text(e.source, "Not documented"),
    });
  }

  // Only true progress-report records enter the due queue.
  const prActions = actions.filter(isProgressReportAction);
  const dueRows: ProgressReportDueRow[] = prActions.map((a, i) => {
    const nextDue = validDay(a.next_action_due_date);
    const appealDue = validDay(a.appeal_due_date);
    const dueDate = nextDue ?? appealDue;
    const dueSource: ProgressReportDueRow["dueSource"] = nextDue
      ? "next_action_due_date"
      : appealDue
        ? "appeal_due_date"
        : "none";
    const days = dueDate ? daysBetween(todayIso, dueDate) : null;
    const resolved = isActionResolved(a);
    const overdue = !resolved && days != null && days < 0;
    const recordedDate =
      validDay(a.submitted_date) ??
      validDay(a.approved_date) ??
      validDay(a.denied_date) ??
      validDay(a.received_date);
    return {
      key: `${a.record_id}-${i}`,
      client: text(a.client_name, "Unknown client"),
      clientCrId: text(a.client_cr_id, ""),
      authorizationNumber: text(a.authorization_number, "Not documented"),
      state: text(a.state, "Unknown"),
      payor: text(a.payor, "Unknown"),
      status: text(a.workflow_stage ?? a.status, "Not documented"),
      nextAction: text(a.next_action, "Not documented"),
      dueDate,
      dueSource,
      recordedDate,
      daysUntilDue: days,
      overdue,
      resolved,
      resolvedNote: resolved
        ? "Resolved — closed out in the source record, so it is not overdue work."
        : null,
      note: resolved
        ? "Resolved — no outstanding action against the recorded due date."
        : dueSource === "none"
          ? NO_AUTHORITATIVE_DUE
          : days != null && days < 0
            ? `Overdue by ${Math.abs(days)} day(s) against the recorded due date.`
            : `Due in ${days} day(s).`,
    };
  });

  return {
    hasEvents: prEvents.length > 0,
    submitted: prEvents.filter((e) => e.outcome === "submitted").length,
    approved: prEvents.filter((e) => e.outcome === "approved").length,
    denied: prEvents.filter((e) => e.outcome === "denied").length,
    resubmitted: prEvents.filter((e) => e.outcome === "resubmitted").length,
    events: prEvents.sort((a, b) =>
      String(b.eventDate ?? "").localeCompare(String(a.eventDate ?? "")),
    ),
    dueRows: dueRows.sort((a, b) => {
      if (a.dueSource === "none" && b.dueSource !== "none") return 1;
      if (b.dueSource === "none" && a.dueSource !== "none") return -1;
      return String(a.dueDate ?? "").localeCompare(String(b.dueDate ?? ""));
    }),
    overdueCount: dueRows.filter((r) => r.overdue).length,
    withoutDueSource: dueRows.filter((r) => r.dueSource === "none").length,
    resolvedCount: dueRows.filter((r) => r.resolved).length,
  };
}

export interface PauseEventRow {
  key: string;
  eventDate: string | null;
  client: string;
  authorizationNumber: string;
  state: string;
  payor: string;
  reason: string;
  source: string;
}

export interface PauseCandidateRow {
  key: string;
  client: string;
  state: string;
  payor: string;
  lastEnd: string | null;
  note: string;
  /** Always true: snapshot-derived gaps are candidates, never confirmed pauses. */
  needsConfirmation: true;
}

export interface PauseOps {
  confirmedPauses: PauseEventRow[];
  pauseReasons: { label: string; value: number }[];
  candidates: PauseCandidateRow[];
}

export interface CoverageGapInput {
  client: string;
  state: string;
  payor: string;
  lastEnd: string | null;
  note: string;
}

/** Confirmed pause events, kept strictly separate from coverage-gap candidates. */
export function computePauseOps(
  events: LifecycleEventRow[],
  coverageGaps: CoverageGapInput[],
): PauseOps {
  const confirmed: PauseEventRow[] = [];
  const reasons = new Map<string, number>();

  for (const [i, e] of events.entries()) {
    const c = classifyLifecycleEvent(e.event_type, e.lifecycle_kind ?? e.auth_type);
    if (c.action !== "paused") continue;
    const reason = cleanReasonText(e.reason) ?? "Reason not documented";
    reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
    confirmed.push({
      key: `${e.record_id ?? e.id ?? "pause"}-${i}`,
      eventDate: e.event_date ? String(e.event_date).slice(0, 10) : null,
      client: text(e.client_name, "Unknown client"),
      authorizationNumber: text(e.authorization_number, "Not documented"),
      state: text(e.state, "Unknown"),
      payor: text(e.payor, "Unknown"),
      reason,
      source: text(e.source, "Not documented"),
    });
  }

  return {
    confirmedPauses: confirmed.sort((a, b) =>
      String(b.eventDate ?? "").localeCompare(String(a.eventDate ?? "")),
    ),
    pauseReasons: [...reasons.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    candidates: coverageGaps.map((g, i) => ({
      key: `${g.client}-${i}`,
      client: g.client,
      state: g.state,
      payor: g.payor,
      lastEnd: g.lastEnd,
      note: g.note,
      needsConfirmation: true as const,
    })),
  };
}


/**
 * Authoritative action timelines — received → submitted and submitted →
 * decision (approved or denied). Only real documented date pairs count. A
 * missing, malformed or reversed pair is `null` / "Not documented", never 0,
 * and a genuine same-day pair is preserved as 0 days.
 */
export interface ActionTimelineRow {
  key: string;
  client: string;
  authorizationNumber: string;
  state: string;
  payor: string;
  receivedDate: string | null;
  submittedDate: string | null;
  decisionDate: string | null;
  decisionType: "approved" | "denied" | null;
  receivedToSubmittedDays: number | null;
  receivedToSubmittedDisplay: string;
  submittedToDecisionDays: number | null;
  submittedToDecisionDisplay: string;
}

export interface ActionTimelineMetrics {
  rows: ActionTimelineRow[];
  documentedReceivedToSubmitted: number;
  documentedSubmittedToDecision: number;
  avgReceivedToSubmittedDays: number | null;
  avgSubmittedToDecisionDays: number | null;
  approvedDecisions: number;
  deniedDecisions: number;
}

/** Non-negative day span between two valid dates, else null. */
export function timelineDays(
  from: string | null | undefined,
  to: string | null | undefined,
): number | null {
  const a = validDay(from);
  const b = validDay(to);
  if (!a || !b) return null;
  const days = daysBetween(a, b);
  if (days == null || days < 0) return null;
  return days;
}

const timelineDisplay = (days: number | null): string =>
  days == null ? NOT_DOCUMENTED : `${days} day(s)`;

export function computeAuthorizationActionTimelines(
  actions: AuthorizationActionRow[],
): ActionTimelineMetrics {
  const rows: ActionTimelineRow[] = actions.map((a, i) => {
    const receivedDate = validDay(a.received_date);
    const submittedDate = validDay(a.submitted_date);
    const approved = validDay(a.approved_date);
    const denied = validDay(a.denied_date);
    const decisionType: ActionTimelineRow["decisionType"] = approved
      ? "approved"
      : denied
        ? "denied"
        : null;
    const decisionDate = approved ?? denied;
    const receivedToSubmittedDays = timelineDays(receivedDate, submittedDate);
    const submittedToDecisionDays = timelineDays(submittedDate, decisionDate);
    return {
      key: `${a.record_id}-${i}`,
      client: text(a.client_name, "Unknown client"),
      authorizationNumber: text(a.authorization_number, NOT_DOCUMENTED),
      state: text(a.state, "Unknown"),
      payor: text(a.payor, "Unknown"),
      receivedDate,
      submittedDate,
      decisionDate,
      decisionType,
      receivedToSubmittedDays,
      receivedToSubmittedDisplay: timelineDisplay(receivedToSubmittedDays),
      submittedToDecisionDays,
      submittedToDecisionDisplay: timelineDisplay(submittedToDecisionDays),
    };
  });

  const avg = (values: number[]): number | null =>
    values.length ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10 : null;
  const rts = rows
    .map((r) => r.receivedToSubmittedDays)
    .filter((v): v is number => v != null);
  const std = rows
    .map((r) => r.submittedToDecisionDays)
    .filter((v): v is number => v != null);

  return {
    rows,
    documentedReceivedToSubmitted: rts.length,
    documentedSubmittedToDecision: std.length,
    avgReceivedToSubmittedDays: avg(rts),
    avgSubmittedToDecisionDays: avg(std),
    approvedDecisions: rows.filter((r) => r.decisionType === "approved").length,
    deniedDecisions: rows.filter((r) => r.decisionType === "denied").length,
  };
}
