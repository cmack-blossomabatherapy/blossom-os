/**
 * Behavioral Support workflow domain types.
 * These mirror the Supabase tables created for the role.
 */

export type BSSeverity = "low" | "medium" | "high" | "crisis";

export type BSCaseStatus =
  | "open"
  | "triage"
  | "active"
  | "monitoring"
  | "waiting_on_bcba"
  | "waiting_on_family"
  | "resolved"
  | "archived";

export type BSEscalationType =
  | "crisis"
  | "aggression"
  | "family_concern"
  | "staff_safety"
  | "clinical_support"
  | "supervision_gap"
  | "parent_training_gap"
  | "service_instability"
  | "other";

export type BSEscalationStatus =
  | "new"
  | "triage"
  | "assigned"
  | "in_progress"
  | "waiting_on_bcba"
  | "waiting_on_family"
  | "resolved"
  | "archived";

export type BSPlanStatus = "draft" | "active" | "monitoring" | "completed" | "archived";
export type BSTaskStatus = "open" | "in_progress" | "blocked" | "completed" | "archived";

export type BSFollowupType =
  | "family_call"
  | "bcba_checkin"
  | "rbt_support"
  | "plan_review"
  | "crisis_checkin"
  | "documentation_review"
  | "other";

export type BSFollowupStatus = "open" | "due_today" | "overdue" | "completed" | "cancelled";
export type BSPriority = "low" | "medium" | "high" | "urgent";

export interface BSCase {
  id: string;
  client_id: string | null;
  client_name: string;
  family_name: string | null;
  state: string | null;
  centralreach_client_id: string | null;
  centralreach_case_id: string | null;
  bcba_name: string | null;
  rbt_name: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  severity: BSSeverity;
  status: BSCaseStatus;
  primary_concern: string | null;
  risk_flags: string[];
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  source_system: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface BSEscalation {
  id: string;
  case_id: string | null;
  client_id: string | null;
  client_name: string;
  state: string | null;
  escalation_type: BSEscalationType;
  severity: BSSeverity;
  status: BSEscalationStatus;
  description: string;
  immediate_action: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  bcba_name: string | null;
  due_at: string | null;
  resolved_at: string | null;
  centralreach_reference_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BSPlanTask {
  id: string;
  plan_id: string;
  case_id: string | null;
  task_title: string;
  task_description: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  status: BSTaskStatus;
  due_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BSPlan {
  id: string;
  case_id: string | null;
  client_id: string | null;
  client_name: string;
  plan_title: string;
  plan_status: BSPlanStatus;
  reason_for_plan: string | null;
  goals: string[];
  strategies: string[];
  replacement_behaviors: string[];
  family_guidance: string | null;
  rbt_guidance: string | null;
  bcba_owner: string | null;
  review_due_at: string | null;
  centralreach_reference_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BSFollowup {
  id: string;
  case_id: string | null;
  escalation_id: string | null;
  client_id: string | null;
  client_name: string;
  followup_type: BSFollowupType;
  status: BSFollowupStatus;
  priority: BSPriority;
  assigned_to: string | null;
  assigned_to_name: string | null;
  due_at: string;
  completed_at: string | null;
  outcome: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BSActivityLog {
  id: string;
  case_id: string | null;
  escalation_id: string | null;
  plan_id: string | null;
  followup_id: string | null;
  activity_type: string;
  title: string;
  body: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

export const SEVERITY_LABEL: Record<BSSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  crisis: "Crisis",
};

export const SEVERITY_STYLE: Record<BSSeverity, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  high: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  crisis: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export const ESCALATION_TYPES: BSEscalationType[] = [
  "crisis",
  "aggression",
  "family_concern",
  "staff_safety",
  "clinical_support",
  "supervision_gap",
  "parent_training_gap",
  "service_instability",
  "other",
];

export const CASE_STATUSES: BSCaseStatus[] = [
  "open",
  "triage",
  "active",
  "monitoring",
  "waiting_on_bcba",
  "waiting_on_family",
  "resolved",
  "archived",
];

export const ESC_STATUSES: BSEscalationStatus[] = [
  "new",
  "triage",
  "assigned",
  "in_progress",
  "waiting_on_bcba",
  "waiting_on_family",
  "resolved",
  "archived",
];

export const PLAN_STATUSES: BSPlanStatus[] = ["draft", "active", "monitoring", "completed", "archived"];
export const TASK_STATUSES: BSTaskStatus[] = ["open", "in_progress", "blocked", "completed", "archived"];
export const FU_TYPES: BSFollowupType[] = [
  "family_call",
  "bcba_checkin",
  "rbt_support",
  "plan_review",
  "crisis_checkin",
  "documentation_review",
  "other",
];
export const FU_STATUSES: BSFollowupStatus[] = ["open", "due_today", "overdue", "completed", "cancelled"];
export const PRIORITIES: BSPriority[] = ["low", "medium", "high", "urgent"];
