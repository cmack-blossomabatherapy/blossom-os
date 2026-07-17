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