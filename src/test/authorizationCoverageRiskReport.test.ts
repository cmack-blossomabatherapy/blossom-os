import { describe, expect, it } from "vitest";
import { computeAuthorizationCoverageRisk } from "@/lib/os/reports/crPrimary/metrics/authorizationCoverageRisk";
import type { ContinuityAuthRow } from "@/lib/os/reports/crPrimary/metrics/authorizationContinuity";

const TODAY = "2026-06-15";

function auth(overrides: Partial<ContinuityAuthRow>): ContinuityAuthRow {
  return {
    id: "a1",
    authorization_number: "AUTH-1",
    client_name: "Jane Doe",
    client_cr_id: "cr-1",
    payor: "Medicaid",
    state: "NC",
    procedure_code: "97153",
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    is_active: true,
    ...overrides,
  };
}

describe("computeAuthorizationCoverageRisk", () => {
  it("matches billing to authorization by CR client id first, even with mismatched names", () => {
    const auths = [auth({ client_name: "Jane Doe", client_cr_id: "cr-1" })];
    const billing = [
      {
        id: "b1",
        date_of_service: "2026-06-10",
        procedure_code: "97153",
        client_name: "J. Doe (typo)",
        client_cr_id: "cr-1",
      },
    ];
    const metrics = computeAuthorizationCoverageRisk(auths, billing, [], TODAY);
    expect(metrics.billingGaps).toHaveLength(0);
  });

  it("rejects an ambiguous normalized name as a fallback match", () => {
    const auths = [
      auth({ client_name: "John Smith", client_cr_id: "cr-1" }),
      auth({ client_name: "John Smith", client_cr_id: "cr-2", start_date: "2025-01-01", end_date: "2025-12-31" }),
    ];
    // Id-less billing row with a name that maps to two different CR ids.
    const billing = [
      { id: "b1", date_of_service: "2026-06-10", procedure_code: "97153", client_name: "John Smith", client_cr_id: null },
    ];
    const metrics = computeAuthorizationCoverageRisk(auths, billing, [], TODAY);
    expect(metrics.billingGaps).toHaveLength(1);
  });

  it("is service-code aware: a matching date under a different documented code is still a gap", () => {
    const auths = [auth({ client_cr_id: "cr-1", procedure_code: "97155" })];
    const billing = [
      { id: "b1", date_of_service: "2026-06-10", procedure_code: "97153", client_name: "Jane Doe", client_cr_id: "cr-1" },
    ];
    const metrics = computeAuthorizationCoverageRisk(auths, billing, [], TODAY);
    expect(metrics.billingGaps).toHaveLength(1);
    expect(metrics.billingGaps[0].code).toBe("97153");
  });

  it("classifies exactly 14 days to expiry as within-14-days and 15 days as outside it", () => {
    const in14 = auth({
      client_cr_id: "cr-14",
      start_date: "2026-01-01",
      end_date: "2026-06-29", // 14 days from TODAY
    });
    const at15 = auth({
      client_cr_id: "cr-15",
      start_date: "2026-01-01",
      end_date: "2026-06-30", // 15 days from TODAY
    });
    const metrics = computeAuthorizationCoverageRisk([in14, at15], [], [], TODAY);
    expect(metrics.expiring14.map((r) => r.clientCrId)).toContain("cr-14");
    expect(metrics.expiring14.map((r) => r.clientCrId)).not.toContain("cr-15");
  });

  it("classifies an authorization with a latest end date before today as expired", () => {
    const expired = auth({ client_cr_id: "cr-x", start_date: "2025-01-01", end_date: "2026-01-01" });
    const metrics = computeAuthorizationCoverageRisk([expired], [], [], TODAY);
    expect(metrics.expired).toHaveLength(1);
    expect(metrics.expired[0].continuity).toBe("expired");
  });

  it("treats a malformed date (Feb 31) as unknown, never a fabricated coverage window", () => {
    const malformed = auth({ client_cr_id: "cr-bad", start_date: "2026-02-31", end_date: null });
    const metrics = computeAuthorizationCoverageRisk([malformed], [], [], TODAY);
    expect(metrics.unknownDates).toHaveLength(1);
  });

  it("keeps missing remaining hours as Not Documented, never a fabricated zero", () => {
    const noHours = auth({ client_cr_id: "cr-nh", authorized_hours: null, worked_hours: null, remaining_hours: null });
    const zeroHours = auth({
      client_cr_id: "cr-zh",
      authorized_hours: 10,
      worked_hours: 10,
      remaining_hours: 0,
    });
    const metrics = computeAuthorizationCoverageRisk([noHours, zeroHours], [], [], TODAY);
    const noHoursRow = metrics.continuity.rows.find((r) => r.clientCrId === "cr-nh")!;
    expect(noHoursRow.remainingHours).toBeNull();
    expect(metrics.zeroRemainingHours.map((r) => r.clientCrId)).toContain("cr-zh");
    expect(metrics.zeroRemainingHours.map((r) => r.clientCrId)).not.toContain("cr-nh");
  });

  it("labels a coverage gap as a candidate needing confirmation, never a confirmed pause", () => {
    const auths = [auth({ client_cr_id: "cr-gap", start_date: "2025-01-01", end_date: "2026-01-01" })];
    const metrics = computeAuthorizationCoverageRisk(auths, [], [], TODAY);
    expect(metrics.clientsWithoutCoverage).toHaveLength(1);
    const note = metrics.clientsWithoutCoverage[0].note.toLowerCase();
    // The note must ask for confirmation and must never assert a pause as fact.
    expect(note).toContain("needs confirmation");
    expect(note).not.toMatch(/\bis (a )?confirmed\b/);
    expect(note).not.toMatch(/\bpaused\b/);

  });

  it("flags future kept scheduled activity with no matched active coverage", () => {
    const auths = [auth({ client_cr_id: "cr-1", start_date: "2025-01-01", end_date: "2026-01-01" })];
    const schedule = [
      {
        id: "s1",
        event_date: "2026-07-01",
        service_code: "97153",
        client_name: "Jane Doe",
        client_cr_id: "cr-1",
        cancelled: false,
        deleted: false,
      },
    ];
    const metrics = computeAuthorizationCoverageRisk(auths, [], schedule, TODAY);
    expect(metrics.scheduledGaps).toHaveLength(1);
  });

  it("does not flag a cancelled future scheduled entry", () => {
    const auths = [auth({ client_cr_id: "cr-1", start_date: "2025-01-01", end_date: "2026-01-01" })];
    const schedule = [
      {
        id: "s1",
        event_date: "2026-07-01",
        service_code: "97153",
        client_name: "Jane Doe",
        client_cr_id: "cr-1",
        cancelled: true,
        deleted: false,
      },
    ];
    const metrics = computeAuthorizationCoverageRisk(auths, [], schedule, TODAY);
    expect(metrics.scheduledGaps).toHaveLength(0);
  });
});
