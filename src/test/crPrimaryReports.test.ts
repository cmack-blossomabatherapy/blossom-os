/**
 * Verifies the 8 primary CentralReach-backed reports: dedicated pages,
 * canonical routes, shared shell wiring, formatting, filtering, and drilldown
 * projections.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fmtCount, fmtHours, fmtPct } from "@/lib/os/reports/crPrimary/format";
import { matchesFilters, activeFilterCount } from "@/lib/os/reports/crPrimary/filters";
import { EMPTY_FILTERS } from "@/lib/os/reports/crPrimary/types";
import { toCsv } from "@/lib/os/reports/crPrimary/csv";
import {
  BILLING_DRILLDOWN_COLUMNS,
  projectBillingRows,
} from "@/lib/os/reports/crPrimary/drilldown";

const root = resolve(__dirname, "../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const app = read("src/App.tsx");

const PRIMARY_PAGES: Record<string, string> = {
  "bcba-productivity-report-v3": "src/pages/os/reports/BcbaProductivityReportV3.tsx",
  "cancellation-command-center": "src/pages/os/reports/CancellationCommandCenter.tsx",
  "authorization-analysis": "src/pages/os/reports/AuthorizationAnalysisPage.tsx",
  "authorization-utilization-hour-based": "src/pages/os/reports/AuthorizationUtilizationPage.tsx",
  "bcba-performance": "src/pages/os/reports/BcbaPerformancePage.tsx",
  "bcba-supervision": "src/pages/os/reports/BcbaSupervisionPage.tsx",
  "parent-training": "src/pages/os/reports/ParentTrainingPage.tsx",
  "progress-reports": "src/pages/os/reports/ProgressReportsPage.tsx",
};

const NEW_PAGES = Object.values(PRIMARY_PAGES).filter((p) =>
  /AuthorizationAnalysisPage|AuthorizationUtilizationPage|BcbaPerformancePage|BcbaSupervisionPage|ParentTrainingPage|ProgressReportsPage/.test(p),
);

describe("primary CentralReach reports — pages and routes", () => {
  it("has a dedicated page file for all 8 primary reports", () => {
    for (const [id, path] of Object.entries(PRIMARY_PAGES)) {
      expect(existsSync(resolve(root, path)), `${id} → ${path}`).toBe(true);
    }
  });

  it("routes every primary report id to its own page", () => {
    for (const id of Object.keys(PRIMARY_PAGES)) {
      expect(app).toContain(`path="/reports/${id}"`);
      expect(app).toContain(`reportId="${id}"`);
    }
  });

  it("does not point two primary routes at the same shared legacy dashboard", () => {
    const canonical = [
      "/reports/authorization-analysis",
      "/reports/authorization-utilization-hour-based",
      "/reports/parent-training",
      "/reports/bcba-supervision",
    ];
    for (const route of canonical) {
      const line = app.split("\n").find((l) => l.includes(`path="${route}"`));
      expect(line, route).toBeTruthy();
      expect(line).not.toContain("QaAuthUtilizationDashboard");
      expect(line).not.toContain("QaSupervisionPtDashboard");
    }
  });
});

describe("primary report page requirements", () => {
  it("each new page uses the shared shell with freshness, KPIs, charts, filters, drilldown and export", () => {
    for (const path of NEW_PAGES) {
      const src = read(path);
      expect(src, `${path} shell`).toContain("PrimaryReportShell");
      expect(src, `${path} kpis`).toContain("KpiScorecards");
      expect(src, `${path} chart`).toContain("PrimaryChart");
      expect(src, `${path} table`).toContain("PrimaryTable");
      expect(src, `${path} filters`).toContain("PrimaryFilterBar");
      expect(src, `${path} drilldown`).toContain("DrilldownDrawer");
      expect(src, `${path} export`).toContain("downloadCsv");
      expect(src, `${path} cr source`).toContain("useCrPrimaryReport");
    }
  });

  it("has no report-side upload controls on any primary report page", () => {
    for (const path of Object.values(PRIMARY_PAGES)) {
      const src = read(path);
      expect(src, `${path} file input`).not.toMatch(/type="file"/);
      expect(src, `${path} upload handler`).not.toMatch(/storage\s*\.\s*from\([^)]*\)\s*\.\s*upload/);
    }
  });

  it("shared shell renders a staff-facing empty state and a freshness indicator", () => {
    const shell = read("src/components/reports/crPrimary/PrimaryReportShell.tsx");
    expect(shell).toContain("data-testid=\"report-empty-state\"");
    expect(shell).toContain("data-testid=\"data-freshness\"");
    // Report pages are staff surfaces for every role: no admin Data Hub CTA.
    expect(shell).not.toContain("/system/centralreach-data-hub");
    expect(shell).not.toMatch(/type="file"/);
  });

});

describe("executive formatting", () => {
  it("comma-groups large counts and fixes hour/percent decimals", () => {
    expect(fmtCount(1234567)).toBe("1,234,567");
    expect(fmtHours(1234.56)).toBe("1,234.6");
    expect(fmtPct(87.25)).toBe("87.3%");
    expect(fmtCount(null)).toBe("—");
  });
});

describe("shared filtering", () => {
  const fact = {
    date: "2026-03-15",
    state: "GA",
    client: "Client A",
    provider: "BCBA One",
    payor: "Aetna",
    code: "97153",
  };

  it("matches when no filters are active", () => {
    expect(matchesFilters(fact, EMPTY_FILTERS)).toBe(true);
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
  });

  it("applies date range and dimension filters", () => {
    expect(matchesFilters(fact, { ...EMPTY_FILTERS, from: "2026-04-01" })).toBe(false);
    expect(matchesFilters(fact, { ...EMPTY_FILTERS, to: "2026-03-31" })).toBe(true);
    expect(matchesFilters(fact, { ...EMPTY_FILTERS, state: "ga" })).toBe(true);
    expect(matchesFilters(fact, { ...EMPTY_FILTERS, state: "NC" })).toBe(false);
    expect(activeFilterCount({ ...EMPTY_FILTERS, state: "GA", payor: "Aetna" })).toBe(2);
  });
});

describe("drilldown projection", () => {
  it("shows source rows with the matched Blossom BCBA and exports to CSV", () => {
    const rows = projectBillingRows(
      [
        {
          id: "1",
          batch_id: "b1",
          date_of_service: "2026-03-02",
          procedure_code: "97153",
          hours: 2.5,
          client_name: "Client A",
          client_cr_id: "C1",
          rendering_provider_name: "RBT One",
          rendering_provider_cr_id: "P1",
          provider_contact_labels: null,
          payor: "Aetna",
          state: "GA",
          location: "Home",
          status: "Billed",
        },
      ],
      new Map([["Client A", "BCBA One"]]),
    );
    expect(rows[0].matchedBcba).toBe("BCBA One");
    expect(rows[0].hours).toBe("2.5");

    const csv = toCsv(rows, BILLING_DRILLDOWN_COLUMNS);
    expect(csv.split("\n")).toHaveLength(2);
    expect(csv).toContain("Matched BCBA");
    expect(csv).toContain("BCBA One");
  });

  it("labels unmatched clients instead of inventing an owner", () => {
    const rows = projectBillingRows(
      [
        {
          id: "2",
          batch_id: null,
          date_of_service: "2026-03-02",
          procedure_code: "97153",
          hours: 1,
          client_name: "Client Z",
          client_cr_id: null,
          rendering_provider_name: "RBT Two",
          rendering_provider_cr_id: null,
          provider_contact_labels: null,
          payor: null,
          state: null,
          location: null,
          status: "Billed",
        },
      ],
      new Map(),
    );
    expect(rows[0].matchedBcba).toBe("Unassigned");
    expect(String(rows[0].matchStatus)).toContain("Unmatched");
  });
});