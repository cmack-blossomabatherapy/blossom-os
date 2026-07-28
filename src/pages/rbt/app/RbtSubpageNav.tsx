import { Link, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

/**
 * Consistent back / breadcrumb bar for every NON-primary RBT page.
 *
 * The RBT sidebar keeps five simple primary items (Home, Schedule, Learn,
 * Support, Me). Everything deeper (journey, program, readiness, first case,
 * growth, settings, …) is reachable from those pages, so each nested page
 * needs a reliable, predictable way back. Rendering it once in the shell
 * guarantees no nested RBT route can ship without a back action.
 */

/** Primary tabs — they are in the sidebar, so no back bar. */
export const RBT_PRIMARY_PATHS = [
  "/rbt/app/home",
  "/rbt/app/schedule",
  "/rbt/app/learn",
  "/rbt/app/support",
  "/rbt/app/me",
];

type Crumb = { label: string; parent: string; parentLabel: string };

/** Exact-path map for every nested RBT destination. */
export const RBT_SUBPAGES: Record<string, Crumb> = {
  "/rbt/app/welcome":                { label: "Welcome to Blossom", parent: "/rbt/app/learn", parentLabel: "Learn" },
  "/rbt/app/program":                { label: "My Training Program", parent: "/rbt/app/learn", parentLabel: "Learn" },
  "/rbt/app/passport":               { label: "Skill Passport", parent: "/rbt/app/learn", parentLabel: "Learn" },
  "/rbt/app/preboarding":            { label: "Preboarding", parent: "/rbt/app/home", parentLabel: "Home" },
  "/rbt/app/journey":                { label: "My Journey", parent: "/rbt/app/home", parentLabel: "Home" },
  "/rbt/app/readiness":              { label: "Readiness", parent: "/rbt/app/home", parentLabel: "Home" },
  "/rbt/app/staffing":               { label: "Staffing & Availability", parent: "/rbt/app/home", parentLabel: "Home" },
  "/rbt/app/first-case":             { label: "First Case", parent: "/rbt/app/home", parentLabel: "Home" },
  "/rbt/app/clients":                { label: "My Clients", parent: "/rbt/app/me", parentLabel: "Me" },
  "/rbt/app/hours":                  { label: "Hours", parent: "/rbt/app/me", parentLabel: "Me" },
  "/rbt/app/supervision":            { label: "Supervision", parent: "/rbt/app/me", parentLabel: "Me" },
  "/rbt/app/credentials":            { label: "Credentials", parent: "/rbt/app/me", parentLabel: "Me" },
  "/rbt/app/performance":            { label: "Performance", parent: "/rbt/app/me", parentLabel: "Me" },
  "/rbt/app/growth":                 { label: "My Growth", parent: "/rbt/app/me", parentLabel: "Me" },
  "/rbt/app/growth/fellowship":      { label: "BCBA Fellowship", parent: "/rbt/app/growth", parentLabel: "My Growth" },
  "/rbt/app/settings/notifications": { label: "Notification preferences", parent: "/rbt/app/me", parentLabel: "Me" },
  "/rbt/app/first-case/checkin":     { label: "First session check-in", parent: "/rbt/app/first-case", parentLabel: "First Case" },
  "/rbt/app/support/new":            { label: "New request", parent: "/rbt/app/support", parentLabel: "Support" },
  "/rbt/app/support/urgent":         { label: "Urgent help", parent: "/rbt/app/support", parentLabel: "Support" },
  "/rbt/app/support/team":           { label: "My support team", parent: "/rbt/app/support", parentLabel: "Support" },
};

/** Dynamic (`:param`) routes resolved by prefix. */
const DYNAMIC: Array<{ prefix: string; crumb: Crumb }> = [
  { prefix: "/rbt/app/learn/course/", crumb: { label: "Course", parent: "/rbt/app/learn", parentLabel: "Learn" } },
  { prefix: "/rbt/app/journey/",      crumb: { label: "Journey checkpoint", parent: "/rbt/app/journey", parentLabel: "My Journey" } },
  { prefix: "/rbt/app/support/",      crumb: { label: "Request", parent: "/rbt/app/support", parentLabel: "Support" } },
];

export function resolveRbtCrumb(pathname: string): Crumb | null {
  const p = pathname.replace(/\/+$/, "") || pathname;
  if (RBT_PRIMARY_PATHS.includes(p)) return null;
  if (RBT_SUBPAGES[p]) return RBT_SUBPAGES[p];
  for (const d of DYNAMIC) {
    if (p.startsWith(d.prefix) && p.length > d.prefix.length) return d.crumb;
  }
  return null;
}

export function RbtSubpageNav() {
  const { pathname } = useLocation();
  const crumb = resolveRbtCrumb(pathname);
  if (!crumb) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <Link
        to={crumb.parent}
        data-testid="rbt-back-link"
        className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 h-9 text-xs font-medium text-muted-foreground transition hover:text-foreground hover:bg-muted"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back to {crumb.parentLabel}
      </Link>
      <span className="sr-only">Current page: {crumb.label}</span>
    </nav>
  );
}

export default RbtSubpageNav;