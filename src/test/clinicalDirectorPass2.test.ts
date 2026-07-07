import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPORTS } from "@/lib/os/reportsCatalog";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Clinical Director Pass 2 — menu shape", () => {
  const menu = ROLE_MENUS.clinical_director;

  it("has a Clinical Director menu with sections", () => {
    expect(menu).toBeTruthy();
    expect(menu.sections.length).toBeGreaterThan(0);
  });

  const allItems = () =>
    menu.sections.flatMap((s) => s.items).filter((i) => typeof i.path === "string");

  it("has exactly one Reports hub menu item and it points to /reports", () => {
    // Reports hub = exact path /reports. Deep-linked drilldowns under
    // /reports/* (e.g. /reports/progress-reports) are specific report
    // destinations, not the unified Reports hub entry.
    const reportsHub = allItems().filter((i) => i.path === "/reports");
    expect(reportsHub.length).toBe(1);
    expect(reportsHub[0].path).toBe("/reports");
  });

  it("has no AI assistant items in the Clinical Director menu", () => {
    for (const item of allItems()) {
      expect(item.path).not.toMatch(/^\/ai(\/|$)/);
      expect(item.label.toLowerCase()).not.toMatch(/ask blossom|ai assistant/);
    }
  });

  it("has no coming-soon or dead links", () => {
    for (const item of allItems()) {
      expect(item.path).not.toMatch(/coming-soon/);
    }
  });

  it("every Clinical Director menu path is present in ROLE_SPECIFIC_LIVE_PATHS", () => {
    const shell = read("src/pages/os/OSShell.tsx");
    const start = shell.indexOf("clinical_director: new Set<string>([");
    expect(start).toBeGreaterThan(-1);
    const roleBlock = shell.slice(start, shell.indexOf("]),", start));
    const stagedStart = shell.indexOf("STAGED_ROLE_LIVE_PATHS: ReadonlySet<string> = new Set([");
    const stagedBlock = shell.slice(stagedStart, shell.indexOf("]);", stagedStart));
    for (const item of allItems()) {
      const covered =
        roleBlock.includes(`"${item.path}"`) || stagedBlock.includes(`"${item.path}"`);
      expect(covered, `Menu path ${item.path} must be in role-specific or staged live paths`).toBe(true);
    }
  });
});

describe("Clinical Director Pass 2 — Reports visibility", () => {
  const visible = REPORTS.filter(
    (r) => r.visibleTo === "all" || (r.visibleTo as readonly string[]).includes("clinical_director"),
  );
  const ids = new Set(visible.map((r) => r.id));

  it.each([
    "bcba-productivity-report-v3",
    "bcba-performance",
    "caseload",
    "qa-supervision",
    "qa-parent-training",
    "auth-utilization",
    "qa-performance",
    "progress-trends",
  ])("Clinical Director can see report %s", (id) => {
    expect(ids.has(id)).toBe(true);
  });
});

describe("Clinical Director Pass 2 — no separate reports page", () => {
  const app = read("src/App.tsx");
  it("does not mount /clinical/reports", () => {
    expect(app).not.toMatch(/path="\/clinical\/reports"/);
  });
});

describe("Clinical Director Pass 2 — role naming safety", () => {
  const ctx = read("src/contexts/OSRoleContext.tsx");

  it("maps clinical_director, clinic_director, and clinical_lead DB roles to OS clinical_director", () => {
    // The mapping uses the string-based `has` helper so the AppRole type union
    // does not need to trail the DB enum. All three aliases must be handled.
    expect(ctx).toMatch(/has\("clinical_director"\)/);
    expect(ctx).toMatch(/has\("clinic_director"\)/);
    expect(ctx).toMatch(/has\("clinical_lead"\)/);
  });
});

describe("Clinical Director Pass 2 — dashboard composition", () => {
  const src = read("src/pages/os/clinical/ClinicalDirectorDashboard.tsx");
  it("uses useCentralReachOps and useLiveAuthorizations", () => {
    expect(src).toMatch(/useCentralReachOps/);
    expect(src).toMatch(/useLiveAuthorizations/);
  });
  it("uses the Clinical Director data + actions hooks", () => {
    expect(src).toMatch(/useClinicalDirectorData/);
    expect(src).toMatch(/useClinicalDirectorActions/);
  });
  it("exposes a Create Work Item quick action", () => {
    expect(src).toMatch(/New Work Item/);
    expect(src).toMatch(/createWorkItem/);
  });
});

describe("Clinical Director Pass 2 — hooks safety", () => {
  const actions = read("src/hooks/useClinicalDirectorActions.ts");
  it("mirrors auth-linked activity into the existing authorization activity trail", () => {
    expect(actions).toMatch(/authorization_activity/);
    expect(actions).toMatch(/clinical\.\$\{event_type\}/);
  });
  it("writes every mutation into clinical_activity_log", () => {
    expect(actions).toMatch(/clinical_activity_log/);
  });
});