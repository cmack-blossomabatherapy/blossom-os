import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPORTS } from "@/lib/os/reportsCatalog";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { ROLE_PROFILES } from "@/lib/os/permissions";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Clinical Director Pass 3 — Reports stays unified", () => {
  const menu = ROLE_MENUS.clinical_director;
  const allItems = menu.sections.flatMap((s) => s.items);

  it("has exactly one Reports hub menu item pointing to /reports", () => {
    // Reports hub = exact /reports. /reports/* drilldowns (e.g.
    // /reports/progress-reports) are specific report destinations.
    const reportsHub = allItems.filter((i) => i.path === "/reports");
    expect(reportsHub.length).toBe(1);
    expect(reportsHub[0].path).toBe("/reports");
  });

  it("does not mount /clinical/reports", () => {
    const app = read("src/App.tsx");
    expect(app).not.toMatch(/path="\/clinical\/reports"/);
  });

  it("still exposes BCBA Productivity Report V3", () => {
    const visible = REPORTS.filter(
      (r) => r.visibleTo === "all" || (r.visibleTo as readonly string[]).includes("clinical_director"),
    );
    expect(visible.some((r) => r.id === "bcba-productivity-report-v3")).toBe(true);
  });
});

describe("Clinical Director Pass 3 — AI modules removed", () => {
  const profile = ROLE_PROFILES.clinical_director;
  it("has no AI menu items", () => {
    const items = ROLE_MENUS.clinical_director.sections.flatMap((s) => s.items);
    for (const i of items) {
      expect(i.path).not.toMatch(/^\/ai(\/|$)/);
      expect(i.label.toLowerCase()).not.toMatch(/ask blossom|ai assistant/);
    }
  });
  it("does not include ai_assistant or ai_insights in permissions modules", () => {
    expect(profile.modules).not.toContain("ai_assistant");
    expect(profile.modules).not.toContain("ai_insights");
  });
  it("does not claim leadership aiInsights", () => {
    expect(profile.leadership.aiInsights).toBe(false);
  });
});

describe("Clinical Director Pass 3 — Phone System consistency", () => {
  const items = ROLE_MENUS.clinical_director.sections.flatMap((s) => s.items);
  it("has no /phone menu item", () => {
    expect(items.some((i) => i.path === "/phone")).toBe(false);
  });
  it("removes /phone from ROLE_SPECIFIC_LIVE_PATHS.clinical_director", () => {
    const shell = read("src/pages/os/OSShell.tsx");
    const start = shell.indexOf("clinical_director: new Set<string>([");
    const block = shell.slice(start, shell.indexOf("]),", start));
    expect(block).not.toMatch(/"\/phone"/);
  });
  it("removes Phone System from dashboard quick actions", () => {
    const src = read("src/pages/os/clinical/ClinicalDirectorDashboard.tsx");
    expect(src).not.toMatch(/to:\s*"\/phone"/);
    expect(src).not.toMatch(/label:\s*"Phone System"/);
  });
});

describe("Clinical Director Pass 3 — reusable workflow component", () => {
  const panel = read("src/components/clinical/ClinicalWorkItemPanel.tsx");
  const section = read("src/components/clinical/ClinicalDirectorSection.tsx");

  it("ClinicalWorkItemPanel reads via useClinicalDirectorData and writes via useClinicalDirectorActions", () => {
    expect(panel).toMatch(/useClinicalDirectorData/);
    expect(panel).toMatch(/useClinicalDirectorActions/);
  });

  it("ClinicalDirectorSection is role-gated to clinical_director", () => {
    expect(section).toMatch(/useOSRoleSafe/);
    expect(section).toMatch(/clinical_director/);
    expect(section).toMatch(/ClinicalWorkItemPanel/);
  });
});

describe("Clinical Director Pass 3 — every menu page uses the clinical workflow layer", () => {
  const files = {
    "/assigned-bcbas": "src/pages/os/OSQABCBAs.tsx",
    "/supervision-visibility": "src/pages/os/OSQASupervision.tsx",
    "/treatment-plan-reviews": "src/pages/os/OSQATreatmentPlans.tsx",
    "/progress-reports": "src/pages/os/OSQAProgressReports.tsx",
    "/escalations-followups": "src/pages/os/OSQAEscalations.tsx",
    "/evaluations": "src/pages/os/OSEvaluations.tsx",
  } as const;

  for (const [path, file] of Object.entries(files)) {
    it(`${path} mounts the shared Clinical Director workflow surface`, () => {
      const src = read(file);
      expect(src).toMatch(/ClinicalDirectorSection/);
    });
  }

  it("dashboard still uses both clinical hooks", () => {
    const src = read("src/pages/os/clinical/ClinicalDirectorDashboard.tsx");
    expect(src).toMatch(/useClinicalDirectorData/);
    expect(src).toMatch(/useClinicalDirectorActions/);
    expect(src).toMatch(/createWorkItem/);
  });

  it("OSEvaluations remains role-aware (does not break HR)", () => {
    const src = read("src/pages/os/OSEvaluations.tsx");
    expect(src).toMatch(/useOSRole/);
  });
});

describe("Clinical Director Pass 3 — durable action layer", () => {
  const actions = read("src/hooks/useClinicalDirectorActions.ts");
  const data = read("src/hooks/useClinicalDirectorData.ts");

  it("data hook reads clinical_work_items and clinical_activity_log", () => {
    expect(data).toMatch(/clinical_work_items/);
    expect(data).toMatch(/clinical_activity_log/);
  });

  it("actions write to clinical_work_items and clinical_activity_log", () => {
    expect(actions).toMatch(/from\("clinical_work_items"\)/);
    expect(actions).toMatch(/from\("clinical_activity_log"\)/);
  });

  it("actions mirror authorization-linked events into authorization_activity", () => {
    expect(actions).toMatch(/authorization_activity/);
    expect(actions).toMatch(/clinical\.\$\{event_type\}/);
  });
});

describe("Clinical Director Pass 3 — every menu path stays covered", () => {
  it("every clinical_director menu path is in role-specific or staged live paths", () => {
    const shell = read("src/pages/os/OSShell.tsx");
    const start = shell.indexOf("clinical_director: new Set<string>([");
    const roleBlock = shell.slice(start, shell.indexOf("]),", start));
    const stagedStart = shell.indexOf("STAGED_ROLE_LIVE_PATHS: ReadonlySet<string> = new Set([");
    const stagedBlock = shell.slice(stagedStart, shell.indexOf("]);", stagedStart));
    const items = ROLE_MENUS.clinical_director.sections.flatMap((s) => s.items);
    for (const i of items) {
      const covered = roleBlock.includes(`"${i.path}"`) || stagedBlock.includes(`"${i.path}"`);
      expect(covered, `${i.path} must be covered`).toBe(true);
    }
  });
});