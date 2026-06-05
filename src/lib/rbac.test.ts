import { describe, it, expect } from "vitest";
import {
  getUserAccessProfile,
  hasDepartmentAccess,
  hasDepartmentGroupAccess,
  hasPermission,
  hasManagerAccess,
  hasStateScope,
  canAccessRoute,
} from "./rbac";

describe("rbac: company-scope roles", () => {
  it("admin/super_admin has company-wide access", () => {
    const p = getUserAccessProfile(["admin"]);
    expect(p.level).toBe("super_admin");
    expect(p.scope).toBe("company");
    expect(hasDepartmentAccess(p, "clients_case_management")).toBe(true);
    expect(hasDepartmentAccess(p, "payroll")).toBe(true);
    expect(hasDepartmentGroupAccess(p, "business_systems")).toBe(true);
    expect(hasPermission(p, "manage_permissions")).toBe(true);
    expect(canAccessRoute(p, "/admin")).toBe(true);
    expect(canAccessRoute(p, "/integrations")).toBe(true);
    expect(canAccessRoute(p, "/permissions")).toBe(true);
  });

  it("exec has company-wide read + reports visibility", () => {
    const p = getUserAccessProfile(["exec"]);
    expect(p.scope).toBe("company");
    expect(hasPermission(p, "view_company_reports")).toBe(true);
    expect(canAccessRoute(p, "/reports")).toBe(true);
    expect(canAccessRoute(p, "/clients")).toBe(true);
  });

  it("ops_manager has broad operations visibility", () => {
    const p = getUserAccessProfile(["ops_manager"]);
    expect(p.scope).toBe("company");
    expect(hasManagerAccess(p)).toBe(true);
    expect(hasPermission(p, "manage_workflows")).toBe(true);
    expect(hasPermission(p, "view_state_dashboards")).toBe(true);
  });
});

describe("rbac: department staff vs manager inheritance", () => {
  it("department staff only sees its own department workspace", () => {
    const p = getUserAccessProfile(["intake"]);
    expect(p.level).toBe("staff");
    expect(hasDepartmentAccess(p, "intake_leads")).toBe(true);
    expect(hasDepartmentAccess(p, "clients_case_management")).toBe(false);
    expect(hasPermission(p, "view_department_reports")).toBe(false);
    expect(hasManagerAccess(p)).toBe(false);
  });

  it("HR manager gets department reports + team visibility via inheritance", () => {
    const p = getUserAccessProfile(["hr_manager"]);
    expect(hasManagerAccess(p)).toBe(true);
    expect(hasPermission(p, "view_department_reports")).toBe(true);
    expect(hasPermission(p, "view_team_pipeline")).toBe(true);
    expect(hasPermission(p, "manage_department_team")).toBe(true);
    expect(hasDepartmentAccess(p, "hr")).toBe(true);
    expect(hasDepartmentAccess(p, "recruiting")).toBe(true);
  });

  it("recruiting staff vs hr_admin (acts as recruiting manager) inherits team visibility", () => {
    const staff = getUserAccessProfile(["recruiting_assistant"]);
    expect(hasPermission(staff, "view_team_pipeline")).toBe(false);

    const dir = getUserAccessProfile(["hr_admin"]);
    expect(hasManagerAccess(dir)).toBe(true);
    expect(hasPermission(dir, "view_team_pipeline")).toBe(true);
    expect(hasPermission(dir, "view_department_reports")).toBe(true);
  });
});

describe("rbac: state leadership", () => {
  it("state director is state-scoped and sees operational departments", () => {
    const p = getUserAccessProfile({ roles: ["state_director"], state: "GA" });
    expect(p.scope).toBe("state");
    expect(hasStateScope(p, "GA")).toBe(true);
    expect(hasStateScope(p, "NC")).toBe(false);
    for (const dept of [
      "intake_leads",
      "authorizations",
      "scheduling",
      "staffing",
      "clients_case_management",
      "recruiting",
    ] as const) {
      expect(hasDepartmentAccess(p, dept)).toBe(true);
    }
    expect(hasPermission(p, "view_state_dashboards")).toBe(true);
  });

  it("state director cannot access admin / integrations / payroll", () => {
    const p = getUserAccessProfile({ roles: ["state_director"], state: "GA" });
    expect(canAccessRoute(p, "/admin")).toBe(false);
    expect(canAccessRoute(p, "/integrations")).toBe(false);
    expect(canAccessRoute(p, "/payroll")).toBe(false);
  });
});

describe("rbac: restricted roles", () => {
  it("RBT cannot access clients/authorizations/payroll/admin/reports", () => {
    const p = getUserAccessProfile(["rbt"]);
    expect(canAccessRoute(p, "/clients")).toBe(false);
    expect(canAccessRoute(p, "/authorizations")).toBe(false);
    expect(canAccessRoute(p, "/payroll")).toBe(false);
    expect(canAccessRoute(p, "/admin")).toBe(false);
    expect(canAccessRoute(p, "/reports")).toBe(false);
    expect(canAccessRoute(p, "/integrations")).toBe(false);
  });

  it("BCBA/clinical can access clinical + training but not payroll/admin", () => {
    const p = getUserAccessProfile(["bcba"]);
    expect(hasDepartmentAccess(p, "clinical")).toBe(true);
    expect(hasDepartmentAccess(p, "training_clinical_support")).toBe(true);
    expect(canAccessRoute(p, "/payroll")).toBe(false);
    expect(canAccessRoute(p, "/admin")).toBe(false);
    expect(canAccessRoute(p, "/integrations")).toBe(false);
  });

  it("HR can access HR + recruiting-adjacent onboarding + phone but not clients", () => {
    const p = getUserAccessProfile(["hr"]);
    expect(hasDepartmentAccess(p, "hr")).toBe(true);
    expect(hasDepartmentAccess(p, "recruiting")).toBe(true);
    expect(canAccessRoute(p, "/phone")).toBe(true);
    expect(canAccessRoute(p, "/clients")).toBe(false);
  });

  it("payroll access is restricted to payroll/admin", () => {
    expect(canAccessRoute(getUserAccessProfile(["hr"]), "/payroll")).toBe(false);
    expect(canAccessRoute(getUserAccessProfile(["finance"]), "/payroll")).toBe(false);
    expect(canAccessRoute(getUserAccessProfile(["payroll_admin"]), "/payroll")).toBe(true);
    expect(canAccessRoute(getUserAccessProfile(["admin"]), "/payroll")).toBe(true);
  });

  it("integrations + admin remain admin-only", () => {
    for (const role of ["intake", "auth_team", "qa", "scheduling", "staffing", "hr", "hr_manager", "finance", "bcba", "rbt"] as const) {
      const p = getUserAccessProfile([role]);
      expect(canAccessRoute(p, "/admin")).toBe(false);
      expect(canAccessRoute(p, "/integrations")).toBe(false);
      expect(canAccessRoute(p, "/permissions")).toBe(false);
    }
  });
});

describe("rbac: hidden placeholder nav links stay hidden (still routed direct-only)", () => {
  // Pass 6A/6B hid these from primary nav; rbac shouldn't accidentally surface them.
  // canAccessRoute returns true for unmapped paths (caller falls back to navigationAccess),
  // but no department mapping should suddenly grant a non-admin a hidden admin route.
  it("does not grant non-admins access to /admin/* placeholders", () => {
    const p = getUserAccessProfile(["hr"]);
    expect(canAccessRoute(p, "/admin/access-requests")).toBe(false);
    expect(canAccessRoute(p, "/admin/device-inventory")).toBe(false);
  });
});