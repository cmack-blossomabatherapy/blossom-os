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
  { id: "bcba", label: "BCBA", tier: "field" },
  { id: "rbt", label: "RBT", tier: "field" },
];

export type OSAction = "view" | "create" | "edit" | "delete" | "approve" | "export" | "assign";
export const OS_ACTIONS: OSAction[] = ["view", "create", "edit", "delete", "approve", "export", "assign"];

export type OSScope = "company" | "state" | "assigned";

/** Navigation modules / route keys. */
export type OSModule =
  | "dashboard"
  | "leads"
  | "clients"
  | "staff"
  | "scheduling"
  | "intake"
  | "cases"
  | "billing"
  | "reports"
  | "training"
  | "hr"
  | "settings"
  | "permissions";

/** Map modules to route paths (single source of truth for nav filtering). */
export const MODULE_ROUTES: Record<OSModule, string> = {
  dashboard: "/os",
  leads: "/os/leads",
  clients: "/os/clients",
  staff: "/os/staff",
  scheduling: "/os/scheduling",
  intake: "/os/intake",
  cases: "/os/cases",
  billing: "/os/billing",
  reports: "/os/reports",
  training: "/os/training",
  hr: "/os/hr",
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
    modules: ["dashboard", "leads", "clients", "staff", "scheduling", "cases", "billing", "reports", "hr", "training"],
    scope: "company",
    actions: {
      dashboard: VIEW, leads: ["view", "export"], clients: ["view", "export"], staff: ["view", "export"],
      scheduling: VIEW, cases: ["view", "approve"], billing: ["view", "approve", "export"],
      reports: ["view", "export"], hr: ["view", "export"], training: VIEW,
    },
    leadership: { kpis: true, operationalAnalytics: true, staffingAlerts: true, workflowBottlenecks: true, aiInsights: true },
  },
  operations_leadership: {
    modules: ["dashboard", "leads", "clients", "staff", "scheduling", "intake", "cases", "reports", "training", "hr"],
    scope: "company",
    actions: {
      dashboard: VIEW, leads: FULL, clients: FULL, staff: FULL, scheduling: FULL,
      intake: FULL, cases: FULL, reports: ["view", "export"], hr: VIEW, training: VIEW_EDIT,
    },
    leadership: { kpis: true, operationalAnalytics: true, staffingAlerts: true, workflowBottlenecks: true, aiInsights: true },
  },
  state_director: {
    modules: ["dashboard", "leads", "clients", "staff", "scheduling", "intake", "cases", "reports", "training"],
    scope: "state",
    actions: {
      dashboard: VIEW, leads: VIEW_EDIT.concat("assign") as OSAction[], clients: VIEW_EDIT.concat("assign") as OSAction[],
      staff: VIEW_EDIT, scheduling: VIEW_EDIT, intake: VIEW_EDIT, cases: VIEW_EDIT,
      reports: ["view", "export"], training: VIEW,
    },
    leadership: { kpis: true, operationalAnalytics: true, staffingAlerts: true, workflowBottlenecks: true, aiInsights: false },
  },
  intake_coordinator: {
    modules: ["dashboard", "leads", "intake", "clients"],
    scope: "state",
    actions: { dashboard: VIEW, leads: VIEW_EDIT, intake: VIEW_EDIT, clients: VIEW },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: false, workflowBottlenecks: true, aiInsights: false },
  },
  authorization_coordinator: {
    modules: ["dashboard", "clients", "cases", "billing"],
    scope: "state",
    actions: { dashboard: VIEW, clients: VIEW_EDIT, cases: VIEW_EDIT, billing: VIEW },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: false, workflowBottlenecks: true, aiInsights: false },
  },
  scheduling_team: {
    modules: ["dashboard", "scheduling", "clients", "staff"],
    scope: "state",
    actions: { dashboard: VIEW, scheduling: FULL, clients: VIEW, staff: VIEW },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: true, workflowBottlenecks: true, aiInsights: false },
  },
  recruiting_team: {
    modules: ["dashboard", "staff", "hr"],
    scope: "company",
    actions: { dashboard: VIEW, staff: VIEW_EDIT.concat("assign") as OSAction[], hr: VIEW_EDIT },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: true, workflowBottlenecks: false, aiInsights: false },
  },
  hr_team: {
    modules: ["dashboard", "hr", "staff", "training"],
    scope: "company",
    actions: { dashboard: VIEW, hr: FULL, staff: VIEW_EDIT, training: VIEW_EDIT },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: true, workflowBottlenecks: false, aiInsights: false },
  },
  billing_finance: {
    modules: ["dashboard", "billing", "clients", "reports"],
    scope: "company",
    actions: {
      dashboard: VIEW, billing: FULL, clients: VIEW, reports: ["view", "export"],
    },
    leadership: { kpis: true, operationalAnalytics: false, staffingAlerts: false, workflowBottlenecks: false, aiInsights: false },
  },
  qa_team: {
    modules: ["dashboard", "clients", "cases", "staff", "reports"],
    scope: "company",
    actions: { dashboard: VIEW, clients: VIEW, cases: VIEW_EDIT.concat("approve") as OSAction[], staff: VIEW, reports: ["view", "export"] },
    leadership: { kpis: false, operationalAnalytics: true, staffingAlerts: false, workflowBottlenecks: true, aiInsights: false },
  },
  bcba: {
    modules: ["dashboard", "clients", "scheduling", "cases", "training"],
    scope: "assigned",
    actions: { dashboard: VIEW, clients: VIEW_EDIT, scheduling: VIEW, cases: VIEW_EDIT, training: VIEW },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: false, workflowBottlenecks: false, aiInsights: false },
  },
  rbt: {
    modules: ["dashboard", "clients", "scheduling", "training"],
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