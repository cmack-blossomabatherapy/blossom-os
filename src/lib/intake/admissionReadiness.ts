/**
 * Blossom OS — CentralReach admission packet readiness.
 *
 * Blossom prepares, validates and hands off the admission packet.
 * Downstream CentralReach staff activate the patient. Intake never does.
 */

export type AdmissionItemStatus = "complete" | "missing" | "waived";

export interface AdmissionChecklistItem {
  key: string;
  label: string;
  required: boolean;
  status: AdmissionItemStatus;
  missing?: string[];
  /** Set when a Director waived the requirement. */
  waivedBy?: string | null;
  waivedReason?: string | null;
}

export interface AdmissionApproval {
  approvedBy?: string | null;
  approvedAt?: string | null;
  exceptionReason?: string | null;
}

export interface AdmissionReadinessResult {
  /** Every required item satisfied or explicitly waived. */
  checklistSatisfied: boolean;
  /** Checklist satisfied AND a Director approval is recorded. */
  submissionReady: boolean;
  /** Submission ready AND nothing blocks the CentralReach handoff. */
  handoffEligible: boolean;
  blockers: string[];
  requiredCount: number;
  completeCount: number;
  waivedCount: number;
  reviewer: string | null;
  approvedAt: string | null;
  exceptionReason: string | null;
}

export function evaluateAdmissionReadiness(
  items: AdmissionChecklistItem[],
  approval: AdmissionApproval = {},
): AdmissionReadinessResult {
  const required = items.filter((i) => i.required);
  const blockers: string[] = [];

  for (const item of required) {
    if (item.status === "missing") {
      blockers.push(item.missing?.length ? `${item.label}: ${item.missing.join(", ")}` : item.label);
    }
  }

  const checklistSatisfied = blockers.length === 0;
  const approved = !!approval.approvedBy && !!approval.approvedAt;
  if (!approved) blockers.push("Director of Intake approval required");

  return {
    checklistSatisfied,
    submissionReady: checklistSatisfied && approved,
    handoffEligible: checklistSatisfied && approved,
    blockers,
    requiredCount: required.length,
    completeCount: required.filter((i) => i.status === "complete").length,
    waivedCount: required.filter((i) => i.status === "waived").length,
    reviewer: approval.approvedBy ?? null,
    approvedAt: approval.approvedAt ?? null,
    exceptionReason: approval.exceptionReason ?? null,
  };
}

export const CENTRALREACH_BOUNDARY_NOTE =
  "Blossom OS prepares and validates the admission packet and hands it off. Patient activation happens in CentralReach by downstream staff.";
