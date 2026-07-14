import { describe, it, expect } from "vitest";
import { cleanResourceTitle } from "@/lib/resources/resourceDisplay";
import { isVisibleToRole, type Resource } from "@/lib/resources/resourceData";

describe("cleanResourceTitle — audit pass patterns", () => {
  const cases: Array<[string, string]> = [
    ["156 02 Source Document monthly growth review agenda", "Monthly Growth Review Agenda"],
    ["154 02 Source Document readiness assessment", "Readiness Assessment"],
    ["019 03 Training Academ 018 billing department academy guide", "Billing Department Academy Guide"],
    ["008 02 Onboarding 007 state director first 90 days guide", "State Director First 90 Days Guide"],
    ["005 01 Binder Sections certification", "Certification"],
    ["00 Ann First Week Onboarding Package page 6", "Ann First Week Onboarding Package"],
    ["13 Current Blossom Packet", "Current Blossom Packet"],
    ["W2D4 Operational Prioritization SOP.pdf", "Operational Prioritization SOP"],
    ["RFO-05056 Current Blossom Packet", "Current Blossom Packet"],
  ];
  for (const [input, expected] of cases) {
    it(`cleans "${input}"`, () => {
      expect(cleanResourceTitle(input)).toBe(expected);
    });
  }
});

function baseResource(overrides: Partial<Resource>): Resource {
  return {
    id: "r-test",
    title: "Test",
    description: "Test",
    type: "PDF",
    category: "operational",
    status: "Published",
    roles: [],
    departments: [],
    states: [],
    tags: [],
    uploadedBy: "—",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("isVisibleToRole — sensitivity guardrail", () => {
  it("hides sensitive rows from frontline roles even if visibility_roles lists them", () => {
    const r = baseResource({ isSensitive: true, roles: ["rbt", "bcba", "case_manager"] });
    expect(isVisibleToRole(r, "rbt")).toBe(false);
    expect(isVisibleToRole(r, "bcba")).toBe(false);
    expect(isVisibleToRole(r, "case_manager")).toBe(false);
    expect(isVisibleToRole(r, "scheduling_team")).toBe(false);
    expect(isVisibleToRole(r, "staffing_team")).toBe(false);
    expect(isVisibleToRole(r, "behavioral_support")).toBe(false);
  });

  it("still allows sensitive rows to leadership + HR", () => {
    const r = baseResource({ isSensitive: true, roles: ["hr_team", "state_director"] });
    expect(isVisibleToRole(r, "hr_team")).toBe(true);
    expect(isVisibleToRole(r, "state_director")).toBe(true);
    expect(isVisibleToRole(r, "executive_leadership")).toBe(true);
    expect(isVisibleToRole(r, "super_admin")).toBe(true);
  });
});