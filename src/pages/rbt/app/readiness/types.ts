export type ReadinessStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "approved"
  | "blocked"
  | "waived";

export interface ReadinessGate {
  id: string;
  key: string;
  label: string;
  description: string | null;
  employee_instructions: string | null;
  internal_instructions: string | null;
  owner_role: string;
  sort_order: number;
  is_active: boolean;
  requires_approval: boolean;
  advances_stage_key: string | null;
  risk_after_days: number | null;
}

export interface ReadinessState {
  id: string;
  employee_id: string;
  gate_key: string;
  status: ReadinessStatus;
  assigned_to: string | null;
  due_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  risk_flag: "attention" | "overdue" | "escalation" | null;
  blocker_note: string | null;
  last_progress_at: string | null;
  updated_at: string;
}

export interface ReadinessRow {
  gate: ReadinessGate;
  state: ReadinessState;
}

export const READINESS_META: Record<ReadinessStatus, { label: string; tone: string }> = {
  not_started: { label: "Not started", tone: "text-muted-foreground" },
  in_progress: { label: "In progress", tone: "text-primary" },
  submitted:   { label: "Submitted", tone: "text-primary" },
  approved:    { label: "Complete", tone: "text-primary" },
  blocked:     { label: "Blocked", tone: "text-destructive" },
  waived:      { label: "Waived", tone: "text-muted-foreground" },
};

export function isReadinessDone(s: ReadinessStatus) {
  return s === "approved" || s === "waived";
}

export const OWNER_LABEL: Record<string, string> = {
  rbt: "You", hr: "HR", recruiting: "Recruiting", training: "Training",
  bcba: "Your BCBA", scheduling: "Scheduling", qa: "QA", admin: "Admin",
};

export type StaffingStatus =
  | "not_ready"
  | "ready_for_matching"
  | "potential_case"
  | "schedule_confirmation"
  | "awaiting_family"
  | "case_confirmed"
  | "start_date_scheduled"
  | "active"
  | "on_hold";

export const STAFFING_META: Record<StaffingStatus, { label: string; description: string; tone: string }> = {
  not_ready:             { label: "Not yet ready",         description: "Complete readiness gates first.",              tone: "text-muted-foreground" },
  ready_for_matching:    { label: "Ready for matching",    description: "You are approved to be staffed.",              tone: "text-primary" },
  potential_case:        { label: "Potential case identified", description: "A potential case is being reviewed.",      tone: "text-primary" },
  schedule_confirmation: { label: "Schedule confirmation needed", description: "Please review the proposed schedule.",  tone: "text-primary" },
  awaiting_family:       { label: "Awaiting family confirmation", description: "Waiting on the family to confirm.",     tone: "text-muted-foreground" },
  case_confirmed:        { label: "Case confirmed",        description: "Your case has been confirmed.",                tone: "text-primary" },
  start_date_scheduled:  { label: "Start date scheduled",  description: "Your first session is scheduled.",             tone: "text-primary" },
  active:                { label: "Active",                description: "You are actively working the case.",           tone: "text-primary" },
  on_hold:               { label: "On hold",               description: "Placement is temporarily on hold.",            tone: "text-destructive" },
};