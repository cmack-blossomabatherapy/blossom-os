import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isIntegrationReady, isClinicalRole,
  getHrReadinessBlockers, canMarkReadyForStart,
} from "@/lib/hr/readiness";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");
const APP = read("src/App.tsx");
const NEW_HIRES = read("src/pages/os/OSHRNewHires.tsx");
const COMPLIANCE = read("src/pages/os/OSHRCompliance.tsx");

describe("Legacy HR admin routes redirect into canonical OS HR surface", () => {
  it("/hr/dashboard redirects to /hr-team", () => {
    expect(APP).toMatch(/path="\/hr\/dashboard"\s+element={<Navigate to="\/hr-team"/);
  });
  it("/hr/employee-records redirects to /user-management", () => {
    expect(APP).toMatch(/path="\/hr\/employee-records"\s+element={<Navigate to="\/user-management"/);
  });
  it("/admin/hr/requests redirects to /hr/requests", () => {
    expect(APP).toMatch(/path="\/admin\/hr\/requests"\s+element={<Navigate to="\/hr\/requests"/);
  });
  it("/hr/compliance-items redirects to /hr/compliance", () => {
    expect(APP).toMatch(/path="\/hr\/compliance-items"\s+element={<Navigate to="\/hr\/compliance"/);
  });
  it("/hr/nfc-badge-support redirects to /user-management", () => {
    expect(APP).toMatch(/path="\/hr\/nfc-badge-support"\s+element={<Navigate to="\/user-management"/);
  });
  it("/admin/hr/reports and /hr/reports redirect into unified reports", () => {
    expect(APP).toMatch(/path="\/admin\/hr\/reports"\s+element={<Navigate to="\/reports\?category=hr"/);
    expect(APP).toMatch(/path="\/hr\/reports"\s+element={<Navigate to="\/reports\?category=hr"/);
  });
  it("legacy HR page components are no longer rendered", () => {
    expect(APP).not.toMatch(/<HRDashboardPage/);
    expect(APP).not.toMatch(/<HREmployeeRecordsPage/);
    expect(APP).not.toMatch(/<HRRequestsPage/);
    expect(APP).not.toMatch(/<HRComplianceItemsPage/);
  });
});

describe("HR menus stay clean (no duplicates, no Login Vault/NFC/AI links)", () => {
  for (const role of ["hr_team", "hr_lead"] as const) {
    const menu = (ROLE_MENUS as any)[role];
    const paths = menu.sections.flatMap((s: any) => s.items.map((i: any) => i.path)) as string[];
    it(`${role} menu excludes forbidden paths`, () => {
      const forbidden = ["/hr/reports", "/admin/hr/reports", "/user-logins-vault", "/admin/login-vault", "/nfc-badges"];
      for (const p of forbidden) expect(paths).not.toContain(p);
    });
    it(`${role} menu does not include AI/Operational Insights entries`, () => {
      const labels = menu.sections.flatMap((s: any) => s.items.map((i: any) => String(i.label))) as string[];
      expect(labels.some((l) => /Ask Blossom|AI Assistant|Operational Insights/i.test(l))).toBe(false);
    });
    it(`${role} menu keeps unified /reports`, () => {
      expect(paths).toContain("/reports");
    });
  }
});

describe("Shared HR readiness helper", () => {
  it("integration status semantics", () => {
    expect(isIntegrationReady("ready")).toBe(true);
    expect(isIntegrationReady("synced")).toBe(true);
    expect(isIntegrationReady("not_applicable")).toBe(true);
    for (const s of ["not_started", "pending", "in_progress", "error", null, undefined]) {
      expect(isIntegrationReady(s as any)).toBe(false);
    }
  });
  it("clinical role detection", () => {
    expect(isClinicalRole("BCBA")).toBe(true);
    expect(isClinicalRole("RBT")).toBe(true);
    expect(isClinicalRole("Behavior Technician")).toBe(true);
    expect(isClinicalRole("HR Coordinator")).toBe(false);
  });
  it("blocks when Viventium or Stellar are not ready", () => {
    const blockers = getHrReadinessBlockers({
      onboarding: { viventium_status: "pending", stellar_status: "pending", centralreach_status: "not_applicable" },
      employeeRole: "HR Coordinator",
    });
    expect(blockers.some((b) => /Viventium/.test(b))).toBe(true);
    expect(blockers.some((b) => /Stellar/.test(b))).toBe(true);
  });
  it("requires CentralReach only for clinical roles", () => {
    const clinical = getHrReadinessBlockers({
      onboarding: { viventium_status: "ready", stellar_status: "ready", centralreach_status: "pending" },
      employeeRole: "BCBA",
    });
    expect(clinical.some((b) => /CentralReach/.test(b))).toBe(true);
    const nonClinical = getHrReadinessBlockers({
      onboarding: { viventium_status: "ready", stellar_status: "ready", centralreach_status: "pending" },
      employeeRole: "HR Coordinator",
    });
    expect(nonClinical.some((b) => /CentralReach/.test(b))).toBe(false);
  });
  it("flags missing/expired docs and incomplete training", () => {
    const blockers = getHrReadinessBlockers({
      onboarding: { viventium_status: "ready", stellar_status: "ready" },
      documents: [
        { required: true, status: "missing" },
        { required: true, status: "verified", expires_on: "2000-01-01" },
      ],
      trainings: [{ status: "in_progress" }],
      employeeRole: "HR Coordinator",
    });
    expect(blockers.some((b) => /missing/i.test(b))).toBe(true);
    expect(blockers.some((b) => /expired/i.test(b))).toBe(true);
    expect(blockers.some((b) => /training/i.test(b))).toBe(true);
  });
  it("flags orientation not completed when required", () => {
    const blockers = getHrReadinessBlockers({
      onboarding: { viventium_status: "ready", stellar_status: "ready" },
      orientationRequired: true,
      orientationCompleted: false,
      employeeRole: "HR Coordinator",
    });
    expect(blockers.some((b) => /Orientation/.test(b))).toBe(true);
  });
  it("canMarkReadyForStart is true when no blockers", () => {
    expect(canMarkReadyForStart({
      onboarding: { viventium_status: "ready", stellar_status: "ready", centralreach_status: "not_applicable" },
      documents: [],
      trainings: [],
      employeeRole: "HR Coordinator",
    })).toBe(true);
  });
});

describe("New Hires and Compliance both use shared readiness helper", () => {
  it("OSHRNewHires imports getHrReadinessBlockers", () => {
    expect(NEW_HIRES).toMatch(/from "@\/lib\/hr\/readiness"/);
    expect(NEW_HIRES).toMatch(/getHrReadinessBlockers/);
  });
  it("OSHRCompliance imports getHrReadinessBlockers", () => {
    expect(COMPLIANCE).toMatch(/from "@\/lib\/hr\/readiness"/);
    expect(COMPLIANCE).toMatch(/getHrReadinessBlockers/);
  });
  it("Neither page directly activates employees.status = 'active' via mark-ready", () => {
    const badPattern = /supabase\.from\(["']employees["']\)[\s\S]{0,120}update\([\s\S]{0,120}status:\s*["']active["']/;
    expect(badPattern.test(NEW_HIRES)).toBe(false);
    expect(badPattern.test(COMPLIANCE)).toBe(false);
  });
});
