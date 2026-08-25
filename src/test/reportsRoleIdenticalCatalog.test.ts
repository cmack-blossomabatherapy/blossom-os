import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  PRIMARY_REPORT_IDS,
  REPORTS,
  visibleReportsForRole,
  visibleDepartmentDashboardsForRole,
} from "@/lib/os/reportsCatalog";

import { OS_ROLES } from "@/lib/os/permissions";
import { ROLE_RESTRICTED_PRIMARY_REPORT_IDS } from "@/lib/os/reportsCatalog";

const appSrc = fs.readFileSync("src/App.tsx", "utf8");
const genericRoute = /path="\/reports\/:reportId"/.test(appSrc);

const PRIMARY = [...PRIMARY_REPORT_IDS];
const DEPARTMENTS = [
  "department-intake-dashboard",
  "department-authorizations-dashboard",
  "department-staffing-dashboard",
  "department-scheduling-dashboard",
  "department-recruiting-dashboard",
  "department-hr-dashboard",
  "department-qa-dashboard",
  "department-clinic-dashboard",
  "department-training-dashboard",
];

function idsFor(role: string) {
  return [
    ...visibleReportsForRole(role as never).map((r) => r.id),
    ...visibleDepartmentDashboardsForRole(role as never).map((r) => r.id),
  ];
}

const SHARED_PRIMARY = PRIMARY.filter((id) => !ROLE_RESTRICTED_PRIMARY_REPORT_IDS.has(id));

/**
 * The shared catalog is identical for every OS role: 8 shared primary cards +
 * 9 department dashboards = 17. The two finance reports (claims submission,
 * payment reconciliation) keep their own catalog `visibleTo` restriction, so an
 * eligible finance/leadership role sees up to 19 cards.
 */
describe("/reports catalog", () => {
  const baseline = idsFor("super_admin").filter(
    (id) => !ROLE_RESTRICTED_PRIMARY_REPORT_IDS.has(id),
  );

  it("shared baseline is exactly the 8 shared primary + 9 department dashboards", () => {
    expect(SHARED_PRIMARY).toHaveLength(8);
    expect(visibleDepartmentDashboardsForRole("super_admin").map((r) => r.id).sort())
      .toEqual([...DEPARTMENTS].sort());
    expect(baseline).toHaveLength(17);
  });

  for (const r of OS_ROLES) {
    it(`${r.id} sees the identical 17-card shared catalog with no duplicates`, () => {
      const all = idsFor(r.id);
      const shared = all.filter((id) => !ROLE_RESTRICTED_PRIMARY_REPORT_IDS.has(id));
      expect(shared).toEqual(baseline);
      expect(shared).toHaveLength(17);
      expect(new Set(all).size).toBe(all.length);
      for (const id of SHARED_PRIMARY) expect(shared).toContain(id);
      for (const id of DEPARTMENTS) expect(shared).toContain(id);
      expect(all.length).toBeLessThanOrEqual(19);
    });
  }

  it("no role sees a legacy catalog of 81 / 85 reports", () => {
    for (const r of OS_ROLES) {
      expect(idsFor(r.id).length).toBeGreaterThanOrEqual(17);
      expect(idsFor(r.id).length).toBeLessThanOrEqual(19);
    }
  });

  it("every visible card routes to a mounted page, never /coming-soon", () => {
    expect(genericRoute).toBe(true);
    for (const rep of [
      ...visibleReportsForRole("super_admin"),
      ...visibleDepartmentDashboardsForRole("super_admin"),
    ]) {
      const path = rep.drilldownPath;
      if (path) {
        expect(path).not.toMatch(/coming[-_ ]?soon/i);
        expect(appSrc).toContain(`path="${path.split("?")[0]}"`);
      }
    }
  });

  it("bcba-performance is primary with an explicit drilldown path; progress-reports keeps its legacy route without being a primary card", () => {
    const byId = new Map(visibleReportsForRole("super_admin").map((r) => [r.id, r]));
    expect(byId.get("bcba-performance")?.drilldownPath).toBe("/reports/bcba-performance");
    expect(byId.has("progress-reports")).toBe(false);
    expect(REPORTS.find((r) => r.id === "progress-reports")?.drilldownPath).toBe(
      "/reports/progress-reports",
    );
  });

});
