import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Marketing Pass 100 — no shim arrays in live pages", () => {
  it("Campaigns.tsx has no shimLeads / shimCalls / shimCandidates", () => {
    const src = read("src/pages/os/marketing/Campaigns.tsx");
    expect(src).not.toMatch(/\bshimLeads\b/);
    expect(src).not.toMatch(/\bshimCalls\b/);
    expect(src).not.toMatch(/\bshimCandidates\b/);
  });
  it("CallTracking.tsx has no shimCalls / shimLeads", () => {
    const src = read("src/pages/os/marketing/CallTracking.tsx");
    expect(src).not.toMatch(/\bshimCalls\b/);
    expect(src).not.toMatch(/\bshimLeads\b/);
  });
  it("CommunityOutreach.tsx has no shimLeads / shimCandidates", () => {
    const src = read("src/pages/os/marketing/CommunityOutreach.tsx");
    expect(src).not.toMatch(/\bshimLeads\b/);
    expect(src).not.toMatch(/\bshimCandidates\b/);
  });
});

describe("Marketing Pass 100 — no stale empty useMemo deps around live marketing data", () => {
  const files = [
    "src/pages/os/marketing/LeadSources.tsx",
    "src/pages/os/marketing/WebAnalytics.tsx",
    "src/pages/os/marketing/SEOContent.tsx",
    "src/pages/os/marketing/RecruitingMarketing.tsx",
    "src/pages/os/marketing/AttributionROI.tsx",
    "src/pages/os/marketing/StateGrowth.tsx",
    "src/pages/os/marketing/Reputation.tsx",
    "src/pages/os/marketing/Campaigns.tsx",
    "src/pages/os/marketing/CallTracking.tsx",
    "src/pages/os/marketing/CommunityOutreach.tsx",
  ];
  for (const f of files) {
    it(`${f} has no useMemo(..., []) block referencing marketingLeads/Calls/Candidates`, () => {
      if (!fs.existsSync(f)) return;
      const src = read(f);
      const memoBlocks = src.match(/useMemo\(\s*\(\)\s*=>\s*\{[\s\S]*?\},\s*\[\]\s*\)/g) ?? [];
      for (const block of memoBlocks) {
        expect(block, `${f}: empty-deps useMemo reads marketing data`).not.toMatch(
          /\bmarketing(Leads|Calls|Candidates)\b/,
        );
      }
    });
  }
});

describe("Marketing Pass 100 — Patient Lifetime Journey is Marketing-only", () => {
  it("/patient-journey route uses MARKETING_ROLES (not MARKETING_ROLES_WITH_BD)", () => {
    const app = read("src/App.tsx");
    const m = app.match(/path="\/patient-journey"[^]*?<\/PermissionRoute>/);
    expect(m).toBeTruthy();
    expect(m![0]).toMatch(/MARKETING_ROLES\b/);
    expect(m![0]).not.toMatch(/MARKETING_ROLES_WITH_BD/);
  });
  it("Business Development menu does not include /patient-journey", () => {
    const { ROLE_MENUS } = require("@/lib/os/roleMenus");
    const paths = ROLE_MENUS.business_development.sections.flatMap(
      (s: { items: { path: string }[] }) => s.items.map((i) => i.path),
    );
    expect(paths).not.toContain("/patient-journey");
  });
});

describe("Marketing Pass 100 — single Reports page", () => {
  it("MarketingReports.tsx file is not present", () => {
    expect(fs.existsSync("src/pages/os/marketing/MarketingReports.tsx")).toBe(false);
  });
  it("/marketing/reports route is a Navigate redirect to /reports", () => {
    const app = read("src/App.tsx");
    const m = app.match(/<Route\s+path="\/marketing\/reports"[^>]*element=\{<Navigate[^>]*to="\/reports"/);
    expect(m).toBeTruthy();
  });
});