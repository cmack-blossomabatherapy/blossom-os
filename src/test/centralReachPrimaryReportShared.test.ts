/**
 * Chunk 3 — shared operator dashboard for the 7 non-BCBA primary reports.
 *
 * Proves the 7 IDs render through `CentralReachPrimaryReport`, that
 * `ReportDetail` never shows the generic "Live report shell · connect source
 * data to populate" copy for primary reports, that the new component has no
 * file-upload control, and that the shared fact/group/KPI helpers calculate.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  SHARED_PRIMARY_REPORT_IDS,
  SHARED_REPORT_CONFIGS,
  isSharedPrimaryReport,
  sharedReportConfig,
  billingFacts,
  scheduleFacts,
  groupFacts,
  factsForDim,
  filterFacts,
  chartData,
  formatGroupCell,
  groupExportColumns,
  groupExportRows,
} from "@/lib/os/reports/crPrimary/sharedReport";
import { EMPTY_FILTERS } from "@/lib/os/reports/crPrimary/types";
import type {
  CrBillingSessionRow,
  CrScheduleEventRow,
} from "@/lib/os/reports/crPrimary/types";

const root = resolve(__dirname, "../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const renderer = read("src/pages/os/reports/CentralReachPrimaryReports.tsx");
const shared = read("src/pages/os/reports/CentralReachPrimaryReport.tsx");
const reportDetail = read("src/pages/os/reports/ReportDetail.tsx");

const SEVEN = [
  "authorization-analysis",
  "authorization-utilization-hour-based",
  "bcba-performance",
  "bcba-supervision",
  "cancellation-command-center",
  "parent-training",
  "progress-reports",
];

describe("the 7 non-BCBA primary reports render via CentralReachPrimaryReport", () => {
  it("covers exactly the 7 shared ids (BCBA V3 excluded)", () => {
    expect([...SHARED_PRIMARY_REPORT_IDS].sort()).toEqual(SEVEN);
    expect(isSharedPrimaryReport("bcba-productivity-report-v3")).toBe(false);
    expect(isSharedPrimaryReport(null)).toBe(false);
    for (const id of SHARED_PRIMARY_REPORT_IDS) expect(isSharedPrimaryReport(id)).toBe(true);
  });

  it("routes all 7 ids into the shared component and keeps BCBA V3 on its own page", () => {
    for (const id of SEVEN) expect(renderer).toContain(`case "${id}":`);
    expect(renderer).toContain("<CentralReachPrimaryReport reportId={reportId} />");
    expect(renderer).toContain("<BcbaProductivityReportV3 />");
    // BCBA V3 must not be re-implemented through the shared dashboard.
    expect(renderer).not.toMatch(
      /case "bcba-productivity-report-v3":[\s\S]{0,120}CentralReachPrimaryReport/,
    );
  });

  it("ReportDetail no longer shows the generic live report shell for primary reports", () => {
    expect(reportDetail).not.toContain("Live report shell · connect source data to populate");
    expect(shared).not.toContain("connect source data to populate");
    const primaryGate = reportDetail.indexOf("isPrimaryCrReport(report.id)");
    expect(primaryGate).toBeGreaterThan(-1);
    expect(primaryGate).toBeLessThan(reportDetail.indexOf("os-skeleton"));
  });

  it("has no report-side upload control in the shared component", () => {
    expect(shared).not.toMatch(/type=["']file["']/);
    expect(shared).not.toMatch(/<input[^>]*accept=/);
    expect(shared).not.toContain("uploadSharedReportDataset");
  });

  it("wires freshness, filters, KPIs, charts, table, drilldown, and CSV export", () => {
    for (const token of [
      "PrimaryReportShell",
      "useCrPrimaryReport",
      "PrimaryFilterBar",
      "KpiScorecards",
      "PrimaryChart",
      "PrimaryTable",
      "DrilldownDrawer",
      "downloadCsv",
      "filterFacts",
    ]) {
      expect(shared, token).toContain(token);
    }
    // Recharts arrives through the shared chart card.
    expect(read("src/components/reports/crPrimary/PrimaryChart.tsx")).toContain("recharts");
  });

  it("gives every report its own labels, datasets, KPIs, charts, and filters", () => {
    for (const id of SHARED_PRIMARY_REPORT_IDS) {
      const cfg = sharedReportConfig(id);
      expect(cfg.title.length).toBeGreaterThan(3);
      expect(cfg.subtitle).toContain("CentralReach");
      expect(cfg.datasets.length).toBeGreaterThan(0);
      expect(cfg.requiredExports.length).toBeGreaterThan(0);
      expect(cfg.charts.length).toBeGreaterThanOrEqual(2);
      expect(cfg.columns.length).toBeGreaterThanOrEqual(4);
      expect(cfg.filterFields.length).toBeGreaterThanOrEqual(4);
      expect(cfg.drilldownColumns.length).toBeGreaterThan(5);
      expect(cfg.kpis([]).length).toBeGreaterThanOrEqual(4);
    }
    const titles = new Set(Object.values(SHARED_REPORT_CONFIGS).map((c) => c.title));
    expect(titles.size).toBe(7);
  });
});

describe("shared fact model calculations", () => {
  const billing = (over: Partial<CrBillingSessionRow>): CrBillingSessionRow => ({
    id: Math.random().toString(36).slice(2),
    batch_id: "b1",
    date_of_service: "2026-05-04",
    procedure_code: "97153",
    hours: 1,
    client_name: "Client A",
    client_cr_id: "C1",
    rendering_provider_name: "RBT One",
    rendering_provider_cr_id: "P1",
    provider_contact_labels: null,
    payor: "Aetna",
    state: "GA",
    location: "Home",
    status: "billed",
    ...over,
  });

  const rows = [
    billing({ procedure_code: "97153", hours: 90 }),
    billing({ procedure_code: "97155", hours: 10, rendering_provider_name: "BCBA One" }),
    billing({ procedure_code: "97156", hours: 4, client_name: "Client B", rendering_provider_name: "BCBA One" }),
  ];

  it("builds facts with tolerant extraction and code normalization", () => {
    const facts = billingFacts(rows);
    expect(facts).toHaveLength(3);
    expect(facts[0].code).toBe("97153");
    expect(facts[0].hours).toBe(90);
    expect(facts[0].client).toBe("Client A");
    expect(facts[0].week).toBeTruthy();
    // Raw-payload fallback still populates the fact.
    const tolerant = billingFacts([
      { ...billing({ hours: null, payor: null }), raw_row: { "Billed Hours": "2.5", Payor: "BCBS" } } as never,
    ]);
    expect(tolerant[0].hours).toBe(2.5);
    expect(tolerant[0].payor).toBe("BCBS");
  });

  it("aggregates supervision ratio and code hours per group", () => {
    const groups = groupFacts(billingFacts(rows), "client");
    const clientA = groups.find((g) => g.label === "Client A")!;
    expect(clientA.hoursDirect).toBe(90);
    expect(clientA.hoursSupervision).toBe(10);
    expect(clientA.supervisionPct).toBeCloseTo(11.1, 1);
    const clientB = groups.find((g) => g.label === "Client B")!;
    expect(clientB.hoursParentTraining).toBe(4);
  });

  it("filters facts and narrows drilldown rows by dimension", () => {
    const facts = billingFacts(rows);
    expect(filterFacts(facts, { ...EMPTY_FILTERS, code: "97155" })).toHaveLength(1);
    expect(filterFacts(facts, { ...EMPTY_FILTERS, state: "ga" })).toHaveLength(3);
    expect(factsForDim(facts, "provider", "bcba one")).toHaveLength(2);
    expect(facts[0].source).toHaveProperty("batchId");
  });

  it("produces chart data sorted by measure and weeks in order", () => {
    const facts = billingFacts(rows);
    const byClient = chartData(facts, "client", "hours");
    expect(byClient[0].label).toBe("Client A");
    expect(byClient[0].value).toBe(100);
    const byWeek = chartData(facts, "week", "hours");
    expect(byWeek.map((d) => d.label)).toEqual([...byWeek.map((d) => d.label)].sort());
  });

  it("formats grouped cells and CSV rows with locked number rules", () => {
    const cfg = sharedReportConfig("bcba-supervision");
    const groups = groupFacts(billingFacts(rows), "provider");
    const row = groupExportRows(groups, cfg)[0];
    expect(groupExportColumns(cfg).map((c) => c.key)).toContain("supervisionPct");
    expect(String(row["hoursDirect"])).toMatch(/^\d[\d,]*\.\d$/);
    expect(String(row["supervisionPct"])).toMatch(/%$/);
    expect(formatGroupCell(groups[0], { key: "clients", label: "Clients", kind: "count" })).toMatch(/^\d/);
  });

  it("computes cancellation KPIs from schedule facts", () => {
    const events: CrScheduleEventRow[] = [
      {
        id: "s1", batch_id: "b1", event_date: "2026-05-04", procedure_code: "97153",
        scheduled_hours: 3, client_name: "Client A", provider_name: "RBT One",
        status: "Cancelled", cancellation_reason: "Client illness", cancelled_by: "Parent",
        state: "GA", location: "Home", payor: "Aetna",
      },
      {
        id: "s2", batch_id: "b1", event_date: "2026-05-05", procedure_code: "97153",
        scheduled_hours: 2, client_name: "Client B", provider_name: "RBT Two",
        status: "Completed", cancellation_reason: null, cancelled_by: null,
        state: "NC", location: "Clinic", payor: "BCBS",
      },
    ];
    const facts = scheduleFacts(events);
    const kpis = sharedReportConfig("cancellation-command-center").kpis(facts);
    const byId = Object.fromEntries(kpis.map((k) => [k.id, k.value]));
    expect(byId.total).toBe("1");
    expect(byId.rate).toBe("50.0%");
    expect(byId.hours).toBe("3.0");
    expect(byId.clients).toBe("1");
    expect(byId.topReason).toBe("Illness");
  });
});