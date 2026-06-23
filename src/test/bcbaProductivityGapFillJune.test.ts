import { describe, it, expect } from "vitest";
import {
  ownerForClientAtDateV3,
  type BcbaAssignmentV3,
  normalizeName,
} from "@/lib/os/bcbaProductivityV3/store";
import {
  inferAssignmentHistory,
  type InferBillingRow,
} from "@/lib/os/bcbaProductivityV3/inferAssignments";

/**
 * Regression: partial saved Assignment History (that ends before June)
 * must NOT prevent inferred ownership from covering June rows.
 *
 * Mirrors the per-row resolution used in BcbaProductivityReportV3:
 *   1. Try saved Assignment History for that client/DOS.
 *   2. Fall back to inferred ownership for the same client/DOS.
 *   3. Only unassigned when neither matches.
 */
function resolveOwnerForRow(
  saved: BcbaAssignmentV3[],
  inferred: BcbaAssignmentV3[],
  savedClientKeys: Set<string>,
  row: { clientId: string; clientName: string; date: string },
) {
  const savedOwner = saved.length
    ? ownerForClientAtDateV3(saved, row.clientId, row.clientName, row.date)
    : null;
  const inferredOwner = savedOwner
    ? null
    : ownerForClientAtDateV3(inferred, row.clientId, row.clientName, row.date);
  const owner = savedOwner ?? inferredOwner;
  const key = (row.clientId && row.clientId.trim()) || normalizeName(row.clientName);
  const hasSaved = savedClientKeys.has(key);
  const source = !owner
    ? "unassigned"
    : savedOwner
      ? "saved"
      : hasSaved ? "inferred_gap_fill" : "inferred";
  return { owner: owner?.bcba ?? null, source };
}

function row(clientName: string, date: string, bcba: string, code: string, hours = 1): InferBillingRow {
  return {
    clientId: "",
    clientName,
    renderingProvider: bcba,
    providerLabels: bcba ? "BCBA" : "",
    code,
    hours,
    date,
  };
}

describe("BCBA Productivity V3 - saved history must not block inferred June ownership", () => {
  // Saved Assignment History ends 2026-05-31; inferred BCBA anchors exist in June.
  const saved: BcbaAssignmentV3[] = [
    {
      id: "saved-melody",
      clientId: "",
      clientName: "Melody Simmons",
      bcbaName: "Old BCBA",
      startDate: "2026-01-01",
      endDate: "2026-05-31",
      createdAt: 0,
    },
  ];
  const savedKeys = new Set(saved.map(a => normalizeName(a.clientName)));

  const billingRows: InferBillingRow[] = [
    // BCBA anchor rows in June establish inferred ownership.
    row("Melody Simmons", "2026-06-02", "Inferred BCBA", "97155"),
    row("Malachi Simmons", "2026-06-03", "Inferred BCBA", "97155"),
    row("Jesse Miller", "2026-06-04", "Other BCBA", "97155"),
    // 97153 RBT hours that should attach to the inferred owner in June.
    row("Melody Simmons", "2026-06-10", "RBT Person", "97153", 6),
    row("Malachi Simmons", "2026-06-11", "RBT Person", "97153", 5),
    row("Jesse Miller", "2026-06-12", "RBT Person", "97153", 4),
  ];

  const inferred = inferAssignmentHistory(billingRows);

  it("inferred ownership exists for the June clients", () => {
    const names = new Set(inferred.assignments.map(a => a.clientName));
    expect(names.has("Melody Simmons")).toBe(true);
    expect(names.has("Malachi Simmons")).toBe(true);
    expect(names.has("Jesse Miller")).toBe(true);
  });

  it("June 97153 row for client with saved history ending in May is gap-filled by inferred ownership", () => {
    const r = { clientId: "", clientName: "Melody Simmons", date: "2026-06-10" };
    const res = resolveOwnerForRow(saved, inferred.assignments, savedKeys, r);
    expect(res.owner).toBe("Inferred BCBA");
    expect(res.source).toBe("inferred_gap_fill");
  });

  it("June row for client with no saved history is plain inferred (not unassigned)", () => {
    const r = { clientId: "", clientName: "Jesse Miller", date: "2026-06-12" };
    const res = resolveOwnerForRow(saved, inferred.assignments, savedKeys, r);
    expect(res.owner).toBe("Other BCBA");
    expect(res.source).toBe("inferred");
  });

  it("saved history still wins for dates it covers", () => {
    const r = { clientId: "", clientName: "Melody Simmons", date: "2026-05-15" };
    const res = resolveOwnerForRow(saved, inferred.assignments, savedKeys, r);
    expect(res.owner).toBe("Old BCBA");
    expect(res.source).toBe("saved");
  });

  it("global regression: no June row is left Unassigned when inferred can resolve it", () => {
    const juneRows = billingRows.filter(r => r.date.startsWith("2026-06"));
    for (const r of juneRows) {
      const res = resolveOwnerForRow(saved, inferred.assignments, savedKeys, r);
      expect(res.owner, `${r.clientName} ${r.date} should not be unassigned`).not.toBeNull();
      expect(res.source).not.toBe("unassigned");
    }
  });
});