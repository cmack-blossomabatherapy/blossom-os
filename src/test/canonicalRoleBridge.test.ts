import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as consumer from "@/lib/os/reporting/canonicalConsumer";
import {
  aggregateClientSummaryRows,
  assertNoCrossProviderLeakage,
  deriveCaseloadClientsFromCanonical,
  deriveMyClientsFromCanonical,
  deriveDeliveredServiceRowsFromCanonical,
  derivePtRecordsFromCanonical,
  deriveRbtServiceHoursMap,
  deriveRbtSupervisionCoverage,
  CANONICAL_SOURCE_LABEL,
} from "@/lib/os/reporting/canonicalRoleBridge";
import { CANONICAL_UNAVAILABLE_FIELDS } from "@/lib/os/reporting/canonicalFallback";

beforeEach(() => vi.restoreAllMocks());
afterEach(() => vi.restoreAllMocks());

function clientRow(over: Partial<consumer.CanonicalClientSummaryRow>): consumer.CanonicalClientSummaryRow {
  return {
    crClientId: "c1",
    clientName: "Alpha, A.",
    sessionKind: "direct",
    hours: 10,
    units: 40,
    rowCount: 4,
    minServiceDate: "2026-06-01",
    maxServiceDate: "2026-06-30",
    ...over,
  };
}

describe("aggregateClientSummaryRows", () => {
  it("folds multiple session_kind rows for the same client into one bucket", () => {
    const out = aggregateClientSummaryRows([
      clientRow({ sessionKind: "direct", hours: 20 }),
      clientRow({ sessionKind: "supervision", hours: 3 }),
      clientRow({ sessionKind: "parent_training", hours: 1.5 }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].directHours).toBe(20);
    expect(out[0].supervisionHours).toBe(3);
    expect(out[0].parentTrainingHours).toBe(1.5);
    expect(out[0].totalHours).toBe(24.5);
    expect(out[0].source).toBe("canonical");
    expect(out[0].unavailableFromCanonical).toBe(CANONICAL_UNAVAILABLE_FIELDS);
  });

  it("sorts by client name and preserves distinct clients", () => {
    const out = aggregateClientSummaryRows([
      clientRow({ crClientId: "c2", clientName: "Zeta, Z.", hours: 5 }),
      clientRow({ crClientId: "c1", clientName: "Alpha, A.", hours: 5 }),
    ]);
    expect(out.map((r) => r.crClientId)).toEqual(["c1", "c2"]);
  });
});

describe("deriveCaseloadClientsFromCanonical", () => {
  it("returns [] when scope is unmapped (never calls RPC, never fabricates)", async () => {
    const spy = vi.spyOn(consumer, "fetchCanonicalClientSummary");
    const out = await deriveCaseloadClientsFromCanonical({});
    expect(out).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns canonical-tagged caseload when RPC has rows for the provider", async () => {
    vi.spyOn(consumer, "fetchCanonicalClientSummary").mockResolvedValue([
      clientRow({ crClientId: "c1", hours: 12, sessionKind: "direct" }),
    ]);
    const out = await deriveCaseloadClientsFromCanonical({ authUserId: "u1" });
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe("canonical");
    expect(out[0].totalHours).toBe(12);
  });

  it("swallows RPC errors as [] (never fabricates)", async () => {
    vi.spyOn(consumer, "fetchCanonicalClientSummary").mockRejectedValue(new Error("rpc down"));
    const out = await deriveCaseloadClientsFromCanonical({ authUserId: "u1" });
    expect(out).toEqual([]);
  });
});

describe("derivePtRecordsFromCanonical", () => {
  it("only surfaces clients with 97156 rows in the export", async () => {
    vi.spyOn(consumer, "fetchCanonicalClientSummary").mockResolvedValue([
      clientRow({ crClientId: "c1", sessionKind: "direct", hours: 20 }),
      clientRow({ crClientId: "c1", sessionKind: "parent_training", hours: 2, rowCount: 3 }),
      clientRow({ crClientId: "c2", sessionKind: "direct", hours: 5 }),
    ]);
    const out = await derivePtRecordsFromCanonical({ authUserId: "u1" });
    expect(out).toHaveLength(1);
    expect(out[0].crClientId).toBe("c1");
    expect(out[0].ptHours).toBe(2);
    expect(out[0].ptRowCount).toBe(3);
    expect(out[0].source).toBe("canonical");
  });

  it("stable synthetic ids let list rendering key without collisions", async () => {
    vi.spyOn(consumer, "fetchCanonicalClientSummary").mockResolvedValue([
      clientRow({ crClientId: "c1", sessionKind: "parent_training", hours: 1 }),
    ]);
    const out = await derivePtRecordsFromCanonical({ authUserId: "u1" });
    expect(out[0].syntheticId).toBe("canon-pt-c1");
  });
});

describe("deriveRbtServiceHoursMap", () => {
  it("returns empty map when no employee ids given (never calls RPC)", async () => {
    const spy = vi.spyOn(consumer, "fetchCanonicalProviderSummary");
    const out = await deriveRbtServiceHoursMap([]);
    expect(out.size).toBe(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it("populates one entry per RBT with rows, skips RBTs with none", async () => {
    vi.spyOn(consumer, "fetchCanonicalProviderSummary").mockImplementation(async (scope: any) => {
      if (scope.employeeId === "e1") {
        return [
          { sessionKind: "direct", hours: 40, units: 160, rowCount: 20, distinctClients: 3, minServiceDate: "2026-06-01", maxServiceDate: "2026-06-30" },
        ];
      }
      return [];
    });
    const out = await deriveRbtServiceHoursMap(["e1", "e2"]);
    expect(out.size).toBe(1);
    expect(out.get("e1")?.directHours).toBe(40);
    expect(out.get("e2")).toBeUndefined();
  });
});

describe("deriveMyClientsFromCanonical", () => {
  it("derives distinct client list scoped to the RBT with hours + row counts", async () => {
    vi.spyOn(consumer, "fetchCanonicalClientSummary").mockResolvedValue([
      clientRow({ crClientId: "c1", clientName: "Alpha", hours: 30, rowCount: 15, sessionKind: "direct" }),
      clientRow({ crClientId: "c2", clientName: "Bravo", hours: 8, rowCount: 4, sessionKind: "direct" }),
    ]);
    const out = await deriveMyClientsFromCanonical({ employeeId: "e1" });
    expect(out).toHaveLength(2);
    expect(out.map((c) => c.crClientId).sort()).toEqual(["c1", "c2"]);
    expect(out[0].source).toBe("canonical");
  });
});

describe("deriveDeliveredServiceRowsFromCanonical", () => {
  it("marks scheduled/location fields explicitly null and unavailable", async () => {
    vi.spyOn(consumer, "fetchCanonicalSessionRows").mockResolvedValue([
      {
        rowId: "r1", batchId: "b1", sourceFileName: "cr.csv", batchUploadedAt: "2026-06-01T00:00:00Z",
        serviceDate: "2026-06-15", crClientId: "c1", clientName: "Alpha", crProviderId: "p1",
        providerName: "RBT One", providerEmployeeId: "e1", providerAuthUserId: "u1",
        procedureCode: "97153", sessionKind: "direct", hours: 2, units: 8,
      },
    ]);
    const out = await deriveDeliveredServiceRowsFromCanonical({ employeeId: "e1" });
    expect(out).toHaveLength(1);
    expect(out[0].scheduledStartTime).toBeNull();
    expect(out[0].scheduledEndTime).toBeNull();
    expect(out[0].location).toBeNull();
    expect(out[0].liveStatus).toBeNull();
    expect(out[0].unavailableFromCanonical).toEqual(CANONICAL_UNAVAILABLE_FIELDS);
  });
});

describe("deriveRbtSupervisionCoverage", () => {
  it("attributes 97155 hours to clients only, never as one-to-one RBT observations", async () => {
    vi.spyOn(consumer, "fetchCanonicalClientSummary").mockResolvedValue([
      clientRow({ crClientId: "c1", sessionKind: "supervision", hours: 1.5 }),
      clientRow({ crClientId: "c1", sessionKind: "direct", hours: 20 }),
      clientRow({ crClientId: "c2", sessionKind: "direct", hours: 5 }),
    ]);
    const out = await deriveRbtSupervisionCoverage({ employeeId: "e1" });
    expect(out).toHaveLength(1);
    expect(out[0].crClientId).toBe("c1");
    expect(out[0].supervisionHoursOnClient).toBe(1.5);
    expect(out[0].attribution).toBe("client_level_coverage");
  });
});

describe("assertNoCrossProviderLeakage", () => {
  it("flags rows whose provider ids differ from the scope", () => {
    const leaked = assertNoCrossProviderLeakage(
      { employeeId: "e1", authUserId: "u1" },
      [
        { providerEmployeeId: "e1", providerAuthUserId: "u1" },
        { providerEmployeeId: "e2", providerAuthUserId: "u1" },
        { providerEmployeeId: "e1", providerAuthUserId: "u2" },
      ],
    );
    expect(leaked).toHaveLength(2);
  });

  it("returns [] when every row matches the scope", () => {
    const leaked = assertNoCrossProviderLeakage(
      { employeeId: "e1" },
      [
        { providerEmployeeId: "e1", providerAuthUserId: "u1" },
        { providerEmployeeId: "e1", providerAuthUserId: "u9" },
      ],
    );
    expect(leaked).toHaveLength(0);
  });
});

describe("integration expectations", () => {
  it("CANONICAL_SOURCE_LABEL is stable so UI badges reference the view name", () => {
    expect(CANONICAL_SOURCE_LABEL).toBe("v_cr_canonical_sessions");
  });

  it("role-table > canonical precedence: caller decides via early-return, bridge never overrides", async () => {
    // The bridge helpers do not know about role tables. Callers must gate.
    // This test simply asserts the contract that the bridge never throws when
    // asked in a well-formed way — role-table checks live in the hooks.
    vi.spyOn(consumer, "fetchCanonicalClientSummary").mockResolvedValue([]);
    const out = await deriveCaseloadClientsFromCanonical({ authUserId: "u1" });
    expect(out).toEqual([]);
  });
});