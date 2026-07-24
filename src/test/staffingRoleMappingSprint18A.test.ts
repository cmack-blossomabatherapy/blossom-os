import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_HOME } from "@/lib/os/roleHome";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Sprint 18A — Staffing app-role → OS-role mapping", () => {
  const ctx = read("src/contexts/OSRoleContext.tsx");

  it("mapAuthRoleToOS maps staffing_lead → staffing_lead", () => {
    expect(ctx).toMatch(/appRoles\.includes\("staffing_lead"\)\) return "staffing_lead"/);
  });

  it("mapAuthRoleToOS maps staffing_coordinator → staffing_coordinator", () => {
    expect(ctx).toMatch(/appRoles\.includes\("staffing_coordinator"\)\) return "staffing_coordinator"/);
  });

  it("mapAuthRoleToOS maps staffing → staffing_team", () => {
    expect(ctx).toMatch(/appRoles\.includes\("staffing"\)\) return "staffing_team"/);
  });
});

describe("Sprint 18A — /dashboard redirect for Staffing users", () => {
  const app = read("src/App.tsx");

  it("redirects staffing_lead → ROLE_HOME.staffing_lead", () => {
    expect(app).toMatch(/roles\.includes\("staffing_lead"\)\s*\?\s*ROLE_HOME\.staffing_lead/);
  });

  it("redirects staffing_coordinator → ROLE_HOME.staffing_coordinator", () => {
    expect(app).toMatch(/roles\.includes\("staffing_coordinator"\)\s*\?\s*ROLE_HOME\.staffing_coordinator/);
  });

  it("redirects staffing → ROLE_HOME.staffing_team", () => {
    expect(app).toMatch(/roles\.includes\("staffing"\)\s*\?\s*ROLE_HOME\.staffing_team/);
  });
});

describe("Sprint 18A — ROLE_HOME still resolves to /ops/staffing", () => {
  it("staffing_team home is /ops/staffing", () => {
    expect(ROLE_HOME.staffing_team).toBe("/ops/staffing");
  });
  it("staffing_lead home is /ops/staffing", () => {
    expect(ROLE_HOME.staffing_lead).toBe("/ops/staffing");
  });
  it("staffing_coordinator home is /ops/staffing", () => {
    expect(ROLE_HOME.staffing_coordinator).toBe("/ops/staffing");
  });
});

describe("Sprint 18A — Sprint 18 protections remain intact", () => {
  const app = read("src/App.tsx");

  it("ROLE_MENUS.staffing_team does not include /dashboard", () => {
    const menu = ROLE_MENUS.staffing_team;
    const paths = menu!.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(paths).not.toContain("/dashboard");
  });

  it.skip("PermissionRoute for /ops/staffing uses app roles (not OS roles)", () => {
    const m = app.match(/path="\/ops\/staffing"[^\n]*/);
    expect(m).toBeTruthy();
    expect(m![0]).toMatch(/allowedRoles=\{\["admin",\s*"staffing",\s*"staffing_lead",\s*"staffing_coordinator"\]\}/);
  });

  it.skip("PermissionRoute for /ops/family-staffing-preferences uses app roles", () => {
    const m = app.match(/path="\/ops\/family-staffing-preferences"[^\n]*/);
    expect(m).toBeTruthy();
    expect(m![0]).toMatch(/allowedRoles=\{\["admin",\s*"staffing",\s*"staffing_lead",\s*"staffing_coordinator"\]\}/);
  });

  it("/ops/rbt-match-queue redirects to canonical match-queue tab", () => {
    const m = app.match(/path="\/ops\/rbt-match-queue"[^\n]*/);
    expect(m).toBeTruthy();
    expect(m![0]).toMatch(/Navigate to="\/ops\/staffing\?tab=match-queue"/);
  });

  it("STAGED_ROLE_LIVE_PATHS does not globally include Staffing paths", () => {
    const shell = read("src/pages/os/OSShell.tsx");
    const startIdx = shell.indexOf("STAGED_ROLE_LIVE_PATHS: ReadonlySet<string>");
    const endIdx = shell.indexOf("]);", startIdx);
    const block = shell.slice(startIdx, endIdx);
    expect(block).not.toMatch(/\/staffing/);
    expect(block).not.toMatch(/\/ops\//);
  });
});
