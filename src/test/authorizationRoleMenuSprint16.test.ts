import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { ROLE_HOME } from "@/lib/os/roleHome";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

const REQUIRED_AUTH_PATHS = [
  "/authorizations",
  "/auth-workspace",
  "/ops/approved-authorizations",
  "/ops/expiring-authorizations",
  "/ops/denials",
  "/ops/missing-docs",
  "/ops/payer-requirements",
  "/reports",
  "/academy",
  "/resource-library",
];

describe("Sprint 16 — Authorizations Team live menu", () => {
  const menu = ROLE_MENUS.authorization_coordinator;

  it("menu exposes every required Authorizations path", () => {
    expect(menu).toBeDefined();
    const paths = menu!.sections.flatMap((s) => s.items.map((i) => i.path));
    for (const p of REQUIRED_AUTH_PATHS) {
      expect(paths).toContain(p);
    }
  });

  it("menu does NOT include generic /dashboard item", () => {
    const paths = menu!.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(paths).not.toContain("/dashboard");
  });

  it("Authorizations role home is /authorizations", () => {
    expect(ROLE_HOME.authorization_coordinator).toBe("/authorizations");
    expect(ROLE_HOME.authorization_manager).toBe("/authorizations");
  });

  it("authorization_coordinator block no longer uses DASHBOARD_ITEM", () => {
    const src = read("src/lib/os/roleMenus.ts");
    const start = src.indexOf("authorization_coordinator: {");
    const end = src.indexOf("/* ", start + 1);
    const block = src.slice(start, end);
    expect(block).not.toMatch(/DASHBOARD_ITEM/);
  });
});

describe("Sprint 16 — OSShell role-specific live paths", () => {
  const shell = read("src/pages/os/OSShell.tsx");

  it("declares authorization_coordinator role-specific live paths", () => {
    expect(shell).toMatch(/authorization_coordinator:\s*new Set/);
    for (const p of [
      "/authorizations",
      "/auth-workspace",
      "/ops/approved-authorizations",
      "/ops/expiring-authorizations",
      "/ops/denials",
      "/ops/missing-docs",
      "/ops/payer-requirements",
    ]) {
      expect(shell).toContain(`"${p}"`);
    }
  });

  it("intake role-specific paths still exist", () => {
    expect(shell).toMatch(/intake_coordinator:\s*new Set/);
  });

  it("does NOT add authorization paths to global STAGED_ROLE_LIVE_PATHS", () => {
    const startIdx = shell.indexOf("STAGED_ROLE_LIVE_PATHS: ReadonlySet<string>");
    const endIdx = shell.indexOf("]);", startIdx);
    const block = shell.slice(startIdx, endIdx);
    expect(block).not.toMatch(/\/authorizations/);
    expect(block).not.toMatch(/\/auth-workspace/);
    expect(block).not.toMatch(/\/ops\//);
  });
});

describe("Sprint 16 — App.tsx mounts Authorizations routes", () => {
  const app = read("src/App.tsx");
  it.each(REQUIRED_AUTH_PATHS)("mounts %s", (path) => {
    expect(app).toContain(`path="${path}"`);
  });

  it("/ops/approved-authorizations is NOT AdminRoute-only", () => {
    const m = app.match(/path="\/ops\/approved-authorizations"[^\n]*/);
    expect(m).toBeTruthy();
    expect(m![0]).not.toMatch(/<AdminRoute>/);
    expect(m![0]).toMatch(/PermissionRoute/);
  });

  it("/ops/denials is NOT AdminRoute-only", () => {
    const m = app.match(/path="\/ops\/denials"[^\n]*/);
    expect(m).toBeTruthy();
    expect(m![0]).not.toMatch(/<AdminRoute>/);
    expect(m![0]).toMatch(/PermissionRoute/);
  });

  it.each(["/ops/expiring-authorizations", "/ops/missing-docs", "/ops/payer-requirements"])(
    "%s is wrapped in OSShellPage",
    (path) => {
      const m = app.match(new RegExp(`path="${path.replace(/\//g, "\\/")}"[^\\n]*`));
      expect(m).toBeTruthy();
      expect(m![0]).toMatch(/OSShellPage/);
    },
  );
});

describe("Sprint 16 — protected surfaces still mounted", () => {
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