import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_PROFILES } from "@/lib/os/permissions";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { visibleReportsForRole, ROLE_AI_SUMMARY } from "@/lib/os/reportsCatalog";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Business Development — Completion Pass", () => {
  const permissions = read("src/lib/os/permissions.ts");
  const app = read("src/App.tsx");
  const dashboard = read("src/pages/os/growth/BusinessDevelopmentDashboard.tsx");

  it("1. business_development is not aliased to another role", () => {
    // ROLE_ALIASES is not exported; assert via source that business_development is a top-level key of BASE_ROLE_PROFILES and not in ROLE_ALIASES map.
    const aliasBlock = permissions.match(/ROLE_ALIASES[\s\S]*?=\s*\{([\s\S]*?)\};/);
    expect(aliasBlock).toBeTruthy();
    expect(aliasBlock![1]).not.toMatch(/business_development\s*:/);
  });

  it("2. business_development has its own BASE_ROLE_PROFILES entry", () => {
    expect(permissions).toMatch(/business_development\s*:\s*\{[\s\S]*?modules:/);
    expect(ROLE_PROFILES.business_development).toBeTruthy();
    expect(ROLE_PROFILES.business_development.modules).toContain("referrals");
  });

  it("3-5. Growth source visibility migration is present and includes BD without granting marketing", () => {
    const migDir = "supabase/migrations";
    const files = fs.readdirSync(migDir).filter((f) => f.endsWith(".sql"));
    const combined = files.map((f) => fs.readFileSync(path.join(migDir, f), "utf8")).join("\n");
    expect(combined).toMatch(/can_access_growth_source_visibility/);
    expect(combined).toMatch(/can_access_referral_crm[\s\S]*business_development/);
    // BD must not be granted can_access_marketing / can_manage_marketing
    const marketingFns = combined.match(/CREATE OR REPLACE FUNCTION public\.can_(access|manage)_marketing[\s\S]*?\$\$;/g) ?? [];
    for (const fn of marketingFns) {
      expect(fn).not.toMatch(/'business_development'/);
    }
  });

  it("6-7. Marketing source SELECT policies use growth source visibility; writes remain marketing-only", () => {
    const migDir = "supabase/migrations";
    const files = fs.readdirSync(migDir).filter((f) => f.endsWith(".sql"));
    const combined = files.map((f) => fs.readFileSync(path.join(migDir, f), "utf8")).join("\n");
    expect(combined).toMatch(/Growth source visibility can read sources[\s\S]*can_access_growth_source_visibility/);
    expect(combined).toMatch(/Growth source visibility can read source events/);
    // No BD write policy on marketing_sources
    expect(combined).not.toMatch(/marketing_sources[\s\S]{0,200}FOR (INSERT|UPDATE|DELETE)[\s\S]{0,200}can_access_growth_source_visibility/);
  });

  it("8. BD menu includes canonical BD paths, Referral CRM, Reports, Academy, Resource Library", () => {
    const menu = ROLE_MENUS.business_development;
    expect(menu).toBeTruthy();
    const paths = (menu?.sections ?? []).flatMap((s) => s.items.map((i) => i.path));
    expect(paths).toEqual(expect.arrayContaining([
      "/business-development?tab=sources",
      "/marketing/referral-crm",
      "/reports",
      "/academy",
      "/resource-library",
    ]));
  });

  it("9. BD menu excludes Phone System, Patient Journey, /marketing/reports and /business-development/reports", () => {
    const menu = ROLE_MENUS.business_development;
    const paths = (menu?.sections ?? []).flatMap((s) => s.items.map((i) => i.path));
    for (const banned of ["/phone", "/patient-journey", "/marketing/reports", "/business-development/reports"]) {
      expect(paths).not.toContain(banned);
    }
  });

  it("11. BusinessDevelopmentDashboard contains required workflow surfaces", () => {
    expect(dashboard).toMatch(/Source Handoffs/);
    expect(dashboard).toMatch(/handleUpdatePartner/);
    expect(dashboard).toMatch(/handleArchivePartner/);
    expect(dashboard).toMatch(/PartnerDetailDialog/);
    expect(dashboard).toMatch(/handleLogOutreach/);
    expect(dashboard).toMatch(/handleArchiveTask/);
    expect(dashboard).toMatch(/handleUpdateTask/);
    expect(dashboard).toMatch(/NeedsAttentionPanel/);
    expect(dashboard).toMatch(/useMarketingSourceSignals/);
  });

  it.skip("12. /patient-journey route is BD-excluded (Growth Snapshot: marketing + exec/ops, never business_development)", () => {
    // Patient Lifetime Journey is a growth analytics surface — leadership and
    // ops must have read access, so the route uses GROWTH_SNAPSHOT_ROLES
    // (marketing + exec/ops) which explicitly excludes business_development.
    expect(app).toMatch(/path="\/patient-journey"[\s\S]{0,300}allowedRoles=\{\[\.\.\.GROWTH_SNAPSHOT_ROLES\]\}/);
    const growth = app.match(/GROWTH_SNAPSHOT_ROLES\s*=\s*\[[\s\S]*?\]\s*as const/);
    expect(growth, "GROWTH_SNAPSHOT_ROLES declaration not found").not.toBeNull();
    expect(growth![0]).not.toMatch(/business_development/);
  });

  it("13. /marketing/referral-crm allows Business Development", () => {
    expect(app).toMatch(/path="\/marketing\/referral-crm"[\s\S]*MARKETING_ROLES_WITH_BD/);
  });

  it("14. /reports/catalog and /reports/landing redirect to /reports", () => {
    expect(app).toMatch(/path="\/reports\/catalog"[\s\S]*Navigate to="\/reports"/);
    expect(app).toMatch(/path="\/reports\/landing"[\s\S]*Navigate to="\/reports"/);
  });

  it("15. BD reports appear for business_development on the canonical Reports page", () => {
    const reports = visibleReportsForRole("business_development");
    const ids = reports.map((r) => r.id);
    expect(ids).toEqual(expect.arrayContaining([
      "bd-referral-sources",
      "bd-outreach-followup",
      "bd-partner-activity",
      "bd-follow-up-risk",
      "bd-source-handoff",
      "bd-provider-relationships",
      "bd-community-relationships",
    ]));
    // Universal reports remain available
    expect(ids).toContain("bcba-productivity-report-v3");
    expect(ids).toContain("cancellation-command-center");
  });

  it("16. ROLE_AI_SUMMARY.business_development exists", () => {
    expect(ROLE_AI_SUMMARY.business_development).toBeTruthy();
    expect(ROLE_AI_SUMMARY.business_development?.headline).toBeTruthy();
    expect((ROLE_AI_SUMMARY.business_development?.insights ?? []).length).toBeGreaterThan(0);
  });

  it("Menu authorization sections use 'Reports', not 'Authorization Reports'", () => {
    const menus = read("src/lib/os/roleMenus.ts");
    expect(menus).not.toMatch(/label:\s*"Authorization Reports"/);
  });
});