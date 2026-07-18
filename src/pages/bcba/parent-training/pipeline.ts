// Parent training + service utilization pipeline definitions.
// Keep in sync with CHECK constraints on bcba_parent_training_records
// and bcba_service_utilization.

export type ParentTrainingStatus =
  | "on_track"
  | "due_soon"
  | "overdue"
  | "repeated_cancellations"
  | "family_barrier"
  | "scheduling_help_needed"
  | "documentation_pending";

export const PT_STATUS_ORDER: ParentTrainingStatus[] = [
  "on_track",
  "due_soon",
  "overdue",
  "repeated_cancellations",
  "family_barrier",
  "scheduling_help_needed",
  "documentation_pending",
];

export const PT_STATUS_LABELS: Record<ParentTrainingStatus, string> = {
  on_track: "On track",
  due_soon: "Due soon",
  overdue: "Overdue",
  repeated_cancellations: "Repeated cancellations",
  family_barrier: "Family barrier",
  scheduling_help_needed: "Scheduling help needed",
  documentation_pending: "Documentation pending",
};

export const PT_STATUS_STYLES: Record<ParentTrainingStatus, string> = {
  on_track: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  due_soon: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
  overdue: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
  repeated_cancellations: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  family_barrier: "bg-muted text-foreground/80 border-border",
  scheduling_help_needed: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  documentation_pending: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900",
};

export const FREQUENCY_LABELS = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  quarterly: "Quarterly",
  custom: "Custom",
} as const;

export const SUPPORT_CATEGORIES = [
  { value: "schedule_followup", label: "Schedule follow-up" },
  { value: "family_barrier", label: "Report family barrier" },
  { value: "scheduling_support", label: "Request scheduling support" },
  { value: "outreach_complete", label: "Mark outreach complete" },
  { value: "centralreach_link", label: "Open CentralReach" },
  { value: "operational_note", label: "Add operational note" },
] as const;

// Service utilization
export type UtilizationTrend = "improving" | "steady" | "declining" | "volatile";
export type UtilizationRisk = "none" | "watch" | "elevated" | "critical";
export type CancellationPattern = "none" | "occasional" | "frequent" | "chronic";

export const TREND_LABELS: Record<UtilizationTrend, string> = {
  improving: "Improving",
  steady: "Steady",
  declining: "Declining",
  volatile: "Volatile",
};

export const RISK_LABELS: Record<UtilizationRisk, string> = {
  none: "Healthy",
  watch: "Watch",
  elevated: "Elevated",
  critical: "Critical",
};

export const RISK_STYLES: Record<UtilizationRisk, string> = {
  none: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  watch: "bg-muted text-foreground/80 border-border",
  elevated: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  critical: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
};

export const PATTERN_LABELS: Record<CancellationPattern, string> = {
  none: "None observed",
  occasional: "Occasional",
  frequent: "Frequent",
  chronic: "Chronic",
};

// Utilization percentage against authorization
export function utilizationPct(delivered: number, authorized: number): number {
  if (authorized <= 0) return 0;
  return Math.round((delivered / authorized) * 100);
}

// Explain contributing factors WITHOUT assigning blame.
// Returns short factual phrases the UI can render as chips.
export function explainUtilization(input: {
  risk: UtilizationRisk;
  staffingGapHours: number;
  familyPattern: CancellationPattern;
  providerPattern: CancellationPattern;
  factors?: string[] | null;
}): string[] {
  const notes: string[] = [];
  if (input.staffingGapHours > 0) {
    notes.push(`Staffing gap of ${input.staffingGapHours.toFixed(1)} hrs contributing`);
  }
  if (input.familyPattern !== "none") {
    notes.push(`${PATTERN_LABELS[input.familyPattern]} family cancellations observed`);
  }
  if (input.providerPattern !== "none") {
    notes.push(`${PATTERN_LABELS[input.providerPattern]} provider cancellations observed`);
  }
  if (input.factors?.length) notes.push(...input.factors);
  if (notes.length === 0 && input.risk !== "none") {
    notes.push("Contributing factors are still being reviewed");
  }
  return notes;
}

export const STALE_THRESHOLD_DAYS = 7;
export function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return null;
  return Math.round((Date.now() - t) / 86400000);
}
export function isStale(iso?: string | null): boolean {
  const d = daysSince(iso);
  return d !== null && d > STALE_THRESHOLD_DAYS;
}
export function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((t - today.getTime()) / 86400000);
}