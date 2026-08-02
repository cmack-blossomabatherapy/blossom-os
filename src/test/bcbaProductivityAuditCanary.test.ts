import { describe, expect, it } from "vitest";
import {
  aggregate, applyFilters, buildOwnership, EMPTY_FILTERS, fmtHours, fmtPct,
  resolveReportState, supervisionPercent, type EngineBillingRow,
} from "@/lib/os/bcbaProductivityV3/engine";

const BCBA = "BCBA ,Georgia Location";
const RBT = "Behavior Technician ,Georgia Location";

function row(p: Partial<EngineBillingRow>): EngineBillingRow {
  return {
    clientId: "AREEB", clientName: "Areeb Hasan", renderingProvider: "RBT Person",
    providerLabels: RBT, code: "97153", hours: 1, date: "2026-03-05",
    state: "GA", payor: "Aetna", location: "", ...p,
  };
}
const bcbaRow = (name: string, code: string, hours: number, date: string) =>
  row({ renderingProvider: name, providerLabels: BCBA, code, hours, date });

/** Locked canary windows: March, Apr 1-9, Apr 10-May 31. */
const ROWS: EngineBillingRow[] = [
  // March 2026 — Brandy: 139.00 of 97153, 7.75 direct => 146.75 total
  row({ code: "97153", hours: 100, date: "2026-03-05" }),
  row({ code: "97153 GT", hours: 39, date: "2026-03-20" }),
  bcbaRow("Brandy Roden", "97155", 5.75, "2026-03-18"),
  bcbaRow("Brandy Roden", "97151", 2, "2026-03-19"),
  // April 1-9 — Brandy: 44.00 of 97153, 6.00 direct => 50.00 total
  bcbaRow("Brandy Roden", "97155", 4, "2026-04-01"),
  bcbaRow("Brandy Roden", "97156", 2, "2026-04-02"),
  row({ code: "97153", hours: 20, date: "2026-04-03" }),
  row({ code: "97153-HN", hours: 24, date: "2026-04-09" }),
  // April 10 - May 31 — Zestine: 243.00 of 97153, 14.75 direct => 257.75 total
  bcbaRow("Zestine Roberts", "97155", 9.75, "2026-04-10"),
  bcbaRow("Zestine Roberts", "97151", 5, "2026-05-06"),
  row({ code: "97153", hours: 120, date: "2026-04-20" }),
  row({ code: "97153", hours: 123, date: "2026-05-27" }),
];

const ownership = buildOwnership(ROWS);
const window = (from: string, to: string) =>
  aggregate(applyFilters(ownership.rows, { ...EMPTY_FILTERS, from, to }));

describe("BCBA Productivity audit canary — Areeb Hasan windows", () => {
  it("March 2026 belongs entirely to Brandy Roden with locked totals", () => {
    const agg = window("2026-03-01", "2026-03-31");
    expect(agg.totalHours).toBe(146.75);
    expect(agg.hours97153).toBe(139);
    expect(agg.directBcbaHours).toBe(7.75);
    const owners = agg.bcbaSummary.map((b) => b.bcba);
    expect(owners).toEqual(["Brandy Roden"]);
    expect(owners).not.toContain("Zestine Roberts");
    expect(agg.unassignedHours).toBe(0);
  });

  it("April 1-9 2026 belongs to Brandy Roden: 50.00 total, 44.00 of 97153, 6.00 direct", () => {
    const agg = window("2026-04-01", "2026-04-09");
    expect(agg.totalHours).toBe(50);
    expect(agg.hours97153).toBe(44);
    expect(agg.directBcbaHours).toBe(6);
    expect(agg.bcbaSummary.map((b) => b.bcba)).toEqual(["Brandy Roden"]);
  });

  it("April 10 - May 31 2026 belongs to Zestine Roberts: 257.75 total, 243.00 of 97153, 14.75 direct", () => {
    const agg = window("2026-04-10", "2026-05-31");
    expect(agg.totalHours).toBe(257.75);
    expect(agg.hours97153).toBe(243);
    expect(agg.directBcbaHours).toBe(14.75);
    expect(agg.bcbaSummary.map((b) => b.bcba)).toEqual(["Zestine Roberts"]);
  });
});

describe("BCBA Productivity audit — state fallback, formatting, supervision", () => {
  it("resolves state from provider contact labels when the state column is blank", () => {
    for (const [label, code] of [
      ["BCBA ,Georgia Location", "GA"],
      ["RBT ,Tennessee Location", "TN"],
      ["BCBA ,North Carolina Location", "NC"],
      ["BCBA ,Virginia Location", "VA"],
    ] as const) {
      expect(resolveReportState({ state: "", location: "", providerLabels: label })).toBe(code);
    }
  });

  it("prefers the normalized state column, then location free text", () => {
    expect(resolveReportState({ state: "georgia", providerLabels: "BCBA ,Virginia Location" })).toBe("GA");
    expect(resolveReportState({ state: "", location: "ORGANIZATION: Tennessee Clinic 12", providerLabels: "" })).toBe("TN");
  });

  it("formats hours with commas and one decimal, percent with one decimal, dash on no denominator", () => {
    expect(fmtHours(1234.5)).toBe("1,234.5");
    expect(fmtHours(139)).toBe("139.0");
    expect(supervisionPercent(9.75, 243)).toBeCloseTo(4.0, 1);
    expect(fmtPct(supervisionPercent(9.75, 243))).toBe("4.0%");
    expect(supervisionPercent(5, 0)).toBeNull();
    expect(fmtPct(null)).toBe("—");
  });

  it("counts unassigned hours only for clients with no BCBA anchors", () => {
    const withOrphan = buildOwnership([
      ...ROWS,
      row({ clientId: "ORPHAN", clientName: "No Anchor Child", code: "97153", hours: 12, date: "2026-04-15" }),
    ]);
    const agg = aggregate(withOrphan.rows);
    expect(agg.unassignedHours).toBe(12);
    expect(withOrphan.clientsWithoutAnchors.map((c) => c.clientName)).toEqual(["No Anchor Child"]);
    const assigned = agg.bcbaSummary.filter((b) => !b.isUnassigned)
      .reduce((sum, b) => sum + b.totalHours, 0);
    expect(Math.round((assigned + agg.unassignedHours) * 100) / 100).toBe(agg.totalHours);
  });
});
