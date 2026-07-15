import {
  BarChart3, Workflow, Megaphone, Users, Wallet, ShieldCheck,
  ClipboardCheck, Calendar, Briefcase, HeartHandshake, IdCard, MapPin,
  GraduationCap, FileText, Settings, Crown, Compass, UserCheck,
  Brain, Sparkles, type LucideIcon,
} from "lucide-react";

export type WorkspaceGroup = "workspaces" | "knowledge" | "system" | "legacy";

export interface Workspace {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  path: string;
  group: WorkspaceGroup;
  /** Auth roles (from useAuth().roles) that should see this workspace. */
  roles: string[];
  /** Optional tabs surfaced inside the workspace shell. */
  tabs?: { label: string; path: string }[];
}

// "*" = visible to every signed-in user.
const EVERYONE = ["*"];
const ADMIN_ONLY = ["admin", "super_admin", "systems_admin"];
const EXEC = [...ADMIN_ONLY, "exec", "executive", "coo"];
const OPS = [...EXEC, "ops_manager", "operations_manager", "director_of_operations"];

/** Helper: build a sub-tab path under a workspace base path. */
const tab = (base: string, id: string) => {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}tab=${id}`;
};

/**
 * Single source of truth for Blossom OS top-level navigation.
 * Workspaces hold their own sub-tabs. Sidebar groups workspaces by role and
 * renders the tabs as collapsible children — no separate sidebar entries per
 * sub-page. Each tab path = `${workspace.path}?tab=<id>` and is handled by
 * the workspace shell.
 */
export const WORKSPACES: Workspace[] = [
  // ---------- 12 core workspaces ----------
  {
    id: "executive",
    label: "Executive",
    description: "Company-wide visibility",
    icon: BarChart3,
    path: "/executive",
    group: "workspaces",
    roles: EXEC,
    tabs: [
      { label: "Executive Dashboard", path: "/executive" },
      { label: "Risks & Escalations", path: tab("/executive", "risks") },
      { label: "Bloom Growth Meetings", path: tab("/executive", "meetings") },
    ],
  },
  {
    id: "coo",
    label: "COO / Super Admin",
    description: "Operating system governance",
    icon: Crown,
    path: "/coo",
    group: "workspaces",
    roles: ["admin", "super_admin", "coo"],
    tabs: [
      { label: "COO Command Center", path: "/coo" },
      { label: "Departments", path: tab("/coo", "departments") },
      { label: "Blossom OS Roadmap", path: tab("/coo", "roadmap") },
      { label: "Automations", path: tab("/coo", "automations") },
      { label: "Integrations", path: tab("/coo", "integrations") },
      { label: "Data Health", path: tab("/coo", "data-health") },
      { label: "Permissions", path: tab("/coo", "permissions") },
      { label: "Reports", path: tab("/coo", "reports") },
      { label: "Admin Settings", path: tab("/coo", "settings") },
    ],
  },
  {
    id: "operations",
    label: "Director of Operations",
    description: "Cadence, blockers, escalations",
    icon: Workflow,
    path: "/operations/command-center",
    group: "workspaces",
    roles: OPS,
    tabs: [
      { label: "Command Center",      path: "/operations/command-center" },
      { label: "Department Health",   path: "/operations/department-health" },
      { label: "Workflow Risks",      path: "/operations/workflow-risks" },
      { label: "Escalations",         path: "/operations/escalations" },
      { label: "Accountability",      path: "/operations/accountability" },
      { label: "Staffing Capacity",   path: "/operations/staffing-capacity" },
      { label: "Training Adoption",   path: "/operations/training-adoption" },
      { label: "Leadership Briefing", path: "/operations/briefing" },
      { label: "Updates",             path: "/operations/updates" },
      { label: "Resources",           path: "/operations/resources" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing & Growth",
    description: "Campaigns, leads, attribution",
    icon: Megaphone,
    path: "/marketing",
    group: "workspaces",
    roles: [...EXEC, "marketing", "marketing_team", "marketing_growth_lead"],
    tabs: [
      { label: "Dashboard",       path: "/marketing" },
      { label: "Campaigns",       path: "/marketing/campaigns" },
      { label: "Lead Sources",    path: "/marketing/lead-sources" },
      { label: "SEO",             path: "/marketing/seo" },
      { label: "Web Analytics",   path: "/marketing/web-analytics" },
      { label: "Call Tracking",   path: "/marketing/call-tracking" },
      { label: "Referral CRM",    path: "/marketing/referral-crm" },
      { label: "Recruiting",      path: "/marketing/recruiting" },
      { label: "Outreach",        path: "/marketing/outreach" },
      { label: "Reputation",      path: "/marketing/reputation" },
      { label: "Attribution",     path: "/marketing/attribution" },
      { label: "State Growth",    path: "/marketing/state-growth" },
      { label: "Reports",         path: "/reports" },
    ],
  },
  {
    id: "finance",
    label: "Finance / Benefits",
    description: "Revenue, benefits, billing",
    icon: Wallet,
    path: "/reports",
    group: "workspaces",
    roles: [...EXEC, "finance", "payroll_admin", "finance_benefits_lead", "finance_benefits_team", "payroll_lead"],
    tabs: [
      { label: "VOB Review",        path: "/reports" },
      { label: "Case Approvals",    path: tab("/reports", "case-approvals") },
      { label: "Payment Plans",     path: tab("/reports", "payment-plans") },
    ],
  },
  {
    id: "authorizations",
    label: "Authorizations",
    description: "Auth pipeline & utilization",
    icon: ShieldCheck,
    path: "/authorizations",
    group: "workspaces",
    roles: [...OPS, "auth_team", "qa", "authorization_manager", "authorization_coordinator"],
    tabs: [
      { label: "Auth Queue",     path: "/authorizations" },
      { label: "Workspace",      path: "/auth-workspace" },
      { label: "Risk Center",    path: "/auth-risk-center" },
      { label: "Coordinator",    path: "/auth-coordinator" },
      { label: "Resources",      path: "/authorizations/resources" },
    ],
  },
  {
    id: "qa",
    label: "QA / Compliance",
    description: "Reviews, PRs, escalations",
    icon: ClipboardCheck,
    path: "/qa",
    group: "workspaces",
    roles: [...OPS, "qa", "qa_director", "qa_specialist", "clinical_lead"],
    tabs: [
      { label: "QA Queue",          path: "/qa-queue" },
      { label: "Workspace",         path: "/qa-workspace" },
      { label: "Clients",           path: "/qa-clients" },
      { label: "Treatment Plans",   path: "/treatment-plan-reviews" },
      { label: "Progress Reports",  path: "/reports?category=progress" },
      { label: "Missing Info",      path: "/missing-information" },
      { label: "Supervision",       path: "/supervision-visibility" },
      { label: "Messages",          path: "/qa-messages" },
      { label: "Resources",         path: "/qa/resources" },
    ],
  },
  {
    id: "scheduling",
    label: "Scheduling & Staffing",
    description: "Coverage and staffing risks",
    icon: Calendar,
    path: "/scheduling",
    group: "workspaces",
    roles: [...OPS, "scheduling", "staffing", "scheduling_lead", "scheduling_coordinator", "staffing_lead", "staffing_coordinator"],
    tabs: [
      { label: "Scheduling Queue", path: "/scheduling" },
      { label: "RBT Roster",       path: "/scheduling/rbts" },
      { label: "BCBA Roster",      path: "/scheduling/bcbas" },
      { label: "Orientation",      path: "/hr/orientation-queue" },
      { label: "Workspace",        path: "/scheduling-workspace" },
      { label: "Resources",        path: "/scheduling/resources" },
    ],
  },
  {
    id: "recruiting",
    label: "Recruiting",
    description: "Candidates, interviews, onboarding",
    icon: Briefcase,
    path: "/recruiting/workspace",
    group: "workspaces",
    roles: [...OPS, "recruiting_assistant", "hr", "hr_admin", "hr_manager", "recruiting_lead", "recruiting_coordinator", "hr_lead"],
    tabs: [
      { label: "Dashboard",              path: "/recruiting/workspace" },
      { label: "Training Academy",       path: "/recruiting/academy" },
      { label: "Candidate Pipeline",     path: "/recruiting/pipeline" },
      { label: "RBT Recruiting",         path: "/recruiting/rbt" },
      { label: "BCBA Recruiting",        path: "/recruiting/bcba" },
      { label: "Interviews",             path: "/recruiting/interviews" },
      { label: "Offers",                 path: "/recruiting/offers" },
      { label: "Background Checks",      path: "/recruiting/background" },
      { label: "Onboarding Handoff",     path: "/recruiting/onboarding" },
      { label: "Orientation Queue",      path: "/recruiting/orientation" },
      { label: "Staffing Needs",         path: "/recruiting/staffing-needs" },
      { label: "Recruiting Map",         path: "/recruiting/map" },
      { label: "Follow-Ups",             path: "/recruiting/follow-ups" },
      { label: "Messages",               path: "/recruiting/messages" },
      { label: "Escalations",            path: "/recruiting/escalations" },
      { label: "Recruiting Performance", path: "/recruiting/performance" },
      { label: "Resources",              path: "/recruiting/resources" },
    ],
  },
  {
    id: "hr",
    label: "HR",
    description: "People, onboarding, compliance",
    icon: HeartHandshake,
    path: "/hr-team",
    group: "workspaces",
    roles: [...OPS, "hr", "hr_admin", "hr_manager", "hr_lead"],
    tabs: [
      { label: "Team",                 path: "/hr-team" },
      { label: "Workspace",            path: "/hr/workspace" },
      { label: "New Hires",            path: "/hr/new-hires" },
      { label: "Onboarding Journey",   path: "/hr/onboarding-journey" },
      { label: "Orientation Queue",    path: "/hr/orientation-queue" },
      { label: "Employee Support",     path: "/hr/employee-support" },
      { label: "Training & Certs",     path: "/hr/training-certifications" },
      { label: "Evaluations",          path: "/hr/evaluations" },
      { label: "Requests",             path: "/hr/requests" },
      { label: "Compliance",           path: "/hr/compliance" },
      { label: "Messages",             path: "/hr/messages" },
      { label: "Resources",            path: "/hr/team-resources" },
    ],
  },
  {
    id: "payroll",
    label: "Payroll",
    description: "Payroll runs, hours, Viventium",
    icon: Wallet,
    path: "/payroll/workspace",
    group: "workspaces",
    roles: [...EXEC, "payroll_admin", "payroll_lead", "finance"],
    tabs: [
      { label: "Workspace",          path: "/payroll/workspace" },
      { label: "Queue",              path: "/payroll/queue" },
      { label: "Hours / Time",       path: "/payroll/time-attendance" },
      { label: "Adjustments",        path: "/payroll/adjustments" },
      { label: "Issues",             path: "/payroll/issues" },
      { label: "PTO",                path: "/payroll/pto" },
      { label: "Benefits",           path: "/payroll/benefits" },
      { label: "Tax Documents",      path: "/payroll/tax-documents" },
      { label: "Compliance",         path: "/payroll/compliance" },
      { label: "Profiles",           path: "/payroll/profiles" },
      { label: "Messages",           path: "/payroll/messages" },
      { label: "Resources",          path: "/payroll/resources" },
    ],
  },
  {
    id: "billing-credentialing",
    label: "Billing / Finance",
    description: "Claims, payors, credentialing",
    icon: IdCard,
    path: "/billing-finance",
    group: "workspaces",
    roles: [...EXEC, "finance", "billing_lead", "credentialing_lead", "rcm_team", "finance_benefits_lead"],
    tabs: [
      { label: "Billing Queue",   path: "/billing-finance" },
      { label: "Credentialing",   path: tab("/billing-finance", "credentialing") },
      { label: "Payer Problems",  path: tab("/billing-finance", "payer-problems") },
      { label: "Reports",         path: tab("/billing-finance", "reports") },
    ],
  },
  {
    id: "state-command",
    label: "State Director",
    description: "State-level operations",
    icon: MapPin,
    path: "/state-director",
    group: "workspaces",
    roles: [...EXEC, "state_director"],
    tabs: [
      { label: "State Work Queue",    path: "/state-director" },
      { label: "Pipeline",            path: tab("/state-director", "pipeline") },
      { label: "Intake Visibility",   path: tab("/state-director", "intake") },
      { label: "Staffing",            path: tab("/state-director", "staffing") },
      { label: "Escalations",         path: tab("/state-director", "escalations") },
      { label: "Local Relationships", path: tab("/state-director", "relationships") },
      { label: "Resources",           path: tab("/state-director", "resources") },
    ],
  },
  {
    id: "assistant-state-director",
    label: "State Director Assistant",
    description: "State support queue, escalations & follow-ups",
    icon: Compass,
    path: "/state-operations",
    group: "workspaces",
    roles: [...ADMIN_ONLY, "assistant_state_director"],
    tabs: [
      { label: "State Support Dashboard", path: "/state-operations" },
      { label: "Intake Support",          path: "/intake/dashboard" },
      { label: "State Task Queue",        path: "/ops/tasks" },
      { label: "Escalations",             path: "/ops/state-escalations" },
      { label: "Staffing Support",        path: "/ops/staffing" },
      { label: "Scheduling Support",      path: "/ops/scheduling" },
      { label: "Authorization Support",   path: "/authorizations" },
      { label: "Resources",               path: "/resource-library" },
      { label: "Reports",                 path: "/reports" },
    ],
  },
  {
    id: "bcba",
    label: "BCBA",
    description: "Clients, plans, supervision",
    icon: UserCheck,
    path: "/bcba",
    group: "workspaces",
    roles: [...ADMIN_ONLY, "bcba", "clinical_lead"],
    tabs: [
      { label: "My Clients", path: "/bcba" },
      { label: "Assessments", path: tab("/bcba", "assessments") },
      { label: "Treatment Plans", path: tab("/bcba", "treatment-plans") },
      { label: "Auth / Reports Needed", path: tab("/bcba", "reports-needed") },
      { label: "Supervision", path: tab("/bcba", "supervision") },
      { label: "Parent Training", path: tab("/bcba", "parent-training") },
      { label: "Resources", path: tab("/bcba", "resources") },
    ],
  },
  {
    id: "rbt",
    label: "RBT",
    description: "Day-of session support",
    icon: Brain,
    path: "/rbt/my-day",
    group: "workspaces",
    roles: [...ADMIN_ONLY, "rbt"],
    tabs: [
      { label: "My Day", path: "/rbt/my-day" },
      { label: "Schedule", path: tab("/rbt/my-day", "schedule") },
      { label: "Clients", path: tab("/rbt/my-day", "clients") },
      { label: "Session Support", path: tab("/rbt/my-day", "session-support") },
      { label: "Training", path: tab("/rbt/my-day", "training") },
      { label: "Messages", path: tab("/rbt/my-day", "messages") },
      { label: "Resources", path: tab("/rbt/my-day", "resources") },
    ],
  },
  {
    id: "training-admin",
    label: "Training Admin",
    description: "Academy administration",
    icon: Sparkles,
    path: "/academy?role=admin",
    group: "workspaces",
    roles: [...ADMIN_ONLY, "hr_lead", "hr_manager", "training_admin"],
    tabs: [
      { label: "Training Dashboard", path: "/academy?role=admin" },
      { label: "Assignments", path: "/academy?role=admin&tab=assignments" },
      { label: "Courses", path: "/academy?role=admin&tab=courses" },
      { label: "Completion Tracking", path: "/academy?role=admin&tab=completion" },
      { label: "Role Tracks", path: "/academy?role=admin&tab=tracks" },
      { label: "Resource Library", path: "/academy?role=admin&tab=resources" },
    ],
  },

  // ---------- Knowledge ----------
  {
    id: "training",
    label: "Training & Resources",
    description: "Academy, courses, resource hub",
    icon: GraduationCap,
    path: "/academy",
    group: "knowledge",
    roles: EVERYONE,
    tabs: [
      { label: "Academy", path: "/academy" },
      { label: "My Learning", path: "/my-learning" },
      { label: "Catalog", path: "/catalog" },
      { label: "Resource Hub", path: "/resources" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    description: "Operational reports",
    icon: FileText,
    path: "/reports",
    group: "knowledge",
    roles: EVERYONE,
  },

  // ---------- System ----------
  {
    id: "admin",
    label: "Admin / Settings",
    description: "Users, permissions, settings",
    icon: Settings,
    path: "/admin",
    group: "system",
    roles: ADMIN_ONLY,
    tabs: [
      { label: "Users & Roles",       path: "/team" },
      { label: "Departments",         path: "/blossom/departments" },
      { label: "Permissions",         path: "/admin/permissions" },
      { label: "Integrations",        path: "/admin/integrations" },
      { label: "Automations",         path: "/automations" },
      { label: "Data Health",         path: tab("/admin", "data-health") },
      { label: "Audit Log",           path: "/admin/role-audit" },
      { label: "System Settings",     path: "/settings" },
      { label: "Blossom OS Roadmap",  path: tab("/coo", "roadmap") },
    ],
  },
];

/** Legacy / deep routes. Surfaced only to super admins, in a collapsed group. */
export interface LegacyLink {
  label: string;
  path: string;
}

export const LEGACY_GROUPS: { title: string; items: LegacyLink[] }[] = [
  {
    title: "Legacy Workspace Pages",
    items: [
      { label: "Executive (legacy)",        path: "/executive" },
      { label: "Operations (legacy)",       path: "/operations" },
      { label: "Marketing (legacy)",        path: "/marketing" },
      { label: "Intake (legacy)",           path: "/intake-coordinator" },
      { label: "Authorizations (legacy)",   path: "/auth-workspace" },
      { label: "QA (legacy)",               path: "/qa-team" },
      { label: "Scheduling (legacy)",       path: "/scheduling-workspace" },
      { label: "Recruiting (legacy)",       path: "/recruiting/workspace" },
      { label: "HR (legacy)",               path: "/hr-team" },
      { label: "Billing/Finance (legacy)",  path: "/billing-finance" },
      { label: "State Director (legacy)",   path: "/state-director" },
    ],
  },
  {
    title: "Legacy Dashboards",
    items: [
      { label: "CEO & Leadership", path: "/leadership-dashboard" },
      { label: "BCBA Performance", path: "/reports/bcba-performance" },
      { label: "Clinic Dashboard", path: "/clinic-dashboard" },
      { label: "Intake (Legacy)", path: "/intake" },
      { label: "Authorizations (Legacy)", path: "/authorizations" },
      { label: "Scheduling (Legacy)", path: "/scheduling" },
      { label: "Staffing Workspace", path: "/ops/staffing" },
    ],
  },
  {
    title: "HR Suite (Legacy)",
    items: [
      { label: "HR Dashboard", path: "/hr" },
      { label: "Employees", path: "/user-management" },
      { label: "Org Chart", path: "/hr/org-chart" },
      { label: "Onboarding", path: "/hr/onboarding" },
      { label: "Reviews", path: "/hr/reviews" },
      { label: "Time Clock", path: "/hr/time-clock" },
      { label: "Hours", path: "/hr/hours" },
      { label: "Payroll", path: "/hr/payroll" },
      { label: "Reports", path: "/reports" },
      { label: "HR Settings", path: "/hr/settings" },
    ],
  },
  {
    title: "Enterprise Tools",
    items: [
      { label: "Workforce Readiness", path: "/enterprise/readiness" },
      { label: "Compliance & Audit", path: "/enterprise/compliance" },
      { label: "AI Recommendations", path: "/enterprise/recommendations" },
      { label: "SOP Intelligence", path: "/enterprise/sop-intelligence" },
      { label: "AI Course Studio", path: "/enterprise/course-studio" },
      { label: "Simulations", path: "/enterprise/simulations" },
      { label: "Automations", path: "/enterprise/automations" },
    ],
  },
  {
    title: "Operational Tools",
    items: [
      { label: "Clients", path: "/clients" },
      { label: "Clinics", path: "/clinics" },
      { label: "Pipeline", path: "/pipeline" },
      { label: "Phone System", path: "/phone" },
      { label: "Documents", path: "/documents" },
      { label: "Tasks", path: "/tasks" },
      { label: "Automations", path: "/automations" },
      { label: "Intelligence", path: "/intelligence" },
      { label: "KPI Tracking", path: "/kpi" },
      { label: "User Management", path: "/team" },
      { label: "Role Audit Log", path: "/admin/role-audit" },
      { label: "Integrations", path: "/admin/integrations" },
      { label: "Blossom OS Insights", path: "/admin/ai" },
    ],
  },
];

/** Returns the workspaces that the given auth roles can see. */
export function workspacesForRoles(roles: string[], isAdmin: boolean): Workspace[] {
  if (isAdmin) return WORKSPACES;
  return WORKSPACES.filter((w) =>
    w.roles.includes("*") || w.roles.some((r) => roles.includes(r)),
  );
}