/**
 * Blossom OS — Frontend Permission Architecture (mock).
 *
 * Four independent axes:
 *   1. Navigation Visibility — what shows up in the sidebar / routes
 *   2. Data Visibility Scope — company / state / assigned-only
 *   3. Action Permissions    — view / create / edit / delete / approve / export / assign
 *   4. Leadership Visibility — KPIs, analytics, AI insights, bottlenecks
 *
 * NOTE: This is wiring + matrix only. Backend enforcement comes later.
 */

export type OSRole =
  | "super_admin"
  | "executive_leadership"
  | "operations_leadership"
  | "state_director"
  | "intake_coordinator"
  | "authorization_coordinator"
  | "scheduling_team"
  | "recruiting_team"
  | "hr_team"
  | "billing_finance"
  | "qa_team"
  | "payroll_coordinator"
  | "bcba"
  | "rbt";

export const OS_ROLES: { id: OSRole; label: string; tier: "platform" | "leadership" | "operations" | "field" }[] = [
  { id: "super_admin", label: "Super Admin", tier: "platform" },
  { id: "executive_leadership", label: "Executive Leadership", tier: "leadership" },
  { id: "operations_leadership", label: "Operations Leadership", tier: "leadership" },
  { id: "state_director", label: "State Director", tier: "leadership" },
  { id: "intake_coordinator", label: "Intake Coordinator", tier: "operations" },
  { id: "authorization_coordinator", label: "Authorization Coordinator", tier: "operations" },
  { id: "scheduling_team", label: "Scheduling Team", tier: "operations" },
  { id: "recruiting_team", label: "Recruiting Team", tier: "operations" },
  { id: "hr_team", label: "HR Team", tier: "operations" },
  { id: "billing_finance", label: "Billing / Finance", tier: "operations" },
  { id: "qa_team", label: "QA Team", tier: "operations" },
  { id: "payroll_coordinator", label: "Payroll Coordinator", tier: "operations" },
  { id: "bcba", label: "BCBA", tier: "field" },
  { id: "rbt", label: "RBT", tier: "field" },
];

export type OSAction = "view" | "create" | "edit" | "delete" | "approve" | "export" | "assign";
export const OS_ACTIONS: OSAction[] = ["view", "create", "edit", "delete", "approve", "export", "assign"];

export type OSScope = "company" | "state" | "assigned";

/** Navigation modules / route keys. */
export type OSModule =
  | "dashboard"
  | "command_center"
  | "calendar"
  | "notifications"
  | "leads"
  | "clients"
  | "staff"
  | "scheduling"
  | "intake"
  | "cases"
  | "authorizations"
  | "recruiting"
  | "credentialing"
  | "employee_ops"
  | "evaluations"
  | "billing"
  | "payroll"
  | "revenue"
  | "insurance"
  | "reports"
  | "kpi"
  | "workflows"
  | "sop"
  | "marketing"
  | "analytics_hub"
  | "tech_requests"
  | "internal_requests"
  | "open_issues"
  | "projects"
  | "ai_assistant"
  | "ai_insights"
  | "automation_center"
  | "predictive_alerts"
  | "ai_workflows"
  | "training"
  | "hr"
  | "user_management"
  | "state_management"
  | "settings"
  | "permissions";

/** Map modules to route paths (single source of truth for nav filtering). */
export const MODULE_ROUTES: Record<OSModule, string> = {
  dashboard: "/os",
  command_center: "/os/command-center",
  calendar: "/os/calendar",
  notifications: "/os/notifications",
  leads: "/os/leads",
  clients: "/os/clients",
  staff: "/os/staff",
  scheduling: "/os/scheduling",
  intake: "/os/intake",
  cases: "/os/cases",
  authorizations: "/os/authorizations",
  recruiting: "/os/recruiting",
  credentialing: "/os/credentialing",
  employee_ops: "/os/employee-ops",
  evaluations: "/os/evaluations",
  billing: "/os/billing",
  payroll: "/os/payroll",
  revenue: "/os/revenue",
  insurance: "/os/insurance",
  reports: "/os/reports",
  kpi: "/os/kpi",
  workflows: "/os/workflows",
  sop: "/os/sop",
  marketing: "/os/marketing",
  analytics_hub: "/os/analytics",
  tech_requests: "/os/tech-requests",
  internal_requests: "/os/internal-requests",
  open_issues: "/os/open-issues",
  projects: "/os/projects",
  ai_assistant: "/os/ai/assistant",
  ai_insights: "/os/ai/insights",
  automation_center: "/os/ai/automations",
  predictive_alerts: "/os/ai/predictive",
  ai_workflows: "/os/ai/workflows",
  training: "/os/training",
  hr: "/os/hr",
  user_management: "/os/user-management",
  state_management: "/os/state-management",
  settings: "/os/settings",
  permissions: "/os/permissions",
};

const ALL_MODULES: OSModule[] = Object.keys(MODULE_ROUTES) as OSModule[];
const ALL_ACTIONS: OSAction[] = [...OS_ACTIONS];

interface RoleProfile {
  /** Navigation visibility — which sidebar modules render. */
  modules: OSModule[];
  /** Default data scope this role operates under. */
  scope: OSScope;
  /** Per-module action capabilities. Missing module => view-only or none. */
  actions: Partial<Record<OSModule, OSAction[]>>;
  /** Leadership analytics visibility. */
  leadership: {
    kpis: boolean;
    operationalAnalytics: boolean;
    staffingAlerts: boolean;
    workflowBottlenecks: boolean;
    aiInsights: boolean;
  };
  /** Platform-only capabilities. */
  platform?: {
    managePermissions?: boolean;
    impersonate?: boolean;
    accessOldVersion?: boolean;
    configureWorkflows?: boolean;
  };
}

const VIEW: OSAction[] = ["view"];
const VIEW_EDIT: OSAction[] = ["view", "create", "edit"];
const FULL: OSAction[] = ["view", "create", "edit", "delete", "approve", "export", "assign"];

export const ROLE_PROFILES: Record<OSRole, RoleProfile> = {
  super_admin: {
    modules: ALL_MODULES,
    scope: "company",
    actions: Object.fromEntries(ALL_MODULES.map((m) => [m, ALL_ACTIONS])) as Record<OSModule, OSAction[]>,
    leadership: { kpis: true, operationalAnalytics: true, staffingAlerts: true, workflowBottlenecks: true, aiInsights: true },
    platform: { managePermissions: true, impersonate: true, accessOldVersion: true, configureWorkflows: true },
  },
  executive_leadership: {
    modules: [
      "dashboard", "command_center", "calendar", "notifications",
      "leads", "intake", "clients", "authorizations", "scheduling", "cases",
      "staff", "recruiting", "credentialing", "employee_ops", "evaluations", "training",
      "reports", "kpi", "workflows", "sop", "marketing", "analytics_hub",
      "billing", "payroll", "revenue", "insurance",
      "ai_assistant", "ai_insights", "automation_center", "predictive_alerts", "ai_workflows",
      "hr", "state_management",
    ],
    scope: "company",
    actions: {
      dashboard: VIEW, leads: ["view", "export"], clients: ["view", "export"], staff: ["view", "export"],
      scheduling: VIEW, cases: ["view", "approve"], billing: ["view", "approve", "export"],
      reports: ["view", "export"], hr: ["view", "export"], training: VIEW,
    },
    leadership: { kpis: true, operationalAnalytics: true, staffingAlerts: true, workflowBottlenecks: true, aiInsights: true },
  },
  operations_leadership: {
    modules: [
      "dashboard", "command_center", "calendar", "notifications",
      "leads", "intake", "clients", "authorizations", "scheduling", "cases",
      "staff", "recruiting", "credentialing", "employee_ops", "evaluations", "training",
      "reports", "kpi", "workflows", "sop", "marketing", "analytics_hub",
      "tech_requests", "internal_requests", "open_issues", "projects",
      "ai_assistant", "ai_insights", "automation_center", "predictive_alerts", "ai_workflows",
      "hr",
    ],
    scope: "company",
    actions: {
      dashboard: VIEW, leads: FULL, clients: FULL, staff: FULL, scheduling: FULL,
      intake: FULL, cases: FULL, reports: ["view", "export"], hr: VIEW, training: VIEW_EDIT,
    },
    leadership: { kpis: true, operationalAnalytics: true, staffingAlerts: true, workflowBottlenecks: true, aiInsights: true },
  },
  state_director: {
    modules: [
      "dashboard", "command_center", "calendar", "notifications",
      "leads", "intake", "clients", "authorizations", "scheduling", "cases",
      "staff", "evaluations", "training",
      "reports", "kpi", "sop", "analytics_hub",
      "ai_assistant", "ai_insights",
    ],
    scope: "state",
    actions: {
      dashboard: VIEW, leads: VIEW_EDIT.concat("assign") as OSAction[], clients: VIEW_EDIT.concat("assign") as OSAction[],
      staff: VIEW_EDIT, scheduling: VIEW_EDIT, intake: VIEW_EDIT, cases: VIEW_EDIT,
      reports: ["view", "export"], training: VIEW,
    },
    leadership: { kpis: true, operationalAnalytics: true, staffingAlerts: true, workflowBottlenecks: true, aiInsights: false },
  },
  intake_coordinator: {
    modules: ["dashboard", "calendar", "notifications", "leads", "intake", "clients", "authorizations", "sop", "training", "ai_assistant"],
    scope: "state",
    actions: { dashboard: VIEW, leads: VIEW_EDIT, intake: VIEW_EDIT, clients: VIEW },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: false, workflowBottlenecks: true, aiInsights: false },
  },
  authorization_coordinator: {
    modules: ["dashboard", "calendar", "notifications", "clients", "authorizations", "cases", "billing", "insurance", "sop", "ai_assistant"],
    scope: "state",
    actions: { dashboard: VIEW, clients: VIEW_EDIT, cases: VIEW_EDIT, billing: VIEW },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: false, workflowBottlenecks: true, aiInsights: false },
  },
  scheduling_team: {
    modules: ["dashboard", "calendar", "notifications", "scheduling", "clients", "staff", "sop", "ai_assistant"],
    scope: "state",
    actions: { dashboard: VIEW, scheduling: FULL, clients: VIEW, staff: VIEW },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: true, workflowBottlenecks: true, aiInsights: false },
  },
  recruiting_team: {
    modules: ["dashboard", "calendar", "notifications", "recruiting", "staff", "credentialing", "employee_ops", "training", "hr", "ai_assistant"],
    scope: "company",
    actions: { dashboard: VIEW, staff: VIEW_EDIT.concat("assign") as OSAction[], hr: VIEW_EDIT },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: true, workflowBottlenecks: false, aiInsights: false },
  },
  hr_team: {
    modules: ["dashboard", "calendar", "notifications", "hr", "staff", "employee_ops", "evaluations", "training", "payroll", "sop", "ai_assistant"],
    scope: "company",
    actions: { dashboard: VIEW, hr: FULL, staff: VIEW_EDIT, training: VIEW_EDIT },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: true, workflowBottlenecks: false, aiInsights: false },
  },
  billing_finance: {
    modules: ["dashboard", "notifications", "billing", "payroll", "revenue", "insurance", "clients", "reports", "kpi", "ai_assistant"],
    scope: "company",
    actions: {
      dashboard: VIEW, billing: FULL, clients: VIEW, reports: ["view", "export"],
    },
    leadership: { kpis: true, operationalAnalytics: false, staffingAlerts: false, workflowBottlenecks: false, aiInsights: false },
  },
  qa_team: {
    modules: ["dashboard", "calendar", "notifications", "clients", "cases", "authorizations", "staff", "evaluations", "reports", "sop", "ai_assistant"],
    scope: "company",
    actions: { dashboard: VIEW, clients: VIEW, cases: VIEW_EDIT.concat("approve") as OSAction[], staff: VIEW, reports: ["view", "export"] },
    leadership: { kpis: false, operationalAnalytics: true, staffingAlerts: false, workflowBottlenecks: true, aiInsights: false },
  },
  bcba: {
    modules: ["dashboard", "calendar", "notifications", "clients", "scheduling", "cases", "evaluations", "training", "sop", "ai_assistant"],
    scope: "assigned",
    actions: { dashboard: VIEW, clients: VIEW_EDIT, scheduling: VIEW, cases: VIEW_EDIT, training: VIEW },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: false, workflowBottlenecks: false, aiInsights: false },
  },
  rbt: {
    modules: ["dashboard", "calendar", "notifications", "clients", "scheduling", "training", "sop"],
    scope: "assigned",
    actions: { dashboard: VIEW, clients: VIEW, scheduling: VIEW, training: VIEW },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: false, workflowBottlenecks: false, aiInsights: false },
  },
};

export function canSeeModule(role: OSRole, module: OSModule): boolean {
  return ROLE_PROFILES[role].modules.includes(module);
}

export function canAct(role: OSRole, module: OSModule, action: OSAction): boolean {
  const allowed = ROLE_PROFILES[role].actions[module] ?? [];
  return allowed.includes(action);
}

export function scopeFor(role: OSRole): OSScope {
  return ROLE_PROFILES[role].scope;
}

export function canSeeLeadership(role: OSRole, key: keyof RoleProfile["leadership"]): boolean {
  return ROLE_PROFILES[role].leadership[key];
}

export function hasPlatformCap(role: OSRole, cap: keyof NonNullable<RoleProfile["platform"]>): boolean {
  return !!ROLE_PROFILES[role].platform?.[cap];
}

export function canAccessOSRoute(role: OSRole, pathname: string): boolean {
  const entry = (Object.entries(MODULE_ROUTES) as [OSModule, string][]).find(([, path]) =>
    pathname === path || pathname.startsWith(path + "/"),
  );
  if (!entry) return true; // unknown OS route — don't gate
  return canSeeModule(role, entry[0]);
}