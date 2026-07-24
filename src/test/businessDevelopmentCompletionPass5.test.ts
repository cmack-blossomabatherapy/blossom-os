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

  it("direct HR/credentialing/canonical QA report routes are wrapped in ReportRoleGuard", () => {
    // Legacy QA report IDs (qa-supervision-pt, qa-auth-utilization,
    // qa-cancellation) now redirect to canonical routes; the canonical
    // routes below are the ones that must be ReportRoleGuard-wrapped.
    for (const id of [
      "bcba-supervision",
      "parent-training",
      "authorization-utilization-hour-based",
      "authorization-analysis",
      "cancellation-command-center",
      "hr-payroll-command",
      "hr-employee-compliance",
      "hr-employee-onboarding",
      "hr-bcba-productivity",
      "bcba-performance",
    ]) {
      const re = new RegExp(`path="\\/reports\\/${id}"[\\s\\S]{0,200}ReportRoleGuard reportId="${id}"`);
      expect(app, `expected ReportRoleGuard on /reports/${id}`).toMatch(re);
    }
    // Legacy aliases must redirect (query/hash preserved via NavigateWithSearch).
    for (const [legacy, canonical] of [
      ["qa-supervision-pt", "bcba-supervision"],
      ["qa-auth-utilization", "authorization-utilization-hour-based"],
      ["qa-cancellation", "cancellation-command-center"],
    ] as const) {
      const rx = new RegExp(`path="\\/reports\\/${legacy}"[\\s\\S]{0,120}NavigateWithSearch to="\\/reports\\/${canonical}"`);
      expect(app, `expected legacy ${legacy} → ${canonical} redirect`).toMatch(rx);
    }
  });

  it("BCBA Productivity V1 redirects to V3 (query/hash preserved), V3 remains guarded", () => {
    // V1 was consolidated into V3 to eliminate dual-surface drift; the
    // legacy URL must still resolve for saved links and use
    // NavigateWithSearch so query params & hash survive the redirect.
    expect(app).toMatch(
      /path="\/reports\/bcba-productivity-report"[\s\S]{0,160}NavigateWithSearch to="\/reports\/bcba-productivity-report-v3"/,
    );
    expect(app).toMatch(
      /path="\/reports\/bcba-productivity-report-v3"[\s\S]{0,200}ReportRoleGuard reportId="bcba-productivity-report-v3"[\s\S]{0,80}<BcbaProductivityReportV3/,
    );
  });

  it.skip("BD completion invariants: /business-development gated, referral-crm allows BD, phone/patient-journey exclude BD", () => {
    expect(app).toMatch(/path="\/business-development"/);
    expect(app).toMatch(/path="\/marketing\/referral-crm"[\s\S]*MARKETING_ROLES_WITH_BD/);
    // /phone must not list business_development in its allowedRoles.
    const phoneMatch = app.match(/path="\/phone"[\s\S]{0,400}\/>/);
    if (phoneMatch) expect(phoneMatch[0]).not.toMatch(/business_development/);
    // /patient-journey is a growth analytics surface — it uses
    // GROWTH_SNAPSHOT_ROLES (marketing + exec/ops) and must exclude BD.
    expect(app).toMatch(/path="\/patient-journey"[\s\S]{0,300}allowedRoles=\{\[\.\.\.GROWTH_SNAPSHOT_ROLES\]\}/);
    const growthDecl = app.match(/GROWTH_SNAPSHOT_ROLES\s*=\s*\[[\s\S]*?\]\s*as const/);
    expect(growthDecl, "GROWTH_SNAPSHOT_ROLES declaration not found").not.toBeNull();
    expect(growthDecl![0]).not.toMatch(/business_development/);
  });
});