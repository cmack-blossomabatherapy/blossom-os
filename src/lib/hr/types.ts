// HR Suite shared types

export type EmployeeStatus =
  | "pending_start" | "active" | "on_leave" | "on_hold" | "terminated" | "resigned";

export type EmploymentType = "full_time" | "part_time" | "contractor" | "prn";
export type PayType = "hourly" | "salaried";
export type WorkSetting = "clinic" | "home" | "hybrid" | "admin" | "field";
export type WorkSettingExt =
  | WorkSetting
  | "office"
  | "leadership"
  | "intake"
  | "recruiting"
  | "scheduling"
  | "state_director"
  | "operations"
  | "systems";

export const WORK_SETTING_LABELS: Record<WorkSettingExt, string> = {
  clinic: "Clinic",
  home: "Home-based",
  hybrid: "Hybrid",
  admin: "Admin",
  field: "Field",
  office: "Office Staff",
  leadership: "Leadership / Executive",
  intake: "Intake Coordinator",
  recruiting: "Recruiting",
  scheduling: "Scheduling",
  state_director: "State Director",
  operations: "Operations",
  systems: "Systems / IT",
};

export const OFFICE_WORK_SETTINGS: WorkSettingExt[] = [
  "office", "leadership", "intake", "recruiting", "scheduling", "state_director", "operations", "systems", "admin",
];

export const FIELD_WORK_SETTINGS: WorkSettingExt[] = ["clinic", "home", "hybrid", "field"];

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
  is_people_manager?: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  manager_id?: string | null;
  responsibilities?: string[] | null;
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

export const HR_STATES = ["GA", "NC", "TN", "VA", "MD", "NJ"] as const;

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

// ============================================================
// Phase 3 — Reviews, Bonuses, Pay Changes, Training, Payroll
// ============================================================

export type ReviewType = "30_day" | "60_day" | "90_day" | "annual" | "probationary" | "ad_hoc";
export type ReviewStatus = "draft" | "manager_review" | "employee_acknowledge" | "completed" | "cancelled";
export type ReviewRating = "exceeds" | "meets" | "developing" | "needs_improvement" | "unsatisfactory";

export type BonusType = "signing" | "retention" | "referral" | "performance" | "spot" | "holiday" | "other";
export type BonusStatus = "pending_approval" | "approved" | "paid" | "cancelled";

export type PayChangeKind = "raise" | "promotion" | "demotion" | "adjustment" | "rate_correction" | "title_change";
export type PayChangeStatus = "proposed" | "approved" | "effective" | "reverted";

export type TrainingStatus = "assigned" | "in_progress" | "completed" | "expired" | "waived";

export type PayrollRunStatus = "open" | "ready" | "submitted" | "posted" | "closed" | "rejected";

export const REVIEW_TYPE_LABEL: Record<ReviewType, string> = {
  "30_day": "30-Day", "60_day": "60-Day", "90_day": "90-Day",
  annual: "Annual", probationary: "Probationary", ad_hoc: "Ad-hoc",
};

export const REVIEW_STATUS_META: Record<ReviewStatus, { label: string; tone: string }> = {
  draft:                 { label: "Draft",                tone: "bg-muted text-muted-foreground border-border" },
  manager_review:        { label: "Manager Review",       tone: "bg-info/15 text-info border-info/30" },
  employee_acknowledge:  { label: "Awaiting Acknowledge", tone: "bg-warning/15 text-warning border-warning/30" },
  completed:             { label: "Completed",            tone: "bg-success/15 text-success border-success/30" },
  cancelled:             { label: "Cancelled",            tone: "bg-destructive/10 text-destructive border-destructive/20" },
};

export const REVIEW_RATING_META: Record<ReviewRating, { label: string; tone: string }> = {
  exceeds:            { label: "Exceeds Expectations",    tone: "bg-success/15 text-success border-success/30" },
  meets:              { label: "Meets Expectations",      tone: "bg-info/15 text-info border-info/30" },
  developing:         { label: "Developing",              tone: "bg-warning/15 text-warning border-warning/30" },
  needs_improvement:  { label: "Needs Improvement",       tone: "bg-warning/20 text-warning border-warning/40" },
  unsatisfactory:     { label: "Unsatisfactory",          tone: "bg-destructive/15 text-destructive border-destructive/30" },
};

export const BONUS_TYPE_LABEL: Record<BonusType, string> = {
  signing: "Signing", retention: "Retention", referral: "Referral",
  performance: "Performance", spot: "Spot", holiday: "Holiday", other: "Other",
};

export const BONUS_STATUS_META: Record<BonusStatus, { label: string; tone: string }> = {
  pending_approval: { label: "Pending Approval", tone: "bg-warning/15 text-warning border-warning/30" },
  approved:         { label: "Approved",         tone: "bg-info/15 text-info border-info/30" },
  paid:             { label: "Paid",              tone: "bg-success/15 text-success border-success/30" },
  cancelled:        { label: "Cancelled",        tone: "bg-muted text-muted-foreground border-border" },
};

export const PAY_CHANGE_KIND_LABEL: Record<PayChangeKind, string> = {
  raise: "Raise", promotion: "Promotion", demotion: "Demotion",
  adjustment: "Adjustment", rate_correction: "Rate Correction", title_change: "Title Change",
};

export const PAY_CHANGE_STATUS_META: Record<PayChangeStatus, { label: string; tone: string }> = {
  proposed:  { label: "Proposed",  tone: "bg-warning/15 text-warning border-warning/30" },
  approved:  { label: "Approved",  tone: "bg-info/15 text-info border-info/30" },
  effective: { label: "Effective", tone: "bg-success/15 text-success border-success/30" },
  reverted:  { label: "Reverted",  tone: "bg-destructive/10 text-destructive border-destructive/20" },
};

export const TRAINING_STATUS_META: Record<TrainingStatus, { label: string; tone: string }> = {
  assigned:    { label: "Assigned",    tone: "bg-info/15 text-info border-info/30" },
  in_progress: { label: "In Progress", tone: "bg-warning/15 text-warning border-warning/30" },
  completed:   { label: "Completed",   tone: "bg-success/15 text-success border-success/30" },
  expired:     { label: "Expired",     tone: "bg-destructive/15 text-destructive border-destructive/30" },
  waived:      { label: "Waived",      tone: "bg-muted text-muted-foreground border-border" },
};

export const PAYROLL_RUN_STATUS_META: Record<PayrollRunStatus, { label: string; tone: string }> = {
  open:      { label: "Open",      tone: "bg-muted text-muted-foreground border-border" },
  ready:     { label: "Ready",     tone: "bg-info/15 text-info border-info/30" },
  submitted: { label: "Submitted", tone: "bg-warning/15 text-warning border-warning/30" },
  posted:    { label: "Posted",    tone: "bg-success/15 text-success border-success/30" },
  closed:    { label: "Closed",    tone: "bg-primary/15 text-primary border-primary/30" },
  rejected:  { label: "Rejected",  tone: "bg-destructive/15 text-destructive border-destructive/30" },
};

export interface EmployeeReview {
  id: string;
  employee_id: string;
  reviewer_id: string | null;
  reviewer_name: string | null;
  review_type: ReviewType;
  status: ReviewStatus;
  overall_rating: ReviewRating | null;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  scheduled_for: string | null;
  strengths: string | null;
  growth_areas: string | null;
  goals: string | null;
  manager_comments: string | null;
  employee_comments: string | null;
  acknowledged_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeBonus {
  id: string;
  employee_id: string;
  bonus_type: BonusType;
  status: BonusStatus;
  amount: number;
  reason: string | null;
  notes: string | null;
  effective_date: string | null;
  paid_date: string | null;
  payroll_run_id: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeePayChange {
  id: string;
  employee_id: string;
  kind: PayChangeKind;
  status: PayChangeStatus;
  previous_rate: number | null;
  new_rate: number;
  previous_title: string | null;
  new_title: string | null;
  previous_pay_type: PayType | null;
  new_pay_type: PayType | null;
  effective_date: string;
  reason: string | null;
  notes: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingCourse {
  id: string;
  name: string;
  description: string | null;
  provider: string | null;
  category: string | null;
  required_for_roles: string[];
  renewal_months: number | null;
  duration_minutes: number | null;
  is_active: boolean;
  external_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeTraining {
  id: string;
  employee_id: string;
  course_id: string;
  status: TrainingStatus;
  assigned_at: string;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  expires_on: string | null;
  score: number | null;
  certificate_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollRun {
  id: string;
  name: string;
  period_start: string;
  period_end: string;
  pay_date: string | null;
  status: PayrollRunStatus;
  total_hours: number;
  total_gross: number;
  employee_count: number;
  viventium_batch_id: string | null;
  viventium_synced_at: string | null;
  notes: string | null;
  submitted_by_name: string | null;
  submitted_at: string | null;
  posted_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollRunItem {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  timesheet_id: string | null;
  regular_hours: number;
  overtime_hours: number;
  pto_hours: number;
  bonus_total: number;
  gross_pay: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function formatMoney(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

// ============================================================
// Phase 4 — Communication, Resources, Reports, Settings
// ============================================================

export type AnnouncementPriority = "info" | "important" | "urgent";
export type AnnouncementAudience = "all" | "by_state" | "by_clinic" | "by_department" | "by_role";

export type ResourceKind = "document" | "link" | "video" | "policy" | "form" | "folder";
export type ResourceCategory =
  | "handbook" | "payroll" | "training" | "clinical" | "it" | "benefits" | "onboarding" | "general";

export const ANNOUNCEMENT_PRIORITY_META: Record<AnnouncementPriority, { label: string; tone: string }> = {
  info:      { label: "Info",      tone: "bg-info/15 text-info border-info/30" },
  important: { label: "Important", tone: "bg-warning/15 text-warning border-warning/30" },
  urgent:    { label: "Urgent",    tone: "bg-destructive/15 text-destructive border-destructive/30" },
};

export const RESOURCE_CATEGORY_LABEL: Record<ResourceCategory, string> = {
  handbook: "Handbook",
  payroll: "Payroll",
  training: "Training",
  clinical: "Clinical",
  it: "IT & Equipment",
  benefits: "Benefits",
  onboarding: "Onboarding",
  general: "General",
};

export const RESOURCE_KIND_LABEL: Record<ResourceKind, string> = {
  document: "Document", link: "Link", video: "Video",
  policy: "Policy", form: "Form", folder: "Folder",
};

export interface HRAnnouncement {
  id: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  audience: AnnouncementAudience;
  audience_states: string[];
  audience_clinics: string[];
  audience_departments: string[];
  audience_roles: string[];
  pinned: boolean;
  publish_at: string;
  expires_at: string | null;
  author_id: string | null;
  author_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface HRResource {
  id: string;
  title: string;
  description: string | null;
  kind: ResourceKind;
  category: ResourceCategory;
  url: string | null;
  storage_path: string | null;
  parent_id: string | null;
  visibility_states: string[];
  visibility_clinics: string[];
  visibility_roles: string[];
  is_pinned: boolean;
  is_active: boolean;
  position: number;
  uploaded_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface HRSavedReport {
  id: string;
  name: string;
  description: string | null;
  category: string;
  config: Record<string, unknown>;
  is_shared: boolean;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface HRSetting {
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updated_by_name: string | null;
  updated_at: string;
}