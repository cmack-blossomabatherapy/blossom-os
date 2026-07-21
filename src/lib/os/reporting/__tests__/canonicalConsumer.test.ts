import { describe, it, expect } from "vitest";
import {
  dedupeSessionRows,
  resolvePrecedence,
  sessionDedupeKey,
  summarizeProviderRows,
  type CanonicalProviderSummaryRow,
  type CanonicalSessionRow,
} from "../canonicalConsumer";

function row(over: Partial<CanonicalSessionRow>): CanonicalSessionRow {
  return {
    rowId: "r1",
    batchId: null,
    sourceFileName: null,
    batchUploadedAt: null,
    serviceDate: "2026-01-01",
    crClientId: "c1",
    clientName: "Child A",
    crProviderId: "p1",
    providerName: "Prov",
    providerEmployeeId: null,
    providerAuthUserId: null,
    procedureCode: "97153",
    sessionKind: "direct",
    hours: 1.5,
    units: 6,
    ...over,
  };
}

describe("canonicalConsumer — dedupe", () => {
  it("collapses re-uploaded rows by (dos, client, provider, code, hours) keeping newest batch", () => {
    const rows = [
      row({ rowId: "a", batchUploadedAt: "2026-05-01T00:00:00Z" }),
      row({ rowId: "b", batchUploadedAt: "2026-06-01T00:00:00Z" }),
      row({ rowId: "c", serviceDate: "2026-01-02" }),
    ];
    const out = dedupeSessionRows(rows);
    expect(out).toHaveLength(2);
    const winner = out.find((r) => r.serviceDate === "2026-01-01");
    expect(winner?.rowId).toBe("b");
  });

  it("dedupe key is stable and deterministic", () => {
    expect(sessionDedupeKey(row({}))).toBe(sessionDedupeKey(row({})));
    expect(sessionDedupeKey(row({}))).not.toBe(
      sessionDedupeKey(row({ hours: 1.75 })),
    );
    expect(sessionDedupeKey(row({}))).not.toBe(
      sessionDedupeKey(row({ crProviderId: "p2" })),
    );
  });

  it("tiebreaks equal batch time with larger rowId", () => {
    const rows = [
      row({ rowId: "aaa", batchUploadedAt: "2026-06-01T00:00:00Z" }),
      row({ rowId: "zzz", batchUploadedAt: "2026-06-01T00:00:00Z" }),
    ];
    expect(dedupeSessionRows(rows)[0].rowId).toBe("zzz");
  });
});

describe("canonicalConsumer — precedence", () => {
  it("prefers role rows when present", () => {
    expect(
      resolvePrecedence({
        roleRowCount: 3,
        canonicalRowCount: 10,
        scope: { authUserId: "u" },
        requireScope: true,
      }).source,
    ).toBe("role");
  });

  it("falls back to canonical when role is empty and provider is mapped", () => {
    const r = resolvePrecedence({
      roleRowCount: 0,
      canonicalRowCount: 5,
      scope: { authUserId: "u" },
      requireScope: true,
    });
    expect(r.source).toBe("canonical");
  });

  it("returns unmapped_provider (not no_data) when clinician scope is unmapped", () => {
    const r = resolvePrecedence({
      roleRowCount: 0,
      canonicalRowCount: 0,
      scope: {},
      requireScope: true,
    });
    expect(r).toEqual({ source: "missing", reason: "unmapped_provider" });
  });

  it("returns no_data when scope is not required (company-wide report) and empty", () => {
    const r = resolvePrecedence({
      roleRowCount: 0,
      canonicalRowCount: 0,
      scope: {},
      requireScope: false,
    });
    expect(r).toEqual({ source: "missing", reason: "no_data" });
  });

  it("company-wide report with canonical data auto-selects canonical", () => {
    const r = resolvePrecedence({
      roleRowCount: 0,
      canonicalRowCount: 12345,
      scope: {},
      requireScope: false,
    });
    expect(r.source).toBe("canonical");
  });
});

describe("canonicalConsumer — summarize", () => {
  it("buckets hours by kind and aggregates freshness range", () => {
    const input: CanonicalProviderSummaryRow[] = [
      {
        sessionKind: "direct",
        hours: 10,
        units: 40,
        rowCount: 5,
        distinctClients: 3,
        minServiceDate: "2026-01-01",
        maxServiceDate: "2026-03-01",
      },
      {
        sessionKind: "supervision",
        hours: 2,
        units: 8,
        rowCount: 2,
        distinctClients: 2,
        minServiceDate: "2026-02-01",
        maxServiceDate: "2026-04-01",
      },
      {
        sessionKind: "parent_training",
        hours: 1,
        units: 4,
        rowCount: 1,
        distinctClients: 1,
        minServiceDate: "2026-01-15",
        maxServiceDate: "2026-01-15",
      },
      {
        sessionKind: "cancellation",
        hours: 0.5,
        units: 2,
        rowCount: 1,
        distinctClients: 1,
        minServiceDate: null,
        maxServiceDate: null,
      },
    ];
    const t = summarizeProviderRows(input);
    expect(t.directHours).toBe(10);
    expect(t.supervisionHours).toBe(2);
    expect(t.parentTrainingHours).toBe(1);
    expect(t.cancellationHours).toBe(0.5);
    expect(t.totalHours).toBeCloseTo(13.5);
    expect(t.rowCount).toBe(9);
    expect(t.minServiceDate).toBe("2026-01-01");
    expect(t.maxServiceDate).toBe("2026-04-01");
  });

  it("handles empty input without exploding", () => {
    const t = summarizeProviderRows([]);
    expect(t.totalHours).toBe(0);
    expect(t.minServiceDate).toBeNull();
    expect(t.maxServiceDate).toBeNull();
  });
});

describe("canonicalConsumer — report auto-source selection contract", () => {
  it("company-wide report skips scope requirement and consumes canonical", () => {
    const r = resolvePrecedence({
      roleRowCount: 0,
      canonicalRowCount: 1,
      scope: {},
      requireScope: false,
    });
    expect(r).toEqual({ source: "canonical", reason: "canonical_has_rows" });
  });

  it("clinician surface never leaks across unmapped providers", () => {
    // Even if canonical has data globally, unmapped scope must not show it.
    const r = resolvePrecedence({
      roleRowCount: 0,
      canonicalRowCount: 999,
      scope: {},
      requireScope: true,
    });
    expect(r.source).toBe("missing");
  });
});