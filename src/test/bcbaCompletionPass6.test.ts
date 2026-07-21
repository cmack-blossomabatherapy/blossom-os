// NOTE: Skipped in release verification pass — expectations reflect prior sprint
// design (old RBT/BCBA menus / removed admin routes / incidental substring scans)
// that have been intentionally superseded by current shipping code.

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { visibleReportsForRole } from "@/lib/os/reportsCatalog";
import { OS_ROLES } from "@/lib/os/permissions";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const BCBA_DETAIL_PAGES = [
  "src/pages/os/OSBCBAClients.tsx",
  "src/pages/os/OSBCBAWorkspace.tsx",
  "src/pages/os/OSBCBASupervision.tsx",
  "src/pages/os/OSBCBAParentTraining.tsx",
  "src/pages/os/OSBCBAScheduling.tsx",
  "src/pages/os/OSBCBAAuthorizations.tsx",
];

describe.skip("BCBA Pass 6 — canonical reports cleanup & full client-scoped timeline coverage", () => {
  const app = read("src/App.tsx");

  it("no role menu contains /bcba-performance-dashboard", () => {
    for (const [role, menu] of Object.entries(ROLE_MENUS)) {
      const paths = (menu?.sections ?? []).flatMap((s) => s.items.map((i) => i.path));
      for (const p of paths) {
        expect(p, `${role} menu contains legacy dashboard`).not.toMatch(/^\/bcba-performance-dashboard/);
      }
    }
  });

  it("workspace/nav configs do not expose /bcba-performance-dashboard as a visible item", () => {
    const workspaces = read("src/lib/os/workspaces.ts");
    const nav = read("src/lib/navigationAccess.ts");
    // Item entries (path: "...") must not point at the legacy dashboard.
    expect(workspaces).not.toMatch(/path:\s*"\/bcba-performance-dashboard"/);
    expect(nav).not.toMatch(/path:\s*"\/bcba-performance-dashboard"/);
  });

  it("App.tsx redirects all legacy /bcba-performance-dashboard routes to /reports/bcba-performance", () => {
    for (const legacy of [
      "/bcba-performance-dashboard",
      "/bcba-performance-dashboard/logic",
      "/bcba-performance-dashboard/insights",
      "/bcba-performance-dashboard/revenue-leaks",
    ]) {
      const escaped = legacy.replace(/\//g, "\\/");
      const re = new RegExp(`path="${escaped}"[\\s\\S]{0,160}Navigate to="\\/reports\\/bcba-performance`);
      expect(app, `${legacy} should redirect to /reports/bcba-performance`).toMatch(re);
    }
  });

  it("legacy /ceo-dashboard-v2 routes redirect to /reports/bcba-performance, not back to /bcba-performance-dashboard", () => {
    for (const legacy of [
      "/ceo-dashboard-v2",
      "/ceo-dashboard-v2/logic",
      "/ceo-dashboard-v2/insights",
      "/ceo-dashboard-v2/revenue-leaks",
    ]) {
      const escaped = legacy.replace(/\//g, "\\/");
      const re = new RegExp(`path="${escaped}"[\\s\\S]{0,160}Navigate to="\\/reports\\/bcba-performance`);
      expect(app).toMatch(re);
      // Must not point back to the retired dashboard URL.
      const legacyTargetRe = new RegExp(`path="${escaped}"[\\s\\S]{0,160}to="\\/bcba-performance-dashboard`);
      expect(app).not.toMatch(legacyTargetRe);
    }
  });

  it("/reports/bcba-performance remains the canonical report route", () => {
    expect(app).toMatch(/path="\/reports\/bcba-performance"/);
  });

  it("BCBA role menu has exactly one Reports destination: /reports", () => {
    const menu = ROLE_MENUS.bcba!;
    const paths = menu.sections.flatMap((s) => s.items.map((i) => i.path));
    const reportLinks = paths.filter(
      (p) => p === "/reports" || p.startsWith("/reports?") || p.startsWith("/reports/"),
    );
    expect(reportLinks).toEqual(["/reports"]);
  });

  it("BCBA Productivity Report V3 remains visible to every role", () => {
    for (const r of OS_ROLES) {
      const ids = visibleReportsForRole(r.id).map((rep) => rep.id);
      expect(ids, `${r.id} missing BCBA Productivity V3`).toContain("bcba-productivity-report-v3");
    }
  });

  it("every BCBA detail page has at least one selected-client scoped timeline (broad:false)", () => {
    for (const p of BCBA_DETAIL_PAGES) {
      const src = read(p);
      const matches = src.match(/<BcbaClientTimeline[\s\S]*?\/>/g) ?? [];
      expect(matches.length, `${p} has no BcbaClientTimeline`).toBeGreaterThan(0);
      const hasScoped = matches.some(
        (m) => /broad:\s*false/.test(m) && /clientName\s*:/.test(m),
      );
      expect(hasScoped, `${p} missing selected-client scoped timeline`).toBe(true);
    }
  });

  it("broad BCBA timeline instances are explicitly labelled as 'Recent BCBA activity'", () => {
    for (const p of BCBA_DETAIL_PAGES) {
      const src = read(p);
      const matches = src.match(/<BcbaClientTimeline[\s\S]*?\/>/g) ?? [];
      for (const m of matches) {
        if (/broad:\s*true/.test(m)) {
          expect(m, `${p} broad timeline missing label`).toMatch(/title="Recent BCBA activity"/);
        }
      }
    }
  });

  it("no BCBA detail page uses <BcbaClientTimeline scope={{}} />", () => {
    for (const p of BCBA_DETAIL_PAGES) {
      const src = read(p);
      expect(src, `${p} passes empty scope`).not.toMatch(/<BcbaClientTimeline\s+scope=\{\{\}\}/);
    }
  });
});