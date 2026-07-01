import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), "utf8");

describe("Marketing Pass 106 completion", () => {
  it("BulkWebMetricsImportDialog exists", () => {
    expect(fs.existsSync("src/components/marketing/BulkWebMetricsImportDialog.tsx")).toBe(true);
  });
  it("BulkReputationEventImportDialog exists", () => {
    expect(fs.existsSync("src/components/marketing/BulkReputationEventImportDialog.tsx")).toBe(true);
  });
  it("ReputationEventLogDialog exists", () => {
    expect(fs.existsSync("src/components/marketing/ReputationEventLogDialog.tsx")).toBe(true);
  });

  it("WebAnalytics uses useMarketingWebMetrics", () => {
    expect(read("src/pages/os/marketing/WebAnalytics.tsx")).toContain("useMarketingWebMetrics");
  });
  it("SEOContent uses useMarketingWebMetrics", () => {
    expect(read("src/pages/os/marketing/SEOContent.tsx")).toContain("useMarketingWebMetrics");
  });
  it("Reputation page uses useMarketingReputationEvents", () => {
    expect(read("src/pages/os/marketing/Reputation.tsx")).toContain("useMarketingReputationEvents");
  });

  it("WebAnalytics does not contain fake mobile share estimate", () => {
    const src = read("src/pages/os/marketing/WebAnalytics.tsx");
    expect(src).not.toMatch(/0\.62/);
    expect(src.toLowerCase()).not.toContain("est. mobile share");
    expect(src.toLowerCase()).not.toContain("estimated mobile share");
  });

  it("CreateMarketingWorkButton helper is exported", () => {
    expect(read("src/components/marketing/MarketingWorkPanel.tsx")).toMatch(
      /export\s+(function|const)\s+CreateMarketingWorkButton/,
    );
  });

  it("seedFactory is used in more than one marketing page", () => {
    const pages = [
      "src/pages/os/marketing/WebAnalytics.tsx",
      "src/pages/os/marketing/SEOContent.tsx",
      "src/pages/os/marketing/Reputation.tsx",
      "src/pages/os/marketing/CommunityOutreach.tsx",
      "src/pages/os/marketing/RecruitingMarketing.tsx",
      "src/pages/os/marketing/StateGrowth.tsx",
      "src/pages/os/marketing/AttributionROI.tsx",
    ];
    const uses = pages.filter((p) => fs.existsSync(p) && read(p).includes("seedFactory"));
    expect(uses.length).toBeGreaterThanOrEqual(4);
  });

  it("MarketingWorkPanel exposes owner editing UI", () => {
    const src = read("src/components/marketing/MarketingWorkPanel.tsx");
    expect(src).toMatch(/setOwner|owner_id/);
    expect(src).toContain("useEmployeeDirectory");
  });

  it("IntegrationReadinessPanel includes Go Integrate Nava", () => {
    expect(read("src/components/marketing/IntegrationReadinessPanel.tsx")).toMatch(
      /Go Integrate Nava/i,
    );
  });

  it("A corrective migration drops broad marketing policies", () => {
    const dir = "supabase/migrations";
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    const contents = files.map((f) => ({ f, text: fs.readFileSync(path.join(dir, f), "utf8") }));
    const hardening = contents.find(
      (c) =>
        /DROP POLICY[^;]*Authenticated can manage marketing work items/i.test(c.text) &&
        /DROP POLICY[^;]*Authenticated can manage web metrics/i.test(c.text) &&
        /DROP POLICY[^;]*Authenticated can manage reputation events/i.test(c.text),
    );
    expect(hardening, "Expected a corrective migration dropping broad policies").toBeTruthy();

    // And that migration must NOT re-introduce USING (true) WITH CHECK (true) for marketing tables.
    const bad = /CREATE POLICY[^;]*ON public\.(marketing_work_items|marketing_web_metrics|marketing_reputation_events)[^;]*USING \(true\)[^;]*WITH CHECK \(true\)/is;
    expect(bad.test(hardening!.text)).toBe(false);
  });
});