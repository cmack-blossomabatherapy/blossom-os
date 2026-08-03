/**
 * Date filters on the BCBA Productivity Report must select the chosen month
 * out of the full loaded dataset. The reported defect ("7/1–7/31 shows no
 * data") came from a truncated load, so these tests assert the filter over a
 * multi-month dataset.
 */
import { describe, it, expect } from "vitest";
import {
  applyFilters, buildOwnership, EMPTY_FILTERS,
} from "@/lib/os/bcbaProductivityV3/engine";
import { buildBcbaProductivityModelFromOwnedRows } from "@/lib/os/bcbaProductivityV3/model";

const months = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07"];

const raw = months.flatMap((m) => ([
  { clientId: "1", clientName: "Areeb Hasan", renderingProvider: "Brandy Roden", providerLabels: "BCBA", code: "97155", hours: 2, date: `${m}-05`, state: "GA", payor: "Aetna", location: "" },
  { clientId: "1", clientName: "Areeb Hasan", renderingProvider: "Tech One", providerLabels: "RBT", code: "97153 RBT Clinic", hours: 20, date: `${m}-06`, state: "GA", payor: "Aetna", location: "" },
]));

const ownership = buildOwnership(raw);

describe("BCBA productivity date filters", () => {
  it("returns only July rows for 7/1–7/31", () => {
    const rows = applyFilters(ownership.rows, { ...EMPTY_FILTERS, from: "2026-07-01", to: "2026-07-31" });
    expect(rows.length).toBe(2);
    expect(rows.every((r) => r.date.startsWith("2026-07"))).toBe(true);
    const model = buildBcbaProductivityModelFromOwnedRows(rows, ownership);
    expect(model.kpis.totalHours).toBe(22);
    expect(model.kpis.hours97153).toBe(20);
    expect(model.kpis.hours97155).toBe(2);
    // 2 / 20 * 100 = 10% → healthy band.
    expect(model.kpis.supervisionPct).toBe(10);
  });

  it("month-by-month totals cover the whole dataset", () => {
    let sum = 0;
    for (const m of months) {
      const rows = applyFilters(ownership.rows, { ...EMPTY_FILTERS, from: `${m}-01`, to: `${m}-31` });
      expect(rows.length).toBe(2);
      sum += buildBcbaProductivityModelFromOwnedRows(rows, ownership).kpis.totalHours;
    }
    const all = buildBcbaProductivityModelFromOwnedRows(ownership.rows, ownership);
    expect(sum).toBe(all.kpis.totalHours);
  });

  it("assigned + unassigned equals the filtered total", () => {
    const rows = applyFilters(ownership.rows, { ...EMPTY_FILTERS, from: "2026-07-01", to: "2026-07-31" });
    const k = buildBcbaProductivityModelFromOwnedRows(rows, ownership).kpis;
    expect(k.assignedHours + k.unassignedHours).toBeCloseTo(k.totalHours, 2);
  });
});
