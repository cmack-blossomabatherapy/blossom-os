import type { Lead } from "@/data/leads";

export type ReadinessStatus =
  | "Awaiting Contact"
  | "Waiting on Family"
  | "Waiting on Internal Review"
  | "Financial Review Needed"
  | "Assessment Coordination"
  | "Operationally Ready"
  | "Cannot Proceed";

export type BlockerKey =
  | "packet_incomplete"
  | "missing_insurance"
  | "parent_unavailable"
  | "assessment_unscheduled"
  | "vob_pending"
  | "consent_missing"
  | "financial_review"
  | "stopped_responding";

export interface BlockerMeta {
  key: BlockerKey;
  label: string;
  reason: string;
}

const BLOCKER_LABELS: Record<BlockerKey, string> = {
  packet_incomplete: "Intake packet not completed",
  missing_insurance: "Missing insurance card",
  parent_unavailable: "Parent unavailable",
  assessment_unscheduled: "Assessment not scheduled",
  vob_pending: "VOB pending",
  consent_missing: "Consent form missing",
  financial_review: "Financial review needed",
  stopped_responding: "Family stopped responding",
};

export function getReadinessStatus(lead: Lead): ReadinessStatus {
  if (lead.status === "Non-Qualified" || lead.status === "Can Not Submit Auth") return "Cannot Proceed";
  if (lead.status === "VOB Completed" && lead.financialStatus === "Approved") return "Operationally Ready";
  if (lead.financialStatus === "Payment Plan Required" || lead.financialStatus === "Pending Review" && lead.vobStatus === "Received") return "Financial Review Needed";
  if (lead.status === "New Lead" || !lead.lastContacted) return "Awaiting Contact";
  if (lead.status === "Can't Reach" || lead.status === "Sent Packet - Can't Reach") return "Waiting on Family";
  if (lead.status === "Missing Information" || lead.formReviewStatus === "Missing Information") return "Waiting on Family";
  if (lead.status === "Sent Form" || lead.formStatus === "Sent" || lead.formStatus === "Viewed") return "Waiting on Family";
  if (lead.status === "Form Received" && lead.formReviewStatus === "Pending") return "Waiting on Internal Review";
  if (lead.status === "Sent to VOB" || lead.vobStatus === "Sent") return "Waiting on Internal Review";
  if (lead.status === "Getting DX" || lead.status === "Needs DX") return "Assessment Coordination";
  return "Waiting on Internal Review";
}

export function getBlockers(lead: Lead): BlockerMeta[] {
  const out: BlockerMeta[] = [];
  const push = (key: BlockerKey, reason: string) =>
    out.push({ key, label: BLOCKER_LABELS[key], reason });

  if (lead.formStatus === "Sent" || lead.formStatus === "Viewed")
    push("packet_incomplete", "Packet sent but not returned");
  if (lead.status === "Missing Information" || lead.formReviewStatus === "Missing Information")
    push("missing_insurance", "Insurance / form data missing");
  if (lead.status === "Can't Reach" || lead.status === "Sent Packet - Can't Reach")
    push("parent_unavailable", "Cannot reach parent");
  if (lead.status === "Getting DX" || lead.status === "Needs DX")
    push("assessment_unscheduled", "Diagnostic / assessment not scheduled");
  if (lead.status === "Sent to VOB" || lead.vobStatus === "Sent")
    push("vob_pending", "Waiting on VOB return");
  if (lead.consentStatus === "Not Sent" && (lead.status === "Form Received" || lead.status === "Sent to VOB"))
    push("consent_missing", "Consent has not been sent");
  if (lead.financialStatus === "Payment Plan Required" || lead.financialStatus === "Pending Review" && lead.vobStatus === "Received")
    push("financial_review", "Financial review pending");
  if ((lead.status === "Can't Reach" || lead.status === "Sent Packet - Can't Reach") && lead.daysInStage >= 7)
    push("stopped_responding", `No response in ${lead.daysInStage} days`);
  return out;
}

export function primaryBlocker(lead: Lead): BlockerMeta | null {
  return getBlockers(lead)[0] ?? null;
}

export type Urgency = "low" | "medium" | "high";
export function getUrgency(lead: Lead): Urgency {
  const d = lead.daysInStage ?? 0;
  if (d >= 7) return "high";
  if (d >= 3) return "medium";
  return "low";
}

export interface ReadinessStage {
  key: string;
  label: string;
  match: (l: Lead) => boolean;
}

export const READINESS_STAGES: ReadinessStage[] = [
  { key: "inquiry", label: "New Inquiry", match: (l) => l.status === "New Lead" },
  { key: "contact", label: "Initial Contact", match: (l) => l.status === "In Contact" },
  { key: "packet_sent", label: "Intake Packet Sent", match: (l) => l.status === "Sent Form" || l.formStatus === "Sent" },
  { key: "forms_recv", label: "Forms Received", match: (l) => l.status === "Form Received" },
  { key: "missing", label: "Missing Information", match: (l) => l.status === "Missing Information" || l.formReviewStatus === "Missing Information" },
  { key: "ins_verified", label: "Insurance Verified", match: (l) => l.vobStatus === "Received" || l.vobStatus === "Sent" },
  { key: "sent_vob", label: "Sent to VOB", match: (l) => l.status === "Sent to VOB" },
  { key: "fin_cleared", label: "Financially Cleared", match: (l) => l.financialStatus === "Approved" },
  { key: "assessment", label: "Assessment Coordination", match: (l) => l.status === "Getting DX" || l.status === "Needs DX" },
  { key: "client_setup", label: "Ready for Client Setup", match: (l) => l.status === "VOB Completed" && l.financialStatus === "Approved" },
  { key: "auth", label: "Ready for Authorization", match: (l) => l.status === "VOB Completed" && l.financialStatus === "Approved" && !l.paymentPlanNeeded },
  { key: "staffing", label: "Ready for Staffing", match: (l) => l.status === "VOB Completed" && l.financialStatus === "Approved" && (!l.paymentPlanNeeded || l.paymentPlanSigned) },
];

export const READINESS_TONE: Record<ReadinessStatus, string> = {
  "Awaiting Contact": "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  "Waiting on Family": "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "Waiting on Internal Review": "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  "Financial Review Needed": "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  "Assessment Coordination": "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  "Operationally Ready": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "Cannot Proceed": "bg-destructive/10 text-destructive",
};