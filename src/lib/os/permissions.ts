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
  // TODO(future-roles): Add the following blueprint roles when ready to
  // surface them in View As Role. Until then, do NOT add them as menu
  // entries — keep the preview list lean:
  //   - "director_of_rcm"               (Director of Revenue Cycle Management)
  //   - "office_manager"                (Office Manager)
  //   - "regional_state_director"       (Regional State Director — Mentor Program)
  // When activating any of these, also: add to ROLE_MENUS + ROLE_HOME +
  // ROLE_PREVIEW_LIST, add a default menu reusing existing pages where
  // possible, and add an entry to mapAuthRoleToOS.
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
  | "rbt"
  | "marketing_team"
  | "case_manager"
  | "behavioral_support"
  // ---- 2026 canonical org roles ----
  | "systems_admin"
  | "executive"
  | "coo"
  | "director_of_operations"
  | "operations_manager"
  | "marketing_growth_lead"
  | "intake_lead"
  | "finance_benefits_lead"
  | "finance_benefits_team"
  | "authorization_manager"
  | "qa_director"
  | "qa_specialist"
  | "clinical_lead"
  | "scheduling_lead"
  | "scheduling_coordinator"
  | "staffing_lead"
  | "staffing_coordinator"
  | "recruiting_lead"
  | "recruiting_coordinator"
  | "hr_lead"
  | "payroll_lead"
  | "billing_lead"
  | "credentialing_lead"
  | "rcm_team"
  | "assistant_state_director"
  | "business_development"
  | "staffing_team"
  | "credentialing_team"
  | "clinical_director"
  | "viewer";

export const OS_ROLES: { id: OSRole; label: string; tier: "platform" | "leadership" | "operations" | "field" }[] = [
  { id: "super_admin", label: "Super Admin", tier: "platform" },
  { id: "systems_admin", label: "Systems Admin", tier: "platform" },
  { id: "executive", label: "Executive", tier: "leadership" },
  { id: "coo", label: "COO", tier: "leadership" },
  { id: "director_of_operations", label: "Director of Operations", tier: "leadership" },
  { id: "operations_manager", label: "Operations Manager", tier: "leadership" },
  { id: "executive_leadership", label: "Executive Leadership", tier: "leadership" },
  { id: "operations_leadership", label: "Operations Leadership", tier: "leadership" },
  { id: "state_director", label: "State Director", tier: "leadership" },
  { id: "assistant_state_director", label: "Assistant State Director", tier: "leadership" },
  { id: "marketing_growth_lead", label: "Marketing & Growth Lead", tier: "operations" },
  { id: "marketing_team", label: "Marketing Team", tier: "operations" },
  { id: "intake_lead", label: "Intake Lead", tier: "operations" },
  { id: "intake_coordinator", label: "Intake Coordinator", tier: "operations" },
  { id: "finance_benefits_lead", label: "Finance / Benefits Lead", tier: "operations" },
  { id: "finance_benefits_team", label: "Finance / Benefits Team", tier: "operations" },
  { id: "authorization_manager", label: "Authorization Manager", tier: "operations" },
  { id: "authorization_coordinator", label: "Authorization Coordinator", tier: "operations" },
  { id: "qa_director", label: "QA Director", tier: "operations" },
  { id: "qa_specialist", label: "QA Specialist", tier: "operations" },
  { id: "clinical_lead", label: "Clinical Lead", tier: "operations" },
  { id: "scheduling_lead", label: "Scheduling Lead", tier: "operations" },
  { id: "scheduling_coordinator", label: "Scheduling Coordinator", tier: "operations" },
  { id: "staffing_lead", label: "Staffing Lead", tier: "operations" },
  { id: "staffing_coordinator", label: "Staffing Coordinator", tier: "operations" },
  { id: "recruiting_lead", label: "Recruiting Lead", tier: "operations" },
  { id: "recruiting_coordinator", label: "Recruiting Coordinator", tier: "operations" },
  { id: "hr_lead", label: "HR Lead", tier: "operations" },
  { id: "payroll_lead", label: "Payroll Lead", tier: "operations" },
  { id: "billing_lead", label: "Billing Lead", tier: "operations" },
  { id: "credentialing_lead", label: "Credentialing Lead", tier: "operations" },
  { id: "rcm_team", label: "RCM Team", tier: "operations" },
  { id: "scheduling_team", label: "Scheduling Team", tier: "operations" },
  { id: "recruiting_team", label: "Recruiting Team", tier: "operations" },
  { id: "hr_team", label: "HR Team", tier: "operations" },
  { id: "business_development", label: "Business Development", tier: "operations" },
  { id: "staffing_team", label: "Staffing Team", tier: "operations" },
  { id: "credentialing_team", label: "Credentialing Team", tier: "operations" },
  { id: "clinical_director", label: "Clinical Director", tier: "leadership" },
  { id: "billing_finance", label: "Billing / Finance", tier: "operations" },
  { id: "qa_team", label: "QA / Compliance", tier: "operations" },
  { id: "payroll_coordinator", label: "Payroll Coordinator", tier: "operations" },
  { id: "bcba", label: "BCBA", tier: "field" },
  { id: "rbt", label: "RBT", tier: "field" },
  { id: "case_manager", label: "Case Manager", tier: "operations" },
  { id: "behavioral_support", label: "Behavioral Support", tier: "field" },
  { id: "viewer", label: "Viewer", tier: "field" },
];

export type OSAction = "view" | "create" | "edit" | "delete" | "approve" | "export" | "assign";
export const OS_ACTIONS: OSAction[] = ["view", "create", "edit", "delete", "approve", "export", "assign"];

export type OSScope = "company" | "state" | "assigned";

/** Navigation modules / route keys. */
export type OSModule =
  | "dashboard"
  | "command_center"
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
  | "vob"
  | "workflows"
  | "sop"
  | "marketing"
  | "analytics_hub"
  | "marketing_dashboard"
  | "campaigns"
  | "lead_sources"
  | "seo_content"
  | "referrals"
  | "recruiting_marketing"
  | "state_growth"
  | "reputation"
  | "community_outreach"
  | "marketing_reports"
  | "web_analytics"
  | "call_tracking"
  | "phone_system"
  | "attribution_roi"
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
  | "permissions"
  | "integrations";

/** Map modules to route paths (single source of truth for nav filtering). */
export const MODULE_ROUTES: Record<OSModule, string> = {
  dashboard: "/",
  command_center: "/command-center",
  leads: "/leads",
  clients: "/clients",
  staff: "/staff",
  scheduling: "/scheduling",
  intake: "/intake",
  cases: "/cases",
  authorizations: "/authorizations",
  recruiting: "/recruiting/workspace",
  credentialing: "/credentialing",
  employee_ops: "/employee-ops",
  evaluations: "/evaluations",
  billing: "/billing",
  payroll: "/payroll/workspace",
  revenue: "/revenue",
  insurance: "/insurance",
  reports: "/reports",
  kpi: "/kpi",
  vob: "/vob-decision-center",
  workflows: "/workflows",
  sop: "/resource-library",
  marketing: "/marketing",
  analytics_hub: "/analytics",
  marketing_dashboard: "/marketing-dashboard",
  campaigns: "/marketing/campaigns",
  lead_sources: "/marketing/lead-sources",
  seo_content: "/marketing/seo",
  referrals: "/marketing/referral-crm",
  recruiting_marketing: "/marketing/recruiting",
  state_growth: "/marketing/state-growth",
  reputation: "/marketing/reputation",
  community_outreach: "/marketing/outreach",
  marketing_reports: "/reports?category=marketing",
  web_analytics: "/marketing/web-analytics",
  call_tracking: "/marketing/call-tracking",
  phone_system: "/phone",
  attribution_roi: "/marketing/attribution",
  tech_requests: "/tech-requests",
  internal_requests: "/internal-requests",
  open_issues: "/open-issues",
  projects: "/projects",
  ai_assistant: "/ai/assistant",
  ai_insights: "/ai/insights",
  automation_center: "/ai/automations",
  predictive_alerts: "/ai/predictive",
  ai_workflows: "/ai/workflows",
  training: "/training",
  hr: "/hr",
  user_management: "/user-management",
  state_management: "/state-management",
  settings: "/settings",
  permissions: "/permissions",
  integrations: "/integrations",
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

const BASE_ROLE_PROFILES: Partial<Record<OSRole, RoleProfile>> = {
  super_admin: {
    modules: ALL_MODULES,
    scope: "company",
    actions: Object.fromEntries(ALL_MODULES.map((m) => [m, ALL_ACTIONS])) as Record<OSModule, OSAction[]>,
    leadership: { kpis: true, operationalAnalytics: true, staffingAlerts: true, workflowBottlenecks: true, aiInsights: true },
    platform: { managePermissions: true, impersonate: true, accessOldVersion: true, configureWorkflows: true },
  },
  executive_leadership: {
    modules: ALL_MODULES,
    scope: "company",
    actions: Object.fromEntries(ALL_MODULES.map((m) => [m, ALL_ACTIONS])) as Record<OSModule, OSAction[]>,
    leadership: { kpis: true, operationalAnalytics: true, staffingAlerts: true, workflowBottlenecks: true, aiInsights: true },
    platform: { managePermissions: false, impersonate: false, accessOldVersion: true, configureWorkflows: true },
  },
  operations_leadership: {
    modules: [
      "dashboard", "command_center", "leads", "intake", "clients", "authorizations", "scheduling", "cases",
      "staff", "recruiting", "credentialing", "employee_ops", "evaluations", "training",
      "reports", "kpi", "vob", "workflows", "sop", "marketing", "analytics_hub",
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
  /**
   * Clinical Director owns clinical quality, BCBA oversight, supervision
   * health, treatment plan / progress report pipelines, evaluations, and
   * clinical escalations. Company scope, no HR/finance authority.
   */
  clinical_director: {
    modules: [
      "dashboard", "command_center", "clients", "cases", "authorizations",
      "staff", "scheduling", "evaluations", "training", "reports", "kpi",
      "sop", "analytics_hub", "ai_assistant", "ai_insights",
    ],
    scope: "company",
    actions: {
      dashboard: VIEW,
      clients: VIEW_EDIT,
      cases: FULL,
      staff: VIEW_EDIT,
      scheduling: VIEW,
      reports: ["view", "export"],
      training: VIEW,
    },
    leadership: { kpis: true, operationalAnalytics: true, staffingAlerts: true, workflowBottlenecks: true, aiInsights: true },
  },
  state_director: {
    modules: [
      "dashboard", "command_center", "leads", "intake", "clients", "authorizations", "scheduling", "cases",
      "staff", "evaluations", "training",
      "reports", "kpi", "vob", "sop", "analytics_hub",
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
    modules: ["dashboard", "intake", "leads", "vob", "clients", "authorizations", "sop", "training", "kpi", "ai_assistant"],
    scope: "company",
    actions: { dashboard: VIEW, leads: VIEW_EDIT, intake: VIEW_EDIT, clients: VIEW },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: false, workflowBottlenecks: true, aiInsights: false },
  },
  authorization_coordinator: {
    modules: ["dashboard", "clients", "authorizations", "vob", "cases", "billing", "insurance", "sop", "kpi", "ai_assistant"],
    scope: "company",
    actions: { dashboard: VIEW, clients: VIEW_EDIT, cases: VIEW_EDIT, billing: VIEW },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: false, workflowBottlenecks: true, aiInsights: false },
  },
  scheduling_team: {
    modules: ["dashboard", "scheduling", "clients", "staff", "sop", "kpi", "ai_assistant"],
    scope: "company",
    actions: { dashboard: VIEW, scheduling: FULL, clients: VIEW, staff: VIEW },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: true, workflowBottlenecks: true, aiInsights: false },
  },
  /**
   * Staffing Team has its own role profile — it shares some surface area with
   * Scheduling but owns RBT/case matching, family preferences, and coverage
   * gaps. Staffing should never be aliased back to scheduling_team.
   */
  staffing_team: {
    modules: ["dashboard", "staff", "clients", "scheduling", "reports", "training", "sop", "ai_assistant"],
    scope: "company",
    actions: {
      dashboard: VIEW,
      staff: FULL,
      clients: VIEW_EDIT,
      scheduling: VIEW_EDIT,
      reports: ["view", "export"],
      training: VIEW,
    },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: true, workflowBottlenecks: true, aiInsights: false },
  },
  recruiting_team: {
    modules: ["dashboard", "recruiting", "staff", "credentialing", "employee_ops", "training", "hr", "kpi", "ai_assistant"],
    scope: "company",
    actions: { dashboard: VIEW, staff: VIEW_EDIT.concat("assign") as OSAction[], hr: VIEW_EDIT },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: true, workflowBottlenecks: false, aiInsights: false },
  },
  hr_team: {
    modules: ["dashboard", "hr", "user_management", "staff", "employee_ops", "evaluations", "training", "payroll", "sop", "kpi", "phone_system", "ai_assistant"],
    scope: "company",
    actions: { dashboard: VIEW, hr: FULL, user_management: FULL, staff: VIEW_EDIT, training: VIEW_EDIT, phone_system: VIEW_EDIT },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: true, workflowBottlenecks: false, aiInsights: false },
  },
  billing_finance: {
    modules: ["dashboard", "billing", "payroll", "revenue", "insurance", "vob", "clients", "reports", "kpi", "ai_assistant"],
    scope: "company",
    actions: {
      dashboard: VIEW, billing: FULL, clients: VIEW, reports: ["view", "export"],
    },
    leadership: { kpis: true, operationalAnalytics: false, staffingAlerts: false, workflowBottlenecks: false, aiInsights: false },
  },
  qa_team: {
    modules: ["dashboard", "clients", "cases", "authorizations", "staff", "evaluations", "reports", "sop", "kpi"],
    scope: "company",
    actions: { dashboard: VIEW, clients: VIEW, cases: VIEW_EDIT.concat("approve") as OSAction[], staff: VIEW, reports: ["view", "export"] },
    leadership: { kpis: false, operationalAnalytics: true, staffingAlerts: false, workflowBottlenecks: true, aiInsights: false },
  },
  payroll_coordinator: {
    modules: ["dashboard", "payroll", "billing", "staff", "employee_ops", "reports", "sop", "kpi", "ai_assistant"],
    scope: "company",
    actions: { dashboard: VIEW, payroll: FULL, staff: VIEW, reports: ["view", "export"] },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: false, workflowBottlenecks: false, aiInsights: false },
  },
  credentialing_team: {
    modules: ["dashboard", "credentialing", "staff", "reports", "sop", "training", "kpi", "ai_assistant"],
    scope: "company",
    actions: {
      dashboard: VIEW,
      credentialing: FULL,
      staff: VIEW,
      reports: ["view", "export"],
      training: VIEW,
    },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: false, workflowBottlenecks: false, aiInsights: false },
  },
  bcba: {
    modules: ["dashboard", "clients", "scheduling", "cases", "evaluations", "training", "sop", "kpi", "ai_assistant"],
    scope: "assigned",
    actions: { dashboard: VIEW, clients: VIEW_EDIT, scheduling: VIEW, cases: VIEW_EDIT, training: VIEW },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: false, workflowBottlenecks: false, aiInsights: false },
  },
  rbt: {
    modules: ["dashboard", "clients", "scheduling", "training", "sop", "kpi"],
    scope: "assigned",
    actions: { dashboard: VIEW, clients: VIEW, scheduling: VIEW, training: VIEW },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: false, workflowBottlenecks: false, aiInsights: false },
  },
  /**
   * Business Development — growth/referral partner focus. NOT a marketing admin.
   * Owns referral partner CRM, outreach, follow-up, provider/community relationships,
   * and read-safe visibility into lead source handoffs.
   */
  business_development: {
    modules: [
      "dashboard",
      "referrals",
      "reports",
      "training",
      "sop",
      "ai_assistant",
    ],
    scope: "company",
    actions: {
      dashboard: VIEW,
      referrals: VIEW_EDIT,
      reports: ["view", "export"],
      training: VIEW,
      sop: VIEW,
    },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: false, workflowBottlenecks: false, aiInsights: false },
  },
  marketing_team: {
    modules: [
      "dashboard", "training",
      "marketing_dashboard",
      // Growth Engine
      "campaigns", "lead_sources", "seo_content", "web_analytics", "call_tracking",
      // Relationships
      "referrals", "recruiting_marketing", "community_outreach", "reputation",
      // Intelligence — reports lives on the canonical /reports page (module id "reports").
      "attribution_roi", "state_growth", "reports",
      "settings",
    ],
    scope: "company",
    actions: {
      dashboard: VIEW,
      marketing_dashboard: VIEW,
      campaigns: VIEW_EDIT,
      lead_sources: ["view", "export"],
      seo_content: VIEW_EDIT,
      web_analytics: ["view", "export"],
      call_tracking: ["view", "export"],
      referrals: VIEW_EDIT,
      recruiting_marketing: VIEW,
      state_growth: ["view", "export"],
      reputation: VIEW_EDIT,
      community_outreach: VIEW_EDIT,
      attribution_roi: ["view", "export"],
      reports: ["view", "export"],
      training: VIEW,
    },
    // Marketing does not currently expose an AI surface — keep aiInsights off.
    leadership: { kpis: true, operationalAnalytics: true, staffingAlerts: false, workflowBottlenecks: false, aiInsights: false },
  },
  case_manager: {
    modules: [
      "dashboard", "clients", "scheduling", "authorizations", "sop", "training", "ai_assistant", "reports", "evaluations",
    ],
    scope: "assigned",
    actions: {
      dashboard: VIEW,
      clients: VIEW,
      scheduling: VIEW,
      authorizations: VIEW,
      training: VIEW,
      reports: ["view", "export"],
      evaluations: VIEW,
    },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: true, workflowBottlenecks: true, aiInsights: false },
  },
  behavioral_support: {
    modules: ["reports", "training"],
    scope: "company",
    actions: {
      reports: ["view", "export"],
      training: VIEW,
    },
    leadership: { kpis: false, operationalAnalytics: false, staffingAlerts: false, workflowBottlenecks: false, aiInsights: false },
  },
};

/**
 * Aliases for the 2026 canonical org roles.
 * Each new role inherits a sensible existing profile until detailed
 * department permissions are designed. Update individually as needed.
 */
const ROLE_ALIASES: Record<
  Exclude<OSRole, keyof typeof BASE_ROLE_PROFILES>,
  OSRole
> = {
  systems_admin: "super_admin",
  executive: "executive_leadership",
  coo: "executive_leadership",
  director_of_operations: "operations_leadership",
  operations_manager: "operations_leadership",
  marketing_growth_lead: "marketing_team",
  intake_lead: "intake_coordinator",
  finance_benefits_lead: "billing_finance",
  finance_benefits_team: "billing_finance",
  authorization_manager: "authorization_coordinator",
  qa_director: "qa_team",
  qa_specialist: "qa_team",
  clinical_lead: "bcba",
  scheduling_lead: "scheduling_team",
  scheduling_coordinator: "scheduling_team",
  staffing_lead: "staffing_team",
  staffing_coordinator: "staffing_team",
  recruiting_lead: "recruiting_team",
  recruiting_coordinator: "recruiting_team",
  hr_lead: "hr_team",
  payroll_lead: "payroll_coordinator",
  billing_lead: "billing_finance",
  credentialing_lead: "credentialing_team",
  rcm_team: "billing_finance",
  assistant_state_director: "state_director",
  viewer: "behavioral_support",
};

export const ROLE_PROFILES: Record<OSRole, RoleProfile> = {
  ...(BASE_ROLE_PROFILES as Record<OSRole, RoleProfile>),
  ...(Object.fromEntries(
    (Object.entries(ROLE_ALIASES) as [OSRole, OSRole][]).map(
      ([aliasRole, sourceRole]) => [aliasRole, BASE_ROLE_PROFILES[sourceRole] as RoleProfile],
    ),
  ) as Record<OSRole, RoleProfile>),
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