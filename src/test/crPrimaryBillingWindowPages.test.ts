/**
 * Every date-capable non-V3 report page that loads billing facts must push its
 * selected window into the shared loader, and must keep All Dates working by
 * passing null when the filter is blank. V3 is out of scope by design.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const BILLING_FACT_PAGES = [
  "src/pages/os/reports/ClinicOperationsPage.tsx",
  "src/pages/os/reports/ParentTrainingPage.tsx",
  "src/pages/os/reports/AuthorizationUtilizationPage.tsx",
  "src/pages/os/reports/BcbaSupervisionPage.tsx",
  "src/pages/os/reports/BcbaPerformancePage.tsx",
  "src/pages/os/reports/AuthorizationCoverageRiskPage.tsx",
  "src/pages/os/reports/AuthorizationAnalysisPage.tsx",
];

describe("date-capable non-V3 billing-fact report pages", () => {
  for (const page of BILLING_FACT_PAGES) {
    it(`pushes the selected window into the loader: ${page}`, () => {
      const text = readFileSync(page, "utf8");
      expect(text).toMatch(/useCrPrimaryReport\(/);
      expect(text, page).toMatch(
        /useCrPrimaryReport\([\s\S]{0,220}?\],\s*\{\s*from: filters\.from \|\| null,\s*to: filters\.to \|\| null,\s*\}\)/,
      );
    });

    it(`declares filters before requesting data: ${page}`, () => {
      const text = readFileSync(page, "utf8");
      const filtersAt = text.indexOf("const [filters, setFilters]");
      const dataAt = text.indexOf("const data = useCrPrimaryReport(");
      expect(filtersAt, page).toBeGreaterThan(-1);
      expect(dataAt, page).toBeGreaterThan(filtersAt);
    });
  }

  it("leaves the cancellation center on the small current schedule view only", () => {
    const text = readFileSync("src/pages/os/reports/CancellationCommandCenter.tsx", "utf8");
    expect(text).toMatch(/useCrPrimaryReport\(\["scheduleCurrent"\]\)/);
  });

  it("defaults Authorization Coverage Risk to the current month, not All Dates", () => {
    const text = readFileSync("src/pages/os/reports/AuthorizationCoverageRiskPage.tsx", "utf8");
    expect(text).toMatch(/withCurrentMonthDefault/);
    expect(text).toMatch(/const DEFAULT_FILTERS = withCurrentMonthDefault\(EMPTY_FILTERS\)/);
    expect(text).toMatch(/useUrlFilterState\(DEFAULT_FILTERS\)/);
    expect(text).toMatch(/onReset=\{\(\) => setFilters\(DEFAULT_FILTERS\)\}/);
    // All Dates is still reachable: the loader passes null when filters are blank.
    expect(text).toMatch(/from: filters\.from \|\| null,\s*to: filters\.to \|\| null/);
  });
});
