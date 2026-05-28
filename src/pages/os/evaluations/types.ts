export type StaffRole = "BCBA" | "RBT";
export type EvalType = "Quarterly" | "Annual";
export type SelfStatus = "Not Sent" | "Sent" | "Opened" | "Completed" | "Overdue";
export type LeadershipStatus = "Not Started" | "In Progress" | "Completed";
export type MeetingStatus = "Not Scheduled" | "Scheduled" | "Completed";
export type FinalStatus = "Not Started" | "In Progress" | "Needs Meeting" | "Complete" | "Overdue";
export type CycleStatus = "Draft" | "Active" | "Complete" | "Archived";
export type EmailStatus = "Draft" | "Queued" | "Sent" | "Failed";
// Note: "Cancelled" is also a valid backend value

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

export interface EvalCycle {
  id: string;
  name: string;
  evaluation_type: EvalType;
  staff_type: "BCBA" | "RBT" | "Both";
  start_date: string | null;
  self_due_date: string | null;
  leadership_due_date: string | null;
  meeting_due_date: string | null;
  final_due_date: string | null;
  status: CycleStatus;
  created_at: string;
  updated_at: string;
}

export interface Evaluation {
  id: string;
  staff_id: string;
  cycle_id: string | null;
  evaluation_type: EvalType;
  self_status: SelfStatus;
  leadership_status: LeadershipStatus;
  meeting_status: MeetingStatus;
  final_status: FinalStatus;
  next_review_date: string | null;
  completed_at: string | null;
  created_at: string;
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
  cycle_id: string | null;
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