import type { AppRole } from "@/lib/roles";
import {
  canAccessRoute as rbacCanAccessRoute,
  getUserAccessProfile,
  hasPermission as rbacHasPermission,
} from "@/lib/rbac";

export interface RoleNavigationException {
  sectionTitles?: string[];
  itemPaths?: string[];
  /**
   * If set, this role only sees these intelligence items (and access to other
   * intelligence routes is denied). Used for RBT/BCBA who should only see the
   * Training Hub, not the general Training catalog or Resource Hub.
   */
  intelligenceItemPaths?: string[];
  /**
   * If set, restricts which item paths are visible within a given allowed section.
   * Map of section title -> allowed item paths within that section.
   */
  sectionItemPaths?: Record<string, string[]>;
}

export interface NavigationPreviewItem {
  label: string;
  path: string;
  perm?: string;
  superAdminOnly?: boolean;
  allowedRoles?: AppRole[];
}

export interface NavigationPreviewSection {
  title: string;
  items: NavigationPreviewItem[];
}

export const fullNavigationRoles: AppRole[] = ["admin", "exec", "ops_manager"];
export const TRAINING_ADMIN_ROLES: AppRole[] = ["admin", "training_admin", "hr", "hr_admin", "hr_manager"];

/** Roles allowed into Intelligence/analytics dashboards and cross-module scorecards. */
export const ANALYTICS_ROLES: AppRole[] = [
  "admin",
  "exec",
  "ops_manager",
  "state_director",
  "clinic_director",
  "dept_manager",
];

/** Roles allowed to author/regenerate AI-generated courses and SOP intelligence. */
export const COURSE_AUTHOR_ROLES: AppRole[] = [
  "admin",
  "ops_manager",
  "training_admin",
  "hr",
  "hr_admin",
  "hr_manager",
];

/** Roles allowed to view/run automations. */
export const AUTOMATIONS_ROLES: AppRole[] = ["admin", "ops_manager"];

/**
 * Default Intelligence-only navigation for any role that does not have a
 * specific exception and does not get full navigation. Shows just the three
 * staff-facing items: Blossom Training (locked until Academy done),
 * Operations Academy, and Resource Hub.
 */
const DEFAULT_LIMITED_INTELLIGENCE_PATHS = ["/onboarding", "/onboarding/phase/welcome", "/training", "/training/academy", "/resources", "/hr/org-chart"];
const DEFAULT_LIMITED_EXCEPTION: RoleNavigationException = {
  intelligenceItemPaths: DEFAULT_LIMITED_INTELLIGENCE_PATHS,
};

export const roleNavigationExceptions: Partial<Record<AppRole, RoleNavigationException>> = {
  // Roles below get Intelligence + the listed paths/sections (no full nav).
  training_admin: { itemPaths: ["/hr/training", "/admin/training-dashboard", "/admin/training-statistics", "/admin/training-assign"] },
  hr: {
    sectionTitles: ["HR Suite", "Phone System"],
    sectionItemPaths: {
      "HR Suite": ["/hr", "/hr/directory", "/hr/onboarding", "/hr/training", "/hr/training-academy", "/hr/resources"],
      "Phone System": ["/phone"],
    },
    intelligenceItemPaths: ["/training", "/training/academy", "/resources"],
  },
  hr_admin: {
    sectionTitles: ["HR Suite", "Phone System"],
    sectionItemPaths: {
      "HR Suite": ["/hr", "/hr/directory", "/hr/onboarding", "/hr/training", "/hr/training-academy", "/hr/resources"],
      "Phone System": ["/phone"],
    },
    intelligenceItemPaths: ["/training", "/training/academy", "/resources"],
  },
  hr_manager: {
    sectionTitles: ["HR Suite", "Phone System"],
    sectionItemPaths: {
      "HR Suite": ["/hr", "/hr/directory", "/hr/onboarding", "/hr/training", "/hr/training-academy", "/hr/resources"],
      "Phone System": ["/phone"],
    },
    intelligenceItemPaths: ["/training", "/training/academy", "/resources"],
  },
  rbt: { intelligenceItemPaths: ["/onboarding", "/onboarding/phase/welcome", "/hr/journey", "/resources", "/hr/org-chart"] },
  bcba: { intelligenceItemPaths: ["/onboarding", "/onboarding/phase/welcome", "/hr/journey", "/resources", "/hr/org-chart"] },
};

const intelligenceRoutePrefixes = ["/onboarding", "/training", "/resources", "/hr/journey", "/hr/org-chart"];

const dashboardPreviewSection: NavigationPreviewSection = {
  title: "Dashboards",
  items: [
    { label: "CEO & Leadership", path: "/leadership-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "BCBA Performance", path: "/reports/bcba-performance", superAdminOnly: true },
    { label: "Intake Dashboard", path: "/intake", perm: "leads.view", superAdminOnly: true },
    { label: "Authorizations Dashboard", path: "/authorizations", perm: "dashboard.view", superAdminOnly: true },
    { label: "Scheduling Dashboard", path: "/scheduling", perm: "dashboard.view", superAdminOnly: true },
    { label: "Staffing Dashboard", path: "/ops/staffing", perm: "dashboard.view", superAdminOnly: true },
    { label: "Clinic Dashboard", path: "/clinic-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "QA Dashboard", path: "/qa-workspace", perm: "dashboard.view", superAdminOnly: true },
    { label: "Finance Dashboard", path: "/billing-finance", perm: "dashboard.view", superAdminOnly: true },
    { label: "HR Dashboard", path: "/hr", perm: "dashboard.view", superAdminOnly: true },
    { label: "Recruiting Dashboard", path: "/recruiting/workspace", perm: "dashboard.view", superAdminOnly: true },
  ],
};

const navigationPreviewSections: NavigationPreviewSection[] = [
  { title: "Operate", items: [
    { label: "Clients", path: "/clients", perm: "clients.view" },
    { label: "Intake", path: "/leads?view=queue", perm: "leads.view" },
    { label: "Authorizations", path: "/authorizations", perm: "auth.view" },
    { label: "Scheduling", path: "/scheduling", perm: "scheduling.view" },
    { label: "Staffing", path: "/ops/staffing", perm: "staffing.view" },
    { label: "QA & Compliance", path: "/qa", perm: "qa.view" },
    { label: "Recruiting", path: "/recruiting/workspace", perm: "recruiting.view" },
    { label: "Clinics", path: "/clinics", perm: "clinics.view" },
  ] },
  { title: "Pipeline", items: [{ label: "Pipeline", path: "/pipeline", perm: "clients.view" }] },
  { title: "Phone System", items: [
    { label: "Phone Calls", path: "/phone", perm: "phone.view" },
  ] },
  { title: "Records", items: [
    { label: "Phone Calls", path: "/phone", perm: "phone.view" },
    { label: "Documents", path: "/documents", perm: "documents.view" },
    { label: "Tasks", path: "/tasks", perm: "tasks.view" },
  ] },
  { title: "Intelligence", items: [
    { label: "Welcome to Blossom", path: "/onboarding/phase/welcome" },
    { label: "Org Chart", path: "/hr/org-chart" },
    { label: "Training Hub", path: "/hr/journey", allowedRoles: ["rbt", "bcba"] },
    { label: "Training", path: "/training" },
    { label: "Resource Hub", path: "/resources" },
  ] },
  { title: "HR Suite", items: [
    { label: "HR Dashboard", path: "/hr", perm: "hr.view" },
    { label: "Employees", path: "/user-management", perm: "hr.employees.view" },
    { label: "Org Chart", path: "/hr/org-chart", perm: "hr.employees.view" },
    { label: "Onboarding", path: "/hr/onboarding", perm: "hr.onboarding.manage" },
    { label: "Reviews", path: "/hr/reviews", perm: "hr.reviews.view" },
    { label: "Training Admin", path: "/hr/training", perm: "hr.training.view" },
    { label: "Training Academy", path: "/hr/training-academy", perm: "hr.training.view" },
    { label: "Time Clock", path: "/hr/time-clock", perm: "hr.timeclock.view" },
    { label: "Hours", path: "/hr/hours", perm: "hr.hours.view" },
    { label: "Payroll", path: "/hr/payroll", perm: "hr.payroll.runs.view" },
    { label: "Announcements", path: "/hr/announcements", perm: "hr.announcements.view" },
    { label: "Resource Hub", path: "/hr/resources", perm: "hr.resources.view" },
    { label: "Reports", path: "/reports", perm: "hr.reports.view" },
    { label: "HR Settings", path: "/hr/settings", perm: "hr.settings.manage" },
  ] },
  { title: "Admin", items: [
    { label: "Team", path: "/team", perm: "team.view" },
    { label: "Training Dashboard", path: "/admin/training-dashboard", perm: "hr.training.view", allowedRoles: TRAINING_ADMIN_ROLES },
    { label: "Training Statistics", path: "/admin/training-statistics", perm: "hr.training.view", allowedRoles: TRAINING_ADMIN_ROLES },
    { label: "Assign Trainings", path: "/admin/training-assign", perm: "hr.training.assign", allowedRoles: TRAINING_ADMIN_ROLES },
    { label: "Role Audit Log", path: "/admin/role-audit", superAdminOnly: true },
    { label: "Reports", path: "/reports", perm: "reports.view" },
    { label: "Automations", path: "/automations", perm: "automations.view" },
    { label: "Settings", path: "/settings", perm: "settings.view" },
  ] },
];

const sectionRoutePrefixes: Record<string, string[]> = {
  Dashboards: [
    "/leadership-dashboard",
    "/reports/bcba-performance",
    "/intake",
    "/authorizations",
    "/scheduling",
    "/ops/staffing",
    "/clinic-dashboard",
    "/qa-workspace",
    "/billing-finance",
    "/recruiting/workspace",
  ],
  Operate: ["/clients", "/leads", "/authorizations", "/scheduling", "/ops/staffing", "/qa", "/recruiting/workspace", "/clinics"],
  Pipeline: ["/pipeline"],
  "Phone System": ["/phone"],
  Records: ["/phone", "/documents", "/tasks"],
  Intelligence: intelligenceRoutePrefixes,
  "HR Suite": ["/hr"],
  Admin: ["/team", "/admin/training-dashboard", "/admin/training-statistics", "/admin/training-assign", "/admin/role-audit", "/reports", "/automations", "/settings"],
};

const routeMatches = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export const hasFullNavigationAccess = (roles: AppRole[]) =>
  roles.some((role) => fullNavigationRoles.includes(role));

export const getRoleNavigationExceptions = (roles: AppRole[]): RoleNavigationException[] => {
  if (hasFullNavigationAccess(roles)) {
    return roles.map((role) => roleNavigationExceptions[role]).filter(Boolean) as RoleNavigationException[];
  }
  const explicit = roles.map((role) => roleNavigationExceptions[role]).filter(Boolean) as RoleNavigationException[];
  if (explicit.length > 0) return explicit;
  // Fallback for any other role (staff, intake, finance, qa, scheduling, etc.):
  // restrict to the Intelligence section with just the three staff-facing items.
  return [DEFAULT_LIMITED_EXCEPTION];
};

export const navPathToRoutePrefix = (path: string) => path.split("?")[0];

export const getSidebarPreviewForRoles = (roles: AppRole[], hasPermission: (permission: string) => boolean) => {
  const isFullNavigation = hasFullNavigationAccess(roles);
  const baseSections = isFullNavigation
    ? roles.includes("admin") ? [dashboardPreviewSection, ...navigationPreviewSections] : navigationPreviewSections
    : navigationPreviewSections;
  const exceptions = getRoleNavigationExceptions(roles);
  const allowedSections = new Set(["Intelligence", ...exceptions.flatMap((exception) => exception.sectionTitles ?? [])]);
  const allowedPaths = new Set(exceptions.flatMap((exception) => exception.itemPaths ?? []).map(navPathToRoutePrefix));
  const intelligenceOverrides = exceptions
    .map((e) => e.intelligenceItemPaths)
    .filter((p): p is string[] => Array.isArray(p));
  const restrictedIntelligence = !isFullNavigation && intelligenceOverrides.length > 0;
  const allowedIntelligencePaths = restrictedIntelligence
    ? new Set(intelligenceOverrides.flat().map(navPathToRoutePrefix))
    : null;
  const sectionItemRestrictions: Record<string, Set<string>> = {};
  if (!isFullNavigation) {
    for (const exception of exceptions) {
      if (!exception.sectionItemPaths) continue;
      for (const [title, paths] of Object.entries(exception.sectionItemPaths)) {
        if (!sectionItemRestrictions[title]) sectionItemRestrictions[title] = new Set();
        paths.forEach((p) => sectionItemRestrictions[title].add(navPathToRoutePrefix(p)));
      }
    }
  }

  return baseSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.superAdminOnly && !roles.includes("admin")) return false;
        if (item.allowedRoles && !item.allowedRoles.some((role) => roles.includes(role))) return false;
        if (section.title === "Intelligence" && allowedIntelligencePaths) {
          if (!allowedIntelligencePaths.has(navPathToRoutePrefix(item.path))) return false;
        }
        const sectionRestriction = sectionItemRestrictions[section.title];
        if (sectionRestriction && !sectionRestriction.has(navPathToRoutePrefix(item.path))) return false;
        if (!isFullNavigation && section.title !== "Intelligence" && !allowedSections.has(section.title) && !allowedPaths.has(navPathToRoutePrefix(item.path))) return false;
        return !item.perm || hasPermission(item.perm);
      }),
    }))
    .filter((section) => section.items.length > 0);
};

export const canAccessRouteForRoles = (pathname: string, roles: AppRole[]) => {
  // ---------------------------------------------------------------------------
  // RBAC Pass 2: layer RBAC denials on top of legacy path-based gating.
  // - Sensitive paths (admin/integrations/permissions/payroll) are denied
  //   when the RBAC profile says so, regardless of full-nav status.
  // - Payroll explicitly grants access to roles with view_payroll
  //   (payroll_admin) without changing other rules.
  // - For all other paths we still defer to the legacy logic below, so
  //   navigation behavior remains identical for existing roles.
  // ---------------------------------------------------------------------------
  const profile = getUserAccessProfile({ roles });
  const isAdminLike = roles.includes("admin");
  const trainingAdminPrefixes = ["/admin/training-dashboard", "/admin/training-statistics", "/admin/training-assign"];
  const isTrainingAdminSubRoute = trainingAdminPrefixes.some((p) => routeMatches(pathname, p));
  const sensitivePrefixes = ["/admin", "/integrations", "/permissions"];
  for (const prefix of sensitivePrefixes) {
    if (
      routeMatches(pathname, prefix) &&
      !isAdminLike &&
      !isTrainingAdminSubRoute &&
      !rbacCanAccessRoute(profile, pathname)
    ) {
      return false;
    }
  }
  if (routeMatches(pathname, "/payroll") || routeMatches(pathname, "/hr/payroll")) {
    if (!rbacCanAccessRoute(profile, pathname)) return false;
    if (rbacHasPermission(profile, "view_payroll")) return true;
  }

  if (hasFullNavigationAccess(roles)) return true;
  const isTrainingAdminRoute = ["/hr/training", "/admin/training-dashboard", "/admin/training-statistics", "/admin/training-assign"].some((prefix) => routeMatches(pathname, prefix));
  if (isTrainingAdminRoute && !roles.some((role) => TRAINING_ADMIN_ROLES.includes(role))) return false;

  // /resources (general Resource Hub) is restricted to RBT/BCBA only.
  if (routeMatches(pathname, "/resources")) {
    return roles.length > 0;
  }

  // Reports is the single canonical surface for every role. Report visibility
  // inside the page is controlled by visibleReportsForRole / ReportRoleGuard,
  // so we only gate that the user is authenticated here.
  if (routeMatches(pathname, "/reports")) {
    return roles.length > 0;
  }

  const exceptions = getRoleNavigationExceptions(roles);
  const intelligenceOverrides = exceptions
    .map((e) => e.intelligenceItemPaths)
    .filter((p): p is string[] => Array.isArray(p));
  const matchesIntelligence = intelligenceRoutePrefixes.some((prefix) => routeMatches(pathname, prefix));
  if (matchesIntelligence) {
    if (intelligenceOverrides.length === 0) return true;
    const allowed = intelligenceOverrides.flat().map(navPathToRoutePrefix);
    return allowed.some((prefix) => routeMatches(pathname, prefix));
  }

  const allowedPrefixes = exceptions.flatMap((exception) => [
    ...(exception.sectionTitles ?? []).flatMap((title) => sectionRoutePrefixes[title] ?? []),
    ...(exception.itemPaths ?? []).map(navPathToRoutePrefix),
  ]);

  return allowedPrefixes.some((prefix) => routeMatches(pathname, prefix));
};