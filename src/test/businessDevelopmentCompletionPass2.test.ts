import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { visibleReportsForRole } from "@/lib/os/reportsCatalog";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Business Development — Completion Pass 2", () => {
  const app = read("src/App.tsx");
  const dashboard = read("src/pages/os/growth/BusinessDevelopmentDashboard.tsx");
  const shell = read("src/pages/os/OSShell.tsx");

  it("BUSINESS_DEVELOPMENT_ROLES constant is defined and used for /business-development", () => {
    expect(app).toMatch(/const\s+BUSINESS_DEVELOPMENT_ROLES\s*=\s*\[/);
    expect(app).toMatch(/"admin"[\s\S]{0,80}"super_admin"[\s\S]{0,80}"business_development"[\s\S]{0,80}"marketing_growth_lead"/);
    expect(app).toMatch(/path="\/business-development"[\s\S]{0,120}BUSINESS_DEVELOPMENT_ROLES/);
  });

  it("marketing_growth_lead has /business-development in its live-path set", () => {
    // Grab the marketing_growth_lead live path block.
    const block = shell.match(/marketing_growth_lead:\s*new Set<string>\(\[([\s\S]*?)\]\)/);
    expect(block).toBeTruthy();
    expect(block![1]).toMatch(/"\/business-development"/);
  });

  it("BD is not added to /patient-journey, /phone, or broad marketing admin routes", () => {
    // /patient-journey uses GROWTH_SNAPSHOT_ROLES (marketing + exec/ops), which
    // must remain BD-excluded. The BD-exclusion invariant is what matters here.
    expect(app).toMatch(/path="\/patient-journey"[\s\S]{0,300}\[\.\.\.GROWTH_SNAPSHOT_ROLES\]/);
    const growth = app.match(/GROWTH_SNAPSHOT_ROLES\s*=\s*\[[\s\S]*?\]\s*as const/);
    expect(growth, "GROWTH_SNAPSHOT_ROLES declaration not found").not.toBeNull();
    expect(growth![0]).not.toMatch(/business_development/);
    // BD role should never appear in /phone or /marketing admin route guards.
    const phone = app.match(/path="\/phone"[\s\S]{0,200}\/>/);
    if (phone) expect(phone[0]).not.toMatch(/business_development/);
  });

  it("BD menu has exactly one Reports link and it is /reports", () => {
    const menu = ROLE_MENUS.business_development;
    const reportsItems = (menu?.sections ?? [])
      .flatMap((s) => s.items)
      .filter((i) => i.label === "Reports" || i.path.startsWith("/reports"));
    expect(reportsItems.length).toBe(1);
    expect(reportsItems[0].path).toBe("/reports");
  });

  it("BD menu excludes department-specific reports pages", () => {
    const menu = ROLE_MENUS.business_development;
    const paths = (menu?.sections ?? []).flatMap((s) => s.items.map((i) => i.path));
    for (const banned of ["/business-development/reports", "/marketing/reports", "/phone", "/patient-journey"]) {
      expect(paths).not.toContain(banned);
    }
  });

  it("BD visible reports include BD cards, BCBA Productivity, and exclude HR-only reports", () => {
    const reports = visibleReportsForRole("business_development");
    const ids = reports.map((r) => r.id);
    for (const id of [
      "bd-referral-sources",
      "bd-outreach-followup",
      "bd-partner-activity",
      "bd-follow-up-risk",
      "bd-source-handoff",
      "bd-provider-relationships",
      "bd-community-relationships",
    ]) {
      expect(ids).toContain(id);
    }
    // Global BCBA Productivity is still available.
    expect(ids).toContain("bcba-productivity-report-v3");
    // HR / credentialing / finance-only reports should not leak to BD.
    for (const id of reports.map((r) => r.id)) {
      expect(id.startsWith("hr-")).toBe(false);
      expect(id.startsWith("credentialing-")).toBe(false);
      expect(id.startsWith("finance-")).toBe(false);
    }
  });

  it("BD report drilldowns land inside /business-development or canonical /reports", () => {
    const reports = visibleReportsForRole("business_development").filter((r) => r.id.startsWith("bd-"));
    for (const r of reports) {
      const dp = r.drilldownPath ?? "";
      expect(dp.startsWith("/business-development") || dp.startsWith("/reports")).toBe(true);
      expect(dp.startsWith("/business-development/reports")).toBe(false);
    }
  });

  it("Source handoff code fetches richer marketing_source_events fields", () => {
    for (const field of [
      "assigned_to",
      "caller_name",
      "caller_email",
      "caller_phone",
      "lead_id",
      "payload_summary",
      "referral_company_id",
      "referral_contact_id",
      "reviewed_at",
      "reviewed_by",
    ]) {
      expect(dashboard).toContain(field);
    }
  });

  it("Source handoff UI exposes the required BD actions", () => {
    for (const label of [
      "Create Partner",
      "Link to Existing Partner",
      "Log Outreach",
      "Create Follow-Up",
      "Assign to Me",
      "Mark Reviewed",
    ]) {
      expect(dashboard).toContain(label);
    }
  });

  it("Safe BD source-event RPCs exist in Supabase migrations", () => {
    const migDir = "supabase/migrations";
    const files = fs.readdirSync(migDir).filter((f) => f.endsWith(".sql"));
    const combined = files.map((f) => fs.readFileSync(path.join(migDir, f), "utf8")).join("\n");
    for (const fn of [
      "bd_assign_source_event",
      "bd_mark_source_event_reviewed",
      "bd_link_source_event_to_referral",
    ]) {
      expect(combined).toContain(fn);
    }
    expect(combined).toMatch(/GRANT EXECUTE ON FUNCTION public\.bd_assign_source_event\(uuid\) TO authenticated/);
    expect(combined).toMatch(/GRANT EXECUTE ON FUNCTION public\.bd_mark_source_event_reviewed\(uuid\) TO authenticated/);
    expect(combined).toMatch(/GRANT EXECUTE ON FUNCTION public\.bd_link_source_event_to_referral\(uuid, uuid, uuid\) TO authenticated/);
  });

  it("BD dashboard uses the RPCs (not direct writes) for handoff actions", () => {
    expect(dashboard).toMatch(/bd_assign_source_event/);
    expect(dashboard).toMatch(/bd_mark_source_event_reviewed/);
    expect(dashboard).toMatch(/bd_link_source_event_to_referral/);
  });

  it("/reports/catalog and /reports/landing redirect to /reports", () => {
    expect(app).toMatch(/path="\/reports\/catalog"[\s\S]{0,120}Navigate to="\/reports"/);
    expect(app).toMatch(/path="\/reports\/landing"[\s\S]{0,120}Navigate to="\/reports"/);
  });
});