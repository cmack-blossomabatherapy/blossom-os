import { describe, it, expect } from "vitest";
import {
  OPERATIONS_LEADERSHIP_ROUTE_ROLES,
  OPERATIONS_AND_STATE_ROUTE_ROLES,
} from "@/lib/os/operationsRoles";

describe("Operations role constants — shared route model", () => {
  it("OPERATIONS_LEADERSHIP_ROUTE_ROLES includes leadership/admin roles", () => {
    for (const r of [
      "admin",
      "super_admin",
      "exec",
      "executive",
      "executive_leadership",
      "operations_leadership",
      "ops_manager",
      "director_of_operations",
      "operations_manager",
    ]) {
      expect(OPERATIONS_LEADERSHIP_ROUTE_ROLES, `missing ${r}`).toContain(r);
    }
  });

  it("OPERATIONS_AND_STATE_ROUTE_ROLES includes everything from leadership plus SD + ASD", () => {
    for (const r of OPERATIONS_LEADERSHIP_ROUTE_ROLES) {
      expect(OPERATIONS_AND_STATE_ROUTE_ROLES, `missing ${r}`).toContain(r);
    }
    expect(OPERATIONS_AND_STATE_ROUTE_ROLES).toContain("state_director");
    expect(OPERATIONS_AND_STATE_ROUTE_ROLES).toContain("assistant_state_director");
  });

  it("OPERATIONS_AND_STATE_ROUTE_ROLES does not include unrelated roles", () => {
    for (const r of ["rbt", "bcba", "marketing", "hr", "payroll"]) {
      expect(OPERATIONS_AND_STATE_ROUTE_ROLES, `should not include ${r}`).not.toContain(r);
    }
    // Same for the leadership-only constant.
    for (const r of ["rbt", "bcba", "marketing", "hr", "payroll", "state_director", "assistant_state_director"]) {
      expect(OPERATIONS_LEADERSHIP_ROUTE_ROLES, `leadership should not include ${r}`).not.toContain(r);
    }
  });
});