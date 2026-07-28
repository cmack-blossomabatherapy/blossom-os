export type PathwayStepStatus =
  | "not_started" | "in_progress" | "submitted" | "complete" | "blocked" | "needs_support";

export type SkillState =
  | "introduced" | "practiced" | "observed" | "demonstrated" | "needs_reinforcement" | "competent";

export const SKILL_META: Record<SkillState, { label: string; tone: string; dot: string }> = {
  introduced:          { label: "Introduced",          tone: "text-muted-foreground", dot: "bg-muted-foreground/40" },
  practiced:           { label: "Practiced",           tone: "text-blue-600",         dot: "bg-blue-500" },
  observed:            { label: "Observed",            tone: "text-indigo-600",       dot: "bg-indigo-500" },
  demonstrated:        { label: "Demonstrated",        tone: "text-emerald-600",      dot: "bg-emerald-500" },
  needs_reinforcement: { label: "Needs reinforcement", tone: "text-amber-600",        dot: "bg-amber-500" },
  competent:           { label: "Competent",           tone: "text-primary",          dot: "bg-primary" },
};

export const STEP_META: Record<PathwayStepStatus, { label: string; tone: string }> = {
  not_started:   { label: "Not started",  tone: "text-muted-foreground" },
  in_progress:   { label: "In progress",  tone: "text-blue-600" },
  submitted:     { label: "Submitted",    tone: "text-indigo-600" },
  complete:      { label: "Complete",     tone: "text-emerald-600" },
  blocked:       { label: "Blocked",      tone: "text-destructive" },
  needs_support: { label: "Needs support", tone: "text-amber-600" },
};

export const isStepDone = (s: string) => s === "complete";

export interface PathwayStep {
  id: string;
  pathway_id: string;
  key: string;
  title: string;
  description: string | null;
  kind: string;
  order_index: number;
  component_type: string | null;
  estimated_days: number | null;
  delivery_mode: string | null;
  capabilities: string[];
  required: boolean;
  /** Course / resource this step opens in the real learning runtime. */
  ref_id?: string | null;
  /** Hard readiness gate this step blocks until it is signed off. */
  blocks_readiness_gate?: string | null;
}
export interface StepProgress {
  id: string;
  pathway_step_id: string;
  employee_id: string;
  status: PathwayStepStatus;
  notes: string | null;
  evidence_url: string | null;
  completed_at: string | null;
  updated_at: string;
}
export interface StepRow { step: PathwayStep; progress: StepProgress; }

/**
 * Hard gates — a step mapped to one of these cannot be self-cleared.
 * Training, skills, documentation and clinical signoff each have a named
 * owner who must approve before staffing can proceed.
 */
export const GATE_META: Record<string, { label: string; owner: string }> = {
  employment_onboarding_complete: { label: "Employment onboarding complete", owner: "HR" },
  background_check_cleared:       { label: "Background check cleared", owner: "HR" },
  required_documents_complete:    { label: "Required documents complete", owner: "HR" },
  certification_verified:         { label: "Certification verified", owner: "Training" },
  orientation_complete:           { label: "Orientation complete", owner: "Training" },
  required_courses_complete:      { label: "Required courses complete", owner: "Training" },
  role_play_complete:             { label: "Role-play complete", owner: "Training" },
  session_note_practice_reviewed: { label: "Session-note practice reviewed", owner: "Training" },
  competency_complete:            { label: "Competency complete", owner: "Your BCBA" },
  bcba_signoff_complete:          { label: "BCBA signoff complete", owner: "Your BCBA" },
  readiness_evaluation_complete:  { label: "Readiness evaluation complete", owner: "Training" },
  centralreach_access_active:     { label: "CentralReach access active", owner: "Admin" },
  availability_confirmed:         { label: "Availability confirmed", owner: "Scheduling" },
  staffing_approval_complete:     { label: "Staffing approval complete", owner: "Scheduling" },
};

/**
 * Where a step's "Start" button should take the learner. Returns null when the
 * step has no runtime destination — we render no button rather than a fake one.
 */
export function stepRuntimeHref(step: PathwayStep): string | null {
  if (step.key === "welcome_to_blossom" || step.component_type === "welcome") return "/rbt/app/welcome";
  if (step.ref_id) return `/rbt/app/learn/course/${step.ref_id}`;
  return null;
}