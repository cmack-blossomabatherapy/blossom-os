// Progress report + authorization readiness pipeline definitions.
// Keep in sync with the CHECK constraints on public.bcba_progress_reports.

export type ProgressReportStatus =
  | "upcoming"
  | "not_started"
  | "in_progress"
  | "parent_input_needed"
  | "parent_signature_needed"
  | "submitted"
  | "qa_review"
  | "changes_requested"
  | "ready"
  | "sent_to_authorization"
  | "authorization_submitted"
  | "approved"
  | "delayed"
  | "at_risk";

export const REPORT_STATUS_ORDER: ProgressReportStatus[] = [
  "upcoming",
  "not_started",
  "in_progress",
  "parent_input_needed",
  "parent_signature_needed",
  "submitted",
  "qa_review",
  "changes_requested",
  "ready",
  "sent_to_authorization",
  "authorization_submitted",
  "approved",
  "delayed",
  "at_risk",
];

export const REPORT_STATUS_LABELS: Record<ProgressReportStatus, string> = {
  upcoming: "Upcoming",
  not_started: "Not started",
  in_progress: "In progress",
  parent_input_needed: "Parent input needed",
  parent_signature_needed: "Parent signature needed",
  submitted: "Submitted",
  qa_review: "QA review",
  changes_requested: "Changes requested",
  ready: "Ready",
  sent_to_authorization: "Sent to authorization",
  authorization_submitted: "Authorization submitted",
  approved: "Approved",
  delayed: "Delayed",
  at_risk: "At risk",
};

export const REPORT_STATUS_STYLES: Record<ProgressReportStatus, string> = {
  upcoming: "bg-muted text-foreground/80 border-border",
  not_started: "bg-muted text-foreground/80 border-border",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
  parent_input_needed: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  parent_signature_needed: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  submitted: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900",
  qa_review: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900",
  changes_requested: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
  ready: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900",
  sent_to_authorization: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900",
  authorization_submitted: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  delayed: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900",
  at_risk: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900",
};

export type RiskLevel = "none" | "watch" | "elevated" | "critical";
export const RISK_LABELS: Record<RiskLevel, string> = {
  none: "Healthy",
  watch: "Watch",
  elevated: "Elevated",
  critical: "Critical",
};
export const RISK_STYLES: Record<RiskLevel, string> = {
  none: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  watch: "bg-muted text-foreground/80 border-border",
  elevated: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  critical: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
};

export const PARENT_INPUT_LABELS = {
  not_needed: "Not needed",
  requested: "Requested",
  received: "Received",
} as const;

export const PARENT_SIG_LABELS = {
  not_needed: "Not needed",
  requested: "Requested",
  received: "Received",
} as const;

export const QA_LABELS = {
  not_started: "Not started",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
} as const;

export const SUBMISSION_LABELS = {
  not_submitted: "Not submitted",
  submitted: "Submitted",
  resubmitted: "Resubmitted",
  accepted: "Accepted",
  rejected: "Rejected",
} as const;

export const AUTH_STATUS_LABELS = {
  pending: "Pending",
  submitted: "Submitted",
  approved: "Approved",
  denied: "Denied",
  expired: "Expired",
} as const;

export const SUPPORT_CATEGORIES = [
  { value: "authorization_help",       label: "Request authorization help" },
  { value: "parent_signature_barrier", label: "Report parent-signature barrier" },
  { value: "scheduling_barrier",       label: "Report scheduling barrier" },
  { value: "qa_clarification",         label: "Request QA clarification" },
  { value: "centralreach_link",        label: "Open CentralReach" },
  { value: "status_update",            label: "Update report status" },
] as const;

export function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((t - today.getTime()) / 86400000);
}

export function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return null;
  return Math.round((Date.now() - t) / 86400000);
}

// Calm, non-threatening due-date language for BCBA-facing messaging.
export function dueDateLanguage(daysRemaining: number | null): string {
  if (daysRemaining === null) return "No due date set";
  if (daysRemaining < 0)      return `Overdue by ${Math.abs(daysRemaining)} days — we can help`;
  if (daysRemaining === 0)    return "Due today";
  if (daysRemaining === 1)    return "Due tomorrow";
  if (daysRemaining <= 7)     return `Due in ${daysRemaining} days`;
  if (daysRemaining <= 21)    return `Due in ${daysRemaining} days`;
  if (daysRemaining <= 63)    return `Due in ${Math.round(daysRemaining / 7)} weeks`;
  return `Due in about ${Math.round(daysRemaining / 7)} weeks`;
}

// Considered "stale" when CentralReach source data hasn't refreshed in >7 days.
export const STALE_THRESHOLD_DAYS = 7;
export function isStale(iso?: string | null): boolean {
  const d = daysSince(iso);
  return d !== null && d > STALE_THRESHOLD_DAYS;
}