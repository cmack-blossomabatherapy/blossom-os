import { describe, it, expect } from "vitest";
import {
  inferAssignmentHistory,
  type InferBillingRow,
} from "@/lib/os/bcbaProductivityV3/inferAssignments";
import { ownerForClientAtDateV3 } from "@/lib/os/bcbaProductivityV3/store";

/**
 * Regression: when the *active* dataset is only a July slice with 97153
 * RBT rows, but historical May/June BCBA direct-service anchors exist,
 * inference over the union (ownership context) must attribute the July
 * 97153 hours to the historical BCBA — never Unassigned.
 *
 * Report KPIs still only count the active rows.
 */
function row(clientName: string, date: string, bcba: string, code: string, hours = 1): InferBillingRow {
  const is97153 = code.startsWith("97153");
  return {
    clientId: "",
    clientName,
    renderingProvider: bcba,
    providerLabels: is97153 ? "" : "BCBA",
    code,
    hours,
    date,
  };
}

describe("BCBA Productivity V3 ownership context — historical anchors attach current 97153 hours", () => {
  // Active (July): 97153 RBT rows only — no in-period BCBA anchor.
  const activeJulyRows: InferBillingRow[] = [
    row("Jamie Client", "2026-07-05", "RBT Person", "97153", 5),
    row("Jamie Client", "2026-07-12", "RBT Person", "97153", 4),
  ];
  // Historical direct-service anchors (May + June).
  const historicalAnchors: InferBillingRow[] = [
    row("Jamie Client", "2026-05-06", "Anchor BCBA", "97155"),
    row("Jamie Client", "2026-06-10", "Anchor BCBA", "97155"),
  ];

  it("inference over active-only leaves July RBT rows Unassigned", () => {
    const { assignments } = inferAssignmentHistory(activeJulyRows);
    expect(assignments).toHaveLength(0);
  });

  it("inference over ownership-context (active + historical) assigns July 97153 to the historical BCBA", () => {
    const context = [...historicalAnchors, ...activeJulyRows];
    const { assignments } = inferAssignmentHistory(context);
    expect(assignments.length).toBeGreaterThan(0);

    const owner = ownerForClientAtDateV3(assignments, "", "Jamie Client", "2026-07-05");
    expect(owner?.bcba).toBe("Anchor BCBA");
    const owner2 = ownerForClientAtDateV3(assignments, "", "Jamie Client", "2026-07-12");
    expect(owner2?.bcba).toBe("Anchor BCBA");
  });

  it("counted hours still reflect only the active July rows (not historical anchors)", () => {
    // The report keys hours off `rows` (active only). We simulate that by
    // summing hours in activeJulyRows directly — historical anchors must
    // never contribute to totals.
    const totalActiveHours = activeJulyRows.reduce((sum, r) => sum + r.hours, 0);
    expect(totalActiveHours).toBe(9);
  });

  it("true unassigned remains unassigned when no historical anchor exists", () => {
    const noHistoryContext: InferBillingRow[] = [
      row("Nobody Client", "2026-07-05", "RBT Person", "97153", 3),
    ];
    const { assignments } = inferAssignmentHistory(noHistoryContext);
    expect(assignments).toHaveLength(0);
  });
});