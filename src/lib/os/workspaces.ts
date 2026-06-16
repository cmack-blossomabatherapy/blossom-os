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
      { label: "Company Scorecard", path: tab("/executive", "scorecard") },
      { label: "Growth & Revenue", path: tab("/executive", "growth") },
      { label: "Department Health", path: tab("/executive", "departments") },
      { label: "State Health", path: tab("/executive", "states") },
      { label: "Risks & Escalations", path: tab("/executive", "risks") },
      { label: "Bloom Growth Meetings", path: tab("/executive", "meetings") },
      { label: "Reports", path: tab("/executive", "reports") },
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
    path: "/operations",
    group: "workspaces",
    roles: OPS,
    tabs: [
      { label: "Operations Command Center", path: "/operations" },
      { label: "Department Updates", path: tab("/operations", "departments") },
      { label: "KPI Exceptions", path: tab("/operations", "kpi") },
      { label: "Workflow Risks", path: tab("/operations", "workflow-risks") },
      { label: "Escalations", path: tab("/operations", "escalations") },
      { label: "Meeting Prep", path: tab("/operations", "meeting-prep") },
      { label: "Resource Alignment", path: tab("/operations", "resources") },
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
      { label: "Growth Dashboard", path: "/marketing" },
      { label: "Lead Sources", path: tab("/marketing", "sources") },
      { label: "Campaigns", path: tab("/marketing", "campaigns") },
      { label: "CTM / Call Tracking", path: tab("/marketing", "ctm") },
      { label: "LeadTrap / Web Leads", path: tab("/marketing", "leadtrap") },
      { label: "Referral CRM", path: tab("/marketing", "referral-crm") },
      { label: "Attribution ROI", path: tab("/marketing", "attribution") },
      { label: "State Growth", path: tab("/marketing", "state-growth") },
      { label: "Marketing Reports", path: tab("/marketing", "reports") },
    ],
  },
  {
    id: "intake",
    label: "Intake",
    description: "Leads, VOB, follow-ups",
    icon: Users,
    path: "/intake-coordinator",
    group: "workspaces",
    roles: [...OPS, "intake", "intake_lead", "intake_coordinator"],
    tabs: [
      { label: "Intake Queue", path: "/intake-coordinator" },
      { label: "New Leads", path: tab("/intake-coordinator", "new-leads") },
      { label: "Family Follow-Up", path: tab("/intake-coordinator", "follow-up") },
      { label: "Missing Info", path: tab("/intake-coordinator", "missing-info") },
      { label: "VOB Readiness", path: tab("/intake-coordinator", "vob") },
      { label: "Intake Handoffs", path: tab("/intake-coordinator", "handoffs") },
      { label: "Intake Reports", path: tab("/intake-coordinator", "reports") },
    ],
  },
  {
    id: "finance",
    label: "Finance / Benefits",
    description: "Revenue, benefits, billing",
    icon: Wallet,
    path: "/billing-finance",
    group: "workspaces",
    roles: [...EXEC, "finance", "payroll_admin", "finance_benefits_lead", "finance_benefits_team", "payroll_lead"],
    tabs: [
      { label: "VOB Review", path: "/billing-finance" },
      { label: "Benefits", path: tab("/billing-finance", "benefits") },
      { label: "Payment Plans", path: tab("/billing-finance", "payment-plans") },
      { label: "Case Approval Queue", path: tab("/billing-finance", "case-approvals") },
      { label: "Payer Rules", path: tab("/billing-finance", "payer-rules") },
      { label: "Finance Notes", path: tab("/billing-finance", "notes") },
      { label: "Reports", path: tab("/billing-finance", "reports") },
    ],
  },
  {
    id: "authorizations",
    label: "Authorizations",
    description: "Auth pipeline & utilization",
    icon: ShieldCheck,
    path: "/auth-workspace",
    group: "workspaces",
    roles: [...OPS, "auth_team", "qa", "authorization_manager", "authorization_coordinator"],
    tabs: [
      { label: "Auth Queue", path: "/auth-workspace" },
      { label: "Initial Auth", path: tab("/auth-workspace", "initial") },
      { label: "Treatment Auth", path: tab("/auth-workspace", "treatment") },
      { label: "Reauth", path: tab("/auth-workspace", "reauth") },
      { label: "Expiring Auths", path: tab("/auth-workspace", "expiring") },
      { label: "Missing Docs", path: tab("/auth-workspace", "missing-docs") },
      { label: "Payer Portals", path: tab("/auth-workspace", "portals") },
      { label: "Auth Reports", path: tab("/auth-workspace", "reports") },
    ],
  },
  {
    id: "qa",
    label: "QA / Compliance",
    description: "Reviews, PRs, escalations",
    icon: ClipboardCheck,
    path: "/qa-team",
    group: "workspaces",
    roles: [...OPS, "qa", "qa_director", "qa_specialist", "clinical_lead"],
    tabs: [
      { label: "QA Queue", path: "/qa-team" },
      { label: "Treatment Plans", path: tab("/qa-team", "treatment-plans") },
      { label: "Progress Reports", path: tab("/qa-team", "progress-reports") },
      { label: "Missing Information", path: tab("/qa-team", "missing-info") },
      { label: "Compliance Checks", path: tab("/qa-team", "compliance") },
      { label: "BCBA Follow-Up", path: tab("/qa-team", "bcba-followup") },
      { label: "QA Reports", path: tab("/qa-team", "reports") },
    ],
  },
  {
    id: "scheduling",
    label: "Scheduling & Staffing",
    description: "Coverage and staffing risks",
    icon: Calendar,
    path: "/scheduling-workspace",
    group: "workspaces",
    roles: [...OPS, "scheduling", "staffing", "scheduling_lead", "scheduling_coordinator", "staffing_lead", "staffing_coordinator"],
    tabs: [
      { label: "Scheduling Workspace", path: "/scheduling-workspace" },
      { label: "Pending Starts", path: tab("/scheduling-workspace", "pending-starts") },
      { label: "Availability", path: tab("/scheduling-workspace", "availability") },
      { label: "Uncovered Hours", path: tab("/scheduling-workspace", "uncovered") },
      { label: "CentralReach Sync", path: tab("/scheduling-workspace", "cr-sync") },
      { label: "Staffing Needs", path: tab("/scheduling-workspace", "staffing-needs") },
      { label: "Restaffing", path: tab("/scheduling-workspace", "restaffing") },
      { label: "Reports", path: tab("/scheduling-workspace", "reports") },
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
      { label: "Recruiting Dashboard", path: "/recruiting/workspace" },
      { label: "Candidate Pipeline", path: tab("/recruiting/workspace", "pipeline") },
      { label: "Interviews", path: tab("/recruiting/workspace", "interviews") },
      { label: "Offers", path: tab("/recruiting/workspace", "offers") },
      { label: "Background Checks", path: tab("/recruiting/workspace", "background") },
      { label: "Orientation", path: tab("/recruiting/workspace", "orientation") },
      { label: "Staffing Needs", path: tab("/recruiting/workspace", "needs") },
      { label: "Recruiting Reports", path: tab("/recruiting/workspace", "reports") },
    ],
  },
  {
    id: "hr",
    label: "HR / Payroll",
    description: "People, payroll, compliance",
    icon: HeartHandshake,
    path: "/hr-team",
    group: "workspaces",
    roles: [...OPS, "hr", "hr_admin", "hr_manager", "payroll_admin", "hr_lead", "payroll_lead"],
    tabs: [
      { label: "Employee Directory", path: "/hr-team" },
      { label: "Onboarding", path: tab("/hr-team", "onboarding") },
      { label: "Training", path: tab("/hr-team", "training") },
      { label: "Compliance", path: tab("/hr-team", "compliance") },
      { label: "Reviews", path: tab("/hr-team", "reviews") },
      { label: "Payroll Queue", path: tab("/hr-team", "payroll") },
      { label: "Hours Validation", path: tab("/hr-team", "hours") },
      { label: "Viventium Readiness", path: tab("/hr-team", "viventium") },
      { label: "Reports", path: tab("/hr-team", "reports") },
    ],
  },
  {
    id: "billing-credentialing",
    label: "Billing / Credentialing",
    description: "Claims, payors, credentialing",
    icon: IdCard,
    path: "/billing-finance?view=rcm",
    group: "workspaces",
    roles: [...EXEC, "finance", "billing_lead", "credentialing_lead", "rcm_team", "finance_benefits_lead"],
    tabs: [
      { label: "Billing Queue", path: "/billing-finance?view=rcm" },
      { label: "Credentialing", path: "/billing-finance?view=rcm&tab=credentialing" },
      { label: "Claims Issues", path: "/billing-finance?view=rcm&tab=claims" },
      { label: "Payer Problems", path: "/billing-finance?view=rcm&tab=payer-problems" },
      { label: "Revenue Blockers", path: "/billing-finance?view=rcm&tab=blockers" },
      { label: "RCM Reports", path: "/billing-finance?view=rcm&tab=reports" },
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
      { label: "State Command Center", path: "/state-director" },
      { label: "State Clients", path: tab("/state-director", "clients") },
      { label: "State Pipeline", path: tab("/state-director", "pipeline") },
      { label: "Staffing Risk", path: tab("/state-director", "staffing-risk") },
      { label: "Recruiting Needs", path: tab("/state-director", "recruiting") },
      { label: "Escalations", path: tab("/state-director", "escalations") },
      { label: "State Scorecard", path: tab("/state-director", "scorecard") },
      { label: "Local Relationships", path: tab("/state-director", "relationships") },
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