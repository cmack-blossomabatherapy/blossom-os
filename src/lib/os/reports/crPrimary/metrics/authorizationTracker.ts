/**
 * Authorization workflow event tracker.
 *
 * CentralReach authorization exports contain no submission dates, no denial
 * events, and no progress-report events. The Authorization team logs those
 * weekly in `authorization_weekly_events`; this module defines the canonical
 * event vocabulary and aggregates events into the weekly tracking matrix.
 */
import { weekStart } from "../format";
import type { AuthorizationWeeklyEventRow } from "../types";

export const AUTH_EVENT_TYPES = [
  "initial_assessment_submitted",
  "initial_assessment_approved",
  "initial_assessment_denied",
  "initial_treatment_submitted",
  "initial_treatment_approved",
  "initial_treatment_denied",
  "ra_submitted",
  "ra_approved",
  "ra_denied",
  "progress_report_submitted",
  "progress_report_approved",
  "progress_report_denied",
  "services_paused_no_ra",
  "services_paused_late_pr",
] as const;

export type AuthEventType = (typeof AUTH_EVENT_TYPES)[number];

export const AUTH_EVENT_LABELS: Record<AuthEventType, string> = {
  initial_assessment_submitted: "Initial Assessment Submitted",
  initial_assessment_approved: "Initial Assessment Approved",
  initial_assessment_denied: "IA Denial",
  initial_treatment_submitted: "Initial Treatment Submitted",
  initial_treatment_approved: "Initial Treatment Approved",
  initial_treatment_denied: "IT Denial",
  ra_submitted: "RA Submitted",
  ra_approved: "RA Approved",
  ra_denied: "RA Denial",
  progress_report_submitted: "Progress Report Submitted",
  progress_report_approved: "Progress Report Approved",
  progress_report_denied: "PR Denial",
  services_paused_no_ra: "Services Paused — No RA",
  services_paused_late_pr: "Services Paused — PR Late/Missing",
};

/** Reasons offered when logging a late/missing progress-report pause. */
export const PR_PAUSE_REASONS = [
  "Progress report not started",
  "Progress report awaiting BCBA data",
  "Progress report submitted late",
  "Payor rejected progress report",
  "Other",
];

export function isAuthEventType(value: string): value is AuthEventType {
  return (AUTH_EVENT_TYPES as readonly string[]).includes(value);
}

export type AuthTrackerWeek = { weekStart: string } & Record<AuthEventType, number>;

export function blankTrackerWeek(week: string): AuthTrackerWeek {
  const row = { weekStart: week } as AuthTrackerWeek;
  for (const t of AUTH_EVENT_TYPES) row[t] = 0;
  return row;
}

/**
 * Aggregate logged events into weeks. `derivedPauses` carries pause events the
 * report computes from authorization coverage so they appear alongside the
 * manually logged ones without double-counting a client/week pair.
 */
export function computeAuthTrackerWeeks(
  events: AuthorizationWeeklyEventRow[],
  derivedPauses: { weekStart: string; clientKey: string }[] = [],
): AuthTrackerWeek[] {
  const weeks = new Map<string, AuthTrackerWeek>();
  const ensure = (week: string) => {
    if (!weeks.has(week)) weeks.set(week, blankTrackerWeek(week));
    return weeks.get(week)!;
  };

  const loggedNoRa = new Set<string>();
  for (const e of events) {
    const wk = weekStart(e.event_date);
    if (!wk) continue;
    const type = (e.event_type ?? "").trim();
    if (!isAuthEventType(type)) continue;
    ensure(wk)[type] += 1;
    if (type === "services_paused_no_ra") {
      loggedNoRa.add(`${wk}::${(e.client_name ?? e.client_cr_id ?? "").trim().toLowerCase()}`);
    }
  }

  for (const p of derivedPauses) {
    const key = `${p.weekStart}::${p.clientKey.trim().toLowerCase()}`;
    if (loggedNoRa.has(key)) continue;
    loggedNoRa.add(key);
    ensure(p.weekStart).services_paused_no_ra += 1;
  }

  return [...weeks.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export function totalTrackerCounts(weeks: AuthTrackerWeek[]): Record<AuthEventType, number> {
  const totals = {} as Record<AuthEventType, number>;
  for (const t of AUTH_EVENT_TYPES) totals[t] = 0;
  for (const w of weeks) for (const t of AUTH_EVENT_TYPES) totals[t] += w[t];
  return totals;
}
