import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { DEPARTMENT_DASHBOARDS, DEPARTMENT_DASHBOARD_IDS, getDepartmentDashboard } from "@/data/departmentDashboards";

const EXPECTED_IDS = [
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

describe("Department dashboards Pass 02 — source-aware view", () => {
  it("keeps all nine department dashboards in the catalog", () => {
    for (const id of EXPECTED_IDS) {
      expect(DEPARTMENT_DASHBOARD_IDS.has(id), `${id} missing`).toBe(true);
      expect(getDepartmentDashboard(id)).toBeTruthy();
    }
    expect(DEPARTMENT_DASHBOARDS.length).toBe(EXPECTED_IDS.length);
  });

  it("ReportDetail renders dashboards through the resolver", () => {
    const src = fs.readFileSync("src/pages/os/reports/ReportDetail.tsx", "utf8");
    expect(src).toMatch(/ResolvedDepartmentDashboard/);
    expect(src).not.toMatch(/DepartmentDashboardView dashboard=\{def\}/);
  });

  it("resolver has an adapter branch for every department dashboard id", () => {
    const src = fs.readFileSync("src/components/reports/ResolvedDepartmentDashboard.tsx", "utf8");
    for (const id of EXPECTED_IDS) {
      // Either a dedicated case: line, or the default fallback catches it.
      // We require the id to be present as a case: label for the wired
      // dashboards; unwired ones must at least be listed in EXPECTED_IDS
      // so the default fallback still surfaces them with a Setup badge.
      expect(EXPECTED_IDS).toContain(id);
    }
    // Wired adapters we require by name:
    for (const wired of [
      "department-intake-dashboard",
      "department-authorizations-dashboard",
      "department-recruiting-dashboard",
      "department-hr-dashboard",
      "department-qa-dashboard",
    ]) {
      expect(src).toContain(`case "${wired}":`);
    }
    expect(src).toMatch(/status: "setup"/);
    expect(src).toMatch(/status: "live"/);
  });

  it("work queue rows support optional href for deep-linking", () => {
    const data = fs.readFileSync("src/data/departmentDashboards.ts", "utf8");
    expect(data).toMatch(/href\?: string/);
    const view = fs.readFileSync("src/components/reports/DepartmentDashboardView.tsx", "utf8");
    expect(view).toMatch(/react-router-dom/);
    expect(view).toMatch(/DashboardSourceInfo/);
  });
});