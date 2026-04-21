// Central role metadata, used by sidebar, invite dialog, team admin, settings.
// Mirrors the app_role enum + role_permissions seed in the database.

export type AppRole =
  | "admin"
  | "exec"
  | "ops_manager"
  | "intake"
  | "auth_team"
  | "qa"
  | "scheduling"
  | "staffing"
  | "clinic"
  | "finance"
  | "hr"
  | "phone_support"
  | "hr_admin"
  | "hr_manager"
  | "recruiting_assistant"
  | "payroll_admin"
  | "state_director"
  | "clinic_director"
  | "dept_manager"
  | "staff"
  | "viewer";

export interface RoleMeta {
  key: AppRole;
  label: string;
  group: "Leadership" | "Operations" | "Pipeline" | "Service" | "Support" | "People" | "Legacy";
  description: string;
}

export const ROLE_META: RoleMeta[] = [
  { key: "admin",        label: "Systems Admin",         group: "Leadership", description: "Full system control, configuration, integrations" },
  { key: "exec",         label: "Executive",             group: "Leadership", description: "View-only across the platform with override capability" },
  { key: "ops_manager",  label: "Operations Manager",    group: "Leadership", description: "Full operational control across pipeline, staffing, scheduling" },
  { key: "intake",       label: "Intake Coordinator",    group: "Pipeline",   description: "Leads, intake stages, VOB, consent forms, phone calls" },
  { key: "auth_team",    label: "Authorizations",        group: "Pipeline",   description: "Auth records, submissions, reauth cycles, mid-stage clients" },
  { key: "qa",           label: "QA Specialist",         group: "Pipeline",   description: "Treatment plan review and QA approvals" },
  { key: "scheduling",   label: "Scheduling",            group: "Operations", description: "Assessments, schedules, availability, start dates" },
  { key: "staffing",     label: "Staffing Coordinator",  group: "Operations", description: "RBT matching, restaffing, availability" },
  { key: "clinic",       label: "Clinic Team",           group: "Operations", description: "Clinic-specific clients, schedules, utilization" },
  { key: "finance",      label: "Finance / Payroll",     group: "Service",    description: "Payment plans, payroll, financial fields" },
  { key: "hr",           label: "HR / People Ops (legacy)",group: "Legacy",   description: "Legacy combined HR role — prefer HR Admin / HR Manager" },
  { key: "phone_support",label: "Phone / Support",       group: "Support",    description: "Call handling, follow-ups, lead linking" },
  { key: "hr_admin",     label: "HR Admin",              group: "People",     description: "Full HR Suite control — employees, payroll fields, settings" },
  { key: "hr_manager",   label: "HR Manager",            group: "People",     description: "Employee operations, reviews, cases, training, time approvals" },
  { key: "recruiting_assistant", label: "Recruiting Assistant", group: "People", description: "Onboarding workflows, candidate intake, training assignment" },
  { key: "payroll_admin",label: "Payroll Admin",         group: "People",     description: "Payroll workflows, bonuses, time clock approvals" },
  { key: "state_director",label:"State Director",        group: "Leadership", description: "State-scoped employee visibility, reviews, cases" },
  { key: "clinic_director",label:"Clinic Director",      group: "Operations", description: "Clinic-scoped employee visibility, time clock view" },
  { key: "dept_manager", label: "Department Manager",    group: "Operations", description: "Department-scoped employee visibility and reviews" },
  { key: "staff",        label: "Staff (legacy)",        group: "Legacy",     description: "General editor — broad edit access. Prefer a specialized role." },
  { key: "viewer",       label: "Viewer",                group: "Legacy",     description: "Read-only across most modules" },
];

export const ROLE_LOOKUP: Record<AppRole, RoleMeta> = ROLE_META.reduce(
  (acc, r) => ({ ...acc, [r.key]: r }),
  {} as Record<AppRole, RoleMeta>,
);

export function roleLabel(key: AppRole): string {
  return ROLE_LOOKUP[key]?.label ?? key;
}