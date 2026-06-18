import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { ROLE_HOME } from "@/lib/os/roleHome";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const RECRUITING_PATHS = [
  "/recruiting-team",
  "/recruiting/workspace",
  "/recruiting/pipeline",
  "/recruiting/interviews",
  "/recruiting/offers",
  "/recruiting/onboarding",
  "/recruiting/background",
  "/recruiting/orientation",
  "/recruiting/staffing-needs",
  "/recruiting/rbt",
  "/recruiting/bcba",
  "/recruiting/performance",
  "/recruiting/follow-ups",
  "/recruiting/messages",
  "/recruiting/escalations",
  "/recruiting/resources",
  "/reports/hr-recruiting-pipeline",
  "/reports",
  "/academy",
  "/resource-library",
];

function menuPaths(role: string): string[] {
  const menu = (ROLE_MENUS as Record<string, { sections: { items: { path: string }[] }[] }>)[role];
  return menu.sections.flatMap((s) => s.items.map((i) => i.path));
}

describe("Sprint 20 — Recruiting Team menu & routing", () => {
  const shell = read("src/pages/os/OSShell.tsx");
  const ctx = read("src/contexts/OSRoleContext.tsx");
  const app = read("src/App.tsx");

  it("Recruiting Team menu exposes every required Recruiting path", () => {
    const paths = menuPaths("recruiting_team");
    for (const p of RECRUITING_PATHS) expect(paths).toContain(p);
  });

  it("Recruiting Team menu does not include the generic /dashboard", () => {
    expect(menuPaths("recruiting_team")).not.toContain("/dashboard");
  });

  it("All Recruiting role homes resolve to /recruiting-team", () => {
    expect(ROLE_HOME.recruiting_team).toBe("/recruiting-team");
    expect(ROLE_HOME.recruiting_lead).toBe("/recruiting-team");
    expect(ROLE_HOME.recruiting_coordinator).toBe("/recruiting-team");
  });

  it("OSShell declares role-specific live paths for every Recruiting OS role", () => {
    for (const role of ["recruiting_team", "recruiting_lead", "recruiting_coordinator"]) {
      expect(shell).toMatch(new RegExp(`${role}:\\s*new Set<string>`));
    }
    // Each role set contains the dashboard path.
    for (const role of ["recruiting_team", "recruiting_lead", "recruiting_coordinator"]) {
      const block = shell.split(`${role}: new Set<string>`)[1].split("]),")[0];
      expect(block).toContain('"/recruiting-team"');
      expect(block).toContain('"/recruiting/workspace"');
      expect(block).toContain('"/reports/hr-recruiting-pipeline"');
    }
  });

  it("STAGED_ROLE_LIVE_PATHS does not globally include Recruiting-specific paths", () => {
    const staged = shell.split("STAGED_ROLE_LIVE_PATHS")[1].split("]")[0];
    expect(staged).not.toContain('"/recruiting-team"');
    expect(staged).not.toContain('"/recruiting/workspace"');
    expect(staged).not.toContain('"/reports/hr-recruiting-pipeline"');
  });

  it("OSRoleContext maps Recruiting app roles to the correct OS roles", () => {
    expect(ctx).toMatch(/recruiting_lead.*return "recruiting_lead"/s);
    expect(ctx).toMatch(/recruiting_coordinator.*return "recruiting_coordinator"/s);
    expect(ctx).toMatch(/recruiting_assistant.*return "recruiting_team"/s);
  });

  it("App.tsx dashboard redirect maps every Recruiting app role", () => {
    expect(app).toMatch(/roles\.includes\("recruiting_lead"\) \? ROLE_HOME\.recruiting_lead/);
    expect(app).toMatch(/roles\.includes\("recruiting_coordinator"\) \? ROLE_HOME\.recruiting_coordinator/);
    expect(app).toMatch(/roles\.includes\("recruiting_assistant"\) \? ROLE_HOME\.recruiting_team/);
  });

  it("Every Recruiting OS route remains mounted in App.tsx", () => {
    const routes = [
      "/recruiting-team",
      "/recruiting/workspace",
      "/recruiting/academy",
      "/recruiting/pipeline",
      "/recruiting/interviews",
      "/recruiting/offers",
      "/recruiting/onboarding",
      "/recruiting/background",
      "/recruiting/orientation",
      "/recruiting/staffing-needs",
      "/recruiting/rbt",
      "/recruiting/bcba",
      "/recruiting/performance",
      "/recruiting/follow-ups",
      "/recruiting/messages",
      "/recruiting/escalations",
      "/recruiting/resources",
      "/reports/hr-recruiting-pipeline",
    ];
    for (const r of routes) expect(app).toContain(`path="${r}"`);
  });

  it("Prior sprint role-specific live paths still exist", () => {
    for (const role of [
      "intake_coordinator",
      "authorization_coordinator",
      "scheduling_team",
      "staffing_team",
      "qa_team",
    ]) {
      expect(shell).toMatch(new RegExp(`${role}:\\s*new Set<string>`));
    }
  });

  it("Protected surfaces remain mounted in App.tsx", () => {
    for (const r of [
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
      "/phone",
    ]) {
      expect(app).toContain(`path="${r}"`);
    }
  });
});