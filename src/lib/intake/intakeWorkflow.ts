/**
 * Sprint 08 — shared intake workflow model.
 *
 * Pure helpers used by the intake pages, LeadActionPanel, and the Patient
 * Lifetime Journey to keep stage transitions, risk detection, missing-info
 * flags, and escalation reasons consistent across the operating layer.
 *
 * No Supabase calls live here — these helpers are deliberately pure so they
 * can be unit-tested and reused from any UI surface.
 */
import type { Lead, LeadStatus } from "@/data/leads";

/**
 * Export 86 — legacy Monday-era intake stages. Kept exported so older code,
 * inbound payloads, and historical records continue to deserialize. NOT the
 * primary forward-path for the operational pipeline.
 */
export const LEGACY_INTAKE_STAGES = [
  "New Lead",
  "In Contact",
  "Sent Form",
  "Missing Information",
  "Form Received",
  "Sent to VOB",
  "VOB Completed",
  "Can Not Submit Auth",
  "Getting DX",
  "Needs DX",
  "Can't Reach",
  "Sent Packet - Can't Reach",
  "Non-Qualified",
] as const;

export type LegacyIntakeStage = (typeof LEGACY_INTAKE_STAGES)[number];

// Re-exported below after FAMILY_LEAD_PIPELINE_STAGES is declared so the
// canonical 13-stage pipeline is the primary `INTAKE_STAGES` export.

/* -------------------------------------------------------------------------- */
/* Export 78 — Canonical Pipelines                                            */
/* -------------------------------------------------------------------------- */
/**
 * Canonical Family / Lead Workflow — the 13-stage operational pipeline from
 * lead capture through ready-to-start services. Owned across Intake, VOB,
 * Scheduling, Clinical/BCBA, QA, Authorizations, and Staffing.
 *
 * This is the user-facing pipeline. Legacy Monday-style LeadStatus values
 * still exist on records and are mapped via `canonicalFamilyLeadStage`.
 */
export const FAMILY_LEAD_PIPELINE_STAGES = [
  "Lead Captured",
  "First Contact Attempt",
  "Engagement Track",
  "Qualification",
  "Intake Packet Sent",
  "Intake Packet Follow Up",
  "Intake Complete",
  "Benefits Verification",
  "Assessment Scheduling",
  "QA / Treatment Plan Authorization",
  "Authorization Pending",
  "Staffing Match",
  "Ready to Start Services",
] as const;

export type FamilyLeadPipelineStage = (typeof FAMILY_LEAD_PIPELINE_STAGES)[number];

/**
 * Export 86 — canonical Family / Lead pipeline is now the primary
 * `INTAKE_STAGES` value. Old Monday-era values are preserved in
 * `LEGACY_INTAKE_STAGES` for back-compat reads only.
 */
export const INTAKE_STAGES = FAMILY_LEAD_PIPELINE_STAGES;
export type IntakeStage = FamilyLeadPipelineStage;

/**
 * Canonical Referral Partner Workflow — relationship pipeline owned by
 * Marketing / Business Development. This is intentionally separate from the
 * family lead workflow above.
 */
export const REFERRAL_PARTNER_PIPELINE_STAGES = [
  "Referral Submitted",
  "Family Contacted",
  "Assessment Scheduled",
  "Authorization Pending",
  "Services Started",
  "Referral Partner Success Update",
  "Marketing Nurture",
] as const;

export type ReferralPartnerPipelineStage = (typeof REFERRAL_PARTNER_PIPELINE_STAGES)[number];

/**
 * Map legacy / Monday-era LeadStatus values to the canonical Family / Lead
 * pipeline stage. Unknown values fall back to "Lead Captured" so nothing
 * disappears from the pipeline view.
 */
const LEGACY_FAMILY_LEAD_ALIASES: Record<string, FamilyLeadPipelineStage> = {
  "New Lead": "Lead Captured",
  "Lead Captured": "Lead Captured",
  "In Contact": "First Contact Attempt",
  "First Contact Attempt": "First Contact Attempt",
  "Can't Reach": "Engagement Track",
  "Sent Packet - Can't Reach": "Engagement Track",
  "Engagement Track": "Engagement Track",
  "Non-Qualified": "Qualification",
  "Non-qualified Lead": "Qualification",
  "Needs DX": "Qualification",
  "Getting DX": "Qualification",
  "Qualification": "Qualification",
  "Sent Form": "Intake Packet Sent",
  "Intake Packet Sent": "Intake Packet Sent",
  "Missing Information": "Intake Packet Follow Up",
  "Intake Packet Follow Up": "Intake Packet Follow Up",
  "Form Received": "Intake Complete",
  "Intake Complete": "Intake Complete",
  "Sent to VOB": "Benefits Verification",
  "Benefits Verification": "Benefits Verification",
  "VOB Completed": "Assessment Scheduling",
  "Schedule Assessment": "Assessment Scheduling",
  "Assessment Scheduled": "Assessment Scheduling",
  "Assessment Scheduling": "Assessment Scheduling",
  "QA Review": "QA / Treatment Plan Authorization",
  "Can Not Submit Auth": "QA / Treatment Plan Authorization",
  "QA / Treatment Plan Authorization": "QA / Treatment Plan Authorization",
  "Authorization Pending": "Authorization Pending",
  "Staffing Needed": "Staffing Match",
  "Staffing Match": "Staffing Match",
  "Ready for Start": "Ready to Start Services",
  "Pending Start": "Ready to Start Services",
  "Ready to Start Services": "Ready to Start Services",
};

export function canonicalFamilyLeadStage(
  stage: string | null | undefined,
): FamilyLeadPipelineStage {
  if (!stage) return "Lead Captured";
  return LEGACY_FAMILY_LEAD_ALIASES[stage] ?? "Lead Captured";
}

/**
 * Export 79 — canonical forward/back movement through the 13-stage Family /
 * Lead Workflow. Operates on canonical stages after aliasing legacy statuses
 * so a lead in "VOB Completed" (legacy) advances to "QA / Treatment Plan
 * Authorization" (canonical next of Assessment Scheduling).
 */
export function getNextFamilyLeadStage(
  stage: string | null | undefined,
): FamilyLeadPipelineStage | null {
  const canonical = canonicalFamilyLeadStage(stage);
  const idx = FAMILY_LEAD_PIPELINE_STAGES.indexOf(canonical);
  if (idx < 0 || idx >= FAMILY_LEAD_PIPELINE_STAGES.length - 1) return null;
  return FAMILY_LEAD_PIPELINE_STAGES[idx + 1];
}

export function getPreviousFamilyLeadStage(
  stage: string | null | undefined,
): FamilyLeadPipelineStage | null {
  const canonical = canonicalFamilyLeadStage(stage);
  const idx = FAMILY_LEAD_PIPELINE_STAGES.indexOf(canonical);
  if (idx <= 0) return null;
  return FAMILY_LEAD_PIPELINE_STAGES[idx - 1];
}

/**
 * True only for the canonical end-of-pipeline stage (or legacy aliases that
 * map to it, such as "Ready for Start" / "Pending Start"). VOB Completed
 * (legacy) maps to Assessment Scheduling — NOT ready-to-start.
 */
export function isReadyToStartStage(stage: string | null | undefined): boolean {
  if (!stage) return false;
  // Only true for explicit canonical "Ready to Start Services" or its known
  // legacy aliases. VOB Completed maps to Assessment Scheduling and must NOT
  // be treated as ready-to-start.
  return LEGACY_FAMILY_LEAD_ALIASES[stage] === "Ready to Start Services";
}

/**
 * Export 88 — outcome statuses that sit OUTSIDE the canonical pipeline.
 * These are surfaced as their own lanes (Not Qualified, Cannot Reach) and
 * must be excluded from "open pipeline" math and follow-up queues.
 */
const NON_QUALIFIED_STATUSES: ReadonlySet<string> = new Set([
  "Non-Qualified",
  "Non-qualified Lead",
  "Disqualified",
]);
const CANNOT_REACH_STATUSES: ReadonlySet<string> = new Set([
  "Can't Reach",
  "Cannot Reach",
  "Sent Packet - Can't Reach",
]);

/** True for any lead status that represents a non-qualified outcome. */
export function isNonQualifiedStatus(status: string | null | undefined): boolean {
  return !!status && NON_QUALIFIED_STATUSES.has(status);
}

/** True for any lead status that represents a cannot-reach final outcome. */
export function isCannotReachStatus(status: string | null | undefined): boolean {
  return !!status && CANNOT_REACH_STATUSES.has(status);
}

/**
 * Convenience for the Intake UI — true when a lead's status is any
 * non-canonical outcome (non-qualified or cannot-reach). These leads should
 * not appear in "open pipeline" follow-up math.
 */
export function isLeadOutOfPipeline(status: string | null | undefined): boolean {
  return isNonQualifiedStatus(status) || isCannotReachStatus(status) || isReadyToStartStage(status);
}

/**
 * True when the lead's form review explicitly flags missing information.
 * Tolerates both legacy "Missing Information" and the canonical
 * "Missing Info" label so reports/filters stay accurate during migration.
 */
export function hasMissingFormReview(lead: { formReviewStatus?: string | null }): boolean {
  const s = (lead.formReviewStatus ?? "").toLowerCase();
  return s === "missing info" || s === "missing information";
}

/**
 * Primary department owner per canonical Family / Lead Workflow stage. Used
 * by the pipeline UI to make handoffs obvious — no automation attached.
 */
export const FAMILY_LEAD_STAGE_OWNERS: Record<FamilyLeadPipelineStage, string> = {
  "Lead Captured": "Marketing / Intake",
  "First Contact Attempt": "Intake",
  "Engagement Track": "Intake",
  "Qualification": "Intake",
  "Intake Packet Sent": "Intake",
  "Intake Packet Follow Up": "Intake",
  "Intake Complete": "Intake",
  "Benefits Verification": "VOB / Benefits",
  "Assessment Scheduling": "Scheduling",
  "QA / Treatment Plan Authorization": "Clinical / QA",
  "Authorization Pending": "Authorizations",
  "Staffing Match": "Staffing",
  "Ready to Start Services": "Scheduling / Operations",
};

/**
 * Recommended "next action" copy per canonical Family / Lead pipeline stage.
 * Used by the New Lead dialog and any other surface that needs to suggest a
 * sensible default next step when the user changes pipeline stage. These are
 * intentionally short and operationally specific.
 */
export const FAMILY_LEAD_STAGE_NEXT_ACTIONS: Record<FamilyLeadPipelineStage, string> = {
  "Lead Captured": "Log first contact attempt",
  "First Contact Attempt": "Call parent and confirm interest",
  "Engagement Track": "Schedule another contact attempt",
  "Qualification": "Confirm diagnosis path & insurance",
  "Intake Packet Sent": "Follow up on intake packet",
  "Intake Packet Follow Up": "Collect missing information",
  "Intake Complete": "Submit to Benefits Verification",
  "Benefits Verification": "Check benefits verification status",
  "Assessment Scheduling": "Schedule assessment with BCBA",
  "QA / Treatment Plan Authorization": "Submit treatment plan for QA",
  "Authorization Pending": "Monitor payer authorization",
  "Staffing Match": "Assign RBT and confirm availability",
  "Ready to Start Services": "Confirm start date with family",
};

/**
 * Convenience: get the recommended next action for any stage value (legacy or
 * canonical). Always returns a non-empty string.
 */
export function getRecommendedNextActionForStage(stage: string | null | undefined): string {
  const canonical = canonicalFamilyLeadStage(stage);
  return FAMILY_LEAD_STAGE_NEXT_ACTIONS[canonical] ?? "Review lead";
}

/** Days-from-today SLA for the given stage (canonical or legacy). */
export function getStageDueOffsetDays(stage: string | null | undefined): number {
  return getStageSlaDays(canonicalFamilyLeadStage(stage));
}

/**
 * Export 86 — canonical 13-stage Family / Lead pipeline is the operational
 * happy-path. Legacy Monday-era statuses are aliased through
 * `canonicalFamilyLeadStage` before walking the path.
 */
const FORWARD_PATH: readonly FamilyLeadPipelineStage[] = FAMILY_LEAD_PIPELINE_STAGES;

const BLOCKED_STAGES = new Set<string>([
  // Canonical
  "Intake Packet Follow Up",
  "Engagement Track",
  "Qualification",
  // Legacy aliases preserved for old records
  "Missing Information",
  "Can't Reach",
  "Sent Packet - Can't Reach",
  "Can Not Submit Auth",
  "Needs DX",
  "Getting DX",
]);

/**
 * "Converted" now means the canonical terminal stage. VOB Completed is NOT
 * converted — it maps to Assessment Scheduling further down the pipeline.
 */
const CONVERTED_STAGES = new Set<string>([
  "Ready to Start Services",
  "Ready for Start",
  "Pending Start",
]);

const VOB_READY_STAGES = new Set<string>([
  // Canonical
  "Intake Complete",
  // Legacy
  "Form Received",
  "Sent Form",
  "Intake Packet Sent",
]);

const STAGE_SLA_DAYS: Record<string, number> = {
  // Canonical
  "Lead Captured": 1,
  "First Contact Attempt": 2,
  "Engagement Track": 3,
  "Qualification": 3,
  "Intake Packet Sent": 5,
  "Intake Packet Follow Up": 3,
  "Intake Complete": 2,
  "Benefits Verification": 5,
  "Assessment Scheduling": 5,
  "QA / Treatment Plan Authorization": 5,
  "Authorization Pending": 7,
  "Staffing Match": 5,
  "Ready to Start Services": 3,
  // Legacy
  "New Lead": 1,
  "In Contact": 2,
  "Sent Form": 5,
  "Missing Information": 3,
  "Form Received": 2,
  "Sent to VOB": 5,
  "VOB Completed": 3,
  "Can Not Submit Auth": 5,
  "Getting DX": 14,
  "Needs DX": 14,
  "Can't Reach": 3,
  "Sent Packet - Can't Reach": 5,
  "Non-Qualified": 0,
};

/**
 * Export 86 — walk the canonical 13-stage pipeline. Legacy statuses are
 * aliased to their canonical equivalent first so old records still move
 * forward through the same path.
 */
export function getNextIntakeStage(
  currentStage: LeadStatus | string,
): FamilyLeadPipelineStage | null {
  return getNextFamilyLeadStage(currentStage);
}

export function getPreviousIntakeStage(
  currentStage: LeadStatus | string,
): FamilyLeadPipelineStage | null {
  return getPreviousFamilyLeadStage(currentStage);
}

export function getStageSlaDays(stage: LeadStatus | string): number {
  return STAGE_SLA_DAYS[stage] ?? 3;
}

export function isStageBlocked(stage: LeadStatus | string): boolean {
  return BLOCKED_STAGES.has(stage as string);
}

export function isStageReadyForVob(stage: LeadStatus | string): boolean {
  return VOB_READY_STAGES.has(stage as string);
}

export function isStageConverted(stage: LeadStatus | string): boolean {
  return CONVERTED_STAGES.has(stage as string);
}

/** Flags describing what intake information is currently missing on the lead. */
export interface MissingInfoFlags {
  phone: boolean;
  email: boolean;
  insurance: boolean;
  diagnosis: boolean;
  dob: boolean;
  referralSource: boolean;
  documents: boolean;
  owner: boolean;
  any: boolean;
}

export function getMissingInfoFlags(lead: Lead): MissingInfoFlags {
  const phone = !lead.phone?.trim();
  const email = !lead.email?.trim();
  const insurance = !lead.insurance?.trim();
  const diagnosis =
    !!lead.intake?.dxNeeded ||
    /needs dx|getting dx/i.test(lead.status) ||
    (lead.intake?.diagnosisStatus ?? "").toLowerCase().includes("needs");
  const dob = !lead.intake?.dob && !lead.childAge?.trim();
  const referralSource =
    !lead.source &&
    !lead.intake?.referralSource &&
    !lead.intake?.referralPartner;
  const documents = !(lead.documents && lead.documents.length > 0);
  const owner = !lead.owner?.trim() || lead.owner === "Unassigned";
  return {
    phone,
    email,
    insurance,
    diagnosis,
    dob,
    referralSource,
    documents,
    owner,
    any: phone || email || insurance || diagnosis || dob || referralSource || documents || owner,
  };
}

export type WorkflowRiskLevel = "ok" | "watch" | "risk" | "urgent";

export interface WorkflowRisk {
  level: WorkflowRiskLevel;
  reasons: string[];
  hasOverdueTasks: boolean;
  daysOverSla: number;
}

function leadHasOverdueTasks(lead: Lead): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (lead.tasks ?? []).some((t) => {
    if (t.completed) return false;
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    if (!Number.isFinite(due.getTime())) return false;
    return due.getTime() < today.getTime();
  });
}

export function getLeadWorkflowRisk(lead: Lead): WorkflowRisk {
  const reasons: string[] = [];
  const missing = getMissingInfoFlags(lead);
  const sla = getStageSlaDays(lead.status);
  const daysOverSla = Math.max(0, (lead.daysInStage ?? 0) - sla);
  const hasOverdueTasks = leadHasOverdueTasks(lead);

  if (!lead.phone && !lead.email) reasons.push("No contact info");
  if (missing.owner) reasons.push("Unassigned");
  if (missing.insurance) reasons.push("Missing insurance");
  if (missing.diagnosis) reasons.push("Diagnosis needed");
  if (hasOverdueTasks) reasons.push("Overdue task");
  if (isStageBlocked(lead.status)) reasons.push(`Blocked: ${lead.status}`);
  if (daysOverSla > 0) reasons.push(`Over SLA by ${daysOverSla}d`);
  if ((lead.tags ?? []).some((t) => /escalat/i.test(t))) reasons.push("Escalated");

  let level: WorkflowRiskLevel = "ok";
  if (reasons.length === 0) level = "ok";
  else if (
    (!lead.phone && !lead.email) ||
    daysOverSla >= 5 ||
    (lead.tags ?? []).some((t) => /escalation_urgent|escalation_high/i.test(t))
  ) level = "urgent";
  else if (isStageBlocked(lead.status) || hasOverdueTasks || daysOverSla >= 2) level = "risk";
  else level = "watch";

  return { level, reasons, hasOverdueTasks, daysOverSla };
}

export function getRecommendedNextAction(lead: Lead): string {
  const missing = getMissingInfoFlags(lead);
  if (missing.owner) return "Assign an intake owner";
  if (!lead.phone && !lead.email) return "Collect parent contact info";
  if (lead.status === "New Lead") return "Log first contact attempt";
  if (lead.status === "In Contact" && lead.formStatus !== "Sent") return "Send intake packet";
  if (lead.status === "Sent Form") return "Follow up on intake packet";
  if (lead.status === "Missing Information") return "Collect missing information";
  if (lead.status === "Form Received") return "Submit to VOB";
  if (lead.status === "Sent to VOB") return "Check VOB status";
  if (lead.status === "VOB Completed") return "Prepare active-care handoff";
  if (lead.status === "Can't Reach" || lead.status === "Sent Packet - Can't Reach")
    return "Schedule another contact attempt";
  if (lead.status === "Needs DX" || lead.status === "Getting DX") return "Confirm diagnosis path";
  return lead.nextAction || "Review lead";
}

/* ------------------------------- Escalations ------------------------------ */

export const ESCALATION_TYPES = [
  "missing_information_blocker",
  "cannot_reach_family",
  "insurance_or_benefits_blocker",
  "diagnosis_needed",
  "authorization_handoff_risk",
  "owner_missing",
  "stage_sla_overdue",
  "other",
] as const;

export type EscalationType = (typeof ESCALATION_TYPES)[number];

export const ESCALATION_SEVERITIES = ["low", "medium", "high", "urgent"] as const;
export type EscalationSeverity = (typeof ESCALATION_SEVERITIES)[number];

export function getEscalationReason(lead: Lead): EscalationType {
  const missing = getMissingInfoFlags(lead);
  if (lead.status === "Can't Reach" || lead.status === "Sent Packet - Can't Reach")
    return "cannot_reach_family";
  if (lead.status === "Missing Information") return "missing_information_blocker";
  if (lead.status === "Needs DX" || lead.status === "Getting DX") return "diagnosis_needed";
  if (lead.status === "Can Not Submit Auth") return "authorization_handoff_risk";
  if (missing.insurance) return "insurance_or_benefits_blocker";
  if (missing.owner) return "owner_missing";
  if ((lead.daysInStage ?? 0) > getStageSlaDays(lead.status)) return "stage_sla_overdue";
  return "other";
}

/* ---------------------------- Lead age / priority -------------------------- */

/** Whole days since `createdAt`. Returns 0 if the date is missing or invalid. */
export function getLeadAgeDays(lead: Lead): number {
  if (!lead.createdAt) return 0;
  const created = new Date(lead.createdAt).getTime();
  if (!Number.isFinite(created)) return 0;
  const diff = Date.now() - created;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/** Days the lead has been sitting in its current stage. */
export function getDaysInCurrentStage(lead: Lead): number {
  return Math.max(0, lead.daysInStage ?? 0);
}

/**
 * Combined operational priority — blends explicit lead priority with workflow
 * risk so the UI can sort/queue without recomputing risk on every render.
 */
export type LeadPriorityScore = {
  level: "hot" | "warm" | "cold";
  weight: number;
  reasons: string[];
};

export function getLeadPriority(lead: Lead): LeadPriorityScore {
  const risk = getLeadWorkflowRisk(lead);
  const explicit = (lead.priority ?? "Warm").toLowerCase();
  let weight = 0;
  if (explicit === "hot") weight += 3;
  else if (explicit === "warm") weight += 1;
  if (risk.level === "urgent") weight += 4;
  else if (risk.level === "risk") weight += 2;
  else if (risk.level === "watch") weight += 1;
  const level: LeadPriorityScore["level"] =
    weight >= 4 ? "hot" : weight >= 2 ? "warm" : "cold";
  return { level, weight, reasons: risk.reasons };
}

/* ---------------------- Shared Next Step / Blocker ------------------------ */

/**
 * Canonical "next step" for a lead. Prefers the explicit `nextAction` field
 * when set (product/ops overrides), otherwise falls back to the recommended
 * action derived from workflow stage + missing info. Both the Leads table
 * and the Lead Detail drawer read this so the pipeline direction stays
 * consistent end-to-end.
 */
export function getLeadNextStep(lead: Lead): string {
  const explicit = (lead.nextAction ?? "").trim();
  if (explicit) return explicit;
  return getRecommendedNextAction(lead);
}

export interface LeadBlocker {
  label: string;
  tone: Exclude<WorkflowRiskLevel, "ok">;
  reasons: string[];
}

/**
 * Canonical "blocker" chip content for a lead — derived from the same
 * workflow risk model so table rows and the drawer header agree.
 * Returns `null` when the lead is clear (risk === "ok").
 */
export function getLeadBlocker(lead: Lead): LeadBlocker | null {
  const risk = getLeadWorkflowRisk(lead);
  if (risk.level === "ok") return null;
  const label = risk.reasons[0] ?? "Needs attention";
  return { label, tone: risk.level, reasons: risk.reasons };
}