import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Pass 105 - Part 3: Web metrics wired into WebAnalytics and SEO. */
describe("Marketing Pass 105 Part 3 - marketing_web_metrics wiring", () => {
  const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

  it("Bulk web metrics import dialog exists and writes to marketing_web_metrics", () => {
    const src = read("src/components/marketing/BulkWebMetricsImportDialog.tsx");
    expect(src).toMatch(/from\("marketing_web_metrics"/);
    expect(src).toMatch(/BulkWebMetricsImportDialog/);
    // Supports the canonical numeric + dimension fields.
    for (const f of ["metric_date", "source_system", "sessions", "clicks", "impressions", "conversions", "spend"]) {
      expect(src).toContain(f);
    }
  });

  it("WebMetricsPanel consumes the live hook and exposes bulk import", () => {
    const src = read("src/components/marketing/WebMetricsPanel.tsx");
    expect(src).toMatch(/useMarketingWebMetrics/);
    expect(src).toMatch(/BulkWebMetricsImportDialog/);
    expect(src).toMatch(/Bulk Import/);
  });

  it("WebAnalytics page mounts WebMetricsPanel", () => {
    const src = read("src/pages/os/marketing/WebAnalytics.tsx");
    expect(src).toMatch(/WebMetricsPanel/);
  });

  it("SEOContent page mounts WebMetricsPanel filtered to search_console", () => {
    const src = read("src/pages/os/marketing/SEOContent.tsx");
    expect(src).toMatch(/WebMetricsPanel/);
    expect(src).toMatch(/filterSourceSystem=["']search_console["']/);
  });

  it("useMarketingWebMetrics hook queries the correct table", () => {
    const src = read("src/hooks/useMarketingWebMetrics.ts");
    expect(src).toMatch(/from\("marketing_web_metrics"/);
  });
});