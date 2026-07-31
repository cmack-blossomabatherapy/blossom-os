// Super Admin / Systems Admin render the dedicated SUPER_ADMIN_MENU rather than
// an entry in ROLE_MENUS.
const MENU_EXEMPT = new Set(["super_admin", "systems_admin"]);

import { describe, it, expect } from "vitest";
import {
  ROLE_GROUPS,
  ASSIGNABLE_ROLE_KEYS,
  isAssignableRoleKey,
  findRoleLabel,
  mapRoleKeyToOSRole,
} from "@/lib/access/roleAssignments";
import { ROLE_MENUS, ROLE_PREVIEW_LIST } from "@/lib/os/roleMenus";
import { ROLE_HOME } from "@/lib/os/roleHome";

describe("canonical role catalog", () => {
  it("has no duplicate assignable keys", () => {
    expect(new Set(ASSIGNABLE_ROLE_KEYS).size).toBe(ASSIGNABLE_ROLE_KEYS.length);
  });

  it("does not offer retired/legacy keys as assignable", () => {
    const retired = [
      "admin", "exec", "executive", "executive_leadership", "operations_leadership",
      "ops_manager", "intake", "intake_lead", "auth_team", "recruiting_lead",
      "recruiting_team", "recruiting_assistant", "staffing", "scheduling",
      "qa", "credentialing", "credentialing_team", "hr", "finance",
      "billing_finance", "finance_benefits_team", "marketing",
      "marketing_growth_lead", "payroll_admin", "training_admin", "viewer",
    ];
    for (const key of retired) {
      expect(isAssignableRoleKey(key), `${key} must not be assignable`).toBe(false);
    }
  });

  it("includes the canonical directors and coordinators", () => {
    for (const key of [
      "super_admin", "systems_admin", "coo", "director_of_operations",
      "state_director", "assistant_state_director", "director_of_marketing",
      "director_of_intake", "intake_coordinator", "director_of_recruiting",
      "recruiting_coordinator", "director_of_staffing", "director_of_scheduling",
      "director_of_authorizations", "qa_director", "credentialing_coordinator",
      "hr_lead", "payroll_coordinator", "office_manager", "clinical_director",
      "bcba", "rbt", "case_manager", "cfo", "controller", "billing_coordinator",
      "finance_benefits_coordinator", "training_manager",
    ]) {
      expect(isAssignableRoleKey(key), `${key} must be assignable`).toBe(true);
    }
  });

  it("labels every assignable key without falling back to raw keys", () => {
    for (const key of ASSIGNABLE_ROLE_KEYS) {
      expect(findRoleLabel(key)).not.toBe(key);
    }
  });

  it("still labels legacy keys for historical records", () => {
    expect(findRoleLabel("admin")).toMatch(/legacy/i);
    expect(findRoleLabel("payroll_admin")).toMatch(/legacy/i);
  });

  it("maps every assignable key to a real OS role with a menu and home", () => {
    const missing: string[] = [];
    for (const key of ASSIGNABLE_ROLE_KEYS) {
      const osRole = mapRoleKeyToOSRole(key);
      expect(osRole, `${key} maps to viewer`).not.toBe("viewer");
      expect(typeof ROLE_HOME[osRole]).toBe("string");
      if (!MENU_EXEMPT.has(osRole) && !ROLE_MENUS[osRole]) missing.push(`${key} -> ${osRole}`);
    }
    expect(missing, `missing menus: ${missing.join(", ")}`).toEqual([]);
  });

  it("maps unknown keys to viewer", () => {
    expect(mapRoleKeyToOSRole("not_a_role")).toBe("viewer");
  });

  it("director_of_operations resolves to operations leadership", () => {
    expect(mapRoleKeyToOSRole("director_of_operations")).toBe("operations_leadership");
  });

  it("maps canonical keys to the expected OS roles", () => {
    const expected: Record<string, string> = {
      director_of_marketing: "marketing_growth_lead",
      director_of_intake: "intake_lead",
      director_of_recruiting: "recruiting_lead",
      director_of_staffing: "staffing_lead",
      director_of_scheduling: "scheduling_lead",
      director_of_authorizations: "authorization_manager",
      cfo: "billing_finance",
      controller: "billing_finance",
      billing_coordinator: "billing_finance",
      finance_benefits_coordinator: "finance_benefits_team",
      credentialing_coordinator: "credentialing_team",
      operations_manager: "operations_leadership",
      regional_state_director: "regional_state_director",
      state_va: "state_va",
      office_manager: "office_manager",
      training_manager: "training_manager",
      clinic_growth: "clinic_growth",
      clinical_director: "clinical_director",
      case_manager: "case_manager",
    };
    for (const [key, os] of Object.entries(expected)) {
      expect(mapRoleKeyToOSRole(key), key).toBe(os);
    }
  });

  it("still maps legacy aliases for backwards compatibility", () => {
    const legacy: Record<string, string> = {
      admin: "super_admin",
      ops_manager: "operations_leadership",
      intake_lead: "intake_lead",
      recruiting_lead: "recruiting_lead",
      auth_team: "authorization_coordinator",
      qa: "qa_team",
      payroll_admin: "payroll_coordinator",
      marketing: "marketing_team",
      credentialing: "credentialing_team",
      staffing: "staffing_team",
      scheduling: "scheduling_team",
    };
    for (const [key, os] of Object.entries(legacy)) {
      expect(mapRoleKeyToOSRole(key), key).toBe(os);
    }
  });

  it("every preview role has a resolvable menu", () => {
    const missing: string[] = [];
    for (const entry of ROLE_PREVIEW_LIST) {
      expect(entry.label).not.toMatch(/legacy/i);
      if (!MENU_EXEMPT.has(entry.role) && !ROLE_MENUS[entry.role]) missing.push(entry.role);
    }
    expect(missing, `missing menus: ${missing.join(", ")}`).toEqual([]);
  });

  it("groups are non-empty", () => {
    for (const g of ROLE_GROUPS) expect(g.roles.length).toBeGreaterThan(0);
  });
});