/**
 * Blossom OS — Canonical Intake-owned stage model.
 *
 * Intake owns exactly eight stages, ending at "Admission Ready". Intake does
 * NOT create or activate a patient — downstream CentralReach staff do that
 * after the handoff.
 *
 * This module is the single source of truth for Intake stage identity,
 * labels, owners, SLAs, next actions, allowed transitions, and the
 * requirement guard that blocks advancement. Legacy / cross-department
 * Family-Lead pipeline labels are aliased in (never broken) via
 * `canonicalIntakeStage`.
 */
import type { Lead } from "@/data/leads";
import { getMissingInfoFlags } from "./intakeWorkflow";

export const INTAKE_CANONICAL_STAGES = [
  "Lead Captured",
  "Contact / Qualification",
  "Intake Packet",
  "Packet Follow Up",
  "Benefits Verification",
  "Clinical / Operational Readiness",
  "CentralReach Packet Prep",
  "Admission Ready",
] as const;

export type IntakeCanonicalStage = (typeof INTAKE_CANONICAL_STAGES)[number];

/** Terminal Intake stage. Nothing past this belongs to Intake. */
export const INTAKE_TERMINAL_STAGE: IntakeCanonicalStage = "Admission Ready";

/**
 * Legacy + cross-department stage labels → canonical Intake stage.
 * Unknown values fall back to "Lead Captured" so no lead disappears.
 */
const INTAKE_STAGE_ALIASES: Record<string, IntakeCanonicalStage> = {
  // Canonical (identity)
  "Lead Captured": "Lead Captured",
  "Contact / Qualification": "Contact / Qualification",
  "Intake Packet": "Intake Packet",
  "Packet Follow Up": "Packet Follow Up",
  "Benefits Verification": "Benefits Verification",
  "Clinical / Operational Readiness": "Clinical / Operational Readiness",
  "CentralReach Packet Prep": "CentralReach Packet Prep",
  "Admission Ready": "Admission Ready",

  // Monday-era / legacy intake statuses
  "New Lead": "Lead Captured",
  "In Contact": "Contact / Qualification",
  "First Contact Attempt": "Contact / Qualification",
  "Engagement Track": "Contact / Qualification",
  "Can't Reach": "Contact / Qualification",
  "Cannot Reach": "Contact / Qualification",
  "Qualification": "Contact / Qualification",
  "Non-Qualified": "Contact / Qualification",
  "Non-qualified Lead": "Contact / Qualification",
  "Needs DX": "Contact / Qualification",
  "Getting DX": "Contact / Qualification",
  "Sent Form": "Intake Packet",
  "Intake Packet Sent": "Intake Packet",
  "Form Received": "Intake Packet",
  "Intake Complete": "Intake Packet",
  "Missing Information": "Packet Follow Up",
  "Intake Packet Follow Up": "Packet Follow Up",
  "Sent Packet - Can't Reach": "Packet Follow Up",
  "Sent to VOB": "Benefits Verification",
  "VOB Completed": "Clinical / Operational Readiness",
  "Schedule Assessment": "Clinical / Operational Readiness",
  "Assessment Scheduled": "Clinical / Operational Readiness",
  "Assessment Scheduling": "Clinical / Operational Readiness",
  "QA Review": "Clinical / Operational Readiness",
  "Can Not Submit Auth": "Clinical / Operational Readiness",
  "QA / Treatment Plan Authorization": "Clinical / Operational Readiness",
  "Authorization Pending": "Clinical / Operational Readiness",
  "Staffing Needed": "Clinical / Operational Readiness",
  "Staffing Match": "Clinical / Operational Readiness",
  "Ready for Start": "Admission Ready",
  "Pending Start": "Admission Ready",
  "Ready to Start Services": "Admission Ready",
};

export function canonicalIntakeStage(stage: string | null | undefined): IntakeCanonicalStage {
  if (!stage) return "Lead Captured";
  return INTAKE_STAGE_ALIASES[stage] ?? INTAKE_STAGE_ALIASES[stage.trim()] ?? "Lead Captured";
}

/**
 * Canonical Intake stage → the stored Family-Lead pipeline label written back
 * to `leads.status`, so existing cross-department surfaces keep working.
 */
export const INTAKE_STAGE_TO_STORED_STATUS: Record<IntakeCanonicalStage, string> = {
  "Lead Captured": "Lead Captured",
  "Contact / Qualification": "Qualification",
  "Intake Packet": "Intake Packet Sent",
  "Packet Follow Up": "Intake Packet Follow Up",
  "Benefits Verification": "Benefits Verification",
  "Clinical / Operational Readiness": "Assessment Scheduling",
  "CentralReach Packet Prep": "Staffing Match",
  "Admission Ready": "Ready to Start Services",
};

export const INTAKE_STAGE_OWNERS: Record<IntakeCanonicalStage, string> = {
  "Lead Captured": "Intake Coordinator",
  "Contact / Qualification": "Intake Coordinator",
  "Intake Packet": "Intake Coordinator",
  "Packet Follow Up": "Intake Coordinator",
  "Benefits Verification": "Intake Coordinator / Benefits",
  "Clinical / Operational Readiness": "Intake Coordinator / Clinical",
  "CentralReach Packet Prep": "Intake Coordinator",
  "Admission Ready": "Director of Intake",
};

export const INTAKE_STAGE_SLA_DAYS: Record<IntakeCanonicalStage, number> = {
  "Lead Captured": 1,
  "Contact / Qualification": 2,
  "Intake Packet": 5,
  "Packet Follow Up": 3,
  "Benefits Verification": 5,
  "Clinical / Operational Readiness": 7,
  "CentralReach Packet Prep": 3,
  "Admission Ready": 2,
};

export const INTAKE_STAGE_NEXT_ACTIONS: Record<IntakeCanonicalStage, string> = {
  "Lead Captured": "Attempt first contact with the family",
  "Contact / Qualification": "Confirm interest, diagnosis path and payer",
  "Intake Packet": "Confirm the family received and started the packet",
  "Packet Follow Up": "Collect the outstanding documents / information",
  "Benefits Verification": "Record the benefits verification outcome",
  "Clinical / Operational Readiness": "Confirm clinical + operational readiness approvals",
  "CentralReach Packet Prep": "Complete the CentralReach admission checklist",
  "Admission Ready": "Hand off to CentralReach for patient activation",
};

export function intakeStageIndex(stage: string | null | undefined): number {
  return INTAKE_CANONICAL_STAGES.indexOf(canonicalIntakeStage(stage));
}

export function getNextIntakeStage(stage: string | null | undefined): IntakeCanonicalStage | null {
  const i = intakeStageIndex(stage);
  if (i < 0 || i >= INTAKE_CANONICAL_STAGES.length - 1) return null;
  return INTAKE_CANONICAL_STAGES[i + 1];
}

export function getPreviousIntakeStage(stage: string | null | undefined): IntakeCanonicalStage | null {
  const i = intakeStageIndex(stage);
  if (i <= 0) return null;
  return INTAKE_CANONICAL_STAGES[i - 1];
}

export function isAdmissionReady(stage: string | null | undefined): boolean {
  return canonicalIntakeStage(stage) === INTAKE_TERMINAL_STAGE;
}

/* -------------------------------------------------------------------------- */
/* Requirements + transition guard                                            */
/* -------------------------------------------------------------------------- */

export interface IntakeTransitionContext {
  /** True when the Director approved the final CentralReach admission packet. */
  admissionPacketApproved?: boolean;
  /** Director-granted exception that bypasses missing requirements. */
  directorException?: boolean;
  /** True when the actor holds Director of Intake capabilities. */
  isDirector?: boolean;
  /** Recorded benefits verification outcome, when tracked outside the lead. */
  benefitsOutcome?: string | null;
  /** Clinical / operational readiness approval recorded elsewhere. */
  readinessApproved?: boolean;
}

export interface IntakeRequirementResult {
  ok: boolean;
  missing: string[];
}

/**
 * Requirements that must be satisfied to LEAVE the given stage.
 */
export function evaluateIntakeStageRequirements(
  stage: string | null | undefined,
  lead: Lead,
  ctx: IntakeTransitionContext = {},
): IntakeRequirementResult {
  const canonical = canonicalIntakeStage(stage);
  const missing: string[] = [];
  const flags = getMissingInfoFlags(lead);

  switch (canonical) {
    case "Lead Captured":
      if (!lead.phone?.trim() && !lead.email?.trim()) missing.push("Phone or email");
      break;
    case "Contact / Qualification":
      if (!lead.parentName?.trim()) missing.push("Parent / guardian name");
      if (!lead.childName?.trim()) missing.push("Child name");
      if (!lead.state?.trim()) missing.push("Service state");
      break;
    case "Intake Packet":
      if ((lead.formStatus ?? "") === "Not Sent") missing.push("Intake packet sent to family");
      break;
    case "Packet Follow Up":
      if (flags.dob) missing.push("Date of birth");
      if (flags.insurance) missing.push("Insurance payer / plan");
      if ((lead.consentStatus ?? "") === "Not Signed") missing.push("Signed consent");
      break;
    case "Benefits Verification":
      if (!(ctx.benefitsOutcome?.trim() || (lead.vobStatus && lead.vobStatus !== "Not Started")))
        missing.push("Benefits verification outcome");
      break;
    case "Clinical / Operational Readiness":
      if (flags.diagnosis) missing.push("Diagnostic / clinical documentation");
      if (ctx.readinessApproved === false) missing.push("Clinical / operational readiness approval");
      break;
    case "CentralReach Packet Prep":
      if (!ctx.admissionPacketApproved) missing.push("Director approval of the admission packet");
      break;
    case "Admission Ready":
      break;
  }

  return { ok: missing.length === 0, missing };
}

export type IntakeTransitionDecision =
  | { allowed: true; to: IntakeCanonicalStage; viaException: boolean }
  | { allowed: false; to: IntakeCanonicalStage | null; reason: string; missing: string[] };

/**
 * Single transition guard used by dashboard, leads table, lead detail/drawer,
 * pipeline, packet prep, and automations.
 */
export function guardIntakeStageTransition(
  lead: Lead,
  target: IntakeCanonicalStage,
  ctx: IntakeTransitionContext = {},
): IntakeTransitionDecision {
  const from = canonicalIntakeStage(lead.status);
  const fromIdx = INTAKE_CANONICAL_STAGES.indexOf(from);
  const toIdx = INTAKE_CANONICAL_STAGES.indexOf(target);

  if (toIdx < 0) return { allowed: false, to: null, reason: "Unknown Intake stage.", missing: [] };
  if (toIdx === fromIdx) return { allowed: false, to: target, reason: "Lead is already at this stage.", missing: [] };

  // Backward moves (reverts) are always one step at a time and audited.
  if (toIdx < fromIdx) {
    if (fromIdx - toIdx > 1 && !ctx.isDirector) {
      return {
        allowed: false, to: target, missing: [],
        reason: "Only the Director of Intake can revert more than one stage.",
      };
    }
    return { allowed: true, to: target, viaException: false };
  }

  if (toIdx - fromIdx > 1) {
    return {
      allowed: false, to: target, missing: [],
      reason: "Intake stages advance one step at a time.",
    };
  }

  const req = evaluateIntakeStageRequirements(from, lead, ctx);
  if (!req.ok) {
    if (ctx.directorException && ctx.isDirector) {
      return { allowed: true, to: target, viaException: true };
    }
    return {
      allowed: false, to: target, missing: req.missing,
      reason: `Blocked — missing: ${req.missing.join(", ")}.`,
    };
  }
  return { allowed: true, to: target, viaException: false };
}
