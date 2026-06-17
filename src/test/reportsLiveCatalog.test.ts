import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { visibleReportsForRole } from "@/lib/os/reportsCatalog";
import { OS_ROLES } from "@/lib/os/permissions";

const appSources = ["src/App.tsx"]
  .filter((p) => fs.existsSync(p))
  .map((p) => fs.readFileSync(p, "utf8"))
  .join("\n");

function routeIsMounted(path: string): boolean {
  const escaped = path.replace(/[/]/g, "\\/");
  return new RegExp(`path="${escaped}"`).test(appSources);
}

describe("Phase C — /reports catalog is live for every role", () => {
  for (const r of OS_ROLES) {
    const reports = visibleReportsForRole(r.id);

    it(`${r.id} sees at least one report`, () => {
      expect(reports.length).toBeGreaterThan(0);
    });

    it(`${r.id} always sees BCBA Productivity Report V3`, () => {
      expect(reports.some((rep) => rep.id === "bcba-productivity-report-v3")).toBe(true);
    });

    for (const rep of reports) {
      it(`${r.id} → "${rep.title}" routes to a real /reports page (not /coming-soon)`, () => {
        const target = `/reports/${rep.id}`;
        expect(target.startsWith("/coming-soon")).toBe(false);
        expect(routeIsMounted(target)).toBe(true);
      });
    }
  }

  it("ReportsHome contains no /coming-soon links", () => {
    const home = fs.readFileSync("src/pages/os/reports/ReportsHome.tsx", "utf8");
    expect(home).not.toMatch(/\/coming-soon/);
  });
});