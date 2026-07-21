/**
 * Deterministic clinician↔CentralReach provider mapping.
 *
 * Mirrors the SQL logic in `v_cr_provider_mapping` so it can be unit-tested
 * and consumed by admin diagnostics UIs without duplicating precedence rules.
 *
 * Precedence (highest → lowest):
 *   1. exact_id           — exactly one active clinician has employees.centralreach_id === provider_id
 *   2. unique_name        — normalized provider_name matches exactly one active clinician
 *                            AND exactly one provider_id shares that normalized name
 *   3. blank_name         — provider_name is blank/whitespace
 *   4. ambiguous_id       — >1 active clinicians already claim the same CentralReach ID
 *   5. ambiguous_provider — >1 provider IDs share the same normalized name
 *   6. ambiguous_employee — >1 active clinicians share the same normalized name
 *   7. no_employee_match  — no active clinician matches the normalized name
 */

export type MappingMethod =
  | "exact_id"
  | "unique_name"
  | "blank_name"
  | "ambiguous_id"
  | "ambiguous_provider"
  | "ambiguous_employee"
  | "no_employee_match";

export type MappingStatus = "mapped" | "unmapped";

export interface ProviderInput {
  provider_id: string;
  provider_name: string | null;
}

export interface ClinicianInput {
  employee_id: string;
  cr_id: string | null;
  first_name: string | null;
  last_name: string | null;
  is_active_clinician: boolean;
}

export interface MappingDecision {
  provider_id: string;
  provider_name: string;
  provider_name_key: string;
  employee_id: string | null;
  mapping_method: MappingMethod;
  mapping_status: MappingStatus;
  mapping_confidence: number;
  ambiguity_reason: string | null;
}

export function normalizePersonName(input: string | null | undefined): string {
  return (input ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function computeMappings(
  providers: ProviderInput[],
  clinicians: ClinicianInput[],
): MappingDecision[] {
  const active = clinicians.filter((c) => c.is_active_clinician);
  const empByName = new Map<string, ClinicianInput[]>();
  const empByCrId = new Map<string, ClinicianInput[]>();
  for (const c of active) {
    const key = normalizePersonName(`${c.first_name ?? ""} ${c.last_name ?? ""}`);
    if (key) {
      const bucket = empByName.get(key) ?? [];
      bucket.push(c);
      empByName.set(key, bucket);
    }
    const crId = (c.cr_id ?? "").trim();
    if (crId) {
      const bucket = empByCrId.get(crId) ?? [];
      bucket.push(c);
      empByCrId.set(crId, bucket);
    }
  }

  const provByName = new Map<string, number>();
  for (const p of providers) {
    const key = normalizePersonName(p.provider_name);
    if (key) provByName.set(key, (provByName.get(key) ?? 0) + 1);
  }

  return providers.map((p) => {
    const providerName = p.provider_name ?? "";
    const nameKey = normalizePersonName(providerName);
    const exact = empByCrId.get(p.provider_id) ?? [];

    if (exact.length === 1) {
      return {
        provider_id: p.provider_id,
        provider_name: providerName,
        provider_name_key: nameKey,
        employee_id: exact[0].employee_id,
        mapping_method: "exact_id",
        mapping_status: "mapped",
        mapping_confidence: 1.0,
        ambiguity_reason: null,
      };
    }
    if (exact.length > 1) {
      return {
        provider_id: p.provider_id,
        provider_name: providerName,
        provider_name_key: nameKey,
        employee_id: null,
        mapping_method: "ambiguous_id",
        mapping_status: "unmapped",
        mapping_confidence: 0,
        ambiguity_reason: "Multiple active clinicians already claim this CentralReach ID",
      };
    }
    if (!nameKey) {
      return {
        provider_id: p.provider_id,
        provider_name: providerName,
        provider_name_key: nameKey,
        employee_id: null,
        mapping_method: "blank_name",
        mapping_status: "unmapped",
        mapping_confidence: 0,
        ambiguity_reason: "Provider name is blank in CentralReach export",
      };
    }
    const emps = empByName.get(nameKey) ?? [];
    const provCount = provByName.get(nameKey) ?? 0;
    if (emps.length === 1 && provCount === 1) {
      return {
        provider_id: p.provider_id,
        provider_name: providerName,
        provider_name_key: nameKey,
        employee_id: emps[0].employee_id,
        mapping_method: "unique_name",
        mapping_status: "mapped",
        mapping_confidence: 0.75,
        ambiguity_reason: null,
      };
    }
    if (provCount > 1) {
      return {
        provider_id: p.provider_id,
        provider_name: providerName,
        provider_name_key: nameKey,
        employee_id: null,
        mapping_method: "ambiguous_provider",
        mapping_status: "unmapped",
        mapping_confidence: 0,
        ambiguity_reason: "Multiple CentralReach provider IDs share this name",
      };
    }
    if (emps.length > 1) {
      return {
        provider_id: p.provider_id,
        provider_name: providerName,
        provider_name_key: nameKey,
        employee_id: null,
        mapping_method: "ambiguous_employee",
        mapping_status: "unmapped",
        mapping_confidence: 0,
        ambiguity_reason: "Multiple active clinicians share this name",
      };
    }
    return {
      provider_id: p.provider_id,
      provider_name: providerName,
      provider_name_key: nameKey,
      employee_id: null,
      mapping_method: "no_employee_match",
      mapping_status: "unmapped",
      mapping_confidence: 0,
      ambiguity_reason: "No active clinician matches this provider name",
    };
  });
}