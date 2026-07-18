export type CapacityStatus =
  | "available"
  | "approaching_capacity"
  | "at_capacity"
  | "over_capacity"
  | "review_required";

export const CAPACITY_LABELS: Record<CapacityStatus, string> = {
  available: "Available",
  approaching_capacity: "Approaching capacity",
  at_capacity: "At capacity",
  over_capacity: "Over capacity",
  review_required: "Review required",
};

export const CAPACITY_STYLES: Record<CapacityStatus, string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  approaching_capacity: "bg-amber-50 text-amber-700 border-amber-200",
  at_capacity: "bg-orange-50 text-orange-700 border-orange-200",
  over_capacity: "bg-rose-50 text-rose-700 border-rose-200",
  review_required: "bg-violet-50 text-violet-700 border-violet-200",
};

export const CAPACITY_ORDER: CapacityStatus[] = [
  "available",
  "approaching_capacity",
  "at_capacity",
  "over_capacity",
  "review_required",
];

export type MetricKey =
  | "caseload_size"
  | "assigned_rbt_count"
  | "clinical_hours"
  | "billable_hours"
  | "assessment_hours"
  | "parent_training_hours"
  | "supervision_hours"
  | "progress_reports"
  | "treatment_plans"
  | "documentation_on_time_pct"
  | "qa_return_rate_pct"
  | "service_utilization_pct"
  | "open_risks"
  | "cancelled_appointments"
  | "mtd_target_hours"
  | "mtd_actual_hours"
  | "forecast_hours";

export interface MetricDefinition {
  key: MetricKey;
  label: string;
  definition: string;
  source: string;
  cadence: string;
  bcbaControlled: boolean;
}

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  { key: "caseload_size", label: "Caseload size", definition: "Number of active clients currently assigned to you.", source: "CentralReach assignments", cadence: "Daily sync", bcbaControlled: false },
  { key: "assigned_rbt_count", label: "Assigned RBTs", definition: "RBTs paired to at least one client on your caseload.", source: "CentralReach + Blossom staffing", cadence: "Daily sync", bcbaControlled: false },
  { key: "clinical_hours", label: "Clinical hours", definition: "All clinical time delivered across supervision, assessment, and direct services.", source: "CentralReach billable data", cadence: "Nightly", bcbaControlled: true },
  { key: "billable_hours", label: "Billable hours", definition: "Hours captured with a billable service code.", source: "CentralReach billable data", cadence: "Nightly", bcbaControlled: true },
  { key: "assessment_hours", label: "Assessment hours", definition: "Hours captured under assessment service codes.", source: "CentralReach billable data", cadence: "Nightly", bcbaControlled: true },
  { key: "parent_training_hours", label: "Parent training", definition: "Delivered parent training hours in the current period.", source: "CentralReach billable data", cadence: "Nightly", bcbaControlled: true },
  { key: "supervision_hours", label: "Supervision", definition: "Direct RBT supervision hours logged.", source: "CentralReach + supervision logs", cadence: "Nightly", bcbaControlled: true },
  { key: "progress_reports", label: "Progress reports", definition: "On-time vs late progress reports in the current period.", source: "Blossom PR tracker", cadence: "Real-time", bcbaControlled: true },
  { key: "treatment_plans", label: "Treatment plans", definition: "Open plans and any currently returned by QA for correction.", source: "Blossom TP tracker", cadence: "Real-time", bcbaControlled: true },
  { key: "documentation_on_time_pct", label: "Documentation timeliness", definition: "% of session notes closed within the required window.", source: "CentralReach notes", cadence: "Nightly", bcbaControlled: true },
  { key: "qa_return_rate_pct", label: "QA return rate", definition: "% of submissions returned by QA for correction.", source: "Blossom QA reviews", cadence: "Real-time", bcbaControlled: true },
  { key: "service_utilization_pct", label: "Service utilization", definition: "Delivered ÷ authorized hours across your caseload.", source: "CentralReach auths + delivered", cadence: "Nightly", bcbaControlled: false },
  { key: "open_risks", label: "Open risks", definition: "Active clinical or operational risks flagged on your caseload.", source: "Blossom risk registry", cadence: "Real-time", bcbaControlled: false },
  { key: "cancelled_appointments", label: "Cancellations", definition: "Cancelled appointments in the current period, broken down by cause.", source: "CentralReach cancellations", cadence: "Nightly", bcbaControlled: false },
  { key: "mtd_target_hours", label: "Month-to-date target", definition: "Expected hours by today based on your monthly target.", source: "Blossom capacity model", cadence: "Daily", bcbaControlled: false },
  { key: "mtd_actual_hours", label: "Month-to-date actual", definition: "Hours delivered so far this month.", source: "CentralReach billable data", cadence: "Nightly", bcbaControlled: true },
  { key: "forecast_hours", label: "Month forecast", definition: "Projected end-of-month hours based on current pace and schedule.", source: "Blossom forecast model", cadence: "Daily", bcbaControlled: false },
];

export function findDefinition(key: string): MetricDefinition | undefined {
  return METRIC_DEFINITIONS.find((m) => m.key === key);
}

export interface ProductivitySnapshot {
  id: string;
  bcba_id: string;
  bcba_name: string | null;
  state: string | null;
  period_start: string;
  period_end: string;
  caseload_size: number;
  assigned_rbt_count: number;
  clinical_hours: number;
  billable_hours: number;
  assessment_hours: number;
  parent_training_hours: number;
  supervision_hours: number;
  progress_reports_on_time: number;
  progress_reports_late: number;
  progress_reports_upcoming: number;
  treatment_plans_open: number;
  treatment_plans_qa_returned: number;
  documentation_on_time_pct: number;
  qa_return_rate_pct: number;
  service_utilization_pct: number;
  open_risks: number;
  cancelled_appointments: number;
  cancelled_hours_family: number;
  cancelled_hours_provider: number;
  cancelled_hours_other: number;
  mtd_target_hours: number;
  mtd_actual_hours: number;
  forecast_hours: number;
  source_dates: Record<string, string>;
  notes: any[];
  updated_at: string;
}

export interface CapacitySnapshot {
  id: string;
  bcba_id: string;
  bcba_name: string | null;
  state: string | null;
  period_start: string;
  period_end: string;
  active_clients: number;
  active_rbts: number;
  supervision_load_hours: number;
  new_assessments: number;
  reports_due: number;
  parent_training_workload: number;
  projected_service_hours: number;
  open_staffing_gap_hours: number;
  scheduled_hours: number;
  upcoming_leave_days: number;
  open_qa_corrections: number;
  capacity_status: CapacityStatus;
  reasoning: string[];
  source_dates: Record<string, string>;
  updated_at: string;
}

/**
 * Build calm, explanatory sentences instead of one opaque percentage.
 * Every clause identifies its source, so BCBAs see WHY numbers moved.
 */
export function buildProductivityExplanations(s: ProductivitySnapshot): string[] {
  const out: string[] = [];
  const gap = Number(s.mtd_target_hours) - Number(s.mtd_actual_hours);
  if (gap > 0.5) {
    out.push(`You are ${gap.toFixed(1)} hours below your month-to-date target.`);
  } else if (gap < -0.5) {
    out.push(`You are ${Math.abs(gap).toFixed(1)} hours ahead of your month-to-date target.`);
  } else {
    out.push("You are on pace with your month-to-date target.");
  }

  const cancelHrs = Number(s.cancelled_hours_family) + Number(s.cancelled_hours_provider) + Number(s.cancelled_hours_other);
  if (s.cancelled_appointments > 0) {
    out.push(
      `${s.cancelled_appointments} cancelled appointment${s.cancelled_appointments === 1 ? "" : "s"} account for ${cancelHrs.toFixed(1)} of those hours.`
    );
  }

  if (s.progress_reports_late > 0) {
    out.push(`${s.progress_reports_late} progress report${s.progress_reports_late === 1 ? " is" : "s are"} currently late.`);
  } else {
    out.push("Your progress reports are currently on time.");
  }

  if (s.treatment_plans_qa_returned > 0) {
    out.push(`${s.treatment_plans_qa_returned} treatment plan${s.treatment_plans_qa_returned === 1 ? "" : "s"} awaiting your correction after QA review.`);
  }

  if (Number(s.documentation_on_time_pct) < 90) {
    out.push(`Documentation timeliness is ${Number(s.documentation_on_time_pct).toFixed(0)}% — target is 90%.`);
  }

  return out;
}

export function capacityExplanations(c: CapacitySnapshot): string[] {
  const notes = [...(c.reasoning || [])];
  if (c.open_staffing_gap_hours > 0) {
    notes.push(`${c.open_staffing_gap_hours.toFixed(1)} hours of open staffing gaps affect projected service delivery.`);
  }
  if (c.open_qa_corrections > 0) {
    notes.push(`${c.open_qa_corrections} open QA correction${c.open_qa_corrections === 1 ? "" : "s"} require your time this period.`);
  }
  if (c.upcoming_leave_days > 0) {
    notes.push(`${c.upcoming_leave_days} day${c.upcoming_leave_days === 1 ? "" : "s"} of upcoming leave were factored into this view.`);
  }
  return notes;
}

export function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return "—"; }
}

export function fmtHours(n: number | null | undefined) {
  const v = Number(n ?? 0);
  return `${v.toFixed(1)} h`;
}