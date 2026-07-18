// Assessment + treatment plan pipeline definitions.
// Keep in sync with the DB CHECK constraints on
// public.bcba_assessments.status and public.bcba_treatment_plans.status.

export type AssessmentStatus =
  | "assigned"
  | "parent_contact_needed"
  | "scheduled"
  | "completed"
  | "treatment_plan_in_progress"
  | "parent_input_needed"
  | "parent_signature_needed"
  | "submitted_to_qa"
  | "qa_changes_requested"
  | "resubmitted"
  | "ready_for_authorization"
  | "completed_final"
  | "on_hold"
  | "cancelled";

export const ASSESSMENT_STATUS_ORDER: AssessmentStatus[] = [
  "assigned",
  "parent_contact_needed",
  "scheduled",
  "completed",
  "treatment_plan_in_progress",
  "parent_input_needed",
  "parent_signature_needed",
  "submitted_to_qa",
  "qa_changes_requested",
  "resubmitted",
  "ready_for_authorization",
  "completed_final",
  "on_hold",
  "cancelled",
];

export const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatus, string> = {
  assigned: "Assigned",
  parent_contact_needed: "Parent contact needed",
  scheduled: "Scheduled",
  completed: "Assessment completed",
  treatment_plan_in_progress: "Treatment plan in progress",
  parent_input_needed: "Parent input needed",
  parent_signature_needed: "Parent signature needed",
  submitted_to_qa: "Submitted to QA",
  qa_changes_requested: "QA changes requested",
  resubmitted: "Resubmitted",
  ready_for_authorization: "Ready for authorization",
  completed_final: "Completed",
  on_hold: "On hold",
  cancelled: "Cancelled",
};

// Tailwind classes for status pills — semantic tokens only.
export const ASSESSMENT_STATUS_STYLES: Record<AssessmentStatus, string> = {
  assigned: "bg-muted text-foreground/80 border-border",
  parent_contact_needed: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  scheduled: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  treatment_plan_in_progress: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900",
  parent_input_needed: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  parent_signature_needed: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  submitted_to_qa: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900",
  qa_changes_requested: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
  resubmitted: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900",
  ready_for_authorization: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900",
  completed_final: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  on_hold: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export const TERMINAL_STATUSES: AssessmentStatus[] = ["completed_final", "cancelled"];

export type TreatmentPlanStatus =
  | "not_started"
  | "drafting"
  | "parent_input_needed"
  | "signature_needed"
  | "submitted"
  | "qa_returned"
  | "correction_in_progress"
  | "resubmitted"
  | "approved"
  | "sent_to_authorization"
  | "completed";

export const TREATMENT_PLAN_ORDER: TreatmentPlanStatus[] = [
  "not_started","drafting","parent_input_needed","signature_needed","submitted",
  "qa_returned","correction_in_progress","resubmitted","approved","sent_to_authorization","completed",
];

export const TREATMENT_PLAN_LABELS: Record<TreatmentPlanStatus, string> = {
  not_started: "Not started",
  drafting: "Drafting",
  parent_input_needed: "Parent input needed",
  signature_needed: "Signature needed",
  submitted: "Submitted",
  qa_returned: "QA returned",
  correction_in_progress: "Correction in progress",
  resubmitted: "Resubmitted",
  approved: "Approved",
  sent_to_authorization: "Sent to authorization",
  completed: "Completed",
};

export const CORRECTION_CATEGORIES = [
  "Assessment tools",
  "Goals & objectives",
  "Medical necessity",
  "Parent involvement",
  "Behavior reduction",
  "Skill acquisition",
  "Data collection",
  "Formatting / templates",
  "Signatures / dates",
  "Other",
] as const;

export function daysBetween(fromIso?: string | null, toIso?: string | null): number {
  if (!fromIso) return 0;
  const from = new Date(fromIso).getTime();
  const to = toIso ? new Date(toIso).getTime() : Date.now();
  return Math.max(0, Math.floor((to - from) / 86400000));
}