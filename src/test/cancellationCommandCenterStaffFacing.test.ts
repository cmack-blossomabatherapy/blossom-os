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

describe("import diagnostics are Super Admin only", () => {
  it("gates the CentralReach freshness strip behind the super_admin role", () => {
    expect(shell).toContain("useOSRoleSafe");
    expect(shell).toMatch(/showDataSourceStrip\s*=\s*roleCtx\?\.role === "super_admin"/);
    expect(shell).toMatch(/\{showDataSourceStrip && \(/);
  });
});
