import type { Client, ClientStage } from "@/data/clients";

export type LifecycleStageKey =
  | "assessment_complete"
  | "ready_for_auth"
  | "auth_submitted"
  | "auth_approved"
  | "ready_for_staffing"
  | "partially_staffed"
  | "fully_staffed"
  | "active"
  | "at_risk"
  | "discharge_pending";

export interface LifecycleStage {
  key: LifecycleStageKey;
  label: string;
  match: (c: Client) => boolean;
}

const inStages = (c: Client, stages: ClientStage[]) => stages.includes(c.stage);

export const LIFECYCLE_STAGES: LifecycleStage[] = [
  { key: "assessment_complete", label: "Assessment Completed",
    match: (c) => inStages(c, ["Assessment Completed", "Treatment Plan Pending", "In QA", "QA Review"]) },
  { key: "ready_for_auth", label: "Ready for Authorization",
    match: (c) => inStages(c, ["Treatment Auth – Awaiting Submission", "QA Approved", "Pending Treatment Auth"]) && c.authStatus === "Not Submitted" },
  { key: "auth_submitted", label: "Authorization Submitted",
    match: (c) => c.authStatus === "Submitted" || inStages(c, ["Treatment Auth – Submitted"]) },
  { key: "auth_approved", label: "Authorization Approved",
    match: (c) => c.authStatus === "Approved" && !inStages(c, ["Active", "Services on Pause", "Discharged", "Flaked"]) },
  { key: "ready_for_staffing", label: "Ready for Staffing",
    match: (c) => inStages(c, ["Staffing Needed", "Restaffing Needed", "Matching in Progress"]) },
  { key: "partially_staffed", label: "Partially Staffed",
    match: (c) => !!c.bcba && !c.rbt && !inStages(c, ["Active", "Discharged", "Services on Pause"]) },
  { key: "fully_staffed", label: "Fully Staffed",
    match: (c) => !!c.bcba && !!c.rbt && !inStages(c, ["Active", "Discharged", "Services on Pause", "Flaked"]) },
  { key: "active", label: "Active Services",
    match: (c) => c.stage === "Active" },
  { key: "at_risk", label: "At Risk",
    match: (c) => c.stage === "Flaked" || c.authStatus === "Expiring Soon" || c.authStatus === "Expired" || (c.activeAlerts?.length ?? 0) > 0 },
  { key: "discharge_pending", label: "Discharge Pending",
    match: (c) => c.stage === "Services on Pause" || c.stage === "Discharged" },
];

/* ─────────────── Operational blocker detection ─────────────── */

export type BlockerKey =
  | "no_bcba" | "no_rbt" | "staffing_needed" | "auth_expiring" | "auth_expired"
  | "auth_not_submitted" | "missing_consent" | "missing_payment_plan"
  | "no_start_date" | "assessment_overdue" | "pr_overdue" | "qa_pending";

export interface Blocker {
  key: BlockerKey;
  label: string;
  reason: string;
}

function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export function getBlockers(c: Client): Blocker[] {
  const out: Blocker[] = [];

  if (!c.bcba && c.stage !== "Discharged") {
    out.push({ key: "no_bcba", label: "No BCBA assigned", reason: `Stage: ${c.stage}` });
  }
  if (c.stage === "Staffing Needed" || c.stage === "Restaffing Needed") {
    out.push({ key: "staffing_needed", label: "Staffing needed", reason: `${c.daysInStage}d in staffing` });
  }
  if (c.bcba && !c.rbt && c.stage !== "BCBA Assignment" && c.stage !== "Active" && c.stage !== "Discharged") {
    out.push({ key: "no_rbt", label: "RBT needed", reason: "BCBA assigned but no RBT paired" });
  }
  if (c.consentRequired !== false && !c.consentComplete && (c.stage === "Waiting on Consent" || c.stage === "Waiting on Consent Forms")) {
    out.push({ key: "missing_consent", label: "Missing consent forms", reason: `${c.daysInStage}d waiting` });
  }
  if (c.paymentPlanRequired && !c.paymentPlanSigned) {
    out.push({ key: "missing_payment_plan", label: "Payment plan not signed", reason: "Required before services" });
  }
  if (c.authStatus === "Expiring Soon") {
    const exp = c.authorizations.find((a) => a.expirationDate)?.expirationDate ?? c.nextReauthDate ?? null;
    const d = daysUntil(exp);
    out.push({ key: "auth_expiring", label: "Auth expiring soon", reason: d != null ? `${d}d remaining` : "Renew now" });
  }
  if (c.authStatus === "Expired") {
    out.push({ key: "auth_expired", label: "Auth expired", reason: "Services paused without renewal" });
  }
  if (c.stage === "Treatment Auth – Awaiting Submission" && c.daysInStage >= 5) {
    out.push({ key: "auth_not_submitted", label: "Auth not submitted", reason: `${c.daysInStage}d awaiting submission` });
  }
  if ((c.stage === "Schedule Assessment" || c.stage === "Assessment Scheduled") && c.daysInStage >= 7) {
    out.push({ key: "assessment_overdue", label: "Assessment overdue", reason: `${c.daysInStage}d in stage` });
  }
  if (c.stage === "Pending Start Date" && !c.startDate) {
    out.push({ key: "no_start_date", label: "Start date missing", reason: `${c.daysInStage}d pending` });
  }
  if (c.stage === "Progress Report Needed" && c.daysInStage >= 3) {
    out.push({ key: "pr_overdue", label: "PR overdue", reason: `${c.daysInStage}d past due` });
  }
  if ((c.stage === "QA Review" || c.stage === "In QA") && c.daysInStage >= 5) {
    out.push({ key: "qa_pending", label: "QA review pending", reason: `${c.daysInStage}d in QA` });
  }

  return out;
}

export function primaryBlocker(c: Client): Blocker | null {
  return getBlockers(c)[0] ?? null;
}

export function getUrgency(c: Client): "low" | "medium" | "high" {
  const blockers = getBlockers(c);
  if (blockers.some((b) => b.key === "auth_expired" || b.key === "auth_expiring" || b.key === "pr_overdue" || b.key === "staffing_needed")) {
    return "high";
  }
  if (blockers.length > 0) return "medium";
  return "low";
}

export type HealthStatus =
  | "healthy" | "staffing_risk" | "auth_risk" | "clinical_risk" | "communication_risk";

export function getHealthStatus(c: Client): HealthStatus {
  if (c.authStatus === "Expired" || c.authStatus === "Expiring Soon") return "auth_risk";
  if (c.stage === "Staffing Needed" || c.stage === "Restaffing Needed" || (c.bcba && !c.rbt && c.stage !== "Active")) return "staffing_risk";
  if (c.qaStatus === "In Review" || c.stage === "QA Issues / Fix Required" || c.stage === "Progress Report Needed") return "clinical_risk";
  if (c.stage === "Flaked") return "communication_risk";
  return "healthy";
}

export const HEALTH_TONE: Record<HealthStatus, string> = {
  healthy: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  staffing_risk: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  auth_risk: "bg-destructive/10 text-destructive border-destructive/20",
  clinical_risk: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  communication_risk: "bg-sky-500/10 text-sky-600 border-sky-500/20",
};

export const HEALTH_LABEL: Record<HealthStatus, string> = {
  healthy: "Operationally Healthy",
  staffing_risk: "Staffing Risk",
  auth_risk: "Auth Risk",
  clinical_risk: "Clinical Risk",
  communication_risk: "Communication Risk",
};