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

export const INTAKE_STAGES = [
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

export type IntakeStage = (typeof INTAKE_STAGES)[number];

/** Forward path through the operational happy-path. */
const FORWARD_PATH: LeadStatus[] = [
  "New Lead",
  "In Contact",
  "Sent Form",
  "Form Received",
  "Sent to VOB",
  "VOB Completed",
];

const BLOCKED_STAGES = new Set<LeadStatus>([
  "Missing Information",
  "Can't Reach",
  "Sent Packet - Can't Reach",
  "Can Not Submit Auth",
  "Needs DX",
  "Getting DX",
]);

const CONVERTED_STAGES = new Set<LeadStatus>(["VOB Completed"]);

const VOB_READY_STAGES = new Set<LeadStatus>(["Form Received", "Sent Form"]);

const STAGE_SLA_DAYS: Record<string, number> = {
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

export function getNextIntakeStage(currentStage: LeadStatus | string): LeadStatus | null {
  const idx = FORWARD_PATH.indexOf(currentStage as LeadStatus);
  if (idx < 0 || idx >= FORWARD_PATH.length - 1) return null;
  return FORWARD_PATH[idx + 1];
}

export function getPreviousIntakeStage(currentStage: LeadStatus | string): LeadStatus | null {
  const idx = FORWARD_PATH.indexOf(currentStage as LeadStatus);
  if (idx <= 0) return null;
  return FORWARD_PATH[idx - 1];
}

export function getStageSlaDays(stage: LeadStatus | string): number {
  return STAGE_SLA_DAYS[stage] ?? 3;
}

export function isStageBlocked(stage: LeadStatus | string): boolean {
  return BLOCKED_STAGES.has(stage as LeadStatus);
}

export function isStageReadyForVob(stage: LeadStatus | string): boolean {
  return VOB_READY_STAGES.has(stage as LeadStatus);
}

export function isStageConverted(stage: LeadStatus | string): boolean {
  return CONVERTED_STAGES.has(stage as LeadStatus);
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