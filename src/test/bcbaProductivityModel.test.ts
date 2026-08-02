import { describe, expect, it } from "vitest";
import {
  buildBcbaProductivityModel,
  bcbaSupervisionPct,
  bcbaSupervisionStatus,
  isBcbaAnchorRow,
  normalizeBcbaCode,
  UNASSIGNED_LABEL,
  type EngineBillingRow,
} from "@/lib/os/bcbaProductivityV3/model";

const BCBA_LABELS = "BCBA ,Georgia Location";
const RBT_LABELS = "Behavior Technician ,Georgia Location";

function row(p: Partial<EngineBillingRow>): EngineBillingRow {
  return {
    clientId: "111",
    clientName: "Areeb Hasan",
    renderingProvider: "Jalanda Simpson",
    providerLabels: RBT_LABELS,
    code: "97153",
    hours: 1,
    date: "2026-03-02",
    state: "GA",
    payor: "Aetna",
    location: "ORGANIZATION: Georgia Clinic",
    ...p,
  };
}

const bcbaRow = (p: Partial<EngineBillingRow>) =>
  row({ providerLabels: BCBA_LABELS, ...p });

/** Locked Areeb Hasan fixture. */
const AREEB: EngineBillingRow[] = [
  // March 2026 — 139.0 hrs of 97153 (RBT), 7.75 direct BCBA hrs by Brandy Roden.
  row({ code: "97153", hours: 100, date: "2026-03-05" }),
  row({ code: "97153 GT", hours: 39, date: "2026-03-20" }),
  bcbaRow({ code: "97155", hours: 5.75, date: "2026-03-18", renderingProvider: "Brandy Roden" }),
  bcbaRow({ code: "97151", hours: 2, date: "2026-03-18", renderingProvider: "Brandy Roden" }),
  // April 2026 — Brandy anchors Apr 1, Zestine anchors Apr 10.
  bcbaRow({ code: "97155", hours: 1, date: "2026-04-01", renderingProvider: "Brandy Roden" }),
  row({ code: "97153", hours: 4, date: "2026-04-09" }),
  bcbaRow({ code: "97155", hours: 1, date: "2026-04-10", renderingProvider: "Zestine Roberts" }),
  row({ code: "97153", hours: 6, date: "2026-04-15" }),
  row({ code: "97153", hours: 3, date: "2026-04-30" }),
];

describe("normalizeBcbaCode", () => {
  it("normalizes 97153 variants by prefix", () => {
    for (const raw of ["97153", "97153 GT", "97153-HN", "97153TS", "97153 GT HN"]) {
      expect(normalizeBcbaCode(raw)).toBe("97153");
    }
  });

  it("normalizes 97155 variants by prefix", () => {
    for (const raw of ["97155", "97155 GT", "97155-TS", "97155 Supervision"]) {
      expect(normalizeBcbaCode(raw)).toBe("97155");
    }
  });

  it("normalizes the remaining families", () => {
    expect(normalizeBcbaCode("97151 Assessment")).toBe("97151");
    expect(normalizeBcbaCode("97152 GT")).toBe("97152");
    expect(normalizeBcbaCode("97156-HO")).toBe("97156");
  });

  it("keeps unknown codes and falls back to Other when blank", () => {
    expect(normalizeBcbaCode("H2019")).toBe("H2019");
    expect(normalizeBcbaCode("")).toBe("Other");
    expect(normalizeBcbaCode(null)).toBe("Other");
  });
});

describe("supervision percent and status", () => {
  it("computes 97155 / 97153 * 100", () => {
    expect(bcbaSupervisionPct(10, 100)).toBe(10);
    expect(bcbaSupervisionPct(5.75, 139)).toBeCloseTo(4.1, 1);
  });

  it("returns null when 97153 hours are zero", () => {
    expect(bcbaSupervisionPct(7.75, 0)).toBeNull();
    expect(bcbaSupervisionStatus(null)).toBe("none");
  });

  it("bands at <5 urgent, 5-9.9 monitor, >=10 healthy", () => {
    expect(bcbaSupervisionStatus(0)).toBe("urgent");
    expect(bcbaSupervisionStatus(4.9)).toBe("urgent");
    expect(bcbaSupervisionStatus(5)).toBe("monitor");
    expect(bcbaSupervisionStatus(9.9)).toBe("monitor");
    expect(bcbaSupervisionStatus(10)).toBe("healthy");
    expect(bcbaSupervisionStatus(42)).toBe("healthy");
  });
});

describe("BCBA anchor definition", () => {
  it("requires a non-97153 code, a BCBA provider label and a rendering provider", () => {
    expect(isBcbaAnchorRow({ code: "97155", providerLabels: BCBA_LABELS, renderingProvider: "Brandy Roden" })).toBe(true);
    expect(isBcbaAnchorRow({ code: "97153", providerLabels: BCBA_LABELS, renderingProvider: "Brandy Roden" })).toBe(false);
    expect(isBcbaAnchorRow({ code: "97153 GT", providerLabels: BCBA_LABELS, renderingProvider: "Brandy Roden" })).toBe(false);
    expect(isBcbaAnchorRow({ code: "97155", providerLabels: RBT_LABELS, renderingProvider: "Tech One" })).toBe(false);
    expect(isBcbaAnchorRow({ code: "97155", providerLabels: BCBA_LABELS, renderingProvider: "" })).toBe(false);
  });
});

describe("Areeb Hasan full aggregation canary", () => {
  const model = buildBcbaProductivityModel(AREEB);

  it("March 2026 belongs only to Brandy Roden", () => {
    const march = model.ownedRows.filter((r) => r.monthKey === "2026-03");
    expect(march).toHaveLength(4);
    expect([...new Set(march.map((r) => r.owner))]).toEqual(["Brandy Roden"]);
  });

  it("March 2026 totals 146.75 hours, 139.0 of 97153 and 7.75 direct BCBA", () => {
    const march = buildBcbaProductivityModel(
      AREEB.filter((r) => r.date.startsWith("2026-03")),
    );
    expect(march.kpis.totalHours).toBe(146.75);
    expect(march.kpis.hours97153).toBe(139);
    expect(march.kpis.directBcbaHours).toBe(7.75);
    expect(march.kpis.supervisionHours).toBe(5.75);
    const brandy = march.bcbaSummaries.find((b) => b.bcba === "Brandy Roden");
    expect(brandy?.totalHours).toBe(146.75);
    expect(brandy?.hours97153).toBe(139);
    expect(brandy?.directBcbaHours).toBe(7.75);
    expect(march.bcbaSummaries.some((b) => b.bcba === "Zestine Roberts")).toBe(false);
  });

  it("Apr 1-9 stays with Brandy Roden and Apr 10-30 moves to Zestine Roberts", () => {
    const april = new Map(
      model.ownedRows
        .filter((r) => r.monthKey === "2026-04")
        .map((r) => [r.date, r.owner]),
    );
    expect(april.get("2026-04-01")).toBe("Brandy Roden");
    expect(april.get("2026-04-09")).toBe("Brandy Roden");
    expect(april.get("2026-04-10")).toBe("Zestine Roberts");
    expect(april.get("2026-04-15")).toBe("Zestine Roberts");
    expect(april.get("2026-04-30")).toBe("Zestine Roberts");
  });

  it("credits 97153 hours to the owning BCBA on the date of service", () => {
    const brandy = model.bcbaSummaries.find((b) => b.bcba === "Brandy Roden");
    const zestine = model.bcbaSummaries.find((b) => b.bcba === "Zestine Roberts");
    expect(brandy?.hours97153).toBe(143); // 139 in March + 4 on Apr 9
    expect(zestine?.hours97153).toBe(9); // Apr 15 + Apr 30
    expect(model.kpis.unassignedHours).toBe(0);
  });

  it("exposes drilldown-ready owned rows with every required field", () => {
    const r = model.ownedRows.find((x) => x.code === "97153 GT")!;
    expect(r.clientId).toBe("111");
    expect(r.clientName).toBe("Areeb Hasan");
    expect(r.date).toBe("2026-03-20");
    expect(r.renderingProvider).toBe("Jalanda Simpson");
    expect(r.owner).toBe("Brandy Roden");
    expect(r.normalizedCode).toBe("97153");
    expect(r.rawCode).toBe("97153 GT");
    expect(r.hours).toBe(39);
    expect(r.state).toBe("GA");
    expect(r.payor).toBe("Aetna");
    expect(r.location).toContain("Georgia");
    expect(r.providerLabels).toBe(RBT_LABELS);
    expect(r.ownerReason).toBeTruthy();
  });

  it("records the ownership audit for the client-months it inferred", () => {
    const months = model.ownershipAudit.segments.map((s) => `${s.monthKey}:${s.bcba}`);
    expect(months).toContain("2026-03:Brandy Roden");
    expect(months).toContain("2026-04:Brandy Roden");
    expect(months).toContain("2026-04:Zestine Roberts");
    expect(model.ownershipAudit.conflicts.some((c) => c.monthKey === "2026-04")).toBe(true);
  });
});

describe("carry-forward and unassigned audit", () => {
  it("carries the prior owner only into later months with no anchors", () => {
    const model = buildBcbaProductivityModel([
      bcbaRow({ code: "97155", hours: 1, date: "2026-01-05", renderingProvider: "Brandy Roden" }),
      row({ code: "97153", hours: 8, date: "2026-02-10" }),
    ]);
    const feb = model.ownedRows.find((r) => r.monthKey === "2026-02");
    expect(feb?.owner).toBe("Brandy Roden");
    expect(feb?.ownerReason).toBe("carry_forward");
  });

  it("reports clients with no anchor in the unassigned audit", () => {
    const model = buildBcbaProductivityModel([
      row({ clientId: "999", clientName: "No Anchor", code: "97153", hours: 3 }),
    ]);
    expect(model.kpis.unassignedHours).toBe(3);
    expect(model.kpis.unassignedRowCount).toBe(1);
    expect(model.unassignedAudit.clients.map((c) => c.clientName)).toEqual(["No Anchor"]);
    expect(model.unassignedAudit.rows).toHaveLength(1);
    expect(model.bcbaSummaries.some((b) => b.bcba === UNASSIGNED_LABEL)).toBe(true);
  });
});

describe("model integrity", () => {
  const mixed: EngineBillingRow[] = [
    ...AREEB,
    row({ clientId: "999", clientName: "No Anchor", code: "97153", hours: 12.5, date: "2026-03-11" }),
    bcbaRow({ clientId: "222", clientName: "Second Client", code: "97156", hours: 2.25, date: "2026-03-04", renderingProvider: "Zestine Roberts" }),
    row({ clientId: "222", clientName: "Second Client", code: "97153", hours: 20, date: "2026-03-06", renderingProvider: "Tech Two" }),
  ];
  const model = buildBcbaProductivityModel(mixed);
  const sum = (ns: number[]) => Math.round(ns.reduce((a, b) => a + b, 0) * 100) / 100;

  it("assigned + unassigned hours equal total hours", () => {
    expect(sum([model.kpis.assignedHours, model.kpis.unassignedHours])).toBe(model.kpis.totalHours);
  });

  it("code summary hours equal total hours", () => {
    expect(sum(model.codeSummaries.map((c) => c.hours))).toBe(model.kpis.totalHours);
  });

  it("BCBA summary hours equal total hours", () => {
    expect(sum(model.bcbaSummaries.map((b) => b.totalHours))).toBe(model.kpis.totalHours);
  });

  it("client summary hours equal total hours and row counts reconcile", () => {
    expect(sum(model.clientSummaries.map((c) => c.totalHours))).toBe(model.kpis.totalHours);
    expect(sum(model.codeSummaries.map((c) => c.rowCount))).toBe(model.kpis.rowCount);
    expect(model.ownedRows).toHaveLength(mixed.length);
  });

  it("RBT 97153 hours equal the 97153 KPI", () => {
    expect(sum(model.rbtSummaries.map((r) => r.hours97153))).toBe(model.kpis.hours97153);
  });

  it("supervision summaries mirror the BCBA summaries", () => {
    for (const s of model.supervisionSummaries) {
      const b = model.bcbaSummaries.find((x) => x.bcba === s.bcba)!;
      expect(s.supervisionHours).toBe(b.hours97155);
      expect(s.direct97153Hours).toBe(b.hours97153);
      expect(s.supervisionPct).toBe(b.supervisionPct);
      expect(s.status).toBe(bcbaSupervisionStatus(b.supervisionPct));
    }
  });
});
