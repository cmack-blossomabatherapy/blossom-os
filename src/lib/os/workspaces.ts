import {
  BarChart3, Workflow, Megaphone, Users, Wallet, ShieldCheck,
  ClipboardCheck, Calendar, Briefcase, HeartHandshake, IdCard, MapPin,
  GraduationCap, FileText, Settings, type LucideIcon,
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
const ADMIN_ONLY = ["admin"];
const EXEC = ["admin", "exec"];
const OPS = ["admin", "exec", "ops_manager"];

/**
 * Single source of truth for Blossom OS top-level navigation.
 * The sidebar, role landing and (later) workspace shells all read from here.
 * Adding a sub-page? Don't add a sidebar item — add a tab to the workspace.
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
  },
  {
    id: "operations",
    label: "Operations",
    description: "Operations command",
    icon: Workflow,
    path: "/operations",
    group: "workspaces",
    roles: OPS,
  },
  {
    id: "marketing",
    label: "Marketing & Growth",
    description: "Campaigns, leads, attribution",
    icon: Megaphone,
    path: "/marketing",
    group: "workspaces",
    roles: [...EXEC, "marketing"],
  },
  {
    id: "intake",
    label: "Intake",
    description: "Leads, VOB, follow-ups",
    icon: Users,
    path: "/intake-coordinator",
    group: "workspaces",
    roles: [...OPS, "intake"],
  },
  {
    id: "finance",
    label: "Finance / Benefits",
    description: "Revenue, benefits, billing",
    icon: Wallet,
    path: "/billing-finance",
    group: "workspaces",
    roles: [...EXEC, "finance", "payroll_admin"],
  },
  {
    id: "authorizations",
    label: "Authorizations",
    description: "Auth pipeline & utilization",
    icon: ShieldCheck,
    path: "/auth-workspace",
    group: "workspaces",
    roles: [...OPS, "auth_team", "qa"],
  },
  {
    id: "qa",
    label: "QA / Compliance",
    description: "Reviews, PRs, escalations",
    icon: ClipboardCheck,
    path: "/qa-team",
    group: "workspaces",
    roles: [...OPS, "qa"],
  },
  {
    id: "scheduling",
    label: "Scheduling & Staffing",
    description: "Coverage and staffing risks",
    icon: Calendar,
    path: "/scheduling-workspace",
    group: "workspaces",
    roles: [...OPS, "scheduling", "staffing"],
  },
  {
    id: "recruiting",
    label: "Recruiting",
    description: "Candidates, interviews, onboarding",
    icon: Briefcase,
    path: "/recruiting/workspace",
    group: "workspaces",
    roles: [...OPS, "recruiting_assistant", "hr", "hr_admin", "hr_manager"],
  },
  {
    id: "hr",
    label: "HR / Payroll",
    description: "People, payroll, compliance",
    icon: HeartHandshake,
    path: "/hr-team",
    group: "workspaces",
    roles: [...OPS, "hr", "hr_admin", "hr_manager", "payroll_admin"],
  },
  {
    id: "billing-credentialing",
    label: "Billing / Credentialing",
    description: "Claims, payors, credentialing",
    icon: IdCard,
    path: "/billing-finance?tab=credentialing",
    group: "workspaces",
    roles: [...EXEC, "finance"],
  },
  {
    id: "state-command",
    label: "State Command Center",
    description: "State-level operations",
    icon: MapPin,
    path: "/state-director",
    group: "workspaces",
    roles: [...EXEC, "state_director"],
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