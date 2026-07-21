import { describe, it, expect } from "vitest";
import { computeMappings, normalizePersonName } from "@/lib/os/reporting/clinicianMapping";

const clinician = (over: Partial<Parameters<typeof computeMappings>[1][number]>) => ({
  employee_id: "emp-1",
  cr_id: null,
  first_name: "Jane",
  last_name: "Doe",
  is_active_clinician: true,
  ...over,
});

describe("clinician↔CR provider mapping — deterministic precedence", () => {
  it("exact CentralReach ID wins (confidence 1.0)", () => {
    const [m] = computeMappings(
      [{ provider_id: "P1", provider_name: "Different Name" }],
      [clinician({ employee_id: "e1", cr_id: "P1", first_name: "Some", last_name: "One" })],
    );
    expect(m.mapping_method).toBe("exact_id");
    expect(m.mapping_status).toBe("mapped");
    expect(m.employee_id).toBe("e1");
    expect(m.mapping_confidence).toBe(1);
    expect(m.ambiguity_reason).toBeNull();
  });

  it("unique normalized name maps at 0.75 confidence when exactly one clinician and one provider ID share it", () => {
    const [m] = computeMappings(
      [{ provider_id: "P2", provider_name: "  Jane   Doe " }],
      [clinician({ employee_id: "e2", first_name: "jane", last_name: "DOE" })],
    );
    expect(m.mapping_method).toBe("unique_name");
    expect(m.mapping_status).toBe("mapped");
    expect(m.employee_id).toBe("e2");
    expect(m.mapping_confidence).toBeCloseTo(0.75);
  });

  it("duplicate provider IDs sharing a normalized name are ambiguous_provider (never guessed)", () => {
    const res = computeMappings(
      [
        { provider_id: "P3", provider_name: "Jane Doe" },
        { provider_id: "P4", provider_name: "jane doe" },
      ],
      [clinician({ employee_id: "e3" })],
    );
    for (const m of res) {
      expect(m.mapping_method).toBe("ambiguous_provider");
      expect(m.mapping_status).toBe("unmapped");
      expect(m.employee_id).toBeNull();
      expect(m.ambiguity_reason).toMatch(/Multiple CentralReach provider IDs/);
    }
  });

  it("duplicate active clinicians sharing a normalized name are ambiguous_employee", () => {
    const [m] = computeMappings(
      [{ provider_id: "P5", provider_name: "Jane Doe" }],
      [
        clinician({ employee_id: "e5a" }),
        clinician({ employee_id: "e5b" }),
      ],
    );
    expect(m.mapping_method).toBe("ambiguous_employee");
    expect(m.mapping_status).toBe("unmapped");
    expect(m.employee_id).toBeNull();
  });

  it("blank/whitespace provider names are blank_name (never mapped)", () => {
    const res = computeMappings(
      [
        { provider_id: "P6", provider_name: "" },
        { provider_id: "P7", provider_name: "   " },
        { provider_id: "P8", provider_name: null },
      ],
      [clinician({ employee_id: "e6" })],
    );
    for (const m of res) {
      expect(m.mapping_method).toBe("blank_name");
      expect(m.mapping_status).toBe("unmapped");
      expect(m.mapping_confidence).toBe(0);
    }
  });

  it("providers without any employee match are no_employee_match, not guessed", () => {
    const [m] = computeMappings(
      [{ provider_id: "P9", provider_name: "Nobody Here" }],
      [clinician({ employee_id: "e9", first_name: "Jane", last_name: "Doe" })],
    );
    expect(m.mapping_method).toBe("no_employee_match");
    expect(m.mapping_status).toBe("unmapped");
    expect(m.employee_id).toBeNull();
    expect(m.mapping_confidence).toBe(0);
  });

  it("non-clinician employees (inactive or wrong role) never participate in matching", () => {
    const [m] = computeMappings(
      [{ provider_id: "P10", provider_name: "Jane Doe" }],
      [clinician({ employee_id: "e10", is_active_clinician: false })],
    );
    expect(m.mapping_method).toBe("no_employee_match");
    expect(m.mapping_status).toBe("unmapped");
  });

  it("exact_id wins over unique_name even when the names would match another clinician", () => {
    // Two providers, both named "Jane Doe" so name-based path would be ambiguous_provider.
    // One provider has an exact CR ID → exact_id still wins for that provider.
    const [pWithId, pWithoutId] = computeMappings(
      [
        { provider_id: "P11", provider_name: "Jane Doe" },
        { provider_id: "P12", provider_name: "Jane Doe" },
      ],
      [clinician({ employee_id: "e11", cr_id: "P11" })],
    );
    expect(pWithId.mapping_method).toBe("exact_id");
    expect(pWithId.employee_id).toBe("e11");
    expect(pWithoutId.mapping_method).toBe("ambiguous_provider");
  });

  it("ambiguous_id fires when two active clinicians already claim the same CR ID", () => {
    const [m] = computeMappings(
      [{ provider_id: "P13", provider_name: "Jane Doe" }],
      [
        clinician({ employee_id: "e13a", cr_id: "P13", first_name: "A", last_name: "One" }),
        clinician({ employee_id: "e13b", cr_id: "P13", first_name: "B", last_name: "Two" }),
      ],
    );
    expect(m.mapping_method).toBe("ambiguous_id");
    expect(m.mapping_status).toBe("unmapped");
    expect(m.employee_id).toBeNull();
  });

  it("normalizePersonName collapses whitespace and lowercases only (no punctuation stripping)", () => {
    expect(normalizePersonName("  Jane   DOE ")).toBe("jane doe");
    expect(normalizePersonName(null)).toBe("");
    expect(normalizePersonName("Jane\tDoe\n")).toBe("jane doe");
  });
});