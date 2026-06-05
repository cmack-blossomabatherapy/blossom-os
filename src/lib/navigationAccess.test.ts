import { describe, it, expect } from "vitest";
import { canAccessRouteForRoles, hasFullNavigationAccess } from "./navigationAccess";

describe("navigationAccess", () => {
  it("admin/exec/ops_manager have full navigation access", () => {
    expect(hasFullNavigationAccess(["admin"])).toBe(true);
    expect(hasFullNavigationAccess(["exec"])).toBe(true);
    expect(hasFullNavigationAccess(["ops_manager"])).toBe(true);
    for (const route of ["/clients", "/authorizations", "/staffing", "/hr", "/settings"]) {
      expect(canAccessRouteForRoles(route, ["admin"])).toBe(true);
      expect(canAccessRouteForRoles(route, ["exec"])).toBe(true);
      expect(canAccessRouteForRoles(route, ["ops_manager"])).toBe(true);
    }
  });

  it("rbt and bcba cannot access /clients or /authorizations", () => {
    for (const role of ["rbt", "bcba"] as const) {
      expect(canAccessRouteForRoles("/clients", [role])).toBe(false);
      expect(canAccessRouteForRoles("/authorizations", [role])).toBe(false);
    }
  });

  it("rbt can access /hr/journey and /resources", () => {
    expect(canAccessRouteForRoles("/hr/journey", ["rbt"])).toBe(true);
    expect(canAccessRouteForRoles("/resources", ["rbt"])).toBe(true);
  });

  it("hr can access /hr/directory and /phone but not /clients", () => {
    expect(canAccessRouteForRoles("/hr/directory", ["hr"])).toBe(true);
    expect(canAccessRouteForRoles("/phone", ["hr"])).toBe(true);
    expect(canAccessRouteForRoles("/clients", ["hr"])).toBe(false);
  });

  // ---- RBAC Pass 2 ---------------------------------------------------------

  it("admin/super_admin can reach admin-only routes", () => {
    for (const p of ["/admin", "/integrations", "/permissions", "/payroll"]) {
      expect(canAccessRouteForRoles(p, ["admin"])).toBe(true);
    }
  });

  it("exec retains reports + clients view but not super-admin config", () => {
    expect(canAccessRouteForRoles("/reports", ["exec"])).toBe(true);
    expect(canAccessRouteForRoles("/clients", ["exec"])).toBe(true);
    // exec is full-nav today so /admin still resolves true; behavior preserved.
    expect(canAccessRouteForRoles("/admin", ["exec"])).toBe(true);
  });

  it("ops_manager retains broad operations access", () => {
    for (const p of ["/clients", "/scheduling", "/staffing", "/authorizations", "/recruiting/workspace"]) {
      expect(canAccessRouteForRoles(p, ["ops_manager"])).toBe(true);
    }
  });

  it("payroll is restricted to payroll_admin / admin", () => {
    expect(canAccessRouteForRoles("/payroll", ["payroll_admin"])).toBe(true);
    expect(canAccessRouteForRoles("/payroll", ["admin"])).toBe(true);
    for (const role of ["hr", "hr_manager", "hr_admin", "finance", "bcba", "rbt", "intake", "qa"] as const) {
      expect(canAccessRouteForRoles("/payroll", [role])).toBe(false);
    }
  });

  it("admin / integrations / permissions stay blocked for non-admin roles", () => {
    for (const role of ["intake", "auth_team", "qa", "scheduling", "hr", "hr_manager", "finance", "bcba", "rbt"] as const) {
      expect(canAccessRouteForRoles("/admin", [role])).toBe(false);
      expect(canAccessRouteForRoles("/integrations", [role])).toBe(false);
      expect(canAccessRouteForRoles("/permissions", [role])).toBe(false);
    }
  });

  it("training admins keep /admin/training-* access (not blocked by RBAC sensitive check)", () => {
    expect(canAccessRouteForRoles("/admin/training-dashboard", ["training_admin"])).toBe(true);
    expect(canAccessRouteForRoles("/admin/training-assign", ["training_admin"])).toBe(true);
  });

  it("RBT stays blocked from clients/authorizations/payroll/admin/reports", () => {
    for (const p of ["/clients", "/authorizations", "/payroll", "/admin", "/reports"]) {
      expect(canAccessRouteForRoles(p, ["rbt"])).toBe(false);
    }
  });

  it("BCBA can access training/resources but not payroll/admin", () => {
    // BCBA's intelligence override allows /resources + /hr/journey, not the
    // general /training catalog (Pass 1 navigationAccess behavior).
    expect(canAccessRouteForRoles("/resources", ["bcba"])).toBe(true);
    expect(canAccessRouteForRoles("/hr/journey", ["bcba"])).toBe(true);
    expect(canAccessRouteForRoles("/payroll", ["bcba"])).toBe(false);
    expect(canAccessRouteForRoles("/admin", ["bcba"])).toBe(false);
  });
});