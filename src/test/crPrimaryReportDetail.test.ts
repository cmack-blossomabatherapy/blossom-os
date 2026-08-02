/**
 * Chunk 2 — primary report detail experience.
 *
 * Proves the 8 primary CentralReach-backed report IDs are routed into the
 * dedicated renderer BEFORE any SD / AUTH / generic placeholder handling, that
 * they never reach the generic "connect source data to populate" shell or the
 * skeleton fallback, that no report-side upload control exists, and that the
 * metric + drilldown helpers behind them calculate correctly.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  PRIMARY_CR_REPORT_IDS,
  PRIMARY_CR_REPORT_ROUTES,
  isPrimaryCrReport,
} from "@/pages/os/reports/CentralReachPrimaryReports";
import { pickField, pickNumber, pickText } from "@/lib/os/reports/crPrimary/tolerant";
import {
  filterDrilldownRows,
  projectBillingRows,
  projectScheduleRows,
} from "@/lib/os/reports/crPrimary/drilldown";
import { applyFilters, matchesFilters } from "@/lib/os/reports/crPrimary/filters";
import { EMPTY_FILTERS } from "@/lib/os/reports/crPrimary/types";
import {
  normalizeCancellationReason,
  isCancelledEvent,
} from "@/lib/os/reports/crPrimary/metrics/cancellation";
import {
  supervisionBand,
  computeSupervisionMetrics,
} from "@/lib/os/reports/crPrimary/metrics/supervision";
import {
  utilizationPct,
  utilizationBand,
} from "@/lib/os/reports/crPrimary/metrics/authorizationUtilization";
import {
  classifyAuthKind,
  classifyAuthStatus,
  classifyPauseReason,
} from "@/lib/os/reports/crPrimary/metrics/authorizationAnalysis";
import type {
  CrAuthorizationRow,
  CrBillingSessionRow,
  CrScheduleEventRow,
} from "@/lib/os/reports/crPrimary/types";

const root = resolve(__dirname, "../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const reportDetail = read("src/pages/os/reports/ReportDetail.tsx");
const renderer = read("src/pages/os/reports/CentralReachPrimaryReports.tsx");

const PRIMARY_PAGES = [
  "src/pages/os/reports/AuthorizationAnalysisPage.tsx",
  "src/pages/os/reports/AuthorizationUtilizationPage.tsx",
  "src/pages/os/reports/BcbaPerformancePage.tsx",
  "src/pages/os/reports/BcbaSupervisionPage.tsx",
  "src/pages/os/reports/ParentTrainingPage.tsx",
  "src/pages/os/reports/ProgressReportsPage.tsx",
];

describe("ReportDetail routes primary reports into the dedicated renderer", () => {
  it("covers exactly the 8 scoped primary report ids", () => {
    expect([...PRIMARY_CR_REPORT_IDS].sort()).toEqual(
      [
        "authorization-analysis",
        "authorization-utilization-hour-based",
        "bcba-performance",
        "bcba-productivity-report-v3",
        "bcba-supervision",
        "cancellation-command-center",
        "parent-training",
        "progress-reports",
      ].sort(),
    );
    for (const id of PRIMARY_CR_REPORT_IDS) {
      expect(isPrimaryCrReport(id)).toBe(true);
      expect(PRIMARY_CR_REPORT_ROUTES[id]).toBe(`/reports/${id}`);
    }
  });

  it("does not treat non-primary reports as primary", () => {
    for (const id of ["auth-performance", "growth-trends", "qa-supervision", "lifecycle", ""]) {
      expect(isPrimaryCrReport(id)).toBe(false);
    }
    expect(isPrimaryCrReport(null)).toBe(false);
  });

  it("renders each primary id from a dedicated page component", () => {
    for (const id of PRIMARY_CR_REPORT_IDS) {
      expect(renderer).toContain(`case "${id}":`);
    }
    expect(renderer).toContain("BcbaProductivityReportV3");
    expect(renderer).toContain("CancellationCommandCenter");
  });

  it("resolves primary reports before SD / AUTH / generic handling", () => {
    const primaryGate = reportDetail.indexOf("isPrimaryCrReport(report.id)");
    const sdGate = reportDetail.indexOf("SD_REPORT_IDS.has(reportId)");
    const authGate = reportDetail.indexOf("AUTH_REPORT_IDS.has(reportId)");
    const skeleton = reportDetail.indexOf("os-skeleton");
    expect(primaryGate).toBeGreaterThan(-1);
    expect(primaryGate).toBeLessThan(sdGate);
    expect(primaryGate).toBeLessThan(authGate);
    expect(primaryGate).toBeLessThan(skeleton);
    // The generic content renderer also short-circuits for primary ids.
    const contentGate = reportDetail.indexOf("isPrimaryCrReport(reportId)");
    expect(contentGate).toBeGreaterThan(-1);
    expect(contentGate).toBeLessThan(sdGate);
  });

  it("preserves the catalog drilldownPath redirect (no BCBA V3 regression)", () => {
    expect(reportDetail).toContain("if (report.drilldownPath) return null;");
    expect(reportDetail).toContain("navigate(report.drilldownPath, { replace: true })");
  });

  it("no longer shows the generic live-report-shell copy for primary reports", () => {
    expect(reportDetail).not.toContain("Live report shell · connect source data to populate");
    for (const page of [renderer, ...PRIMARY_PAGES.map(read)]) {
      expect(page).not.toContain("connect source data to populate");
      expect(page).not.toContain("os-skeleton");
    }
  });

  it("has no report-side file upload control in the primary renderer or pages", () => {
    for (const page of [renderer, ...PRIMARY_PAGES.map(read)]) {
      expect(page).not.toMatch(/type=["']file["']/);
      expect(page).not.toMatch(/<input[^>]*accept=/);
      expect(page).not.toContain("uploadSharedReportDataset");
    }
  });

  it("every primary page renders freshness, KPIs, charts, filters, drilldown, and CSV export", () => {
    for (const path of PRIMARY_PAGES) {
      const src = read(path);
      expect(src, path).toContain("PrimaryReportShell");
      expect(src, path).toContain("useCrPrimaryReport");
      expect(src, path).toContain("KpiScorecards");
      expect(src, path).toContain("PrimaryChart");
      expect(src, path).toContain("PrimaryFilterBar");
      expect(src, path).toContain("DrilldownDrawer");
      expect(src, path).toContain("downloadCsv");
      expect(src, path).toContain("applyFilters");
    }
  });
});

describe("tolerant field extraction", () => {
  it("prefers typed columns then falls back into raw payload containers", () => {
    const row = {
      client_name: "  Areeb Hasan  ",
      hours: null,
      raw_row: { "Billed Hours": "12.5", Payor: "Aetna" },
      metadata: { State: "GA" },
    };
    expect(pickText(row, ["client_name"])).toBe("Areeb Hasan");
    expect(pickNumber(row, ["hours", "billed_hours"])).toBe(12.5);
    expect(pickText(row, ["payor"])).toBe("Aetna");
    expect(pickText(row, ["state"])).toBe("GA");
    expect(pickField(row, ["missing_field"])).toBeUndefined();
  });

  it("parses stringified JSON payloads and strips currency/percent noise", () => {
    const row = { source_payload: '{"Used Hours":"1,204.5","Utilization":"87.4%"}' };
    expect(pickNumber(row, ["used_hours"])).toBe(1204.5);
    expect(pickNumber(row, ["utilization"])).toBe(87.4);
    expect(pickNumber({}, ["anything"], -1)).toBe(-1);
  });
});

describe("supervision percentage and banding", () => {
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

  it("computes 97155 vs 97153 supervision percent from cr_billing_sessions", () => {
    const rows = [
      billing({ procedure_code: "97153", hours: 90 }),
      billing({ procedure_code: "97155", hours: 10, rendering_provider_name: "BCBA One" }),
    ];
    const metrics = computeSupervisionMetrics(rows);
    expect(metrics.directHours).toBe(90);
    expect(metrics.supervisionHours).toBe(10);
    expect(metrics.supervisionPct).toBeCloseTo(11.1, 1);
  });

  it("applies the locked clinical bands (<5 red, 5-10 yellow, >=10 green)", () => {
    expect(supervisionBand(0)).toBe("red");
    expect(supervisionBand(4.9)).toBe("red");
    expect(supervisionBand(5)).toBe("yellow");
    expect(supervisionBand(9.9)).toBe("yellow");
    expect(supervisionBand(10)).toBe("green");
    expect(supervisionBand(22.5)).toBe("green");
  });
});

describe("authorization utilization percent and bands", () => {
  it("computes utilization percent to one decimal and guards divide-by-zero", () => {
    expect(utilizationPct(50, 100)).toBe(50);
    expect(utilizationPct(87.43, 100)).toBeCloseTo(87.4, 1);
    expect(utilizationPct(10, 0)).toBe(0);
  });

  it("bands under / on-track / over utilization", () => {
    expect(utilizationBand(40)).toBe("under");
    expect(utilizationBand(85)).toBe("on_track");
    expect(utilizationBand(101)).toBe("over");
  });
});

describe("cancellation reason mapping", () => {
  const evt = (over: Partial<CrScheduleEventRow>): CrScheduleEventRow => ({
    id: Math.random().toString(36).slice(2),
    batch_id: "b1",
    event_date: "2026-05-04",
    procedure_code: "97153",
    scheduled_hours: 2,
    client_name: "Client A",
    provider_name: "RBT One",
    status: "Cancelled",
    cancellation_reason: null,
    cancelled_by: null,
    state: "GA",
    location: "Home",
    payor: "Aetna",
    ...over,
  });

  it("maps raw CR reasons into stable buckets", () => {
    expect(normalizeCancellationReason("Client was sick")).toBe(
      normalizeCancellationReason("client illness"),
    );
    expect(normalizeCancellationReason("")).toBeTruthy();
    expect(typeof normalizeCancellationReason("totally unknown text")).toBe("string");
  });

  it("detects cancelled events from status text", () => {
    expect(isCancelledEvent(evt({ status: "Cancelled" }))).toBe(true);
    expect(isCancelledEvent(evt({ status: "Completed" }))).toBe(false);
  });
});

describe("authorization weekly status mapping", () => {
  const auth = (over: Partial<CrAuthorizationRow>): CrAuthorizationRow => ({
    id: Math.random().toString(36).slice(2),
    batch_id: "b1",
    authorization_number: "A-1",
    client_name: "Client A",
    client_cr_id: "C1",
    payor: "Aetna",
    state: "GA",
    procedure_code: "97151",
    start_date: "2026-05-04",
    end_date: "2026-11-04",
    authorized_hours: 100,
    worked_hours: 40,
    remaining_hours: 60,
    status: "Approved",
    ...over,
  });

  it("classifies work kind and status buckets", () => {
    expect(classifyAuthKind(auth({ procedure_code: "97151" }))).toBeTruthy();
    expect(classifyAuthStatus(auth({ status: "Approved" }))).toBe("approved");
    expect(classifyAuthStatus(auth({ status: "Denied" }))).toBe("denied");
    expect(classifyAuthStatus(auth({ status: "Submitted" }))).toBe("submitted");
  });

  it("classifies pause reasons for services stopped on auth gaps", () => {
    const noRa = classifyPauseReason(auth({ status: "Paused - no reauthorization on file" }));
    expect(noRa).toBe("no_reauthorization");
    const latePr = classifyPauseReason(auth({ status: "Paused - progress report late" }));
    expect(latePr).toBe("late_or_missing_pr");
    expect(classifyPauseReason(auth({ status: "Approved" }))).toBeNull();
  });
});

describe("drilldown source-row filtering", () => {
  const rows: CrBillingSessionRow[] = [
    {
      id: "1", batch_id: "b1", date_of_service: "2026-05-04", procedure_code: "97153",
      hours: 2, client_name: "Client A", client_cr_id: "C1",
      rendering_provider_name: "RBT One", rendering_provider_cr_id: "P1",
      provider_contact_labels: null, payor: "Aetna", state: "GA", location: "Home", status: "billed",
    },
    {
      id: "2", batch_id: "b1", date_of_service: "2026-06-10", procedure_code: "97155",
      hours: 1, client_name: "Client B", client_cr_id: "C2",
      rendering_provider_name: "BCBA One", rendering_provider_cr_id: "P2",
      provider_contact_labels: null, payor: "BCBS", state: "NC", location: "Clinic", status: "billed",
    },
  ];

  it("filters source rows by date range, state, and code", () => {
    const project = (r: CrBillingSessionRow) => ({
      date: r.date_of_service, state: r.state, client: r.client_name,
      provider: r.rendering_provider_name, payor: r.payor, code: r.procedure_code,
      location: r.location, status: r.status,
    });
    expect(applyFilters(rows, { ...EMPTY_FILTERS, state: "ga" }).map((r) => r.id)).toEqual(["1"]);
    expect(
      applyFilters(rows, { ...EMPTY_FILTERS, from: "2026-06-01", to: "2026-06-30" }, project).map((r) => r.id),
    ).toEqual(["2"]);
    expect(applyFilters(rows, { ...EMPTY_FILTERS, code: "97155" }, project).map((r) => r.id)).toEqual(["2"]);
    expect(matchesFilters(project(rows[0]), EMPTY_FILTERS)).toBe(true);
  });

  it("projects billing rows with match context and filters the projection", () => {
    const projected = projectBillingRows(rows, new Map([["Client A", "BCBA One"]]));
    expect(projected[0].matchedBcba).toBe("BCBA One");
    expect(projected[0].matchStatus).toBe("Matched to BCBA");
    expect(projected[1].matchStatus).toContain("Unmatched");
    expect(projected[0].hours).toBe("2.0");
    expect(filterDrilldownRows(projected, { state: "nc" }).map((r) => r.client)).toEqual(["Client B"]);
    expect(filterDrilldownRows(projected, { state: undefined })).toHaveLength(2);
  });

  it("projects schedule rows with the mapped cancellation reason", () => {
    const events: CrScheduleEventRow[] = [{
      id: "s1", batch_id: "b1", event_date: "2026-05-04", procedure_code: "97153",
      scheduled_hours: 3, client_name: "Client A", provider_name: "RBT One",
      status: "Cancelled", cancellation_reason: "Client illness", cancelled_by: "Parent",
      state: "GA", location: "Home", payor: "Aetna",
    }];
    const projected = projectScheduleRows(events, (r) => normalizeCancellationReason(r.cancellation_reason));
    expect(projected[0].hours).toBe("3.0");
    expect(projected[0].reasonRaw).toBe("Client illness");
    expect(projected[0].reasonBucket).toBeTruthy();
  });
});
