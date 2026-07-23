import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { ROLE_HOME } from "@/lib/os/roleHome";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Sprint 15 — Intake Team live menu", () => {
  const intake = ROLE_MENUS.intake_coordinator;

  it("Intake menu exposes every required Intake path", () => {
    expect(intake).toBeDefined();
    const paths = intake!.sections.flatMap((s) => s.items.map((i) => i.path));
    for (const p of [
      "/intake/dashboard",
      "/intake/tasks",
      "/leads",
      "/intake/missing-information",
      "/phone/ai-calls",
      "/intake/cr-packet-prep",
    ]) {
      expect(paths).toContain(p);
    }
    // Export 81 — Patient Lifetime Journey is Marketing/Admin only and must
    // no longer appear in the Intake menu.
    expect(paths).not.toContain("/patient-journey");
    // Intake simplification pass — removed operator-facing entries:
    for (const p of [
      "/intake/lead-to-active",
      "/intake/parent-communication",
      "/intake/benefits-cheat-sheets",
      "/leads?view=pipeline",
    ]) {
      expect(paths).not.toContain(p);
    }
  });

  it("Intake menu order: Dashboard, Tasks, then Leads", () => {
    const paths = intake!.sections
      .find((s) => s.id === "intake")!
      .items.map((i) => i.path);
    expect(paths[0]).toBe("/intake/dashboard");
    expect(paths[1]).toBe("/intake/tasks");
    expect(paths[2]).toBe("/leads");
  });

  it("Intake menu does NOT include the generic /dashboard item", () => {
    const paths = intake!.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(paths).not.toContain("/dashboard");
  });

  it("Intake role home is /intake/dashboard", () => {
    expect(ROLE_HOME.intake_coordinator).toBe("/intake/dashboard");
    expect(ROLE_HOME.intake_lead).toBe("/intake/dashboard");
  });

  it("Intake Team menu definition no longer uses DASHBOARD_ITEM", () => {
    const src = read("src/lib/os/roleMenus.ts");
    const start = src.indexOf("intake_coordinator: {");
    const end = src.indexOf("/* ", start + 1);
    const block = src.slice(start, end);
    expect(block).not.toMatch(/DASHBOARD_ITEM/);
  });
});

describe("Sprint 15 — OSShell role-specific live paths", () => {
  const shell = read("src/pages/os/OSShell.tsx");

  it("declares ROLE_SPECIFIC_LIVE_PATHS with intake_coordinator entries", () => {
    expect(shell).toMatch(/ROLE_SPECIFIC_LIVE_PATHS/);
    expect(shell).toMatch(/intake_coordinator:\s*new Set/);
    for (const p of [
      "/intake/dashboard",
      "/intake/missing-information",
      "/intake/tasks",
      "/leads",
    ]) {
      expect(shell).toContain(`"${p}"`);
    }
    // Export 81/82 — Patient Lifetime Journey must not appear inside the
    // intake_coordinator live-path block.
    const start = shell.indexOf("intake_coordinator: new Set");
    const end = shell.indexOf("])", start);
    const block = shell.slice(start, end);
    expect(block).not.toMatch(/\/patient-journey/);
    // Retired intake surfaces should no longer be listed as live for intake:
    expect(block).not.toMatch(/\/intake\/lead-to-active/);
    expect(block).not.toMatch(/\/intake\/parent-communication/);
    expect(block).not.toMatch(/\/intake\/benefits-cheat-sheets/);
  });

  it("uses isPathLiveForRole instead of bare STAGED_ROLE_LIVE_PATHS.has for menu gating", () => {
    expect(shell).toMatch(/isPathLiveForRole\(role, basePath\)/);
  });

  it("does NOT add intake paths to the global STAGED_ROLE_LIVE_PATHS set", () => {
    const startIdx = shell.indexOf("STAGED_ROLE_LIVE_PATHS: ReadonlySet<string>");
    const endIdx = shell.indexOf("]);", startIdx);
    const block = shell.slice(startIdx, endIdx);
    expect(block).not.toMatch(/\/intake\//);
    expect(block).not.toMatch(/\/patient-journey/);
    expect(block).not.toMatch(/\/leads/);
  });
});

describe("Sprint 15 — App.tsx mounts Intake routes", () => {
  const app = read("src/App.tsx");
  it.each([
    "/intake/dashboard",
    "/intake/lead-to-active",
    "/intake/missing-information",
    "/intake/parent-communication",
    "/intake/tasks",
    "/intake/benefits-cheat-sheets",
    "/patient-journey",
    "/leads",
  ])("mounts %s", (path) => {
    expect(app).toContain(`path="${path}"`);
  });
});

describe("Sprint 15 — Intake pages canonicalize lead deep links + use LeadActionPanel", () => {
  const files = [
    "src/pages/os/intake/IntakeDashboard.tsx",
    "src/pages/os/intake/LeadToActivePipeline.tsx",
    "src/pages/os/intake/MissingInformation.tsx",
    "src/pages/os/intake/ParentCommunication.tsx",
    "src/pages/os/intake/IntakeTasks.tsx",
  ];

  it("no Intake page uses legacy patient-journey?lead= pattern", () => {
    for (const f of files) {
      const src = read(f);
      expect(src).not.toMatch(/patient-journey\?lead=/);
    }
  });

  it("at least one Intake page imports LeadActionPanel", () => {
    const anyImports = files.some((f) => /LeadActionPanel/.test(read(f)));
    expect(anyImports).toBe(true);
  });
});

describe("Sprint 15 — protected surfaces still mounted", () => {
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