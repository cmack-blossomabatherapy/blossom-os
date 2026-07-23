import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const APP_TSX = fs.readFileSync(path.resolve(__dirname, "../App.tsx"), "utf8");

/**
 * Pass 6 — Executive / COO / Operations Leadership / State Director /
 * Finance / Clinic Growth role-cluster regression. Every leadership and
 * finance-visibility route in the sidebar must be wrapped in a
 * PermissionRoute (or a Navigate redirect) so unauthorized signed-in
 * roles cannot see revenue, strategic risk, or state-scoped data.
 */
function routeIsGuarded(routePath: string): boolean {
  const escaped = routePath.replace(/[/]/g, "\\/");
  const re = new RegExp(
    `<Route\\s+path="${escaped}"\\s+element=\\{(<PermissionRoute|<AdminRoute|<Navigate)`,
  );
  return re.test(APP_TSX);
}

const GUARDED_ROUTES = [
  "/executive",
  "/executive/pulse",
  "/executive/briefing",
  "/executive/organizational-health",
  "/executive/strategic-risks",
  "/executive/growth-readiness",
  "/executive/leadership-accountability",
  "/executive/staffing-expansion",
  "/executive/operational-consistency",
  "/executive/updates",
  "/operations",
  "/operations/command-center",
  "/operations/briefing",
  "/operations/department-health",
  "/operations/workflow-risks",
  "/operations/escalations",
  "/operations/accountability",
  "/operations/staffing-capacity",
  "/operations/training-adoption",
  "/operations/updates",
  "/state-director",
  "/billing-finance",
];

describe("Pass 6 leadership + finance guards", () => {
  for (const route of GUARDED_ROUTES) {
    it(`${route} is wrapped in PermissionRoute or Navigate`, () => {
      expect(routeIsGuarded(route)).toBe(true);
    });
  }

  it("does not re-introduce the duplicate qa_team role list on /qa-team", () => {
    const match = APP_TSX.match(/path="\/qa-team"[^>]*allowedRoles=\{\[([^\]]+)\]/);
    expect(match).not.toBeNull();
    const roles = match![1].split(",").map((s) => s.trim().replace(/"/g, ""));
    const qaTeamCount = roles.filter((r) => r === "qa_team").length;
    expect(qaTeamCount).toBe(1);
  });

  it("EXECUTIVE_ROUTE_ROLES includes clinic_growth (Clinic Growth-to-Launch reads /executive/growth-readiness)", async () => {
    const mod = await import("@/lib/os/operationsRoles");
    expect(mod.EXECUTIVE_ROUTE_ROLES).toContain("clinic_growth");
  });

  it("STATE_DIRECTOR_ROUTE_ROLES includes state_va, regional_state_director, assistant_state_director", async () => {
    const mod = await import("@/lib/os/operationsRoles");
    expect(mod.STATE_DIRECTOR_ROUTE_ROLES).toEqual(
      expect.arrayContaining(["state_va", "regional_state_director", "assistant_state_director", "state_director"]),
    );
  });

  it("FINANCE_ROUTE_ROLES excludes payroll_admin and clinical roles", async () => {
    const mod = await import("@/lib/os/operationsRoles");
    expect(mod.FINANCE_ROUTE_ROLES).not.toContain("payroll_admin");
    expect(mod.FINANCE_ROUTE_ROLES).not.toContain("bcba");
    expect(mod.FINANCE_ROUTE_ROLES).not.toContain("rbt");
  });
});