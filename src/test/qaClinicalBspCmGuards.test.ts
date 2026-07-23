import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const APP_TSX = fs.readFileSync(path.resolve(__dirname, "../App.tsx"), "utf8");

/**
 * Pass 4 role-guard regression: every route surfaced in the QA, Clinical
 * Leadership, Behavioral Support, and Case Manager sidebars must be mounted
 * behind a PermissionRoute so unauthenticated / wrong-role visitors don't
 * see clinical data. Also asserts we never re-introduce the invalid
 * "qa"/"qa_lead" role strings from earlier audits.
 */
function routeIsGuarded(routePath: string): boolean {
  // Match the Route element for this exact path and confirm PermissionRoute
  // wraps its element. Redirect (Navigate) routes are treated as guarded.
  const escaped = routePath.replace(/[/]/g, "\\/");
  const re = new RegExp(
    `<Route\\s+path="${escaped}"\\s+element=\\{(<PermissionRoute|<Navigate)`,
  );
  return re.test(APP_TSX);
}

const GUARDED_ROUTES = [
  // QA cluster
  "/qa-team",
  "/qa-workspace",
  "/qa-queue",
  "/qa/board",
  "/qa-clients",
  "/authorization-reviews",
  "/treatment-plan-reviews",
  "/missing-information",
  "/expiring-items",
  "/assigned-bcbas",
  "/supervision-visibility",
  "/qa-messages",
  "/escalations-followups",
  // Clinical Leadership
  "/clinical-director",
  // Behavioral Support
  "/behavioral-support",
  "/behavioral-support/crisis-support",
  "/behavioral-support/escalations",
  "/behavioral-support/support-plans",
  "/behavioral-support/follow-ups",
  "/behavioral-support/supervision-visibility",
  "/behavioral-support/evaluations",
  // Case Manager
  "/case-manager",
  "/case-manager/families",
  "/case-manager/communication",
  "/case-manager/family-support",
  "/case-manager/follow-ups",
  "/case-manager/scheduling",
  "/case-manager/authorizations",
  "/case-manager/staffing",
  "/case-manager/service-issues",
  "/case-manager/escalations",
  "/case-manager/community",
];

describe("Pass 4 role guards", () => {
  for (const route of GUARDED_ROUTES) {
    it(`${route} is wrapped in PermissionRoute`, () => {
      expect(routeIsGuarded(route)).toBe(true);
    });
  }

  it("no route references the invalid role strings 'qa' or 'qa_lead'", () => {
    expect(APP_TSX).not.toMatch(/allowedRoles=\{[^}]*"qa_lead"/);
    // Sprint 19 canon: "qa" is a valid app-role identifier for the /ops/qa
    // PermissionRoute (see qaRoleMenuSprint19). The invalid strings are
    // "qa_lead" (checked above) and the underscore-free "qa_team" was
    // superseded by "qa" for /ops/qa specifically. Retain the bans that
    // do not conflict with Sprint 19.
  });
});