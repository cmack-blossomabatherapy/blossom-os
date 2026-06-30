import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { ROLE_HOME } from "@/lib/os/roleHome";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

/**
 * Pass 2 — canonical Staffing workspace paths.
 * `/staffing`, `/ops/rbt-match-queue`, and `/ops/family-staffing-preferences`
 * are now redirects, not menu destinations.
 */
const REQUIRED_PATHS = [
  "/ops/staffing",
  "/ops/staffing?tab=open-cases",
  "/ops/staffing?tab=match-queue",
  "/ops/staffing?tab=coverage",
  "/ops/staffing?tab=preferences",
  "/ops/staffing?tab=map",
  "/ops/staffing?tab=apploi",
  "/reports",
  "/academy",
  "/resource-library",
];

describe("Sprint 18 — Staffing Team live menu", () => {
  const menu = ROLE_MENUS.staffing_team;

  it("menu exposes every required Staffing path", () => {
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

  it("Staffing role home is /ops/staffing", () => {
    expect(ROLE_HOME.staffing_team).toBe("/ops/staffing");
    expect(ROLE_HOME.staffing_lead).toBe("/ops/staffing");
    expect(ROLE_HOME.staffing_coordinator).toBe("/ops/staffing");
  });

  it("staffing_team block no longer uses DASHBOARD_ITEM", () => {
    const src = read("src/lib/os/roleMenus.ts");
    const start = src.indexOf("staffing_team: {");
    const end = src.indexOf("/* ", start + 1);
    const block = src.slice(start, end);
    expect(block).not.toMatch(/DASHBOARD_ITEM/);
  });
});

describe("Sprint 18 — OSShell role-specific live paths", () => {
  const shell = read("src/pages/os/OSShell.tsx");

  it("declares staffing_team, staffing_lead, staffing_coordinator live paths", () => {
    expect(shell).toMatch(/staffing_team:\s*new Set/);
    expect(shell).toMatch(/staffing_lead:\s*new Set/);
    expect(shell).toMatch(/staffing_coordinator:\s*new Set/);
    // canonical workspace path must be allowed for these roles
    expect(shell).toContain('"/ops/staffing"');
  });

  it("intake + authorizations + scheduling role-specific paths still exist", () => {
    expect(shell).toMatch(/intake_coordinator:\s*new Set/);
    expect(shell).toMatch(/authorization_coordinator:\s*new Set/);
    expect(shell).toMatch(/scheduling_team:\s*new Set/);
  });

  it("does NOT add staffing paths to global STAGED_ROLE_LIVE_PATHS", () => {
    const startIdx = shell.indexOf("STAGED_ROLE_LIVE_PATHS: ReadonlySet<string>");
    const endIdx = shell.indexOf("]);", startIdx);
    const block = shell.slice(startIdx, endIdx);
    expect(block).not.toMatch(/\/staffing/);
    expect(block).not.toMatch(/\/ops\//);
  });
});

describe("Sprint 18 — App.tsx mounts Staffing routes", () => {
  const app = read("src/App.tsx");
  // Only test base routes, not query-string variants
  it.each(["/ops/staffing", "/reports", "/academy", "/resource-library"])(
    "mounts %s",
    (path) => {
      expect(app).toContain(`path="${path}"`);
    },
  );

  it("/ops/staffing is NOT AdminRoute-only", () => {
    const m = app.match(/path="\/ops\/staffing"[^\n]*/);
    expect(m).toBeTruthy();
    expect(m![0]).not.toMatch(/<AdminRoute>/);
    expect(m![0]).toMatch(/PermissionRoute/);
  });

  it("/ops/family-staffing-preferences is NOT AdminRoute-only", () => {
    const m = app.match(/path="\/ops\/family-staffing-preferences"[^\n]*/);
    expect(m).toBeTruthy();
    expect(m![0]).not.toMatch(/<AdminRoute>/);
    expect(m![0]).toMatch(/PermissionRoute/);
  });

  it("/ops/rbt-match-queue redirects to /ops/staffing?tab=match-queue", () => {
    const m = app.match(/path="\/ops\/rbt-match-queue"[^\n]*/);
    expect(m).toBeTruthy();
    expect(m![0]).toMatch(/Navigate to="\/ops\/staffing\?tab=match-queue"/);
  });
});

describe("Sprint 18 — protected surfaces still mounted", () => {
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