import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { readdirSync } from "node:fs";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { ROLE_META } from "@/lib/roles";
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
    const bs = ROLE_META.find((r) => r.key === "behavioral_support");
    expect(bs).toBeDefined();
    expect(bs!.description.toLowerCase()).not.toContain("reports and training only");
    expect(bs!.owns.length).toBeGreaterThan(1);
  });
});

describe("Behavioral Support pass 2 hardening", () => {
  const pagesDir = "src/pages/os/behavioral-support";
  const pageFiles = readdirSync(resolve(process.cwd(), pagesDir))
    .filter((f) => f.endsWith(".tsx"));

  it("has no browser prompt() calls in any Behavioral Support page", () => {
    for (const f of pageFiles) {
      const src = read(`${pagesDir}/${f}`);
      // strip comments to avoid false positives
      const stripped = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      expect(stripped, `prompt() in ${f}`).not.toMatch(/\bprompt\s*\(/);
    }
  });

  it("evaluations page is a real Behavioral Support-safe surface, not a Navigate redirect", () => {
    const src = read(`${pagesDir}/BehavioralSupportEvaluations.tsx`);
    expect(src).not.toMatch(/<Navigate\s+to=/);
    expect(src).toMatch(/Behavioral Support Evaluations/);
    expect(src).toMatch(/useBehavioralSupportData/);
  });

  it("CentralReach mapper does not compute supervision ratio from cancellations/rbt hours", () => {
    const src = read("src/lib/integrations/centralreach/behavioralSupportMapper.ts");
    expect(src).not.toMatch(/cancellationsLast30d\s*\)\s*\/\s*Math\.max\(\s*p\.rbtHoursLast30d/);
    expect(src).toMatch(/97155/);
    expect(src).toMatch(/97153/);
    expect(src).toMatch(/computeSupervisionRatio/);
  });

  it("hardening migration exists with CHECK constraints and tightened plan/task SELECT", () => {
    const migDir = resolve(process.cwd(), "supabase/migrations");
    const files = readdirSync(migDir).filter((f) => f.endsWith(".sql"));
    const hits = files
      .map((f) => read(`supabase/migrations/${f}`))
      .filter((sql) =>
        sql.includes("bs_cases_severity_chk") &&
        sql.includes("bs_plans_status_chk") &&
        sql.includes("bs_tasks_status_chk") &&
        sql.includes("bs_fu_status_chk"),
      );
    expect(hits.length, "expected a Behavioral Support hardening migration").toBeGreaterThan(0);
    // The same migration must also tighten bs_plans_select / bs_tasks_select
    // so BCBAs no longer have broad SELECT on all plans/tasks.
    const hardening = hits[0];
    expect(hardening).toMatch(/DROP POLICY IF EXISTS "bs_plans_select"/);
    expect(hardening).toMatch(/DROP POLICY IF EXISTS "bs_tasks_select"/);
    // The new SELECT policies must not grant broad bcba access.
    const newPlanPolicy = hardening.split(/DROP POLICY IF EXISTS "bs_plans_select"[\s\S]*?CREATE POLICY "bs_plans_select"/)[1]?.split(";")[0] ?? "";
    expect(newPlanPolicy).not.toMatch(/'bcba'/);
    const newTaskPolicy = hardening.split(/DROP POLICY IF EXISTS "bs_tasks_select"[\s\S]*?CREATE POLICY "bs_tasks_select"/)[1]?.split(";")[0] ?? "";
    expect(newTaskPolicy).not.toMatch(/'bcba'/);
  });

  it("Behavioral Support menu still exposes exactly one Reports link at /reports", () => {
    const menu = ROLE_MENUS.behavioral_support!;
    const paths = menu.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(paths.filter((p) => p === "/reports").length).toBe(1);
    expect(paths).not.toContain("/behavioral-support/reports");
  });

  it("BCBA Productivity Report remains in the shared reports catalog for behavioral_support", () => {
    const ids = visibleReportsForRole("behavioral_support").map((r) => r.id);
    expect(ids).toContain("bcba-productivity-report-v3");
  });
});

describe("Behavioral Support pass 3 — case workflow, plan edit, task activity, no reload", () => {
  const pagesDir = "src/pages/os/behavioral-support";
  const dash = read(`${pagesDir}/BehavioralSupportDashboard.tsx`);
  const plans = read(`${pagesDir}/BehavioralSupportPlans.tsx`);
  const escalations = read(`${pagesDir}/BehavioralSupportEscalations.tsx`);
  const supervision = read(`${pagesDir}/BehavioralSupportSupervisionVisibility.tsx`);
  const dialogs = read(`${pagesDir}/_dialogs.tsx`);
  const hook = read(`${pagesDir}/useBehavioralSupportData.ts`);

  it("Dashboard exposes a New Case action and imports the case dialog", () => {
    expect(dash).toMatch(/New Case/);
    expect(dash).toMatch(/BehavioralSupportCaseDialog/);
  });

  it("Dashboard calls createCase to persist new cases", () => {
    expect(dash).toMatch(/bs\.createCase\(/);
  });

  it("Dashboard renders a case detail drawer / CaseDetailDrawer component", () => {
    expect(dash).toMatch(/CaseDetailDrawer/);
  });

  it("BehavioralSupportCaseDialog is defined and captures the required case fields", () => {
    expect(dialogs).toMatch(/export function BehavioralSupportCaseDialog/);
    for (const field of [
      "client_name",
      "state",
      "bcba_name",
      "rbt_name",
      "severity",
      "source_system",
      "centralreach_client_id",
      "primary_concern",
      "initial_note",
    ]) {
      expect(dialogs, `case dialog missing ${field}`).toMatch(new RegExp(field));
    }
  });

  it("Plans page has an Edit plan control and calls updatePlan", () => {
    expect(plans).toMatch(/Edit plan/);
    expect(plans).toMatch(/bs\.updatePlan\(/);
  });

  it("useBehavioralSupportData.updatePlanTask logs activity with task_updated / task_completed / task_reopened / task_blocked", () => {
    expect(hook).toMatch(/const updatePlanTask/);
    expect(hook).toMatch(/task_updated/);
    expect(hook).toMatch(/task_completed/);
    expect(hook).toMatch(/task_reopened/);
    expect(hook).toMatch(/task_blocked/);
    // The updatePlanTask body must reach logActivity
    const body = hook.split(/const updatePlanTask\s*=\s*useCallback\(/)[1]?.split(/\n\s*const\s+create/)[0] ?? "";
    expect(body).toMatch(/logActivity\(/);
  });

  it("SupervisionVisibility no longer calls window.location.reload", () => {
    expect(supervision).not.toMatch(/window\.location\.reload/);
    expect(supervision).toMatch(/cr\.refresh\(\)/);
  });

  it("Supervision Visibility surfaces CentralReach source note and flagged counts", () => {
    expect(supervision).toMatch(/CentralReach-derived/);
    expect(supervision).toMatch(/Flagged clients:/);
  });

  it("Escalations page renders a detail drawer", () => {
    expect(escalations).toMatch(/EscalationDetailDrawer/);
  });

  it("Follow-up dialog captures follow-up type, priority, due date, and notes", () => {
    const fu = dialogs.split(/export function BehavioralSupportFollowupDialog/)[1] ?? "";
    expect(fu).toMatch(/Follow-up type/);
    expect(fu).toMatch(/Priority/);
    expect(fu).toMatch(/bs-fu-due/);
    expect(fu).toMatch(/bs-fu-notes/);
  });

  it("Follow-up complete dialog supports outcome, resolved, next-step, next-date, and note", () => {
    const done = dialogs.split(/export function BehavioralSupportFollowupCompleteDialog/)[1]?.split(/export function/)[0] ?? "";
    expect(done).toMatch(/Outcome/);
    expect(done).toMatch(/Resolved/);
    expect(done).toMatch(/Next step needed/);
    expect(done).toMatch(/nextFollowupDueAt/);
  });

  it("Reports remain unified at /reports and no behavioral-support/reports route exists", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/path="\/reports"/);
    expect(app).not.toContain('path="/behavioral-support/reports"');
    const menu = ROLE_MENUS.behavioral_support!;
    const paths = menu.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(paths).not.toContain("/behavioral-support/reports");
  });

  it("No behavioral support page uses browser prompt()", () => {
    for (const file of [dash, plans, escalations, supervision, dialogs]) {
      const stripped = file.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      expect(stripped).not.toMatch(/\bprompt\s*\(/);
    }
  });
});

describe("Behavioral Support final hardening pass — source_system + encoding", () => {
  const pagesDir = "src/pages/os/behavioral-support";
  const dialogs = read(`${pagesDir}/_dialogs.tsx`);
  const caseDialog =
    dialogs.split(/export function BehavioralSupportCaseDialog/)[1]?.split(/export function/)[0] ?? "";

  const ALLOWED_SOURCES = [
    "manual",
    "centralreach",
    "phone",
    "intake",
    "qa",
    "case_manager",
    "bcba",
    "rbt",
    "other",
  ];

  it("BehavioralSupportCaseDialog does not include the invalid 'internal' source", () => {
    expect(caseDialog).not.toMatch(/value="internal"/);
    expect(caseDialog).not.toMatch(/useState\("internal"\)/);
  });

  it("BehavioralSupportCaseDialog does not include the invalid 'monday' source", () => {
    expect(caseDialog).not.toMatch(/value="monday"/i);
  });

  it("BehavioralSupportCaseDialog defaults source_system to 'manual'", () => {
    expect(caseDialog).toMatch(/useState\("manual"\)/);
  });

  it("BehavioralSupportCaseDialog exposes every allowed source_system value", () => {
    for (const v of ALLOWED_SOURCES) {
      expect(caseDialog, `missing source option ${v}`).toMatch(new RegExp(`value="${v}"`));
    }
  });

  it("BehavioralSupportCaseDialog constrains submitted source_system to allowed values", () => {
    expect(caseDialog).toMatch(/ALLOWED_SOURCES/);
    for (const v of ALLOWED_SOURCES) {
      expect(caseDialog).toMatch(new RegExp(`"${v}"`));
    }
  });

  it("Behavioral Support files contain no broken encoded UI characters", () => {
    const broken = ["â€”", "â€¢", "â†’", "âœ•"];
    const files = [
      "BehavioralSupportDashboard.tsx",
      "BehavioralSupportPlans.tsx",
      "BehavioralSupportSupervisionVisibility.tsx",
      "useBehavioralSupportData.ts",
      "_dialogs.tsx",
    ];
    for (const f of files) {
      const src = read(`${pagesDir}/${f}`);
      for (const b of broken) {
        expect(src, `${f} contains broken sequence ${b}`).not.toContain(b);
      }
    }
  });
});