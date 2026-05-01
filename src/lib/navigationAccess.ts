import type { AppRole } from "@/lib/roles";

export interface RoleNavigationException {
  sectionTitles?: string[];
  itemPaths?: string[];
}

export interface NavigationPreviewItem {
  label: string;
  path: string;
  perm?: string;
  superAdminOnly?: boolean;
}

export interface NavigationPreviewSection {
  title: string;
  items: NavigationPreviewItem[];
}

export const fullNavigationRoles: AppRole[] = ["admin", "exec", "ops_manager"];

export const roleNavigationExceptions: Partial<Record<AppRole, RoleNavigationException>> = {
  // Roles below get Intelligence + the listed paths/sections (no full nav).
  training_admin: { itemPaths: ["/hr/training", "/admin/training-dashboard"] },
};

const intelligenceRoutePrefixes = ["/training", "/resources"];

const dashboardPreviewSection: NavigationPreviewSection = {
  title: "Dashboards",
  items: [
    { label: "CEO & Leadership", path: "/leadership-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "Intake Dashboard", path: "/intake-dashboard", perm: "leads.view", superAdminOnly: true },
    { label: "Authorizations Dashboard", path: "/authorizations-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "Scheduling Dashboard", path: "/scheduling-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "Staffing Dashboard", path: "/staffing-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "Clinic Dashboard", path: "/clinic-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "QA Dashboard", path: "/qa-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "Finance Dashboard", path: "/finance-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "HR Dashboard", path: "/hr", perm: "dashboard.view", superAdminOnly: true },
    { label: "Recruiting Dashboard", path: "/recruiting-dashboard", perm: "dashboard.view", superAdminOnly: true },
  ],
};

const navigationPreviewSections: NavigationPreviewSection[] = [
  { title: "Operate", items: [
    { label: "Clients", path: "/clients", perm: "clients.view" },
    { label: "Intake", path: "/leads?view=queue", perm: "leads.view" },
    { label: "Authorizations", path: "/authorizations", perm: "auth.view" },
    { label: "Scheduling", path: "/scheduling", perm: "scheduling.view" },
    { label: "Staffing", path: "/staffing", perm: "staffing.view" },
    { label: "QA & Compliance", path: "/qa", perm: "qa.view" },
    { label: "Recruiting", path: "/recruiting", perm: "recruiting.view" },
    { label: "Clinics", path: "/clinics", perm: "clinics.view" },
  ] },
  { title: "Pipeline", items: [{ label: "Pipeline", path: "/pipeline", perm: "clients.view" }] },
  { title: "Records", items: [
    { label: "Phone Calls", path: "/phone-calls", perm: "phone.view" },
    { label: "Documents", path: "/documents", perm: "documents.view" },
    { label: "Tasks", path: "/tasks", perm: "tasks.view" },
  ] },
  { title: "Intelligence", items: [
    { label: "Training", path: "/training" },
    { label: "Resource Hub", path: "/resources" },
  ] },
  { title: "HR Suite", items: [
    { label: "HR Dashboard", path: "/hr", perm: "hr.view" },
    { label: "Employees", path: "/hr/directory", perm: "hr.employees.view" },
    { label: "Org Chart", path: "/hr/org-chart", perm: "hr.employees.view" },
    { label: "Onboarding", path: "/hr/onboarding", perm: "hr.onboarding.manage" },
    { label: "Reviews", path: "/hr/reviews", perm: "hr.reviews.view" },
    { label: "Training Admin", path: "/hr/training", perm: "hr.training.view" },
    { label: "Time Clock", path: "/hr/time-clock", perm: "hr.timeclock.view" },
    { label: "Hours", path: "/hr/hours", perm: "hr.hours.view" },
    { label: "Payroll", path: "/hr/payroll", perm: "hr.payroll.runs.view" },
    { label: "Announcements", path: "/hr/announcements", perm: "hr.announcements.view" },
    { label: "Resource Hub", path: "/hr/resources", perm: "hr.resources.view" },
    { label: "HR Reports", path: "/hr/reports", perm: "hr.reports.view" },
    { label: "HR Settings", path: "/hr/settings", perm: "hr.settings.manage" },
  ] },
  { title: "Admin", items: [
    { label: "Team", path: "/team", perm: "team.view" },
    { label: "Training Dashboard", path: "/admin/training-dashboard", perm: "hr.training.view" },
    { label: "Reports", path: "/reports", perm: "reports.view" },
    { label: "Automations", path: "/automations", perm: "automations.view" },
    { label: "Settings", path: "/settings", perm: "settings.view" },
  ] },
];

const sectionRoutePrefixes: Record<string, string[]> = {
  Dashboards: [
    "/leadership-dashboard",
    "/intake-dashboard",
    "/authorizations-dashboard",
    "/scheduling-dashboard",
    "/staffing-dashboard",
    "/clinic-dashboard",
    "/qa-dashboard",
    "/finance-dashboard",
    "/recruiting-dashboard",
  ],
  Operate: ["/clients", "/leads", "/authorizations", "/scheduling", "/staffing", "/qa", "/recruiting", "/clinics"],
  Pipeline: ["/pipeline"],
  Records: ["/phone-calls", "/documents", "/tasks"],
  Intelligence: intelligenceRoutePrefixes,
  "HR Suite": ["/hr"],
  Admin: ["/team", "/admin/training-dashboard", "/reports", "/automations", "/settings"],
};

const routeMatches = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export const hasFullNavigationAccess = (roles: AppRole[]) => roles.some((role) => fullNavigationRoles.includes(role));

export const getRoleNavigationExceptions = (roles: AppRole[]) => roles.map((role) => roleNavigationExceptions[role]).filter(Boolean);

export const navPathToRoutePrefix = (path: string) => path.split("?")[0];

export const getSidebarPreviewForRoles = (roles: AppRole[], hasPermission: (permission: string) => boolean) => {
  const isFullNavigation = hasFullNavigationAccess(roles);
  const baseSections = isFullNavigation
    ? roles.includes("admin") ? [dashboardPreviewSection, ...navigationPreviewSections] : navigationPreviewSections
    : navigationPreviewSections;
  const exceptions = getRoleNavigationExceptions(roles);
  const allowedSections = new Set(["Intelligence", ...exceptions.flatMap((exception) => exception.sectionTitles ?? [])]);
  const allowedPaths = new Set(exceptions.flatMap((exception) => exception.itemPaths ?? []).map(navPathToRoutePrefix));

  return baseSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.superAdminOnly && !roles.includes("admin")) return false;
        if (!isFullNavigation && section.title !== "Intelligence" && !allowedSections.has(section.title) && !allowedPaths.has(navPathToRoutePrefix(item.path))) return false;
        return !item.perm || hasPermission(item.perm);
      }),
    }))
    .filter((section) => section.items.length > 0);
};

export const canAccessRouteForRoles = (pathname: string, roles: AppRole[]) => {
  if (pathname === "/" || hasFullNavigationAccess(roles)) return true;
  if (intelligenceRoutePrefixes.some((prefix) => routeMatches(pathname, prefix))) return true;

  const exceptions = getRoleNavigationExceptions(roles);
  const allowedPrefixes = exceptions.flatMap((exception) => [
    ...(exception.sectionTitles ?? []).flatMap((title) => sectionRoutePrefixes[title] ?? []),
    ...(exception.itemPaths ?? []).map(navPathToRoutePrefix),
  ]);

  return allowedPrefixes.some((prefix) => routeMatches(pathname, prefix));
};