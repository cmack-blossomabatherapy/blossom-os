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
    path: "/ws/executive",
    group: "workspaces",
    roles: EXEC,
    tabs: [
      { label: "Executive Dashboard", path: "/ws/executive" },
      { label: "Risks & Escalations", path: tab("/ws/executive", "risks") },
      { label: "Bloom Growth Meetings", path: tab("/ws/executive", "meetings") },
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
    path: "/ws/operations",
    group: "workspaces",
    roles: OPS,
    tabs: [
      { label: "Operations Queue", path: "/ws/operations" },
      { label: "KPI Exceptions",   path: tab("/ws/operations", "kpi") },
      { label: "Escalations",      path: tab("/ws/operations", "escalations") },
    ],
  },
  {
    id: "marketing",
    label: "Marketing & Growth",
    description: "Campaigns, leads, attribution",
    icon: Megaphone,
    path: "/ws/marketing",
    group: "workspaces",
    roles: [...EXEC, "marketing", "marketing_team", "marketing_growth_lead"],
    tabs: [
      { label: "Lead Sources",  path: "/ws/marketing" },
      { label: "Campaigns",     path: tab("/ws/marketing", "campaigns") },
      { label: "Referral CRM",  path: tab("/ws/marketing", "referral-crm") },
    ],
  },
  {
    id: "intake",
    label: "Intake",
    description: "Leads, VOB, follow-ups",
    icon: Users,
    path: "/ws/intake",
    group: "workspaces",
    roles: [...OPS, "intake", "intake_lead", "intake_coordinator"],
    tabs: [
      { label: "Intake Queue",     path: "/ws/intake" },
      { label: "Family Follow-Up", path: tab("/ws/intake", "follow-up") },
      { label: "VOB Readiness",    path: tab("/ws/intake", "vob") },
    ],
  },
  {
    id: "finance",
    label: "Finance / Benefits",
    description: "Revenue, benefits, billing",
    icon: Wallet,
    path: "/ws/finance",
    group: "workspaces",
    roles: [...EXEC, "finance", "payroll_admin", "finance_benefits_lead", "finance_benefits_team", "payroll_lead"],
    tabs: [
      { label: "VOB Review",        path: "/ws/finance" },
      { label: "Case Approvals",    path: tab("/ws/finance", "case-approvals") },
      { label: "Payment Plans",     path: tab("/ws/finance", "payment-plans") },
    ],
  },
  {
    id: "authorizations",
    label: "Authorizations",
    description: "Auth pipeline & utilization",
    icon: ShieldCheck,
    path: "/ws/authorizations",
    group: "workspaces",
    roles: [...OPS, "auth_team", "qa", "authorization_manager", "authorization_coordinator"],
    tabs: [
      { label: "Auth Queue",     path: "/ws/authorizations" },
      { label: "Expiring Auths", path: tab("/ws/authorizations", "expiring") },
      { label: "Missing Docs",   path: tab("/ws/authorizations", "missing-docs") },
    ],
  },
  {
    id: "qa",
    label: "QA / Compliance",
    description: "Reviews, PRs, escalations",
    icon: ClipboardCheck,
    path: "/ws/qa",
    group: "workspaces",
    roles: [...OPS, "qa", "qa_director", "qa_specialist", "clinical_lead"],
    tabs: [
      { label: "QA Queue",          path: "/ws/qa" },
      { label: "Treatment Plans",   path: tab("/ws/qa", "treatment-plans") },
      { label: "Compliance Checks", path: tab("/ws/qa", "compliance") },
    ],
  },
  {
    id: "scheduling",
    label: "Scheduling & Staffing",
    description: "Coverage and staffing risks",
    icon: Calendar,
    path: "/ws/scheduling",
    group: "workspaces",
    roles: [...OPS, "scheduling", "staffing", "scheduling_lead", "scheduling_coordinator", "staffing_lead", "staffing_coordinator"],
    tabs: [
      { label: "Scheduling Queue", path: "/ws/scheduling" },
      { label: "Pending Starts",   path: tab("/ws/scheduling", "pending-starts") },
      { label: "Uncovered Hours",  path: tab("/ws/scheduling", "uncovered") },
    ],
  },
  {
    id: "recruiting",
    label: "Recruiting",
    description: "Candidates, interviews, onboarding",
    icon: Briefcase,
    path: "/ws/recruiting",
    group: "workspaces",
    roles: [...OPS, "recruiting_assistant", "hr", "hr_admin", "hr_manager", "recruiting_lead", "recruiting_coordinator", "hr_lead"],
    tabs: [
      { label: "Pipeline",    path: "/ws/recruiting" },
      { label: "Interviews",  path: tab("/ws/recruiting", "interviews") },
      { label: "Orientation", path: tab("/ws/recruiting", "orientation") },
    ],
  },
  {
    id: "hr",
    label: "HR / Payroll",
    description: "People, payroll, compliance",
    icon: HeartHandshake,
    path: "/ws/hr",
    group: "workspaces",
    roles: [...OPS, "hr", "hr_admin", "hr_manager", "payroll_admin", "hr_lead", "payroll_lead"],
    tabs: [
      { label: "Directory",          path: "/ws/hr" },
      { label: "Payroll Queue",      path: tab("/ws/hr", "payroll") },
      { label: "Viventium Readiness",path: tab("/ws/hr", "viventium") },
    ],
  },
  {
    id: "billing-credentialing",
    label: "Billing / Credentialing",
    description: "Claims, payors, credentialing",
    icon: IdCard,
    path: "/ws/billing-credentialing",
    group: "workspaces",
    roles: [...EXEC, "finance", "billing_lead", "credentialing_lead", "rcm_team", "finance_benefits_lead"],
    tabs: [
      { label: "Billing Queue",   path: "/ws/billing-credentialing" },
      { label: "Credentialing",   path: tab("/ws/billing-credentialing", "credentialing") },
      { label: "Payer Problems",  path: tab("/ws/billing-credentialing", "payer-problems") },
    ],
  },
  {
    id: "state-command",
    label: "State Director",
    description: "State-level operations",
    icon: MapPin,
    path: "/ws/state-command",
    group: "workspaces",
    roles: [...EXEC, "state_director"],
    tabs: [
      { label: "State Work Queue",    path: "/ws/state-command" },
      { label: "Pipeline",            path: tab("/ws/state-command", "pipeline") },
      { label: "Local Relationships", path: tab("/ws/state-command", "relationships") },
    ],
  },
  {
    id: "assistant-state-director",
    label: "Assistant State Director",
    description: "State work queue & follow-ups",
    icon: Compass,
    path: "/state-director?role=assistant",
    group: "workspaces",
    roles: [...ADMIN_ONLY, "assistant_state_director"],
    tabs: [
      { label: "State Work Queue", path: "/state-director?role=assistant" },
      { label: "Intake Visibility", path: "/state-director?role=assistant&tab=intake" },
      { label: "Staffing Follow-Up", path: "/state-director?role=assistant&tab=staffing" },
      { label: "Local Escalations", path: "/state-director?role=assistant&tab=escalations" },
      { label: "Family / Provider Notes", path: "/state-director?role=assistant&tab=notes" },
      { label: "State Resources", path: "/state-director?role=assistant&tab=resources" },
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
      { label: "BCBA Performance", path: "/bcba-performance-dashboard" },
      { label: "Clinic Dashboard", path: "/clinic-dashboard" },
      { label: "Intake (Legacy)", path: "/intake" },
      { label: "Authorizations (Legacy)", path: "/authorizations" },
      { label: "Scheduling (Legacy)", path: "/scheduling" },
      { label: "Staffing (Legacy)", path: "/staffing" },
    ],
  },
  {
    title: "HR Suite (Legacy)",
    items: [
      { label: "HR Dashboard", path: "/hr" },
      { label: "Employees", path: "/hr/directory" },
      { label: "Org Chart", path: "/hr/org-chart" },
      { label: "Onboarding", path: "/hr/onboarding" },
      { label: "Reviews", path: "/hr/reviews" },
      { label: "Time Clock", path: "/hr/time-clock" },
      { label: "Hours", path: "/hr/hours" },
      { label: "Payroll", path: "/hr/payroll" },
      { label: "HR Reports", path: "/hr/reports" },
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
      { label: "Blossom OS AI", path: "/admin/ai" },
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