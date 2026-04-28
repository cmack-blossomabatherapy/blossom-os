import type { AppRole } from "@/lib/roles";

export interface RoleNavigationException {
  sectionTitles?: string[];
  itemPaths?: string[];
}

export const fullNavigationRoles: AppRole[] = ["admin", "exec", "ops_manager"];

export const roleNavigationExceptions: Partial<Record<AppRole, RoleNavigationException>> = {
  // Add role keys here when limited roles need more than Intelligence.
  // Example: hr: { sectionTitles: ["HR Suite"], itemPaths: ["/team"] },
};

const intelligenceRoutePrefixes = ["/training", "/resources"];

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