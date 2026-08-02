import { describe, it, expect } from "vitest";
import { inferAssignmentHistory } from "@/lib/os/bcbaProductivityV3/inferAssignments";
import { ownerForClientAtDateV3 } from "@/lib/os/bcbaProductivityV3/store";
import { normalizeUsState } from "@/lib/os/bcbaProductivityV3/stateNormalization";

interface Row {
  clientId: string; clientName: string; renderingProvider: string;
  providerLabels: string; code: string; hours: number; date: string; state?: string;
}

/** One client: RBT 97153 rows plus a single BCBA 97155 anchor. */
const rows: Row[] = [
  { clientId: "C1", clientName: "Test Client", renderingProvider: "Riley RBT", providerLabels: "RBT", code: "97153", hours: 3, date: "2026-03-02", state: "Georgia" },
  { clientId: "C1", clientName: "Test Client", renderingProvider: "Riley RBT", providerLabels: "RBT", code: "97153", hours: 2.5, date: "2026-03-09", state: "georgia" },
  { clientId: "C1", clientName: "Test Client", renderingProvider: "Riley RBT", providerLabels: "RBT", code: "97153", hours: 4, date: "2026-03-20", state: "GA" },
  { clientId: "C1", clientName: "Test Client", renderingProvider: "Brandy Roden", providerLabels: "BCBA", code: "97155", hours: 1, date: "2026-03-10", state: "GA" },
];

describe("BCBA Productivity V3 — inferred ownership with empty saved history", () => {
  const inferred = inferAssignmentHistory(rows);
  const savedAssignments: never[] = []; // production: bcba_assignment_history is empty

  it("produces inferred anchors from BCBA provider labels", () => {
    expect(inferred.anchorRowCount).toBe(1);
    expect(inferred.clientsWithAnchors).toBe(1);
    expect(inferred.assignments.length).toBeGreaterThan(0);
    expect(inferred.assignments[0].bcbaName).toBe("Brandy Roden");
  });

  it("resolves every active RBT 97153 row to the inferred BCBA row-by-row", () => {
    const owned = rows.map((r) => {
      const saved = savedAssignments.length
        ? ownerForClientAtDateV3(savedAssignments, r.clientId, r.clientName, r.date)
        : null;
      const owner = saved ?? ownerForClientAtDateV3(inferred.assignments, r.clientId, r.clientName, r.date);
      return { ...r, bcbaOwner: owner?.bcba ?? null };
    });
    expect(owned.every((r) => r.bcbaOwner === "Brandy Roden")).toBe(true);
  });

  it("empty saved assignment history yields zero unassigned hours when anchors exist", () => {
    const unassignedHours = rows.reduce((sum, r) => {
      const owner = ownerForClientAtDateV3(inferred.assignments, r.clientId, r.clientName, r.date);
      return owner ? sum : sum + r.hours;
    }, 0);
    expect(unassignedHours).toBe(0);
  });

  it("rows are unassigned only when no anchor can resolve the client", () => {
    const noAnchor = [
      { clientId: "C9", clientName: "No Anchor Client", renderingProvider: "Riley RBT", providerLabels: "RBT", code: "97153", hours: 5, date: "2026-04-01" },
    ];
    const inf = inferAssignmentHistory(noAnchor);
    expect(inf.assignments).toHaveLength(0);
    expect(ownerForClientAtDateV3(inf.assignments, "C9", "No Anchor Client", "2026-04-01")).toBeNull();
  });

  it("state filter matches GA for rows stored as GA, Georgia, and georgia", () => {
    const matched = rows.filter((r) => normalizeUsState(r.state) === "GA");
    expect(matched).toHaveLength(4);
    const options = [...new Set(rows.map((r) => normalizeUsState(r.state)).filter(Boolean))];
    expect(options).toEqual(["GA"]);
  });
});

describe("BCBA Productivity V3 — shared admin dataset is the report source", () => {
  it("the report page loads the shared admin dataset and never a canonical RPC", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("src/pages/os/reports/BcbaProductivityReportV3.tsx", "utf8");
    expect(src).toContain("getBcbaProductivitySharedRows");
    expect(src).toContain("getBcbaProductivityDatasetStatus");
    expect(src).toContain("getBcbaProductivityOwnershipContextRows");
    expect(src).not.toContain("fetchBcbaBillingRowsAsSharedShape");
  });
});
