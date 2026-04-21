// HR Suite shared types

export type EmployeeStatus =
  | "pending_start" | "active" | "on_leave" | "on_hold" | "terminated" | "resigned";

export type EmploymentType = "full_time" | "part_time" | "contractor" | "prn";
export type PayType = "hourly" | "salaried";
export type WorkSetting = "clinic" | "home" | "hybrid" | "admin" | "field";

export type OnboardingStatus =
  | "new_hire_pending" | "documents_needed" | "payroll_setup" | "training_assigned"
  | "systems_setup" | "manager_assignment" | "ready_for_start" | "active" | "on_hold" | "incomplete";

export type CaseStatus =
  | "new" | "open" | "waiting_employee" | "waiting_manager"
  | "waiting_payroll" | "waiting_hr" | "resolved" | "closed";

export type CasePriority = "low" | "medium" | "high" | "urgent";

export type CaseType =
  | "payroll_issue" | "attendance_issue" | "benefit_question" | "hr_question"
  | "onboarding_blocker" | "training_issue" | "manager_escalation"
  | "documentation_needed" | "access_issue" | "policy_acknowledgment"
  | "disciplinary_concern" | "offboarding_case";

export type RelationshipKind =
  | "direct_manager" | "dotted_line_manager" | "state_director"
  | "department_owner" | "clinic_leader" | "onboarding_owner" | "operational_owner";

export type DocStatus = "missing" | "requested" | "uploaded" | "verified" | "expired";

export interface Employee {
  id: string;
  user_id: string | null;
  employee_code: string | null;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  job_title: string;
  department_id: string | null;
  state: string;
  clinic: string | null;
  employment_type: EmploymentType;
  pay_type: PayType;
  work_setting: WorkSetting;
  status: EmployeeStatus;
  hire_date: string | null;
  start_date: string | null;
  termination_date: string | null;
  next_review_date: string | null;
  last_review_date: string | null;
  pay_rate: number | null;
  viventium_employee_id: string | null;
  viventium_sync_status: string | null;
  viventium_last_sync: string | null;
  kiosk_pin: string | null;
  kiosk_enabled: boolean;
  resource_hub_access: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
}

export const EMPLOYEE_STATUS_META: Record<EmployeeStatus, { label: string; tone: string }> = {
  pending_start: { label: "Pending Start", tone: "bg-warning/15 text-warning border-warning/30" },
  active:        { label: "Active",        tone: "bg-success/15 text-success border-success/30" },
  on_leave:      { label: "On Leave",      tone: "bg-info/15 text-info border-info/30" },
  on_hold:       { label: "On Hold",       tone: "bg-muted text-muted-foreground border-border" },
  terminated:    { label: "Terminated",    tone: "bg-destructive/15 text-destructive border-destructive/30" },
  resigned:      { label: "Resigned",      tone: "bg-destructive/10 text-destructive border-destructive/20" },
};

export const ONBOARDING_STAGES: { key: OnboardingStatus; label: string; tone: string }[] = [
  { key: "new_hire_pending",  label: "New Hire Pending",   tone: "bg-warning/10 border-warning/30" },
  { key: "documents_needed",  label: "Documents Needed",   tone: "bg-info/10 border-info/30" },
  { key: "payroll_setup",     label: "Payroll Setup",      tone: "bg-info/10 border-info/30" },
  { key: "training_assigned", label: "Training Assigned",  tone: "bg-info/10 border-info/30" },
  { key: "systems_setup",     label: "Systems Setup",      tone: "bg-info/10 border-info/30" },
  { key: "manager_assignment",label: "Manager Assignment", tone: "bg-info/10 border-info/30" },
  { key: "ready_for_start",   label: "Ready for Start",    tone: "bg-success/10 border-success/30" },
  { key: "active",            label: "Active",             tone: "bg-success/15 border-success/40" },
  { key: "on_hold",           label: "On Hold",            tone: "bg-muted border-border" },
  { key: "incomplete",        label: "Incomplete",         tone: "bg-destructive/10 border-destructive/30" },
];

export const HR_STATES = ["GA", "NC", "TN", "VA", "MD"] as const;

export const RELATIONSHIP_LABELS: Record<RelationshipKind, string> = {
  direct_manager: "Direct Manager",
  dotted_line_manager: "Dotted-line Manager",
  state_director: "State Director",
  department_owner: "Department Owner",
  clinic_leader: "Clinic Leader",
  onboarding_owner: "Onboarding Owner",
  operational_owner: "Operational Owner",
};

export function employeeFullName(e: Pick<Employee, "first_name" | "last_name" | "preferred_name">) {
  return `${e.preferred_name || e.first_name} ${e.last_name}`;
}

export function employeeInitials(e: Pick<Employee, "first_name" | "last_name">) {
  return `${e.first_name[0] ?? ""}${e.last_name[0] ?? ""}`.toUpperCase();
}

// ============================================================
// Phase 2 — Time Clock + Hours
// ============================================================

export type PunchKind = "clock_in" | "clock_out" | "break_start" | "break_end";
export type PunchSource = "kiosk" | "manual" | "manager_edit" | "import";
export type PunchStatus = "pending" | "approved" | "rejected" | "locked";

export type AttendanceExceptionKind =
  | "missed_clock_in" | "missed_clock_out" | "late_arrival" | "early_departure"
  | "long_break" | "overtime_risk" | "manual_edit_pending" | "duplicate_punch" | "outside_clinic";
export type AttendanceExceptionStatus = "open" | "acknowledged" | "resolved" | "dismissed";

export type TimesheetStatus = "draft" | "submitted" | "approved" | "rejected" | "locked";

export interface TimeClockPunch {
  id: string;
  employee_id: string;
  clinic: string | null;
  kind: PunchKind;
  source: PunchSource;
  status: PunchStatus;
  punch_at: string;
  scheduled_at: string | null;
  recorded_by: string | null;
  recorded_by_name: string | null;
  edited_by: string | null;
  edited_at: string | null;
  edit_reason: string | null;
  pay_period_start: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceException {
  id: string;
  employee_id: string;
  clinic: string | null;
  kind: AttendanceExceptionKind;
  status: AttendanceExceptionStatus;
  occurred_on: string;
  related_punch_id: string | null;
  detail: string | null;
  resolution: string | null;
  resolved_by: string | null;
  resolved_by_name: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HoursTimesheet {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  status: TimesheetStatus;
  total_hours: number;
  overtime_hours: number;
  submitted_at: string | null;
  submitted_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  locked_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HoursTimesheetEntry {
  id: string;
  timesheet_id: string;
  work_date: string;
  clinic: string | null;
  hours: number;
  category: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const PUNCH_KIND_META: Record<PunchKind, { label: string; tone: string; short: string }> = {
  clock_in:    { label: "Clock In",    tone: "bg-success/15 text-success border-success/30",    short: "In" },
  clock_out:   { label: "Clock Out",   tone: "bg-info/15 text-info border-info/30",             short: "Out" },
  break_start: { label: "Break Start", tone: "bg-warning/15 text-warning border-warning/30",    short: "Brk" },
  break_end:   { label: "Break End",   tone: "bg-warning/10 text-warning border-warning/20",    short: "End" },
};

export const EXCEPTION_KIND_META: Record<AttendanceExceptionKind, { label: string; tone: string }> = {
  missed_clock_in:      { label: "Missed clock-in",  tone: "bg-destructive/15 text-destructive border-destructive/30" },
  missed_clock_out:     { label: "Missed clock-out", tone: "bg-destructive/15 text-destructive border-destructive/30" },
  late_arrival:         { label: "Late arrival",     tone: "bg-warning/15 text-warning border-warning/30" },
  early_departure:      { label: "Early departure",  tone: "bg-warning/15 text-warning border-warning/30" },
  long_break:           { label: "Long break",       tone: "bg-warning/10 text-warning border-warning/20" },
  overtime_risk:        { label: "Overtime risk",    tone: "bg-info/15 text-info border-info/30" },
  manual_edit_pending:  { label: "Edit pending",     tone: "bg-info/15 text-info border-info/30" },
  duplicate_punch:      { label: "Duplicate punch",  tone: "bg-muted text-muted-foreground border-border" },
  outside_clinic:       { label: "Outside clinic",   tone: "bg-destructive/10 text-destructive border-destructive/20" },
};

export const TIMESHEET_STATUS_META: Record<TimesheetStatus, { label: string; tone: string }> = {
  draft:     { label: "Draft",     tone: "bg-muted text-muted-foreground border-border" },
  submitted: { label: "Submitted", tone: "bg-info/15 text-info border-info/30" },
  approved:  { label: "Approved",  tone: "bg-success/15 text-success border-success/30" },
  rejected:  { label: "Rejected",  tone: "bg-destructive/15 text-destructive border-destructive/30" },
  locked:    { label: "Locked",    tone: "bg-primary/15 text-primary border-primary/30" },
};

/** Determine the next legal punch kind given the latest punch for the day. */
export function nextPunchKind(latest: PunchKind | null): PunchKind {
  if (!latest || latest === "clock_out") return "clock_in";
  if (latest === "clock_in" || latest === "break_end") return "break_start";
  if (latest === "break_start") return "break_end";
  return "clock_out";
}

/** Get monday-of-week (ISO) for a date. */
export function startOfWeek(d = new Date()): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // monday = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}