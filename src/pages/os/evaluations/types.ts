export type StaffRole = "BCBA" | "RBT" | "Office";
export type EvalType = "Quarterly" | "Annual" | "30-Day" | "10-Day" | "90-Day";
export type SelfStatus = "Not Sent" | "Sent" | "Opened" | "Completed" | "Overdue";
export type LeadershipStatus = "Not Started" | "In Progress" | "Completed";
export type MeetingStatus = "Not Scheduled" | "Scheduled" | "Completed";
export type FinalStatus = "Not Started" | "In Progress" | "Needs Meeting" | "Complete" | "Overdue";
export type EmailStatus = "Draft" | "Queued" | "Sent" | "Failed" | "Cancelled";

export interface EvalStaff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: StaffRole;
  state: string | null;
  supervisor_id: string | null;
  supervisor_name: string | null;
  hire_date: string | null;
  active_status: boolean;
  evaluation_frequency: "Quarterly" | "Annual" | "Both";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Evaluation {
  id: string;
  staff_id: string;
  evaluation_type: EvalType;
  self_status: SelfStatus;
  leadership_status: LeadershipStatus;
  meeting_status: MeetingStatus;
  final_status: FinalStatus;
  next_review_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  due_date?: string | null;
  eval_label?: string | null;
  assigned_reviewer_id?: string | null;
  generated_from_hire_date?: boolean | null;
}

export interface EvalRule {
  id: string;
  role: StaffRole;
  eval_type: EvalType;
  enabled: boolean;
  first_offset_days: number;
  cadence_days: number | null;
  reminder_days_before: number;
  updated_at: string;
}

export interface EvalMeeting {
  id: string;
  evaluation_id: string;
  meeting_date: string | null;
  meeting_status: "Scheduled" | "Completed" | "Cancelled";
  notes: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface EvalNote {
  id: string;
  evaluation_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface EvalEmail {
  id: string;
  evaluation_id: string | null;
  staff_id: string | null;
  recipient_email: string;
  email_type: string;
  subject: string;
  body: string | null;
  status: EmailStatus;
  sent_at: string | null;
  last_reminder_at: string | null;
  failed_reason: string | null;
  created_at: string;
  template_key?: string | null;
  scheduled_send_at?: string | null;
}

export interface EvalForm {
  id: string;
  name: string;
  staff_role: StaffRole;
  evaluation_type: EvalType;
  form_type: "Self" | "Leadership";
  questions_json: { sections: FormSection[] };
  active_status: boolean;
  updated_at: string;
}

export type FormSection =
  | { title: string; type: "ratings"; description?: string; items: string[] }
  | { title: string; type: "longtext"; items: string[] }
  | { title: string; type: "acknowledgment" };

export interface EvalEmailTemplate {
  id: string;
  template_key: string;
  name: string;
  email_type: string;
  subject: string;
  body: string;
  active: boolean;
  updated_at: string;
}

export interface EvalResponse {
  id: string;
  evaluation_id: string;
  form_id: string | null;
  respondent_email: string | null;
  response_type: "Self" | "Leadership";
  answers_json: Record<string, unknown>;
  submitted_at: string;
}

export interface EvalGoal {
  id: string;
  staff_id: string;
  evaluation_id: string | null;
  title: string;
  description: string | null;
  category: string;
  assigned_by: string | null;
  due_date: string | null;
  progress: number;
  status: string;
  notes: string | null;
  completion_date: string | null;
  carry_over: boolean;
  created_at: string;
  updated_at: string;
}

export interface EvalCoachingPlan {
  id: string;
  staff_id: string;
  evaluation_id: string | null;
  concern_category: string;
  description: string | null;
  expectations: string | null;
  required_improvements: string | null;
  support_resources: string | null;
  check_in_dates: unknown;
  status: "Active" | "Monitoring" | "Improved" | "Escalated" | "Completed" | string;
  outcome: string | null;
  created_by: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvalAIInsight {
  id: string;
  scope: "company" | "state" | "staff" | "reviewer" | string;
  scope_id: string | null;
  severity: "info" | "warn" | "crit" | string;
  title: string;
  body: string;
  recommended_action: string | null;
  source_data: unknown;
  dismissed: boolean;
  generated_at: string;
  created_at: string;
}

export interface EvalTrainingAssignment {
  id: string;
  staff_id: string;
  evaluation_id: string | null;
  training_topic: string;
  reason: string | null;
  status: string;
  assigned_by: string | null;
  due_date: string | null;
  completion_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvalPerformanceScore {
  id: string;
  evaluation_id: string;
  staff_id: string;
  self_score: number | null;
  leadership_score: number | null;
  goals_score: number | null;
  overall_score: number | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvalRiskFlag {
  id: string;
  staff_id: string;
  flag_type: string;
  severity: "low" | "medium" | "high" | string;
  description: string | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export type StandingLevel =
  | "Excellent Standing"
  | "Good Standing"
  | "Needs Coaching"
  | "Performance Concern"
  | "Improvement Plan Active";

export type ReviewerStatus = "Not Sent" | "Sent" | "In Progress" | "Completed" | "Declined";

export interface EvalReviewer {
  id: string;
  evaluation_id: string;
  reviewer_staff_id: string | null;
  reviewer_email: string;
  reviewer_name: string | null;
  status: ReviewerStatus;
  sent_at: string | null;
  completed_at: string | null;
  response_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}