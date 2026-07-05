import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { visibleReportsForRole } from "@/lib/os/reportsCatalog";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Business Development — Completion Pass 5 (Reports hardening)", () => {
  const app = read("src/App.tsx");

  it("BD menu contains exactly one Reports link and it points to /reports", () => {
    const menu = ROLE_MENUS.business_development!;
    const paths = menu.sections.flatMap((s) => s.items.map((i) => i.path));
    const reportsLinks = paths.filter((p) => p === "/reports" || p.startsWith("/reports?") || p.includes("/reports/"));
    expect(reportsLinks).toEqual(["/reports"]);
    // Never a BD-specific reports destination
    expect(paths).not.toContain("/business-development/reports");
  });

  it("no /business-development/reports route is mounted", () => {
    expect(app).not.toMatch(/path="\/business-development\/reports"/);
  });

  it("/marketing/reports, /reports/catalog, /reports/landing redirect to /reports", () => {
    expect(app).toMatch(/path="\/marketing\/reports"[\s\S]{0,80}Navigate to="\/reports/);
    expect(app).toMatch(/path="\/reports\/catalog"[\s\S]{0,80}Navigate to="\/reports"/);
    expect(app).toMatch(/path="\/reports\/landing"[\s\S]{0,80}Navigate to="\/reports"/);
  });

  it("BD visible reports include BD cards and BCBA Productivity", () => {
    const ids = visibleReportsForRole("business_development").map((r) => r.id);
    for (const id of [
      "bd-referral-sources",
      "bd-outreach-followup",
      "bd-partner-activity",
      "bd-follow-up-risk",
      "bd-source-handoff",
      "bd-provider-relationships",
      "bd-community-relationships",
      "bcba-productivity-report-v3",
      "cancellation-command-center",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("BD visible reports exclude HR-only, QA-only, Finance-only, Credentialing-only reports", () => {
    const ids = new Set(visibleReportsForRole("business_development").map((r) => r.id));
    for (const id of [
      "hr-payroll-command",
      "hr-employee-compliance",
      "hr-employee-onboarding",
      "hr-bcba-productivity",
      "qa-supervision-pt",
      "qa-auth-utilization",
      "qa-cancellation",
      "qa-performance",
      "cred-status",
      "cred-bcba-coverage",
      "cred-expiring",
      "cred-payer-matrix",
    ]) {
      expect(ids.has(id)).toBe(false);
    }
  });

  it("direct HR/QA/credentialing report routes are wrapped in ReportRoleGuard", () => {
    for (const id of [
      "qa-supervision-pt",
      "qa-auth-utilization",
      "qa-cancellation",
      "hr-payroll-command",
      "hr-employee-compliance",
      "hr-employee-onboarding",
      "hr-bcba-productivity",
      "bcba-performance",
    ]) {
      const re = new RegExp(`path="\\/reports\\/${id}"[\\s\\S]{0,200}ReportRoleGuard reportId="${id}"`);
      expect(app).toMatch(re);
    }
  });

  it("BCBA Productivity Reports remain reachable (no guard needed — visibleTo: all)", () => {
    expect(app).toMatch(/path="\/reports\/bcba-productivity-report"\s+element=\{<BcbaProductivityReport/);
    expect(app).toMatch(/path="\/reports\/bcba-productivity-report-v3"\s+element=\{<BcbaProductivityReportV3/);
  });

  it("BD completion invariants: /business-development gated, referral-crm allows BD, phone/patient-journey exclude BD", () => {
    expect(app).toMatch(/path="\/business-development"/);
    expect(app).toMatch(/path="\/marketing\/referral-crm"[\s\S]*MARKETING_ROLES_WITH_BD/);
    // /phone must not list business_development in its allowedRoles
    const phoneMatch = app.match(/path="\/phone"[\s\S]{0,400}\/>/);
    if (phoneMatch) expect(phoneMatch[0]).not.toMatch(/business_development/);
    // /patient-journey must be MARKETING_ROLES only
    expect(app).toMatch(/path="\/patient-journey"[\s\S]*allowedRoles=\{\[\.\.\.MARKETING_ROLES\]\}/);
  });
});