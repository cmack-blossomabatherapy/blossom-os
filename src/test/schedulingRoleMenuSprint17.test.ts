import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { ROLE_HOME } from "@/lib/os/roleHome";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

const REQUIRED_PATHS = [
  "/scheduling",
  "/scheduling-workspace",
  "/scheduling/rbts",
  "/scheduling/bcbas",
  "/hr/orientation-queue",
  "/scheduling/resources",
  "/reports/cancellation-command-center",
  "/ops/make-up-sessions",
  "/reports",
  "/academy",
  "/resource-library",
];

describe("Sprint 17 — Scheduling Team live menu", () => {
  const menu = ROLE_MENUS.scheduling_team;

  it("menu exposes every required Scheduling path", () => {
    expect(menu).toBeDefined();
    const paths = menu!.sections.flatMap((s) => s.items.map((i) => i.path));
    for (const p of REQUIRED_PATHS) {
      expect(paths).toContain(p);
    }
  });

  it("menu does NOT include generic /dashboard item", () => {
    const paths = menu!.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(paths).not.toContain("/dashboard");
  });

  it("Scheduling role home is /scheduling", () => {
    expect(ROLE_HOME.scheduling_team).toBe("/scheduling");
    expect(ROLE_HOME.scheduling_lead).toBe("/scheduling");
    expect(ROLE_HOME.scheduling_coordinator).toBe("/scheduling");
  });

  it("scheduling_team block no longer uses DASHBOARD_ITEM", () => {
    const src = read("src/lib/os/roleMenus.ts");
    const start = src.indexOf("scheduling_team: {");
    const end = src.indexOf("/* ", start + 1);
    const block = src.slice(start, end);
    expect(block).not.toMatch(/DASHBOARD_ITEM/);
  });
});

describe("Sprint 17 — OSShell role-specific live paths", () => {
  const shell = read("src/pages/os/OSShell.tsx");

  it("declares scheduling_team, scheduling_lead, scheduling_coordinator live paths", () => {
    expect(shell).toMatch(/scheduling_team:\s*new Set/);
    expect(shell).toMatch(/scheduling_lead:\s*new Set/);
    expect(shell).toMatch(/scheduling_coordinator:\s*new Set/);
    for (const p of [
      "/scheduling",
      "/scheduling-workspace",
      "/scheduling/rbts",
      "/scheduling/bcbas",
      "/hr/orientation-queue",
      "/scheduling/resources",
      "/reports/cancellation-command-center",
      "/ops/make-up-sessions",
      "/reports",
    ]) {
      expect(shell).toContain(`"${p}"`);
    }
  });

  it("intake + authorizations role-specific paths still exist", () => {
    expect(shell).toMatch(/intake_coordinator:\s*new Set/);
    expect(shell).toMatch(/authorization_coordinator:\s*new Set/);
  });

  it("does NOT add scheduling paths to global STAGED_ROLE_LIVE_PATHS", () => {
    const startIdx = shell.indexOf("STAGED_ROLE_LIVE_PATHS: ReadonlySet<string>");
    const endIdx = shell.indexOf("]);", startIdx);
    const block = shell.slice(startIdx, endIdx);
    expect(block).not.toMatch(/\/scheduling/);
    expect(block).not.toMatch(/\/ops\//);
  });
});

describe("Sprint 17 — App.tsx mounts Scheduling routes", () => {
  const app = read("src/App.tsx");
  it.each(REQUIRED_PATHS)("mounts %s", (path) => {
    expect(app).toContain(`path="${path}"`);
  });

  it("/ops/scheduling is a back-compat redirect to /scheduling-workspace", () => {
    const m = app.match(/path="\/ops\/scheduling"[^\n]*/);
    expect(m).toBeTruthy();
    expect(m![0]).toMatch(/Navigate to="\/scheduling-workspace/);
  });

  it("/ops/make-up-sessions is wrapped in OSShellPage", () => {
    const m = app.match(/path="\/ops\/make-up-sessions"[^\n]*/);
    expect(m).toBeTruthy();
    expect(m![0]).toMatch(/OSShellPage/);
  });
});

describe("Sprint 17 — protected surfaces still mounted", () => {
  const app = read("src/App.tsx");
  it.each([
    "/training",
    "/academy",
    "/resource-library",
    "/reports",
    "/reports/bcba-productivity-report-v3",
    "/system/bcba-productivity-uploads",
    "/user-logins-vault",
    "/admin/login-vault",
    "/nfc-badges",
    "/evaluations",
  ])("App.tsx still mounts %s", (path) => {
    expect(app).toContain(`path="${path}"`);
  });
});