import { describe, expect, it } from "vitest";
import {
  aggregate, applyFilters, buildOwnership, drilldownRowToCells, DRILLDOWN_COLUMNS,
  EMPTY_FILTERS, fmtCount, fmtHours, fmtPct, normalizeProcedureCode, resolveReportState,
  supervisionPercent, supervisionStatus, toCsv, type EngineBillingRow,
} from "@/lib/os/bcbaProductivityV3/engine";

const BCBA_LABELS = "BCBA ,Georgia Location";
const RBT_LABELS = "Behavior Technician ,Georgia Location";

function row(p: Partial<EngineBillingRow>): EngineBillingRow {
  return {
    clientId: "C1", clientName: "Areeb Hasan", renderingProvider: "Jalanda Simpson",
    providerLabels: RBT_LABELS, code: "97153", hours: 1, date: "2026-03-02",
    state: "GA", payor: "Aetna", location: "", ...p,
  };
}

/** Areeb Hasan canary — locked by product. */
const AREEB_ROWS: EngineBillingRow[] = [
  // March 2026: 139.0 hrs of 97153 by an RBT, 7.75 direct BCBA hours by Brandy Roden.
  row({ code: "97153", hours: 100, date: "2026-03-05" }),
  row({ code: "97153 GT", hours: 39, date: "2026-03-20" }),
  row({ code: "97155", hours: 5.75, date: "2026-03-18", renderingProvider: "Brandy Roden", providerLabels: BCBA_LABELS }),
  row({ code: "97151", hours: 2, date: "2026-03-18", renderingProvider: "Brandy Roden", providerLabels: BCBA_LABELS }),
  // April 2026: Brandy anchors Apr 1, Zestine anchors Apr 10.
  row({ code: "97155", hours: 1, date: "2026-04-01", renderingProvider: "Brandy Roden", providerLabels: BCBA_LABELS }),
  row({ code: "97153", hours: 4, date: "2026-04-09" }),
  row({ code: "97155", hours: 1, date: "2026-04-10", renderingProvider: "Zestine Roberts", providerLabels: BCBA_LABELS }),
  row({ code: "97153", hours: 6, date: "2026-04-15" }),
];

describe("code normalization", () => {
  it("normalizes every code family by prefix", () => {
    expect(normalizeProcedureCode("97153 GT")).toBe("97153");
    expect(normalizeProcedureCode("97153-HN")).toBe("97153");
    expect(normalizeProcedureCode("97155TS")).toBe("97155");
    expect(normalizeProcedureCode("97151 Assessment")).toBe("97151");
    expect(normalizeProcedureCode("97152")).toBe("97152");
    expect(normalizeProcedureCode("97156 GT")).toBe("97156");
  });

  it("keeps unknown codes intact", () => {
    expect(normalizeProcedureCode("H2019")).toBe("H2019");
    expect(normalizeProcedureCode("")).toBe("");
  });
});

describe("supervision formula and status bands", () => {
  it("computes 97155 / 97153 * 100", () => {
    expect(supervisionPercent(10, 100)).toBe(10);
    expect(supervisionPercent(5.75, 139)).toBeCloseTo(4.1, 1);
  });

  it("returns null when 97153 hours are zero", () => {
    expect(supervisionPercent(5, 0)).toBeNull();
    expect(supervisionStatus(null)).toBe("none");
    expect(fmtPct(null)).toBe("—");
  });

  it("bands at <5 red, 5-9.9 yellow, >=10 green", () => {
    expect(supervisionStatus(4.9)).toBe("red");
    expect(supervisionStatus(5)).toBe("yellow");
    expect(supervisionStatus(9.9)).toBe("yellow");
    expect(supervisionStatus(10)).toBe("green");
  });
});

describe("Areeb Hasan ownership canary", () => {
  const ownership = buildOwnership(AREEB_ROWS);

  it("gives March 2026 entirely to Brandy Roden", () => {
    const march = ownership.rows.filter((r) => r.monthKey === "2026-03");
    expect(march.length).toBe(4);
    expect([...new Set(march.map((r) => r.owner))]).toEqual(["Brandy Roden"]);
  });

  it("matches the locked March totals", () => {
    const march = aggregate(ownership.rows.filter((r) => r.monthKey === "2026-03"));
    expect(march.totalHours).toBe(146.75);
    expect(march.hours97153).toBe(139);
    expect(march.directBcbaHours).toBe(7.75);
    const brandy = march.bcbaSummary.find((b) => b.bcba === "Brandy Roden");
    expect(brandy?.totalHours).toBe(146.75);
    expect(brandy?.hours97153).toBe(139);
    expect(brandy?.directBcbaHours).toBe(7.75);
  });

  it("never splits March to Zestine Roberts", () => {
    const march = ownership.rows.filter((r) => r.monthKey === "2026-03");
    expect(march.some((r) => r.owner === "Zestine Roberts")).toBe(false);
  });

  it("splits April: Apr 1-9 Brandy, Apr 10 onward Zestine", () => {
    const april = ownership.rows.filter((r) => r.monthKey === "2026-04");
    const owners = new Map(april.map((r) => [r.date, r.owner]));
    expect(owners.get("2026-04-01")).toBe("Brandy Roden");
    expect(owners.get("2026-04-09")).toBe("Brandy Roden");
    expect(owners.get("2026-04-10")).toBe("Zestine Roberts");
    expect(owners.get("2026-04-15")).toBe("Zestine Roberts");
  });

  it("credits 97153 RBT hours to the inferred BCBA owner on the DOS", () => {
    const agg = aggregate(ownership.rows);
    const brandy = agg.bcbaSummary.find((b) => b.bcba === "Brandy Roden");
    const zestine = agg.bcbaSummary.find((b) => b.bcba === "Zestine Roberts");
    expect(brandy?.hours97153).toBe(143); // 139 March + 4 on Apr 9
    expect(zestine?.hours97153).toBe(6);
    expect(agg.unassignedHours).toBe(0);
  });
});

describe("ownership carry-forward and gaps", () => {
  it("carries the prior owner into later months with no anchors", () => {
    const rows = buildOwnership([
      row({ code: "97155", hours: 1, date: "2026-01-05", renderingProvider: "Brandy Roden", providerLabels: BCBA_LABELS }),
      row({ code: "97153", hours: 8, date: "2026-02-10" }),
    ]).rows;
    const feb = rows.find((r) => r.monthKey === "2026-02");
    expect(feb?.owner).toBe("Brandy Roden");
    expect(feb?.ownerReason).toBe("carry_forward");
  });

  it("leaves clients with no anchor unassigned", () => {
    const result = buildOwnership([row({ clientId: "C9", clientName: "No Anchor", code: "97153", hours: 3 })]);
    expect(result.rows[0].owner).toBeNull();
    expect(result.clientsWithoutAnchors.map((c) => c.clientName)).toContain("No Anchor");
    expect(aggregate(result.rows).unassignedHours).toBe(3);
  });

  it("never lets a client contact label drive ownership", () => {
    const result = buildOwnership([
      row({ code: "97153", hours: 5, providerLabels: "BCBA ,Georgia Location", renderingProvider: "Jalanda Simpson" }),
    ]);
    // 97153 rows can never be anchors even when the provider carries a BCBA label.
    expect(result.rows[0].isAnchor).toBe(false);
    expect(result.rows[0].owner).toBeNull();
  });
});

describe("filters", () => {
  const rows = buildOwnership(AREEB_ROWS).rows;

  it("filters by date range", () => {
    const out = applyFilters(rows, { ...EMPTY_FILTERS, from: "2026-04-01", to: "2026-04-30" });
    expect(out.every((r) => r.monthKey === "2026-04")).toBe(true);
    expect(out.length).toBe(4);
  });

  it("filters by BCBA owner, code, provider and search", () => {
    expect(applyFilters(rows, { ...EMPTY_FILTERS, bcba: "Zestine Roberts" }).length).toBe(2);
    expect(applyFilters(rows, { ...EMPTY_FILTERS, code: "97153" }).length).toBe(4);
    expect(applyFilters(rows, { ...EMPTY_FILTERS, provider: "Brandy Roden" }).length).toBe(3);
    expect(applyFilters(rows, { ...EMPTY_FILTERS, search: "areeb" }).length).toBe(rows.length);
    expect(applyFilters(rows, { ...EMPTY_FILTERS, search: "nobody" }).length).toBe(0);
  });

  it("filters by normalized state", () => {
    expect(applyFilters(rows, { ...EMPTY_FILTERS, state: "GA" }).length).toBe(rows.length);
    expect(applyFilters(rows, { ...EMPTY_FILTERS, state: "NC" }).length).toBe(0);
  });

  it("keeps aggregates consistent with the filtered rows", () => {
    const april = applyFilters(rows, { ...EMPTY_FILTERS, from: "2026-04-01" });
    const agg = aggregate(april);
    expect(agg.totalHours).toBe(12);
    expect(agg.hours97153).toBe(10);
    expect(agg.hours97155).toBe(2);
  });
});

describe("state normalization fallback", () => {
  it("prefers the state column, then location, then provider labels", () => {
    expect(resolveReportState({ state: "Georgia" })).toBe("GA");
    expect(resolveReportState({ state: "", location: "ORGANIZATION: Georgia Clinic 3850 Holcomb Bridge R" })).toBe("GA");
    expect(resolveReportState({ state: "", location: "", providerLabels: "BCBA ,North Carolina Location" })).toBe("NC");
    expect(resolveReportState({ state: "", location: "", providerLabels: "BCBA" })).toBe("");
  });
});

describe("drilldown integrity and export", () => {
  const rows = buildOwnership(AREEB_ROWS).rows;

  it("exposes every required drilldown column", () => {
    expect(DRILLDOWN_COLUMNS).toContain("Date of Service");
    expect(DRILLDOWN_COLUMNS).toContain("Client");
    expect(DRILLDOWN_COLUMNS).toContain("Client ID");
    expect(DRILLDOWN_COLUMNS).toContain("Inferred BCBA Owner");
    expect(DRILLDOWN_COLUMNS).toContain("Rendering Provider");
    expect(DRILLDOWN_COLUMNS).toContain("Normalized Code");
    expect(DRILLDOWN_COLUMNS).toContain("Raw Code");
    expect(DRILLDOWN_COLUMNS).toContain("Hours");
    expect(DRILLDOWN_COLUMNS).toContain("State");
    expect(DRILLDOWN_COLUMNS).toContain("Payor");
    expect(DRILLDOWN_COLUMNS).toContain("Location");
    expect(DRILLDOWN_COLUMNS).toContain("Provider Labels");
    expect(DRILLDOWN_COLUMNS).toContain("Ownership Reason");
  });

  it("preserves the raw code next to the normalized code", () => {
    const cells = drilldownRowToCells(rows.find((r) => r.code === "97153 GT")!);
    expect(cells).toContain("97153 GT");
    expect(cells).toContain("97153");
    expect(cells.length).toBe(DRILLDOWN_COLUMNS.length);
  });

  it("builds CSV with a header row per drilldown column", () => {
    const csv = toCsv(DRILLDOWN_COLUMNS, rows.map(drilldownRowToCells));
    const lines = csv.trim().split("\n");
    expect(lines[0]).toContain("Inferred BCBA Owner");
    expect(lines.length).toBe(rows.length + 1);
  });
});

describe("number formatting", () => {
  it("uses commas, 1 decimal hours, 0 decimal counts, 1 decimal percent", () => {
    expect(fmtHours(1234.56)).toBe("1,234.6");
    expect(fmtCount(1234.6)).toBe("1,235");
    expect(fmtPct(4.06)).toBe("4.1%");
  });
});
