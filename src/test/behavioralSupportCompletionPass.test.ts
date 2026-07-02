import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { ROLES } from "@/lib/roles";
import { visibleReportsForRole } from "@/lib/os/reportsCatalog";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

const REQUIRED_BS_PATHS = [
  "/behavioral-support",
  "/behavioral-support/crisis-support",
  "/behavioral-support/escalations",
  "/behavioral-support/support-plans",
  "/behavioral-support/follow-ups",
  "/behavioral-support/supervision-visibility",
  "/behavioral-support/evaluations",
  "/reports",
  "/academy",
  "/resource-library",
];

const FORBIDDEN_BS_MENU_PATHS = [
  "/behavioral-support/reports",
  "/clinical/reports",
  "/marketing/reports",
  "/hr/reports",
  "/reports/bcba-productivity-report-v3",
  "/case-manager/service-issues",
  "/case-manager/follow-ups",
  "/bcba/workspace",
  "/escalations-followups",
  "/supervision-visibility",
];

describe("Behavioral Support completion pass", () => {
  const menu = ROLE_MENUS.behavioral_support;

  it("has a behavioral_support role menu", () => {
    expect(menu).toBeDefined();
  });

  it("includes every required Behavioral Support route in the menu", () => {
    const paths = menu!.sections.flatMap((s) => s.items.map((i) => i.path));
    for (const p of REQUIRED_BS_PATHS) {
      expect(paths, `missing ${p}`).toContain(p);
    }
  });

  it("exposes exactly one Reports link and it is /reports", () => {
    const paths = menu!.sections.flatMap((s) => s.items.map((i) => i.path));
    const reportsLinks = paths.filter((p) => p === "/reports" || p.startsWith("/reports/") || p.includes("reports"));
    expect(reportsLinks).toEqual(["/reports"]);
  });

  it("does not include borrowed or deep report menu paths", () => {
    const paths = menu!.sections.flatMap((s) => s.items.map((i) => i.path));
    for (const p of FORBIDDEN_BS_MENU_PATHS) {
      expect(paths, `should not menu ${p}`).not.toContain(p);
    }
  });

  it("App.tsx mounts all Behavioral Support routes", () => {
    const app = read("src/App.tsx");
    for (const p of REQUIRED_BS_PATHS.slice(0, 7)) {
      expect(app, `missing route ${p}`).toContain(`path="${p}"`);
    }
  });

  it("no duplicate role-specific reports route exists in App.tsx", () => {
    const app = read("src/App.tsx");
    expect(app).not.toContain('path="/behavioral-support/reports"');
    expect(app).not.toContain('path="/clinical/reports"');
  });

  it("visibleReportsForRole('behavioral_support') includes shared and clinical support reports", () => {
    const ids = visibleReportsForRole("behavioral_support").map((r) => r.id);
    expect(ids).toContain("bcba-productivity-report-v3");
    expect(ids).toContain("cancellation-command-center");
    expect(ids).toContain("qa-supervision-pt");
  });

  it("Behavioral Support Supabase migration includes all six workflow tables", () => {
    const sql = read("supabase/migrations/20260702212306_da3fe239-260b-46fb-bb17-5f5991653a9d.sql");
    for (const t of [
      "behavioral_support_cases",
      "behavioral_support_escalations",
      "behavioral_support_plans",
      "behavioral_support_plan_tasks",
      "behavioral_support_followups",
      "behavioral_support_activity_log",
    ]) {
      expect(sql, `missing table ${t}`).toContain(t);
    }
    expect(sql.toLowerCase()).toContain("enable row level security");
  });

  it("Behavioral Support dashboard is no longer static placeholder-only", () => {
    const dash = read("src/pages/os/behavioral-support/BehavioralSupportDashboard.tsx");
    expect(dash).toContain("useBehavioralSupportData");
    expect(dash).not.toMatch(/const\s+kpis\s*=\s*\[\s*{[^}]*value:\s*"—"/);
  });

  it("roles.ts no longer describes Behavioral Support as reports and training only", () => {
    const bs = ROLES.find((r) => r.key === "behavioral_support");
    expect(bs).toBeDefined();
    expect(bs!.description.toLowerCase()).not.toContain("reports and training only");
    expect(bs!.owns.length).toBeGreaterThan(1);
  });
});