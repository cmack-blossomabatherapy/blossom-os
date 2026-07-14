import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Export 82 — /patient-journey access", () => {
  const app = read("src/App.tsx");
  const match = app.match(/path="\/patient-journey"[^]*?<\/PermissionRoute>/);

  it("is wrapped in PermissionRoute (not BlockIntakeRoute)", () => {
    expect(match).not.toBeNull();
    expect(match![0]).toMatch(/PermissionRoute/);
    expect(match![0]).not.toMatch(/BlockIntakeRoute/);
  });

  it("allow-list is Marketing-only (Pass 100: BD removed)", () => {
    const block = match![0];
    // Route uses spread of MARKETING_ROLES constant; assert on that + BD absence.
    expect(block).toMatch(/MARKETING_ROLES\b/);
    expect(block).not.toMatch(/MARKETING_ROLES_WITH_BD/);
    expect(block).not.toMatch(/"business_development"/);
  });
});

describe("Export 82 — role menus only expose Patient Lifetime Journey to allowed roles", () => {
  const allowed = new Set([
    "marketing",
    "marketing_team",
    "marketing_growth_lead",
    "admin",
    "super_admin",
  ]);

  it("no other role menu lists /patient-journey", () => {
    for (const [key, menu] of Object.entries(ROLE_MENUS)) {
      if (!menu) continue;
      const paths = menu.sections.flatMap((s) => s.items.map((i) => i.path));
      if (paths.includes("/patient-journey") && !allowed.has(key)) {
        throw new Error(`Patient Lifetime Journey leaked into role menu: ${key}`);
      }
    }
  });

  it("intake_coordinator menu does not contain /patient-journey", () => {
    const paths = ROLE_MENUS.intake_coordinator!.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(paths).not.toContain("/patient-journey");
  });

  it("marketing menus contain /patient-journey (Pass 100: BD menu no longer lists it)", () => {
    for (const r of ["marketing_team", "marketing_growth_lead"] as const) {
      const paths = ROLE_MENUS[r]!.sections.flatMap((s) => s.items.map((i) => i.path));
      expect(paths).toContain("/patient-journey");
    }
    const bdPaths = ROLE_MENUS.business_development!.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(bdPaths).not.toContain("/patient-journey");
  });
});

describe("Export 82 — OSShell live paths do not expose /patient-journey to Intake or staged roles", () => {
  const shell = read("src/pages/os/OSShell.tsx");

  it("STAGED_ROLE_LIVE_PATHS does not include /patient-journey", () => {
    const start = shell.indexOf("STAGED_ROLE_LIVE_PATHS");
    const end = shell.indexOf("]);", start);
    const block = shell.slice(start, end);
    expect(block).not.toMatch(/\/patient-journey/);
  });

  it("intake_coordinator live-path set does not include /patient-journey", () => {
    const start = shell.indexOf("intake_coordinator: new Set");
    const end = shell.indexOf("])", start);
    const block = shell.slice(start, end);
    expect(block).not.toMatch(/\/patient-journey/);
  });
});

describe("Export 82 — Lead to Ready-to-Start naming polish", () => {
  it("MissingInformation uses 'Open Ready-to-Start Pipeline'", () => {
    const src = read("src/pages/os/intake/MissingInformation.tsx");
    expect(src).toContain("Open Ready-to-Start Pipeline");
    expect(src).not.toContain("Open Lead-to-Active");
  });

  it("academyData uses canonical pipeline name", () => {
    const src = read("src/lib/training/academyData.ts");
    expect(src).not.toMatch(/"Lead To Active Pipeline"/);
    expect(src).toMatch(/Lead to Ready-to-Start Pipeline/);
  });

  it("moduleRegistry uses canonical pipeline + conversion names", () => {
    const src = read("src/lib/os/moduleRegistry.ts");
    expect(src).not.toMatch(/Lead To Active Pipeline/);
    expect(src).not.toMatch(/Lead To Active Conversion/);
    expect(src).toMatch(/Lead to Ready-to-Start Pipeline/);
    expect(src).toMatch(/Lead to Ready-to-Start Conversion/);
  });

  it("no user-facing source uses legacy 'Open Lead-to-Active' label", () => {
    const candidates = [
      "src/pages/os/intake/MissingInformation.tsx",
      "src/pages/os/intake/IntakeDashboard.tsx",
      "src/components/intake/LeadActionPanel.tsx",
      "src/pages/os/OSShell.tsx",
      "src/components/layout/AppSidebar.tsx",
      "src/lib/os/roleMenus.ts",
    ];
    for (const f of candidates) {
      expect(read(f), `${f} still uses 'Open Lead-to-Active'`).not.toContain("Open Lead-to-Active");
    }
  });
});
