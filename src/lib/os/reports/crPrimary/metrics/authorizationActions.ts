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
import { classifyLifecycleEvent } from "./authorizationLifecycle";
import { cleanReasonText } from "../scheduleTruth";

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
}

export const NO_AUTHORITATIVE_DUE = "No authoritative due date";

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
  authorizationNumber: string;
  state: string;
  payor: string;
  status: string;
  nextAction: string;
  /** Authoritative due date, or null when no usable due source exists. */
  dueDate: string | null;
  dueSource: "next_action_due_date" | "appeal_due_date" | "none";
  daysUntilDue: number | null;
  overdue: boolean;
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
}

const text = (v: unknown, fallback: string) => String(v ?? "").trim() || fallback;

const daysBetween = (from: string, to: string): number | null => {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86_400_000);
};

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

  const dueRows: ProgressReportDueRow[] = actions.map((a, i) => {
    const nextDue = String(a.next_action_due_date ?? "").slice(0, 10) || null;
    const appealDue = String(a.appeal_due_date ?? "").slice(0, 10) || null;
    const dueDate = nextDue ?? appealDue;
    const dueSource: ProgressReportDueRow["dueSource"] = nextDue
      ? "next_action_due_date"
      : appealDue
        ? "appeal_due_date"
        : "none";
    const days = dueDate ? daysBetween(todayIso, dueDate) : null;
    return {
      key: `${a.record_id}-${i}`,
      client: text(a.client_name, "Unknown client"),
      authorizationNumber: text(a.authorization_number, "Not documented"),
      state: text(a.state, "Unknown"),
      payor: text(a.payor, "Unknown"),
      status: text(a.workflow_stage ?? a.status, "Not documented"),
      nextAction: text(a.next_action, "Not documented"),
      dueDate,
      dueSource,
      daysUntilDue: days,
      overdue: days != null && days < 0,
      note:
        dueSource === "none"
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
