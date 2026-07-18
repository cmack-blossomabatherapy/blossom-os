export const FELLOWSHIP_ROLES = [
  { key: "fellowship_supervisor", label: "Fellowship supervisor" },
  { key: "mentor",                label: "Mentor" },
  { key: "fieldwork_reviewer",    label: "Fieldwork reviewer" },
  { key: "skills_evaluator",      label: "Skills evaluator" },
  { key: "program_advisor",       label: "Program advisor" },
  { key: "transition_coach",      label: "Transition coach" },
] as const;

export type FellowshipRoleKey = typeof FELLOWSHIP_ROLES[number]["key"];

export const REVIEW_TYPES = [
  { key: "monthly_review",              label: "Monthly review" },
  { key: "fieldwork_review",            label: "Fieldwork review" },
  { key: "unrestricted_activity_review",label: "Unrestricted activity review" },
  { key: "coursework_checkin",          label: "Coursework check-in" },
  { key: "development_feedback",        label: "Development feedback" },
  { key: "mentor_meeting",              label: "Mentor meeting" },
  { key: "readiness_review",            label: "Readiness review" },
  { key: "exam_prep_transition",        label: "Exam-preparation transition" },
] as const;

export type ReviewTypeKey = typeof REVIEW_TYPES[number]["key"];

export const REVIEW_STATUSES = ["scheduled","in_progress","completed","missed","cancelled"] as const;
export type ReviewStatus = typeof REVIEW_STATUSES[number];

export const STAGE_TONE: Record<string, string> = {
  interest:           "bg-slate-50 text-slate-700 border-slate-200",
  eligibility_review: "bg-blue-50 text-blue-700 border-blue-200",
  applicant:          "bg-indigo-50 text-indigo-700 border-indigo-200",
  accepted:           "bg-violet-50 text-violet-700 border-violet-200",
  active:             "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused:             "bg-amber-50 text-amber-800 border-amber-200",
  at_risk:            "bg-rose-50 text-rose-700 border-rose-200",
  completed:          "bg-emerald-100 text-emerald-800 border-emerald-300",
  bcba_transition:    "bg-purple-50 text-purple-700 border-purple-200",
  withdrawn:          "bg-neutral-100 text-neutral-600 border-neutral-200",
};