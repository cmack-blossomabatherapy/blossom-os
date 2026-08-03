/**
 * Authorization workflow event tracker.
 *
 * CentralReach authorization exports contain no submission dates, no denial
 * events, and no progress-report events. The Authorization team logs those
 * weekly in `authorization_weekly_events`; this module defines the canonical
 * event vocabulary and aggregates events into the weekly tracking matrix.
 */
import { weekStart } from "../format";
import type { AuthorizationWeeklyEventRow, CrAuthorizationRow } from "../types";
import { classifyAuthKind, classifyAuthStatus } from "./authorizationAnalysis";

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

/** Where a tracker cell's number came from. */
export type AuthTrackerCellSource = "logged" | "centralreach" | "derived" | "empty";

export interface AuthTrackerRow extends AuthTrackerWeek {
  sources: Record<AuthEventType, AuthTrackerCellSource>;
}

/**
 * Event types CentralReach authorization exports can support on their own.
 * Progress-report events and pause reasons are not in any CR export, so they
 * stay team-logged.
 */
export const CR_DERIVABLE_EVENT_TYPES = new Set<AuthEventType>([
  "initial_assessment_submitted",
  "initial_assessment_approved",
  "initial_assessment_denied",
  "initial_treatment_submitted",
  "initial_treatment_approved",
  "initial_treatment_denied",
  "ra_submitted",
  "ra_approved",
  "ra_denied",
]);

/** Event types that only exist once the Authorization team logs them. */
export const LOGGED_ONLY_EVENT_TYPES = AUTH_EVENT_TYPES.filter(
  (t) => !CR_DERIVABLE_EVENT_TYPES.has(t),
);

export function blankTrackerWeek(week: string): AuthTrackerWeek {
  const row = { weekStart: week } as AuthTrackerWeek;
  for (const t of AUTH_EVENT_TYPES) row[t] = 0;
  return row;
}

const KIND_PREFIX: Partial<Record<string, "initial_assessment" | "initial_treatment" | "ra">> = {
  initial_assessment: "initial_assessment",
  initial_treatment: "initial_treatment",
  reauthorization: "ra",
};

/** ISO week an authorization row belongs to (actual start date first). */
export function authorizationTrackerWeek(row: CrAuthorizationRow): string | null {
  return (
    weekStart(row.actual_start_date) ??
    weekStart(row.start_date) ??
    weekStart(row.followup_start_date) ??
    null
  );
}

/**
 * Derive IA / IT / RA submitted, approved, and denied counts straight from
 * normalized CentralReach authorization rows. Each row is classified into
 * exactly one work type, so a row carrying several labels is never double
 * counted.
 */
export function deriveTrackerWeeksFromAuthorizations(
  rows: CrAuthorizationRow[],
): AuthTrackerWeek[] {
  const weeks = new Map<string, AuthTrackerWeek>();
  for (const row of rows) {
    const wk = authorizationTrackerWeek(row);
    if (!wk) continue;
    const prefix = KIND_PREFIX[classifyAuthKind(row)];
    if (!prefix) continue;
    if (!weeks.has(wk)) weeks.set(wk, blankTrackerWeek(wk));
    const week = weeks.get(wk)!;
    week[`${prefix}_submitted` as AuthEventType] += 1;
    const status = classifyAuthStatus(row);
    if (status === "approved") week[`${prefix}_approved` as AuthEventType] += 1;
    if (status === "denied") week[`${prefix}_denied` as AuthEventType] += 1;
  }
  return [...weeks.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

/**
 * Aggregate logged events into weeks. `derivedPauses` carries pause events the
 * report computes from authorization coverage so they appear alongside the
 * manually logged ones without double-counting a client/week pair.
 */
export function computeAuthTrackerWeeks(
  events: AuthorizationWeeklyEventRow[],
  derivedPauses: { weekStart: string; clientKey: string }[] = [],
  centralReachWeeks: AuthTrackerWeek[] = [],
): AuthTrackerRow[] {
  const weeks = new Map<string, AuthTrackerRow>();
  const ensure = (week: string) => {
    if (!weeks.has(week)) {
      const sources = {} as Record<AuthEventType, AuthTrackerCellSource>;
      for (const t of AUTH_EVENT_TYPES) sources[t] = "empty";
      weeks.set(week, { ...blankTrackerWeek(week), sources });
    }
    return weeks.get(week)!;
  };

  // 1. CentralReach-derived baseline for the IA / IT / RA rows.
  for (const cr of centralReachWeeks) {
    const row = ensure(cr.weekStart);
    for (const t of AUTH_EVENT_TYPES) {
      if (!CR_DERIVABLE_EVENT_TYPES.has(t) || !cr[t]) continue;
      row[t] = cr[t];
      row.sources[t] = "centralreach";
    }
  }

  // 2. Logged events take precedence over the derived baseline for that cell.
  const loggedCounts = new Map<string, number>();
  const loggedNoRa = new Set<string>();
  for (const e of events) {
    const wk = weekStart(e.event_date);
    if (!wk) continue;
    const type = (e.event_type ?? "").trim();
    if (!isAuthEventType(type)) continue;
    const key = `${wk}::${type}`;
    const next = (loggedCounts.get(key) ?? 0) + 1;
    loggedCounts.set(key, next);
    const row = ensure(wk);
    row[type] = next;
    row.sources[type] = "logged";
    if (type === "services_paused_no_ra") {
      loggedNoRa.add(`${wk}::${(e.client_name ?? e.client_cr_id ?? "").trim().toLowerCase()}`);
    }
  }

  // 3. Derived coverage-gap pauses, merged without double counting a logged
  //    client/week pair.
  for (const p of derivedPauses) {
    const key = `${p.weekStart}::${p.clientKey.trim().toLowerCase()}`;
    if (loggedNoRa.has(key)) continue;
    loggedNoRa.add(key);
    const row = ensure(p.weekStart);
    row.services_paused_no_ra += 1;
    if (row.sources.services_paused_no_ra !== "logged") {
      row.sources.services_paused_no_ra = "derived";
    }
  }

  return [...weeks.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export function totalTrackerCounts(weeks: AuthTrackerWeek[]): Record<AuthEventType, number> {
  const totals = {} as Record<AuthEventType, number>;
  for (const t of AUTH_EVENT_TYPES) totals[t] = 0;
  for (const w of weeks) for (const t of AUTH_EVENT_TYPES) totals[t] += w[t];
  return totals;
}
