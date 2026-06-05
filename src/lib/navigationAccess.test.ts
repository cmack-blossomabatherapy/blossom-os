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

  it("hr can access /hr/directory and /phone-calls but not /clients", () => {
    expect(canAccessRouteForRoles("/hr/directory", ["hr"])).toBe(true);
    expect(canAccessRouteForRoles("/phone-calls", ["hr"])).toBe(true);
    expect(canAccessRouteForRoles("/clients", ["hr"])).toBe(false);
  });
});