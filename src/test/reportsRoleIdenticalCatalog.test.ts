import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  PRIMARY_REPORT_IDS,
  REPORTS,
  visibleReportsForRole,
  visibleDepartmentDashboardsForRole,
} from "@/lib/os/reportsCatalog";

import { OS_ROLES } from "@/lib/os/permissions";

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

describe("/reports catalog is identical for every OS role", () => {
  const baseline = idsFor("super_admin");

  it("baseline is exactly the 8 primary + 9 department dashboards", () => {
    expect(visibleReportsForRole("super_admin").map((r) => r.id)).toEqual(PRIMARY);
    expect(visibleDepartmentDashboardsForRole("super_admin").map((r) => r.id).sort())
      .toEqual([...DEPARTMENTS].sort());
    expect(baseline).toHaveLength(17);
  });

  for (const r of OS_ROLES) {
    it(`${r.id} sees the identical 17-card catalog with no duplicates`, () => {
      const ids = idsFor(r.id);
      expect(ids).toEqual(baseline);
      expect(ids).toHaveLength(17);
      expect(new Set(ids).size).toBe(17);
      for (const id of PRIMARY) expect(ids).toContain(id);
      for (const id of DEPARTMENTS) expect(ids).toContain(id);
    });
  }

  it("no role sees a legacy catalog of 81 / 85 reports", () => {
    for (const r of OS_ROLES) expect(idsFor(r.id).length).toBe(17);
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
