/**
 * Cancellation Command Center — staff-facing rebuild guardrails.
 *
 * The report must read normalized CentralReach data from the Data Hub and
 * never show upload / export-file plumbing to staff.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const page = read("src/pages/os/reports/CancellationCommandCenter.tsx");
const shell = read("src/components/reports/crPrimary/PrimaryReportShell.tsx");

describe("Cancellation Command Center is Data Hub backed", () => {
  it("loads the curated scheduling truth view through the shared loader", () => {
    expect(page).toMatch(/useCrPrimaryReport\(\["scheduleCurrent"\]\)/);
    expect(page).toContain("computeCancellationCenter");
  });

  it("reports undocumented cancellation reasons instead of bucketing them as Other", () => {
    expect(page).toContain("NOT_DOCUMENTED");
    expect(page).toMatch(/Undocumented reasons/);
  });

  it("shows a plain-language provenance line and no revenue estimates", () => {
    expect(page).toContain("ReportProvenance");
    expect(page).not.toMatch(/revenue at risk|estimatedRevenue|\$\{?fmtCurrency/i);
  });


  it("uses the shared staff-facing report chrome", () => {
    for (const piece of [
      "PrimaryReportShell",
      "KpiScorecards",
      "PrimaryChart",
      "PrimaryTable",
      "PrimaryFilterBar",
      "DrilldownDrawer",
      "downloadCsv",
    ]) {
      expect(page, piece).toContain(piece);
    }
  });

  it("has no upload, file-parse, or build-dashboard flow", () => {
    expect(page).not.toMatch(/type="file"/);
    expect(page).not.toMatch(/parseAnyFile|SUPPORTED_EXTENSIONS/);
    expect(page).not.toMatch(/CentralReachRequirementsCard|SourceCoverageBanner|SharedDatasetStatusPanel/);
    expect(page).not.toMatch(/Build Dashboard/i);
    expect(page).not.toMatch(/re-upload|Clear uploads/i);
  });

  it("keeps filters in the URL so a view survives tab switches", () => {
    expect(page).toContain("useUrlFilterState");
  });

  it("still persists follow-ups and saved views to the cloud", () => {
    expect(page).toMatch(/await\s+upsertRemoteFollowup\("cancellation_command_center"/);
    expect(page).toMatch(/const\s+saved\s*=\s*await\s+saveCancellationReport\(/);
    expect(page).toMatch(/saved\.remoteSyncError/);
    expect(page).toMatch(/toast\.warning\(/);
    expect(page).toMatch(/cloud sync failed, so it may not appear on other devices yet/);
  });
});

describe("the shared report shell is staff-facing for every role", () => {
  it("has no Data Hub link, admin CTA, or import diagnostics strip", () => {
    for (const forbidden of [
      "centralreach-data-hub",
      "useOSRoleSafe",
      "showDataSourceStrip",
      "requiredExports",
      "SharedDatasetStatusPanel",
      "Upload",
    ]) {
      expect(shell, forbidden).not.toContain(forbidden);
    }
  });

  it("keeps freshness, refresh, export, and data-quality warnings", () => {
    for (const piece of ["freshness", "onRefresh", "onExport", "dataQualityWarnings"]) {
      expect(shell, piece).toContain(piece);
    }
  });
});

describe("cancellation report defaults and URL state", () => {
  it("defaults to the current calendar month and resets back to it", () => {
    expect(page).toContain("withCurrentMonthDefault");
    expect(page).toMatch(/onReset=\{\(\) => setFilters\(DEFAULT_FILTERS\)\}/);
  });

  it("keeps the breakdown tab in the URL", () => {
    expect(page).toMatch(/useUrlState\("tab"/);
  });

  it("shows active schedule events as the rate denominator", () => {
    expect(page).toContain("active schedule events");
    expect(page).toContain("metrics.activeScheduleEvents");
  });

  it("renders the event-level follow-up queue", () => {
    expect(page).toContain("followUpEventColumns");
    expect(page).toContain("metrics.followUpEvents");
    expect(page).toContain("Cancellation follow-up queue");
  });
});
