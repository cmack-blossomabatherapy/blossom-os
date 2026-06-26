import { describe, it, expect } from "vitest";
import {
  buildHats, deriveAllowedStates, deriveAllowedDepartmentsByState,
  hasHat, canAccessStateDepartment, mapRoleKeyToOSRole,
  GROWTH_STAGE_PRESETS,
  type RoleAssignment,
} from "@/lib/access/roleAssignments";

function make(over: Partial<RoleAssignment> = {}): RoleAssignment {
  return {
    id: over.id ?? crypto.randomUUID(),
    employee_id: over.employee_id ?? null,
    user_id: over.user_id ?? "u1",
    role_key: over.role_key ?? "intake_coordinator",
    os_role_key: over.os_role_key ?? null,
    state_code: over.state_code ?? "GA",
    department_key: over.department_key ?? "intake",
    scope: over.scope ?? "department",
    is_primary: over.is_primary ?? false,
    is_active: over.is_active ?? true,
    starts_at: null, ends_at: null,
    title_override: null, responsibility_notes: null,
    assigned_by: null,
    created_at: "2024-01-01", updated_at: "2024-01-01",
  };
}

describe("multi-hat helpers", () => {
  const asd = make({ role_key: "assistant_state_director", department_key: "state_operations", scope: "state", is_primary: true });
  const intake = make({ role_key: "intake_coordinator", department_key: "intake" });
  const recruit = make({ role_key: "recruiting_coordinator", department_key: "recruiting" });
  const ncIntake = make({ role_key: "intake_coordinator", state_code: "NC", department_key: "intake" });
  const inactive = make({ role_key: "qa_specialist", department_key: "qa", is_active: false });

  const all = [asd, intake, recruit, ncIntake, inactive];

  it("derives allowed states from active assignments only", () => {
    expect(deriveAllowedStates(all).sort()).toEqual(["GA", "NC"]);
  });

  it("maps departments per state", () => {
    const map = deriveAllowedDepartmentsByState(all);
    expect(map.GA.sort()).toEqual(["intake", "recruiting", "state_operations"]);
    expect(map.NC).toEqual(["intake"]);
  });

  it("answers hasHat with state + department scoping", () => {
    expect(hasHat(all, "intake_coordinator", { state: "GA" })).toBe(true);
    expect(hasHat(all, "intake_coordinator", { state: "VA" })).toBe(false);
    expect(hasHat(all, "qa_specialist")).toBe(false); // inactive
  });

  it("blocks access outside assigned state/department for non-leaders", () => {
    expect(canAccessStateDepartment(all, "GA", "intake")).toBe(true);
    expect(canAccessStateDepartment(all, "VA", "intake")).toBe(false);
  });

  it("grants leaders full access regardless of hats", () => {
    expect(canAccessStateDepartment([], "VA", "billing", ["admin"])).toBe(true);
    expect(canAccessStateDepartment([], "VA", "billing", ["coo"])).toBe(true);
  });

  it("builds hats sorted with active only", () => {
    const hats = buildHats(all);
    expect(hats).toHaveLength(4);
    expect(hats.every((h) => h.osRole)).toBe(true);
  });

  it("maps role keys to OS roles deterministically", () => {
    expect(mapRoleKeyToOSRole("assistant_state_director")).toBe("assistant_state_director");
    expect(mapRoleKeyToOSRole("intake_coordinator")).toBe("intake_coordinator");
    expect(mapRoleKeyToOSRole("unknown_role")).toBe("viewer");
  });

  it("growth presets produce hats for the requested state", () => {
    for (const p of GROWTH_STAGE_PRESETS) {
      const drafts = p.build("GA");
      expect(drafts.length).toBeGreaterThan(0);
      expect(drafts.every((d) => d.state_code === "GA")).toBe(true);
      expect(drafts.filter((d) => d.is_primary).length).toBeLessThanOrEqual(1);
    }
  });
});