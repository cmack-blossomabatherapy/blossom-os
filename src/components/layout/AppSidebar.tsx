import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, UserCheck, ShieldCheck, Calendar,
  UserPlus, ClipboardCheck, Building2, Phone, FileText,
  CheckSquare, BarChart3, Zap, UsersRound, Settings, Workflow, Briefcase,
  HeartHandshake, IdCard, Network, GraduationCap, Clock, Timer, FileSpreadsheet,
  Star, Wallet, Megaphone, BookOpen, ChevronDown, X, ChevronRight, Bell, Sparkles,
  History as HistoryIcon, Search, Compass, Lock, Bot, LogOut, Home, Library, User as UserIcon,
  Inbox, AlertTriangle, MessageSquare, Flame, Eye, Target,
  Plug,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import logo from "@/assets/blossom-logo-full.png";
import blossomMark from "@/assets/blossom-logo.png";
import logoWhite from "@/assets/blossom-logo-light.webp";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
// AppSidebar can render outside OSRoleProvider (legacy routes); tolerate missing context.
import { useOSRoleSafe } from "@/contexts/OSRoleContext";
import { ROLE_PROFILES, MODULE_ROUTES, type OSModule, type OSRole } from "@/lib/os/permissions";
import { ROLE_HOME } from "@/lib/os/roleHome";
import { type DashboardKey } from "@/data/leadershipDashboard";
import { getRoleNavigationExceptions, hasFullNavigationAccess, navPathToRoutePrefix, TRAINING_ADMIN_ROLES, ANALYTICS_ROLES, AUTOMATIONS_ROLES, COURSE_AUTHOR_ROLES } from "@/lib/navigationAccess";
import { canAccessAdminHub } from "@/lib/adminAccess";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAcademyComplete } from "@/hooks/useAcademyComplete";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ResumeOnboardingButton } from "@/components/onboarding/ResumeOnboardingButton";

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  perm: string;
  superAdminOnly?: boolean;
  /** If set, the item is only visible when the user has at least one of these roles. */
  allowedRoles?: string[];
  /** If true, the item is shown but visually disabled and non-interactive. */
  disabled?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const dashboardIcons: Record<DashboardKey, typeof LayoutDashboard> = {
  ceo: BarChart3,
  intake: Users,
  authorizations: ShieldCheck,
  scheduling: Calendar,
  staffing: UserPlus,
  clinic: Building2,
  qa: ClipboardCheck,
  finance: Wallet,
  hr: HeartHandshake,
  recruiting: Briefcase,
};

// LEGACY operations dashboards — surfaced only inside the Admin → Operations subtree.
const legacyOperationsDashboards: { title: string; items: NavItem[] } = {
  title: "Dashboards",
  items: [
    { label: "CEO & Leadership", icon: BarChart3, path: "/leadership-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "BCBA Performance", icon: BarChart3, path: "/bcba-performance-dashboard", perm: "", superAdminOnly: true },
    { label: "Intake Dashboard", icon: Users, path: "/intake-dashboard", perm: "leads.view", superAdminOnly: true },
    { label: "Authorizations Dashboard", icon: ShieldCheck, path: "/authorizations-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "Scheduling Dashboard", icon: Calendar, path: "/scheduling-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "Staffing Dashboard", icon: UserPlus, path: "/staffing-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "Clinic Dashboard", icon: Building2, path: "/clinic-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "QA Dashboard", icon: ClipboardCheck, path: "/qa-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "Finance Dashboard", icon: Wallet, path: "/finance-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "HR Dashboard", icon: HeartHandshake, path: "/hr", perm: "dashboard.view", superAdminOnly: true },
    { label: "Recruiting Dashboard", icon: Briefcase, path: "/recruiting-dashboard", perm: "dashboard.view", superAdminOnly: true },
  ],
};

// PRIMARY — academy-first navigation shown to every signed-in user.
const academySections: NavSection[] = [
  {
    title: "Academy",
    items: [
      { label: "Home", icon: Home, path: "/", perm: "" },
      { label: "Blossom Academy", icon: Compass, path: "/academy", perm: "" },
      { label: "My Learning", icon: GraduationCap, path: "/my-learning", perm: "" },
      { label: "Training Catalog", icon: BookOpen, path: "/catalog", perm: "" },
      { label: "Resource Hub", icon: Library, path: "/resources", perm: "" },
      { label: "Announcements", icon: Megaphone, path: "/announcements", perm: "" },
      { label: "Profile", icon: UserIcon, path: "/profile", perm: "" },
    ],
  },
];

// ADMIN — visible only to admin/exec/ops_manager/training_admin/hr roles.
const adminSections: NavSection[] = [
  {
    title: "Admin",
    items: [
      { label: "Admin Hub", icon: ShieldCheck, path: "/admin", perm: "" },
      { label: "User Management", icon: UsersRound, path: "/team", perm: "team.view" },
      { label: "Course Management", icon: GraduationCap, path: "/admin/training-dashboard", perm: "" },
      { label: "Assign Trainings", icon: ClipboardCheck, path: "/admin/training-assign", perm: "" },
      { label: "Training Statistics", icon: BarChart3, path: "/admin/training-statistics", perm: "" },
      { label: "Academy Editor", icon: Compass, path: "/training/academy/editor", perm: "" },
      { label: "Reporting", icon: BarChart3, path: "/reports", perm: "" },
      { label: "Academy Settings", icon: Settings, path: "/settings", perm: "", superAdminOnly: true },
      { label: "Role Audit Log", icon: HistoryIcon, path: "/admin/role-audit", perm: "" },
      { label: "Blossom OS AI", icon: Sparkles, path: "/admin/ai", perm: "", superAdminOnly: true },
      { label: "Integrations", icon: Plug, path: "/admin/integrations", perm: "", superAdminOnly: true },
    ],
  },
];

// LEGACY OPERATIONS — kept intact so admins keep access; surfaced as "Operations" group.
const operationsSections: NavSection[] = [
  {
    title: "Operations",
    items: [
      { label: "Leadership Dashboard", icon: BarChart3, path: "/leadership-dashboard", perm: "" },
      { label: "Clients", icon: UserCheck, path: "/clients", perm: "clients.view" },
      { label: "Intake", icon: Users, path: "/leads?view=queue", perm: "leads.view" },
      { label: "Authorizations", icon: ShieldCheck, path: "/authorizations", perm: "auth.view" },
      { label: "Scheduling", icon: Calendar, path: "/scheduling", perm: "scheduling.view" },
      { label: "Staffing", icon: UserPlus, path: "/staffing", perm: "staffing.view" },
      { label: "QA & Compliance", icon: ClipboardCheck, path: "/qa", perm: "qa.view" },
      { label: "Recruiting", icon: Briefcase, path: "/recruiting", perm: "recruiting.view" },
      { label: "Clinics", icon: Building2, path: "/clinics", perm: "clinics.view" },
      { label: "Pipeline", icon: Workflow, path: "/pipeline", perm: "clients.view" },
      { label: "Phone Calls", icon: Phone, path: "/phone-calls", perm: "phone.view" },
      { label: "Documents", icon: FileText, path: "/documents", perm: "documents.view" },
      { label: "Tasks", icon: CheckSquare, path: "/tasks", perm: "tasks.view" },
      { label: "Automations", icon: Zap, path: "/automations", perm: "" },
      { label: "Intelligence", icon: Bot, path: "/intelligence", perm: "" },
    ],
  },
];

// HR / Enterprise legacy groups — kept reachable for admins under Operations area.
const legacyHrSection: { title: string; items: NavItem[] } = {
  title: "HR Suite",
  items: [
    { label: "HR Dashboard", icon: HeartHandshake, path: "/hr", perm: "hr.view" },
    { label: "Welcome",      icon: Sparkles,       path: "/hr/welcome", perm: "" },
    { label: "Recognition",  icon: Star,           path: "/hr/recognition", perm: "" },
    { label: "Announcements Feed", icon: Megaphone, path: "/hr/feed", perm: "" },
    { label: "SOP Intelligence", icon: BookOpen, path: "/enterprise/sop-intelligence", perm: "" },
    { label: "AI Course Studio", icon: Sparkles, path: "/enterprise/course-studio", perm: "" },
    { label: "AI Assistant",  icon: Sparkles,       path: "/hr/assistant", perm: "hr.view" },
    { label: "Employees",    icon: IdCard,         path: "/hr/directory", perm: "hr.employees.view" },
    { label: "Org Chart",    icon: Network,        path: "/hr/org-chart", perm: "hr.employees.view" },
    { label: "Onboarding",   icon: GraduationCap,  path: "/hr/onboarding", perm: "hr.onboarding.manage" },
    { label: "Reviews",      icon: Star,           path: "/hr/reviews",   perm: "hr.reviews.view" },
    { label: "Training Admin", icon: GraduationCap, path: "/hr/training", perm: "hr.training.view", allowedRoles: TRAINING_ADMIN_ROLES },
    { label: "Time Clock",   icon: Timer,          path: "/hr/time-clock", perm: "hr.timeclock.view" },
    { label: "Hours",        icon: FileSpreadsheet,path: "/hr/hours",      perm: "hr.hours.view" },
    { label: "Payroll",      icon: Wallet,         path: "/hr/payroll",   perm: "hr.payroll.runs.view" },
    { label: "Announcements",icon: Megaphone,      path: "/hr/announcements", perm: "hr.announcements.view" },
    { label: "Resource Hub", icon: BookOpen,       path: "/hr/resources", perm: "hr.resources.view" },
    { label: "HR Reports",   icon: BarChart3,      path: "/hr/reports",   perm: "hr.reports.view" },
    { label: "Notifications",icon: Bell,           path: "/hr/notifications", perm: "hr.settings.manage" },
    { label: "HR Settings",  icon: Settings,       path: "/hr/settings",  perm: "hr.settings.manage", superAdminOnly: true },
  ],
};

const legacyEnterpriseSection: { title: string; items: NavItem[] } = {
  title: "Enterprise",
  items: [
    { label: "Workforce Readiness", icon: BarChart3, path: "/enterprise/readiness", perm: "", allowedRoles: ANALYTICS_ROLES },
    { label: "Compliance & Audit", icon: ShieldCheck, path: "/enterprise/compliance", perm: "", allowedRoles: ANALYTICS_ROLES },
    { label: "AI Recommendations", icon: Sparkles, path: "/enterprise/recommendations", perm: "", allowedRoles: ANALYTICS_ROLES },
    { label: "SOP Intelligence", icon: BookOpen, path: "/enterprise/sop-intelligence", perm: "", allowedRoles: COURSE_AUTHOR_ROLES },
    { label: "AI Course Studio", icon: Sparkles, path: "/enterprise/course-studio", perm: "", allowedRoles: COURSE_AUTHOR_ROLES },
    { label: "Simulations", icon: Compass, path: "/enterprise/simulations", perm: "", allowedRoles: COURSE_AUTHOR_ROLES },
    { label: "Automations", icon: Zap, path: "/enterprise/automations", perm: "automations.view", allowedRoles: AUTOMATIONS_ROLES },
  ],
};

const mobileSectionDescriptions: Record<string, string> = {
  Academy: "Onboarding, training, and growth",
  Admin: "Manage users, courses, and reporting",
  Operations: "Legacy operations workspace",
  Dashboards: "Real-time insights and performance",
  "HR Suite": "People, payroll, and compliance",
  Enterprise: "Workforce intelligence",
};

const mobileItemDescriptions: Record<string, string> = {
  Training: "Courses and onboarding",
  "Resource Hub": "Guides and internal tools",
};

/** Minimal icon/label catalog for OS modules — used when building a generic
 *  sidebar for an impersonated role that does not have a curated section. */
const MODULE_NAV_META: Partial<Record<OSModule, { label: string; icon: typeof LayoutDashboard }>> = {
  dashboard: { label: "Dashboard", icon: LayoutDashboard },
  command_center: { label: "Command Center", icon: Compass },
  leads: { label: "Leads", icon: Users },
  clients: { label: "Clients", icon: UserCheck },
  staff: { label: "Staff", icon: UsersRound },
  scheduling: { label: "Scheduling", icon: Calendar },
  intake: { label: "Intake", icon: Users },
  cases: { label: "Cases", icon: ClipboardCheck },
  authorizations: { label: "Authorizations", icon: ShieldCheck },
  recruiting: { label: "Recruiting", icon: Briefcase },
  credentialing: { label: "Credentialing", icon: IdCard },
  employee_ops: { label: "Employee Ops", icon: HeartHandshake },
  evaluations: { label: "Evaluations", icon: Star },
  billing: { label: "Billing", icon: Wallet },
  payroll: { label: "Payroll", icon: Wallet },
  revenue: { label: "Revenue", icon: BarChart3 },
  insurance: { label: "Insurance", icon: ShieldCheck },
  reports: { label: "Reports", icon: BarChart3 },
  kpi: { label: "KPI Scorecards", icon: BarChart3 },
  vob: { label: "VOB Decision Center", icon: ClipboardCheck },
  workflows: { label: "Workflows", icon: Workflow },
  sop: { label: "SOPs", icon: BookOpen },
  marketing: { label: "Marketing", icon: Megaphone },
  analytics_hub: { label: "Analytics", icon: BarChart3 },
  marketing_dashboard: { label: "Marketing Dashboard", icon: Megaphone },
  campaigns: { label: "Campaigns", icon: Megaphone },
  lead_sources: { label: "Lead Sources", icon: Inbox },
  seo_content: { label: "SEO & Content", icon: BookOpen },
  referrals: { label: "Referrals", icon: HeartHandshake },
  recruiting_marketing: { label: "Recruiting Marketing", icon: Briefcase },
  state_growth: { label: "State Growth", icon: BarChart3 },
  reputation: { label: "Reputation", icon: Star },
  community_outreach: { label: "Community Outreach", icon: Megaphone },
  marketing_reports: { label: "Marketing Reports", icon: BarChart3 },
  web_analytics: { label: "Web Analytics", icon: BarChart3 },
  call_tracking: { label: "Call Tracking", icon: Phone },
  attribution_roi: { label: "Attribution & ROI", icon: BarChart3 },
  ai_assistant: { label: "Ask Blossom AI", icon: Sparkles },
  ai_insights: { label: "AI Insights", icon: Sparkles },
  automation_center: { label: "Automation Center", icon: Zap },
  predictive_alerts: { label: "Predictive Alerts", icon: AlertTriangle },
  ai_workflows: { label: "AI Workflows", icon: Workflow },
  training: { label: "Training", icon: GraduationCap },
  hr: { label: "HR", icon: HeartHandshake },
  user_management: { label: "User Management", icon: UsersRound },
  state_management: { label: "State Management", icon: Network },
  settings: { label: "Settings", icon: Settings },
  permissions: { label: "Permissions", icon: Lock },
  data_uploads: { label: "Data Uploads", icon: FileSpreadsheet },
};

/** Build a generic sidebar for an impersonated OS role that has no curated nav. */
function buildGenericRoleSections(role: OSRole): NavSection[] {
  const homePath = ROLE_HOME[role] ?? "/";
  const modules = ROLE_PROFILES[role].modules;
  const workspace: NavItem[] = modules
    .filter((m) => m !== "dashboard")
    .map((m) => {
      const meta = MODULE_NAV_META[m];
      if (!meta) return null;
      return { label: meta.label, icon: meta.icon, path: MODULE_ROUTES[m], perm: "" };
    })
    .filter((x): x is NavItem => !!x);
  return [
    {
      title: "Home",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, path: homePath, perm: "" },
        { label: "Training Academy", icon: GraduationCap, path: "/academy", perm: "" },
      ],
    },
    ...(workspace.length ? [{ title: "Workspace", items: workspace }] : []),
  ];
}

const roleLabels: Record<string, string> = {
  admin: "Super Admin / Systems",
  exec: "Executive",
  ops_manager: "Operations Leadership",
  intake: "Intake Team",
  finance: "Financial / Benefits",
  auth_team: "Authorization Team",
  qa: "QA Team",
  staffing: "Staffing Team",
  scheduling: "Scheduling Team",
  clinic: "Clinic Team",
  payroll_admin: "Finance / Payroll",
  hr: "HR / People Ops",
  hr_admin: "HR Admin",
  hr_manager: "HR Manager",
  recruiting_assistant: "Recruiting Team",
  state_director: "State Leadership",
  clinic_director: "Clinic Director",
  dept_manager: "Department Manager",
  training_admin: "Training Admin",
  rbt: "RBT (Registered Behavior Technician)",
  bcba: "BCBA (Board Certified Behavior Analyst)",
  staff: "Staff",
  viewer: "Viewer",
};

export function AppSidebar({ mobileOpen = false, onMobileOpenChange }: { mobileOpen?: boolean; onMobileOpenChange?: (open: boolean) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPerm, isAdmin, user, roles, signOut } = useAuth();
  const osCtx = useOSRoleSafe();
  const osRole = osCtx?.role ?? null;
  // Super admin is impersonating another role via the View-as-Role switcher.
  const impersonating = !!(isAdmin && osRole && osRole !== "super_admin");
  const SIDEBAR_SECTIONS_KEY = "sidebar-open-sections";
  const DEFAULT_OPEN_SECTIONS = ["Dashboards", "Academy", "Admin"];
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set(DEFAULT_OPEN_SECTIONS);
    try {
      const raw = localStorage.getItem(SIDEBAR_SECTIONS_KEY);
      if (raw) return new Set<string>(JSON.parse(raw));
    } catch { /* ignore */ }
    return new Set(DEFAULT_OPEN_SECTIONS);
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(SIDEBAR_SECTIONS_KEY, JSON.stringify(Array.from(openSections))); } catch { /* ignore */ }
  }, [openSections]);
  useEffect(() => {
    const handler = () => {
      try { localStorage.removeItem(SIDEBAR_SECTIONS_KEY); } catch { /* ignore */ }
      setOpenSections(new Set(DEFAULT_OPEN_SECTIONS));
      setMobileOpenSections(new Set());
    };
    window.addEventListener("sidebar:reset-layout", handler);
    return () => window.removeEventListener("sidebar:reset-layout", handler);
  }, []);
  const [mobileOpenSections, setMobileOpenSections] = useState<Set<string>>(new Set());
  const [navQuery, setNavQuery] = useState("");
  const [mobileNavQuery, setMobileNavQuery] = useState("");
  // Admin roles see the Admin + Operations groups; everyone sees the Academy group.
  // When impersonating, the super admin's own admin/operations menus are hidden so
  // the view is a true mirror of the selected role.
  const showAdmin = !impersonating && canAccessAdminHub(user, roles);
  // Executives get a curated menu: Academy + Admin + only the BCBA Performance
  // dashboard. They do NOT see the legacy Operations/HR/Enterprise groups.
  const isExecOnly =
    osRole === "executive_leadership" ||
    (!impersonating && roles.includes("exec") && !roles.includes("admin") && !roles.includes("ops_manager"));
  const showOperations =
    !impersonating && !isExecOnly && roles.some((r) => ["admin", "exec", "ops_manager"].includes(r));
  // Scheduling Team gets a curated operational menu focused on staffing & scheduling.
  // Match either the auth role or the demo OS role override (super admin impersonation).
  const isSchedulingOnly =
    osRole === "scheduling_team" ||
    (roles.includes("scheduling") && !roles.includes("admin") && !roles.includes("exec") && !roles.includes("ops_manager"));
  // BCBA gets a curated clinical menu focused on their caseload.
  const isBcbaOnly =
    osRole === "bcba" ||
    (roles.includes("bcba") && !roles.includes("admin") && !roles.includes("exec") && !roles.includes("ops_manager"));
  // QA Team gets a curated operational menu focused on auth/PR review, client oversight,
  // BCBA coordination, escalations, and supervision visibility.
  const isQaOnly =
    osRole === "qa_team" ||
    (roles.includes("qa") && !roles.includes("admin") && !roles.includes("exec") && !roles.includes("ops_manager"));
  // Recruiting Team gets a curated operational menu focused on candidates,
  // interviews, onboarding, orientation, and staffing coordination.
  const isRecruitingOnly =
    osRole === "recruiting_team" ||
    (roles.includes("recruiting_assistant") && !roles.includes("admin") && !roles.includes("exec") && !roles.includes("ops_manager"));
  // HR Team gets a curated people-ops menu focused on new hires, training,
  // orientation, evaluations, requests, compliance, and employee support.
  const isHrOnly =
    osRole === "hr_team" ||
    ((roles.includes("hr") || roles.includes("hr_admin") || roles.includes("hr_manager"))
      && !roles.includes("admin") && !roles.includes("exec") && !roles.includes("ops_manager"));
  void getRoleNavigationExceptions; void hasFullNavigationAccess; void navPathToRoutePrefix;
  void TRAINING_ADMIN_ROLES; void ANALYTICS_ROLES; void AUTOMATIONS_ROLES; void COURSE_AUTHOR_ROLES;
  const { complete: academyComplete } = useAcademyComplete();
  void academyComplete;

  // Trimmed Dashboards group shown to Executive: only BCBA Performance.
  const execDashboardsSection: NavSection = {
    title: "Dashboards",
    items: [
      { label: "BCBA Performance", icon: BarChart3, path: "/bcba-performance-dashboard", perm: "" },
    ],
  };

  // Reusable Operations & Intelligence section — surfaced in every curated role nav.
  const intelligenceSection: NavSection = {
    title: "Operations & Intelligence",
    items: [
      { label: "KPI Tracking", icon: Target, path: "/kpi", perm: "" },
    ],
  };

  // Scheduling Team curated sections.
  const schedulingSections: NavSection[] = [
    {
      title: "Home",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, path: "/scheduling-team", perm: "" },
        { label: "Scheduling Workspace", icon: Workflow, path: "/scheduling-workspace", perm: "" },
        { label: "Training Academy", icon: GraduationCap, path: "/academy", perm: "" },
      ],
    },
    {
      title: "Staffing & Scheduling",
      items: [
        { label: "Staffing Queue", icon: UserPlus, path: "/staffing", perm: "" },
        { label: "Scheduling", icon: Calendar, path: "/scheduling", perm: "" },
        { label: "Clients", icon: UserCheck, path: "/clients", perm: "" },
        { label: "BCBA / RBT", icon: UsersRound, path: "/bcba", perm: "" },
        { label: "Authorizations", icon: ShieldCheck, path: "/authorizations", perm: "" },
      ],
    },
    intelligenceSection,
    {
      title: "Resources",
      items: [
        { label: "Resource Library", icon: Library, path: "/bcba/resources", perm: "" },
      ],
    },
    {
      title: "AI",
      items: [
        { label: "Ask Blossom AI", icon: Sparkles, path: "/ai/assistant", perm: "" },
      ],
    },
  ];

  // BCBA curated sections.
  const bcbaSections: NavSection[] = [
    {
      title: "Home",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, path: "/bcba", perm: "" },
        { label: "BCBA Workspace", icon: Workflow, path: "/bcba/workspace", perm: "" },
        { label: "Training Academy", icon: GraduationCap, path: "/training/journeys/bcba", perm: "" },
      ],
    },
    {
      title: "Clients & Clinical",
      items: [
        { label: "Clients", icon: UserCheck, path: "/bcba/clients", perm: "" },
        { label: "Authorizations", icon: ShieldCheck, path: "/bcba/authorizations", perm: "" },
        { label: "Supervision", icon: ClipboardCheck, path: "/bcba/supervision", perm: "" },
        { label: "Parent Training", icon: HeartHandshake, path: "/bcba/parent-training", perm: "" },
        { label: "Scheduling", icon: Calendar, path: "/bcba/scheduling", perm: "" },
      ],
    },
    intelligenceSection,
    {
      title: "Resources",
      items: [
        { label: "Resource Library", icon: Library, path: "/bcba/resources", perm: "" },
      ],
    },
    {
      title: "AI",
      items: [
        { label: "Ask Blossom AI", icon: Sparkles, path: "/ai/assistant", perm: "" },
      ],
    },
  ];

  // QA Team curated sections.
  const qaSections: NavSection[] = [
    {
      title: "Home",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, path: "/qa-team", perm: "" },
        { label: "QA Workspace", icon: Workflow, path: "/qa-workspace", perm: "" },
        { label: "Training Academy", icon: GraduationCap, path: "/academy", perm: "" },
      ],
    },
    {
      title: "Reviews & Workflows",
      items: [
        { label: "QA Queue", icon: Inbox, path: "/qa-queue", perm: "" },
        { label: "Authorization Reviews", icon: ShieldCheck, path: "/authorization-reviews", perm: "" },
        { label: "Progress Reports", icon: FileText, path: "/progress-reports", perm: "" },
        { label: "Treatment Plan Reviews", icon: ClipboardCheck, path: "/treatment-plan-reviews", perm: "" },
        { label: "Missing Information", icon: AlertTriangle, path: "/missing-information", perm: "" },
        { label: "Expiring Items", icon: Clock, path: "/expiring-items", perm: "" },
      ],
    },
    {
      title: "Client Oversight",
      items: [
        { label: "Clients", icon: UserCheck, path: "/qa-clients", perm: "" },
        { label: "Assigned BCBAs", icon: UsersRound, path: "/assigned-bcbas", perm: "" },
        { label: "Supervision Visibility", icon: Eye, path: "/supervision-visibility", perm: "" },
      ],
    },
    {
      title: "Communication",
      items: [
        { label: "Messages & Updates", icon: MessageSquare, path: "/qa-messages", perm: "" },
        { label: "Escalations & Follow-Ups", icon: Flame, path: "/escalations-followups", perm: "" },
      ],
    },
    {
      title: "Reports",
      items: [
        { label: "BCBA Performance", icon: BarChart3, path: "/reports/bcba-performance", perm: "" },
      ],
    },
    {
      title: "Operations & Intelligence",
      items: [
        { label: "KPI Tracking", icon: Target, path: "/kpi", perm: "" },
      ],
    },
    {
      title: "Resources",
      items: [
        { label: "Resource Library", icon: Library, path: "/qa/resources", perm: "" },
      ],
    },
    {
      title: "AI",
      items: [
        { label: "Ask Blossom AI", icon: Sparkles, path: "/ai/assistant", perm: "" },
      ],
    },
  ];

  // Recruiting Team curated sections.
  const recruitingSections: NavSection[] = [
    {
      title: "Home",
      items: [
        { label: "Dashboard",            icon: LayoutDashboard, path: "/recruiting-team",       perm: "" },
        { label: "Recruiting Workspace", icon: Workflow,        path: "/recruiting/workspace",  perm: "" },
        { label: "Training Academy",     icon: GraduationCap,   path: "/recruiting/academy",    perm: "" },
      ],
    },
    {
      title: "Candidates",
      items: [
        { label: "Applicant Pipeline", icon: Inbox,         path: "/recruiting/pipeline",     perm: "" },
        { label: "Interviews",         icon: Calendar,      path: "/recruiting/interviews",   perm: "" },
        { label: "Offers & Hiring",    icon: FileText,      path: "/recruiting/offers",       perm: "" },
        { label: "Onboarding Status",  icon: GraduationCap, path: "/recruiting/onboarding",   perm: "" },
        { label: "Background Checks",  icon: ShieldCheck,   path: "/recruiting/background",   perm: "" },
        { label: "Orientation Queue",  icon: Clock,         path: "/recruiting/orientation",  perm: "" },
      ],
    },
    {
      title: "Staffing & Operations",
      items: [
        { label: "Open Staffing Needs",    icon: AlertTriangle, path: "/recruiting/staffing-needs",  perm: "" },
        { label: "RBT Recruiting",         icon: UserPlus,      path: "/recruiting/rbt",             perm: "" },
        { label: "BCBA Recruiting",        icon: UsersRound,    path: "/recruiting/bcba",            perm: "" },
        { label: "Recruiting Performance", icon: BarChart3,     path: "/recruiting/performance",     perm: "" },
        { label: "Hiring Follow-Ups",      icon: CheckSquare,   path: "/recruiting/follow-ups",      perm: "" },
      ],
    },
    {
      title: "Communication",
      items: [
        { label: "Messages & Updates",       icon: MessageSquare, path: "/recruiting/messages",     perm: "" },
        { label: "Escalations & Follow-Ups", icon: Flame,         path: "/recruiting/escalations",  perm: "" },
      ],
    },
    intelligenceSection,
    {
      title: "Resources",
      items: [
        { label: "Resource Library", icon: Library, path: "/recruiting/resources", perm: "" },
      ],
    },
    {
      title: "AI",
      items: [
        { label: "Ask Blossom AI", icon: Sparkles, path: "/ai/assistant", perm: "" },
      ],
    },
  ];

  const hrSections: NavSection[] = [
    {
      title: "Home",
      items: [
        { label: "Dashboard",        icon: LayoutDashboard, path: "/hr-team",       perm: "" },
        { label: "HR Workspace",     icon: Workflow,        path: "/hr/workspace",  perm: "" },
        { label: "Training Academy", icon: GraduationCap,   path: "/hr/training-academy", perm: "" },
      ],
    },
    {
      title: "People",
      items: [
        { label: "New Hires",                 icon: UserPlus,       path: "/hr/new-hires",                perm: "" },
        { label: "Employee Support",          icon: HeartHandshake, path: "/hr/employee-support",         perm: "" },
        { label: "Training & Certifications", icon: GraduationCap,  path: "/hr/training-certifications",  perm: "" },
        { label: "Evaluations & Growth",      icon: ClipboardCheck, path: "/hr/evaluations",              perm: "" },
      ],
    },
    {
      title: "Operations",
      items: [
        { label: "Orientation Queue",      icon: Clock,        path: "/hr/orientation-queue", perm: "" },
        { label: "HR Requests",            icon: Inbox,        path: "/hr/requests",          perm: "" },
        { label: "Compliance & Documents", icon: ShieldCheck,  path: "/hr/compliance",        perm: "" },
      ],
    },
    {
      title: "Communication",
      items: [
        { label: "Messages & Updates", icon: MessageSquare, path: "/hr/messages", perm: "" },
      ],
    },
    {
      title: "Resources",
      items: [
        { label: "Resource Library", icon: Library, path: "/hr/resources", perm: "" },
      ],
    },
    {
      title: "AI",
      items: [
        { label: "Ask Blossom AI", icon: Sparkles, path: "/ai/assistant", perm: "" },
      ],
    },
  ];

  const allSections: NavSection[] = isExecOnly
    ? [
        execDashboardsSection,
        ...academySections,
        ...(showAdmin ? adminSections : []),
      ]
    : isSchedulingOnly
    ? schedulingSections
    : isBcbaOnly
    ? bcbaSections
    : isQaOnly
    ? qaSections
    : isRecruitingOnly
    ? recruitingSections
    : isHrOnly
    ? hrSections
    : impersonating && osRole
    ? buildGenericRoleSections(osRole)
    : [
        ...academySections,
        ...(showAdmin ? adminSections : []),
        ...(showOperations ? operationsSections : []),
        ...(showOperations ? [legacyOperationsDashboards, legacyHrSection, legacyEnterpriseSection] : []),
      ];

  const baseSections = allSections
    .map((s) => {
      const isEnterprise = s.title === "Enterprise";
      return {
        ...s,
        items: s.items
          .map((item) => {
            const accessible = item.superAdminOnly ? isAdmin : true; // TEMP unlocked for system audit
            void item.perm; void item.allowedRoles;
            void hasPerm; void roles;
            if (isEnterprise) {
              return { ...item, disabled: !accessible };
            }
            return accessible ? item : null;
          })
          .filter(Boolean) as NavItem[],
      };
    })
    .filter((s) => s.items.length > 0);

  const filterSectionsByQuery = (q: string) => {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) return baseSections;
    return baseSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          item.label.toLowerCase().includes(trimmed) ||
          (section.title ?? "").toLowerCase().includes(trimmed),
        ),
      }))
      .filter((s) => s.items.length > 0);
  };

  const sections = useMemo(() => filterSectionsByQuery(navQuery), [baseSections, navQuery]);
  const mobileSections = useMemo(() => filterSectionsByQuery(mobileNavQuery), [baseSections, mobileNavQuery]);

  const submitNavSearch = (q: string, isMobile: boolean) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !q.trim()) return;
    // Jump to the first matching nav item (skipping locked/disabled entries).
    const pool = isMobile ? mobileSections : sections;
    const firstHit = pool.flatMap((s) => s.items).find((i) => !i.disabled);
    if (firstHit) {
      navigate(firstHit.path);
      if (isMobile) {
        onMobileOpenChange?.(false);
        setMobileNavQuery("");
      } else {
        setNavQuery("");
      }
      return;
    }
    // No menu match → fall back to the trainings search page.
    navigate(`/training?q=${encodeURIComponent(q.trim())}`);
    if (isMobile) onMobileOpenChange?.(false);
  };

  const isItemActive = (path: string) => {
    if (path === "/hr") {
      return location.pathname === "/hr";
    }
    if (path === "/hr/directory") {
      return location.pathname === "/hr/directory" || location.pathname.startsWith("/hr/employees/");
    }
    if (path.startsWith("/leadership-dashboard?")) {
      const itemDashboard = new URLSearchParams(path.split("?")[1]).get("dashboard");
      const currentDashboard = new URLSearchParams(location.search).get("dashboard");
      return location.pathname === "/leadership-dashboard" && itemDashboard === currentDashboard;
    }
    if (path.startsWith("/leads?")) {
      return location.pathname === "/leads";
    }
    if (path.startsWith("/authorizations?")) {
      const itemType = new URLSearchParams(path.split("?")[1]).get("type");
      const currentType = new URLSearchParams(location.search).get("type") ?? "initial";
      return location.pathname.startsWith("/authorizations") && itemType === currentType;
    }
    if (path === "/assessments") {
      return location.pathname.startsWith("/assessments");
    }
    if (path === "/enterprise/simulations") {
      return location.pathname === "/enterprise/simulations" || location.pathname.startsWith("/enterprise/simulations/");
    }
    return location.pathname === path || `${location.pathname}${location.search}` === path;
  };
  const toggleSection = (title: string) => {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const activeSectionTitles = new Set(baseSections.filter((section) => section.title && section.items.some((item) => isItemActive(item.path))).map((section) => section.title!));
  const toggleMobileSection = (title: string) => setMobileOpenSections((current) => { const next = new Set(current); if (next.has(title)) next.delete(title); else next.add(title); return next; });
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0]?.replace(/[._-]/g, " ") || "Blossom User";
  const initials = displayName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "BU";
  const roleLabel = roles.map((role) => roleLabels[role]).find(Boolean) || "Operations Director";

  useEffect(() => {
    if (mobileOpen) setMobileOpenSections(activeSectionTitles);
  }, [location.pathname, location.search, mobileOpen]);

  useEffect(() => {
    if (mobileNavQuery.trim()) setMobileOpenSections(new Set(mobileSections.map((s) => s.title ?? "")));
  }, [mobileNavQuery, mobileSections]);

  return (
    <>
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="right" className="mobile-menu-sheet flex h-dvh w-[92vw] max-w-[380px] flex-col overflow-hidden border-0 bg-background p-0 md:hidden">
          <header className="relative shrink-0 overflow-hidden border-b border-border/60 px-5 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--primary)/0.08)_0%,hsl(var(--accent)/0.06)_60%,transparent_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_-10%,hsl(var(--primary)/0.18),transparent_55%),radial-gradient(circle_at_-10%_110%,hsl(var(--accent)/0.14),transparent_50%)]" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
            <div className="relative flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => { navigate("/"); onMobileOpenChange?.(false); }}
                className="group flex min-w-0 items-center gap-1 rounded-2xl px-1 py-1 -ml-1 transition active:scale-[0.98]"
                aria-label="Go to home"
              >
                <img
                  src={blossomMark}
                  alt="Blossom ABA Therapy"
                  className="h-12 w-auto object-contain drop-shadow-[0_2px_10px_hsl(var(--primary)/0.18)] transition-transform group-hover:scale-[1.02]"
                />
              </button>
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full bg-card/70 text-muted-foreground shadow-sm backdrop-blur-md ring-1 ring-border/60 hover:bg-card hover:text-foreground" onClick={() => onMobileOpenChange?.(false)} aria-label="Close navigation menu">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute z-10 left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={mobileNavQuery}
                onChange={(e) => setMobileNavQuery(e.target.value)}
                onKeyDown={submitNavSearch(mobileNavQuery, true)}
                placeholder="Search menu…"
                className="h-10 rounded-xl border-border/50 bg-card/70 pl-9 text-[14px] shadow-sm backdrop-blur-md placeholder:text-muted-foreground/80 focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-primary/30"
              />
            </div>
          </header>
          <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Mobile navigation">
            <div className="mb-3 px-1">
              <ResumeOnboardingButton variant="mobile" onNavigate={() => onMobileOpenChange?.(false)} />
            </div>
            {mobileSections.map((section, i) => {
              const title = section.title ?? `Section ${i + 1}`;
              const activeInSection = section.items.some((item) => isItemActive(item.path));
              const sectionOpen = mobileOpenSections.has(title);
              const isFirst = i === 0;
              return (
              <div key={title} className={cn("animate-fade-in", !isFirst && "mt-1 pt-1")}>
                <button
                  type="button"
                  onClick={() => toggleMobileSection(title)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-secondary/40"
                  aria-expanded={sectionOpen}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</span>
                    {activeInSection && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />}
                  </span>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", !sectionOpen && "-rotate-90")} />
                </button>
                {sectionOpen && <div className="mt-0.5 space-y-0.5 px-1 pb-1 animate-fade-in">
                  {section.items.map((item) => {
                    const active = isItemActive(item.path);
                    if (item.disabled) {
                      return (
                        <button
                          key={item.path}
                          type="button"
                          aria-disabled="true"
                          className="mobile-menu-item w-full cursor-not-allowed opacity-50"
                        >
                          <span className="mobile-menu-icon"><Lock className="h-4 w-4" /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">{item.label}</span>
                            <span className="block truncate text-[11px] font-normal text-muted-foreground">Access restricted</span>
                          </span>
                        </button>
                      );
                    }
                    if (item.path === "/training" && !academyComplete) {
                      return (
                        <button
                          key={item.path}
                          type="button"
                          aria-disabled="true"
                          className="mobile-menu-item w-full cursor-not-allowed opacity-50"
                        >
                          <span className="mobile-menu-icon"><Lock className="h-4 w-4" /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">{item.label}</span>
                            <span className="block truncate text-[11px] font-normal text-muted-foreground">Locked — finish Operations Academy</span>
                          </span>
                        </button>
                      );
                    }
                    return (
                      <NavLink key={item.path} to={item.path} end={item.path === "/"} onClick={() => onMobileOpenChange?.(false)} className={cn("mobile-menu-item", active && "mobile-menu-item-active")}>
                        <span className="mobile-menu-icon"><item.icon className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{item.label}</span>
                        </span>
                        {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />}
                      </NavLink>
                    );
                  })}
                </div>}
              </div>
            );})}
            {mobileNavQuery.trim() && mobileSections.length === 0 && (
              <p className="mt-4 rounded-xl border border-dashed border-border/60 bg-card/60 p-4 text-center text-xs text-muted-foreground">
                No menu matches. Press Enter to search trainings for “{mobileNavQuery.trim()}”.
              </p>
            )}
          </nav>
          <div className="shrink-0 border-t border-border/60 bg-card/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl">
            <div className="flex items-center gap-3 rounded-xl px-2 py-2">
              <button
                type="button"
                onClick={() => { onMobileOpenChange?.(false); navigate("/profile"); }}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left transition-colors hover:bg-secondary/50 active:scale-[0.99]"
                aria-label="Open profile"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground">{initials}</div>
                <div className="min-w-0 flex-1 py-1">
                  <p className="truncate text-sm font-semibold capitalize leading-tight text-foreground">{displayName}</p>
                  <p className="truncate text-[11px] leading-tight text-muted-foreground">{roleLabel}</p>
                </div>
              </button>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Sign out"
                onClick={async () => {
                  onMobileOpenChange?.(false);
                  await signOut();
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <aside className="sidebar-shell hidden shrink-0 md:sticky md:top-0 md:flex md:h-screen md:w-60 md:flex-col">
      {/* Logo */}
      <div className="hidden h-20 items-center justify-center border-b border-sidebar-border/50 px-4 md:flex">
        <img src={logoWhite} alt="Blossom ABA Therapy" className="max-h-12 w-auto object-contain drop-shadow-[0_4px_12px_hsl(var(--sidebar-primary)/0.35)]" />
      </div>


      {/* Navigation */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        <div className="px-1">
          <ResumeOnboardingButton variant="sidebar" />
        </div>
        <div className="relative px-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 h-4 w-4 text-sidebar-primary"
            strokeWidth={2.25}
          />
          <Input
            value={navQuery}
            onChange={(e) => setNavQuery(e.target.value)}
            onKeyDown={submitNavSearch(navQuery, false)}
            placeholder="Search menu — Enter to jump"
            className="h-9 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/30 pl-10 text-xs text-sidebar-foreground placeholder:text-sidebar-muted shadow-inner backdrop-blur-md focus-visible:ring-1 focus-visible:ring-sidebar-primary"
          />
        </div>
        {sections.map((section, i) => {
          // Section open state is driven by the user's toggle. Sections without
          // a title (search results, etc.) always render open.
          const sectionOpen = !section.title || openSections.has(section.title);
          return (
          <div key={section.title ?? i}>
            {section.title && (
              <button
                type="button"
                onClick={() => toggleSection(section.title!)}
                className="mb-1.5 flex w-full items-center justify-between rounded-md px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted/80 transition-colors hover:text-sidebar-foreground"
                aria-expanded={sectionOpen}
              >
                <span>{section.title}</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform opacity-60", !sectionOpen && "-rotate-90")} />
              </button>
            )}
            {sectionOpen && <div className="grid grid-cols-3 gap-1 md:block md:space-y-0.5 md:pl-1">
              {section.items.map((item) => {
                if (item.disabled) {
                  return (
                    <Tooltip key={item.path}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => e.preventDefault()}
                          aria-disabled="true"
                          className={cn("nav-item nav-item-disabled w-full")}
                        >
                          <Lock className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Access restricted</TooltipContent>
                    </Tooltip>
                  );
                }
                if (item.path === "/training" && !academyComplete) {
                  return (
                    <Tooltip key={item.path}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => e.preventDefault()}
                          aria-disabled="true"
                          className={cn("nav-item nav-item-inactive w-full cursor-not-allowed opacity-50")}
                        >
                          <Lock className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Unlocks after you finish Operations Academy</TooltipContent>
                    </Tooltip>
                  );
                }
                return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/" || item.path === "/hr"}
                  className={({ isActive }) => {
                    const queryAwareActive = item.path.includes("?") ? isItemActive(item.path) : isActive || isItemActive(item.path);
                    return cn("nav-item", queryAwareActive ? "nav-item-active" : "nav-item-inactive");
                  }}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
                );
              })}
            </div>}
          </div>
        );
        })}
        {navQuery.trim() && sections.length === 0 && (
          <p className="rounded-md border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-[11px] text-sidebar-muted">
            No menu matches. Press Enter to search trainings.
          </p>
        )}
      </nav>
      </aside>
    </>
  );
}
