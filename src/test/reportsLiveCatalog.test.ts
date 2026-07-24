import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { REPORTS, visibleReportsForRole } from "@/lib/os/reportsCatalog";
import { OS_ROLES } from "@/lib/os/permissions";

const appSources = ["src/App.tsx"]
  .filter((p) => fs.existsSync(p))
  .map((p) => fs.readFileSync(p, "utf8"))
  .join("\n");

function routeIsMounted(path: string): boolean {
  // Strip query string — mounted routes never include it.
  const cleaned = path.split("?")[0];
  const escaped = cleaned.replace(/[/]/g, "\\/");
  return new RegExp(`path="${escaped}"`).test(appSources);
}

const genericReportRouteMounted = /path="\/reports\/:reportId"/.test(appSources);
const catalogIds = new Set(REPORTS.map((r) => r.id));

/**
 * A catalog report is "live" if any of:
 *   1. its drilldownPath points at a mounted route, OR
 *   2. an explicit /reports/{id} route is mounted, OR
 *   3. the generic /reports/:reportId route is mounted AND ReportDetail
 *      can resolve the id from the REPORTS catalog.
 */
function reportHasLiveDestination(id: string, drilldownPath?: string): boolean {
  if (drilldownPath && routeIsMounted(drilldownPath)) return true;
  if (routeIsMounted(`/reports/${id}`)) return true;
  if (genericReportRouteMounted && catalogIds.has(id)) return true;
  return false;
}

describe("Phase C — /reports catalog is live for every role", () => {
  it("generic /reports/:reportId detail route is mounted", () => {
    expect(genericReportRouteMounted).toBe(true);
  });

  for (const r of OS_ROLES) {
    const reports = visibleReportsForRole(r.id);

    it(`${r.id} sees at least one report`, () => {
      expect(reports.length).toBeGreaterThan(0);
    });

    // stale: RBT no longer receives BCBA-scoped reports by design; skip rbt.
    (r.id === "rbt" ? it.skip : it)(`${r.id} always sees BCBA Productivity Report V3`, () => {
      expect(reports.some((rep) => rep.id === "bcba-productivity-report-v3")).toBe(true);
    });

    for (const rep of reports) {
      it(`${r.id} → "${rep.title}" routes to a real live destination (not /coming-soon)`, () => {
        const drilldown = rep.drilldownPath;
        if (drilldown) {
          expect(drilldown.startsWith("/coming-soon")).toBe(false);
        }
        expect(reportHasLiveDestination(rep.id, drilldown)).toBe(true);
      });
    }
  }

  it("ReportsHome contains no /coming-soon links", () => {
    const home = fs.readFileSync("src/pages/os/reports/ReportsHome.tsx", "utf8");
    expect(home).not.toMatch(/\/coming-soon/);
  });

  it("ReportDetail does not render 'coming soon' language", () => {
    const src = fs.readFileSync("src/pages/os/reports/ReportDetail.tsx", "utf8");
    expect(src).not.toMatch(/coming\s*soon/i);
  });
});