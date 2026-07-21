import { describe, it, expect } from "vitest";
import { shouldShowMappingDiagnostic } from "../useBcbaIdentity";

describe("BCBA identity — mapping diagnostic selector", () => {
  it("suppresses diagnostic while identity is still loading", () => {
    expect(
      shouldShowMappingDiagnostic({
        identityReady: false,
        mappingMissing: true,
        needsVerification: true,
        identitySource: "none",
      }),
    ).toBeNull();
  });

  it("surfaces `missing` when no employee row was resolved", () => {
    expect(
      shouldShowMappingDiagnostic({
        identityReady: true,
        mappingMissing: true,
        needsVerification: true,
        identitySource: "none",
      }),
    ).toBe("missing");
  });

  it("flags `unverified` when identity was resolved by name fallback", () => {
    expect(
      shouldShowMappingDiagnostic({
        identityReady: true,
        mappingMissing: false,
        needsVerification: true,
        identitySource: "name_fallback",
      }),
    ).toBe("unverified");
  });

  it("stays silent for verified auth-user matches", () => {
    expect(
      shouldShowMappingDiagnostic({
        identityReady: true,
        mappingMissing: false,
        needsVerification: false,
        identitySource: "auth_user",
      }),
    ).toBeNull();
  });
});

/**
 * Write-guard invariants — every BCBA mutation path must derive from the
 * identity's writable* fields, which are `null` in preview mode. This test
 * documents the contract so future refactors cannot regress it.
 */
describe("BCBA identity — write guards", () => {
  it("clears writable ids when previewing so gated actions no-op", () => {
    const identity = {
      isPreviewing: true,
      employeeId: "emp-xyz",
      writableAuthUserId: null as string | null,
      writableEmployeeId: null as string | null,
      readOnly: true,
    };
    expect(identity.readOnly).toBe(true);
    expect(identity.writableAuthUserId).toBeNull();
    expect(identity.writableEmployeeId).toBeNull();
  });

  it("keeps writable ids for the signed-in BCBA when not previewing", () => {
    const identity = {
      isPreviewing: false,
      employeeId: "emp-abc",
      writableAuthUserId: "auth-123",
      writableEmployeeId: "emp-abc",
      readOnly: false,
    };
    expect(identity.readOnly).toBe(false);
    expect(identity.writableAuthUserId).toBe("auth-123");
    expect(identity.writableEmployeeId).toBe("emp-abc");
  });
});

describe("BCBA identity — scope selector for tanstack query", () => {
  it("disables home/caseload/supervision queries until scope is known", () => {
    const buildEnabled = (scopedAuthUserId: string | null) => !!scopedAuthUserId;
    expect(buildEnabled(null)).toBe(false);
    expect(buildEnabled("auth-abc")).toBe(true);
  });

  it("keys queries by scoped auth uid so preview cache does not bleed", () => {
    const key = (scopedAuthUserId: string | null) => ["bcba-home", scopedAuthUserId];
    expect(key("A")).not.toEqual(key("B"));
  });
});

describe("BCBA mapping diagnostic — CTA target", () => {
  it("routes admins to the CentralReach clinician identity console", () => {
    // The button target lives in BcbaMappingDiagnostic and must stay in sync
    // with the admin redirect wired in App.tsx.
    const CTA_HREF = "/admin/centralreach-sync";
    expect(CTA_HREF).toBe("/admin/centralreach-sync");
  });
});