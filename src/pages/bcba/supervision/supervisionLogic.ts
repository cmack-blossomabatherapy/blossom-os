/**
 * Pure functions for BCBA Supervision Center.
 *
 * IMPORTANT: Blossom OS tracks supervision operationally. It does NOT replace
 * required CentralReach or BACB documentation of record. Administrators can
 * mark fields as operational-only vs required documentation via the
 * bcba_supervision_config table.
 */

export type SupervisionStatus =
  | "on_track"
  | "plan_needed"
  | "due_soon"
  | "at_risk"
  | "completed"
  | "leadership_review";

export const STATUS_LABELS: Record<SupervisionStatus, string> = {
  on_track: "On track",
  plan_needed: "Plan needed",
  due_soon: "Due soon",
  at_risk: "At risk",
  completed: "Completed",
  leadership_review: "Leadership review",
};

export const STATUS_STYLES: Record<SupervisionStatus, string> = {
  on_track:          "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  completed:         "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  due_soon:          "bg-amber-500/10  text-amber-700  border-amber-500/20",
  plan_needed:       "bg-sky-500/10    text-sky-700    border-sky-500/20",
  at_risk:           "bg-red-500/10    text-red-700    border-red-500/20",
  leadership_review: "bg-purple-500/10 text-purple-700 border-purple-500/20",
};

export function monthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthBounds(d: Date = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end   = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { start, end };
}

/**
 * BACB uses a 5% supervision minimum of RBT service hours per month, with a
 * floor for very-low-hour caseloads. Administrators can override per-RBT via
 * rbt_client_assignments.supervision_plan (free-form) — the number below is a
 * safe operational default only.
 */
export function requiredSupervisionMinutes(monthServiceHours: number): number {
  const fivePercentMinutes = monthServiceHours * 0.05 * 60;
  return Math.max(60, Math.round(fivePercentMinutes));
}

export function daysLeftInMonth(now: Date = new Date()): number {
  const { end } = monthBounds(now);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
}

export interface StatusInput {
  requiredMinutes: number;
  completedMinutes: number;
  individualContacts: number;
  observationCompleted: boolean;
  lastSupervisionDaysAgo: number | null;
  hasSupervisionPlan: boolean;
  hasOpenLeadershipFlag: boolean;
  daysLeftInMonth: number;
}

export function computeStatus(i: StatusInput): SupervisionStatus {
  if (i.hasOpenLeadershipFlag) return "leadership_review";
  const pct = i.requiredMinutes === 0 ? 1 : i.completedMinutes / i.requiredMinutes;

  const meetsMinimum = pct >= 1 && i.individualContacts >= 1 && i.observationCompleted;
  if (meetsMinimum) return "completed";

  if (!i.hasSupervisionPlan) return "plan_needed";

  // At risk: month almost over and still under 60% complete
  if (i.daysLeftInMonth <= 5 && pct < 0.6) return "at_risk";
  if (i.daysLeftInMonth <= 10 && pct < 0.8) return "due_soon";
  if (i.lastSupervisionDaysAgo !== null && i.lastSupervisionDaysAgo > 14 && pct < 0.5) return "at_risk";

  return "on_track";
}

export type EscalationLevel =
  | "early_reminder"
  | "due_soon"
  | "rbt_notified"
  | "bcba_notified"
  | "leadership_visible"
  | "escalation_task";

/**
 * Given a status + days-left, return the highest escalation level that
 * should be open. Callers upsert into bcba_supervision_escalations.
 */
export function escalationLevelFor(
  status: SupervisionStatus,
  daysLeft: number,
): EscalationLevel | null {
  if (status === "completed") return null;
  if (status === "leadership_review") return "leadership_visible";
  if (status === "at_risk")            return daysLeft <= 2 ? "escalation_task" : "bcba_notified";
  if (status === "due_soon")           return "rbt_notified";
  if (status === "plan_needed")        return "due_soon";
  return "early_reminder";
}

/**
 * Required-field enforcement for the structured post-supervision record.
 * Administrators configure which fields are required documentation via
 * bcba_supervision_config.is_required_documentation.
 */
export interface RequiredFieldRule {
  field_key: string;
  label: string;
  is_required_documentation: boolean;
  is_operational_only: boolean;
}

export function missingRequiredFields(
  rules: RequiredFieldRule[],
  values: Record<string, unknown>,
): string[] {
  const missing: string[] = [];
  for (const r of rules) {
    if (!r.is_required_documentation) continue;
    const v = values[r.field_key];
    const empty =
      v === undefined || v === null || v === "" ||
      (Array.isArray(v) && v.length === 0);
    if (empty) missing.push(r.label);
  }
  return missing;
}