/**
 * Case-health computation for the BCBA Caseload Command Center.
 *
 * Every health status is derived from explicit, listable REASONS. There is
 * no mysterious single score — the UI can (and must) surface the reasons.
 */

export type CaseHealthStatus =
  | "on_track"
  | "needs_attention"
  | "authorization_risk"
  | "staffing_risk"
  | "underutilized"
  | "progress_report_due"
  | "parent_training_overdue"
  | "documentation_issue"
  | "family_engagement_concern"
  | "on_hold"
  | "discharge_pending";

export const HEALTH_LABEL: Record<CaseHealthStatus, string> = {
  on_track:                  "On track",
  needs_attention:           "Needs attention",
  authorization_risk:        "Authorization risk",
  staffing_risk:             "Staffing risk",
  underutilized:             "Underutilized",
  progress_report_due:       "Progress report due",
  parent_training_overdue:   "Parent training overdue",
  documentation_issue:       "Documentation issue",
  family_engagement_concern: "Family engagement concern",
  on_hold:                   "On hold",
  discharge_pending:         "Discharge pending",
};

export const HEALTH_TONE: Record<CaseHealthStatus, string> = {
  on_track:                  "bg-emerald-100 text-emerald-800 border-emerald-200",
  needs_attention:           "bg-amber-100 text-amber-800 border-amber-200",
  authorization_risk:        "bg-orange-100 text-orange-800 border-orange-200",
  staffing_risk:             "bg-orange-100 text-orange-800 border-orange-200",
  underutilized:             "bg-blue-100 text-blue-800 border-blue-200",
  progress_report_due:       "bg-amber-100 text-amber-800 border-amber-200",
  parent_training_overdue:   "bg-amber-100 text-amber-800 border-amber-200",
  documentation_issue:       "bg-red-100 text-red-800 border-red-200",
  family_engagement_concern: "bg-amber-100 text-amber-800 border-amber-200",
  on_hold:                   "bg-muted text-muted-foreground border-border",
  discharge_pending:         "bg-muted text-muted-foreground border-border",
};

/** Priority order — first match wins as the "primary" status. */
const STATUS_PRIORITY: CaseHealthStatus[] = [
  "on_hold",
  "discharge_pending",
  "authorization_risk",
  "documentation_issue",
  "staffing_risk",
  "progress_report_due",
  "parent_training_overdue",
  "family_engagement_concern",
  "underutilized",
  "needs_attention",
  "on_track",
];

export interface CaseHealthInput {
  serviceStatus?: string | null;
  authExpiresAt?: string | null;
  usedUnits?: number | null;
  authorizedUnits?: number | null;
  scheduledWeeklyHours?: number | null;
  deliveredWeeklyHours?: number | null;
  staffingStatus?: string | null;
  progressReportDueAt?: string | null;
  parentTrainingNextDueAt?: string | null;
  documentationCompliance?: string | null;
  openSupportConcerns?: number;
  cancelledLast4wk?: number;
  sourceStale?: boolean;
}

export interface CaseHealth {
  primary: CaseHealthStatus;
  reasons: { code: CaseHealthStatus; label: string; detail?: string }[];
  stale: boolean;
}

function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  return Math.floor((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function computeCaseHealth(input: CaseHealthInput): CaseHealth {
  const reasons: CaseHealth["reasons"] = [];

  const svc = (input.serviceStatus ?? "").toLowerCase();
  if (svc.includes("hold")) reasons.push({ code: "on_hold", label: HEALTH_LABEL.on_hold, detail: input.serviceStatus ?? undefined });
  if (svc.includes("discharge")) reasons.push({ code: "discharge_pending", label: HEALTH_LABEL.discharge_pending });

  const authDays = daysUntil(input.authExpiresAt);
  if (authDays !== null && authDays <= 30) {
    reasons.push({
      code: "authorization_risk",
      label: HEALTH_LABEL.authorization_risk,
      detail: authDays < 0 ? `expired ${Math.abs(authDays)}d ago` : `expires in ${authDays}d`,
    });
  }

  if ((input.authorizedUnits ?? 0) > 0) {
    const util = ((input.usedUnits ?? 0) / (input.authorizedUnits ?? 1)) * 100;
    if (util > 95) {
      reasons.push({ code: "authorization_risk", label: "Auth exhausted", detail: `${Math.round(util)}% used` });
    }
  }

  const scheduled = input.scheduledWeeklyHours ?? 0;
  const delivered = input.deliveredWeeklyHours ?? 0;
  if (scheduled > 0 && delivered / scheduled < 0.7) {
    reasons.push({
      code: "underutilized",
      label: HEALTH_LABEL.underutilized,
      detail: `${delivered.toFixed(1)}h of ${scheduled.toFixed(1)}h`,
    });
  }

  const staff = (input.staffingStatus ?? "").toLowerCase();
  if (staff.includes("unstaffed") || staff.includes("gap") || staff.includes("partial")) {
    reasons.push({ code: "staffing_risk", label: HEALTH_LABEL.staffing_risk, detail: input.staffingStatus ?? undefined });
  }

  const prDays = daysUntil(input.progressReportDueAt);
  if (prDays !== null && prDays <= 14) {
    reasons.push({
      code: "progress_report_due",
      label: HEALTH_LABEL.progress_report_due,
      detail: prDays < 0 ? `${Math.abs(prDays)}d overdue` : `due in ${prDays}d`,
    });
  }

  const ptDays = daysUntil(input.parentTrainingNextDueAt);
  if (ptDays !== null && ptDays < 0) {
    reasons.push({
      code: "parent_training_overdue",
      label: HEALTH_LABEL.parent_training_overdue,
      detail: `${Math.abs(ptDays)}d overdue`,
    });
  }

  const doc = (input.documentationCompliance ?? "").toLowerCase();
  if (doc && !doc.includes("compliant") && !doc.includes("on time") && doc !== "ok") {
    reasons.push({ code: "documentation_issue", label: HEALTH_LABEL.documentation_issue, detail: input.documentationCompliance ?? undefined });
  }

  if ((input.openSupportConcerns ?? 0) > 0) {
    reasons.push({
      code: "family_engagement_concern",
      label: "Open concerns",
      detail: `${input.openSupportConcerns} open`,
    });
  }

  if ((input.cancelledLast4wk ?? 0) >= 3) {
    reasons.push({
      code: "family_engagement_concern",
      label: HEALTH_LABEL.family_engagement_concern,
      detail: `${input.cancelledLast4wk} cancellations last 4wk`,
    });
  }

  const primary = STATUS_PRIORITY.find((s) => reasons.some((r) => r.code === s)) ?? "on_track";

  if (primary === "on_track" && reasons.length === 0) {
    reasons.push({ code: "on_track", label: HEALTH_LABEL.on_track });
  }

  return {
    primary,
    reasons,
    stale: !!input.sourceStale,
  };
}