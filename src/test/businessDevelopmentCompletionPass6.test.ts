import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { visibleReportsForRole } from "@/lib/os/reportsCatalog";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Business Development — Completion Pass 6 (generic /reports/:reportId guard)", () => {
  const detail = read("src/pages/os/reports/ReportDetail.tsx");
  const app = read("src/App.tsx");

  it("ReportDetail uses visibleReportsForRole(role) to guard generic /reports/:reportId", () => {
    expect(detail).toMatch(/visibleReportsForRole\(role\)/);
    expect(detail).toMatch(/canViewReport/);
    expect(detail).toMatch(/!report \|\| !cat \|\| !canViewReport/);
  });

  it("drilldown redirect only runs when canViewReport is true", () => {
    expect(detail).toMatch(/if\s*\(\s*canViewReport\s*&&\s*report\?\.drilldownPath\s*\)/);
  });

  it("/reports/:reportId remains mounted", () => {
    expect(app).toMatch(/path="\/reports\/:reportId"/);
  });

  it("hidden report IDs are not visible to business_development", () => {
    const ids = new Set(visibleReportsForRole("business_development").map(r => r.id));
    for (const hidden of ["claims-aging", "revenue-pipeline", "qa-performance", "cred-status", "exec-overview"]) {
      expect(ids.has(hidden)).toBe(false);
    }
  });

  it("BD report IDs and BCBA Productivity V3 remain visible to business_development", () => {
    const ids = new Set(visibleReportsForRole("business_development").map(r => r.id));
    for (const shown of [
      "bd-referral-sources",
      "bd-outreach-followup",
      "bd-partner-activity",
      "bd-follow-up-risk",
      "bd-source-handoff",
      "bd-provider-relationships",
      "bd-community-relationships",
      "bcba-productivity-report-v3",
    ]) {
      expect(ids.has(shown)).toBe(true);
    }
  });
});