import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Marketing — canonical wiring", () => {
  it("MarketingReports.tsx is not imported into App.tsx", () => {
    const app = read("src/App.tsx");
    expect(app).not.toMatch(/MarketingReports/);
  });

  it("MarketingReports.tsx file has been removed from the marketing pages folder", () => {
    expect(fs.existsSync("src/pages/os/marketing/MarketingReports.tsx")).toBe(false);
  });

  it("App.tsx defines a shared MARKETING_ROLES access constant", () => {
    const app = read("src/App.tsx");
    expect(app).toContain("MARKETING_ROLES");
    expect(app).toContain("MARKETING_ROLES_WITH_BD");
  });

  it("/marketing/reports is only mounted as a Navigate redirect", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(
      /<Route\s+path="\/marketing\/reports"\s+element=\{<Navigate/,
    );
  });

  const MARKETING_FILES = [
    "src/pages/os/marketing/CallTracking.tsx",
    "src/pages/os/marketing/Campaigns.tsx",
    "src/pages/os/marketing/CommunityOutreach.tsx",
    "src/pages/os/marketing/MarketingDashboard.tsx",
    "src/pages/os/marketing/LeadSources.tsx",
    "src/pages/os/marketing/SEOContent.tsx",
    "src/pages/os/marketing/WebAnalytics.tsx",
    "src/pages/os/marketing/EmailMarketing.tsx",
    "src/pages/os/marketing/Reputation.tsx",
    "src/pages/os/marketing/AttributionROI.tsx",
    "src/pages/os/marketing/StateGrowth.tsx",
    "src/pages/os/marketing/RecruitingMarketing.tsx",
    "src/hooks/useMarketingIntelligence.ts",
  ];

  for (const f of MARKETING_FILES) {
    it(`${f} does not import mockLeads / mockPhoneCalls / mockCandidates`, () => {
      if (!fs.existsSync(f)) return;
      const src = read(f);
      expect(src).not.toMatch(/from\s+["']@\/data\/leads["'][^;]*mockLeads/);
      expect(src).not.toMatch(/from\s+["']@\/data\/calls["'][^;]*mockPhoneCalls/);
      expect(src).not.toMatch(/from\s+["']@\/data\/recruiting["'][^;]*mockCandidates/);
      expect(src).not.toMatch(/\bimport\s*\{[^}]*\bmockLeads\b/);
      expect(src).not.toMatch(/\bimport\s*\{[^}]*\bmockPhoneCalls\b/);
      expect(src).not.toMatch(/\bimport\s*\{[^}]*\bmockCandidates\b/);
    });
  }

  it("LeadSourceActions no longer says 'coming soon'", () => {
    const src = read("src/components/marketing/LeadSourceActions.tsx");
    expect(src.toLowerCase()).not.toContain("coming soon");
  });

  it("marketing_team permissions do not include ai_assistant", () => {
    const src = read("src/lib/os/permissions.ts");
    const marketingBlock = src.slice(
      src.indexOf("marketing_team:"),
      src.indexOf("case_manager:", src.indexOf("marketing_team:")),
    );
    expect(marketingBlock).not.toMatch(/["']ai_assistant["']/);
    expect(marketingBlock).toMatch(/aiInsights:\s*false/);
  });
});