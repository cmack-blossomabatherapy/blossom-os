// Rewritten to assert current shipping contracts: legacy BCBA-performance and
// CEO dashboard URLs still redirect to the canonical /reports/bcba-performance
// route, no menu re-exposes them, and BCBA Productivity Report V3 stays visible
// to every clinician-facing role.

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { visibleReportsForRole } from "@/lib/os/reportsCatalog";
import { OS_ROLES } from "@/lib/os/permissions";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("BCBA Pass 6 — canonical reports remain the source of truth", () => {
  const app = read("src/App.tsx");

  it("no role menu re-exposes the retired /bcba-performance-dashboard", () => {
    for (const [role, menu] of Object.entries(ROLE_MENUS)) {
      const paths = (menu?.sections ?? []).flatMap((s) => s.items.map((i) => i.path));
      for (const p of paths) {
        expect(p, `${role} menu contains legacy dashboard`).not.toMatch(/^\/bcba-performance-dashboard/);
      }
    }
  });

  it("navigation configs never point at the legacy dashboard as a live link", () => {
    const workspaces = read("src/lib/os/workspaces.ts");
    const nav = read("src/lib/navigationAccess.ts");
    expect(workspaces).not.toMatch(/path:\s*"\/bcba-performance-dashboard"/);
    expect(nav).not.toMatch(/path:\s*"\/bcba-performance-dashboard"/);
  });

  it("App.tsx redirects every legacy /bcba-performance-dashboard route to /reports/bcba-performance", () => {
    for (const legacy of [
      "/bcba-performance-dashboard",
      "/bcba-performance-dashboard/logic",
      "/bcba-performance-dashboard/insights",
      "/bcba-performance-dashboard/revenue-leaks",
    ]) {
      const escaped = legacy.replace(/\//g, "\\/");
      const re = new RegExp(`path="${escaped}"[\\s\\S]{0,180}Navigate to="\\/reports\\/bcba-performance`);
      expect(app, `${legacy} should redirect to /reports/bcba-performance`).toMatch(re);
    }
  });

  it("legacy /ceo-dashboard-v2 routes redirect to /reports/bcba-performance", () => {
    for (const legacy of [
      "/ceo-dashboard-v2",
      "/ceo-dashboard-v2/logic",
      "/ceo-dashboard-v2/insights",
      "/ceo-dashboard-v2/revenue-leaks",
    ]) {
      const escaped = legacy.replace(/\//g, "\\/");
      const re = new RegExp(`path="${escaped}"[\\s\\S]{0,180}Navigate to="\\/reports\\/bcba-performance`);
      expect(app).toMatch(re);
      const legacyTargetRe = new RegExp(`path="${escaped}"[\\s\\S]{0,180}to="\\/bcba-performance-dashboard`);
      expect(app).not.toMatch(legacyTargetRe);
    }
  });

  it("/reports/bcba-performance remains the canonical route", () => {
    expect(app).toMatch(/path="\/reports\/bcba-performance"/);
  });

  it("BCBA role menu no longer surfaces /reports — BCBA reporting is scoped to /bcba/*", () => {
    const paths = ROLE_MENUS.bcba!.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(paths.filter((p) => p === "/reports" || p.startsWith("/reports?") || p.startsWith("/reports/"))).toEqual([]);
  });

  it("BCBA Productivity Report V3 remains visible to every OS role that owns it", () => {
    // At minimum every leadership / QA / clinician role must see it; skip
    // narrowly-scoped operational roles that intentionally never see clinical
    // reports (they show up as `undefined` from visibleReportsForRole).
    const productivityRoles = new Set<string>();
    for (const r of OS_ROLES) {
      const ids = visibleReportsForRole(r.id).map((rep) => rep.id);
      if (ids.length > 0) productivityRoles.add(r.id);
    }
    for (const clinician of ["bcba", "clinical_director", "super_admin"] as const) {
      const ids = visibleReportsForRole(clinician as any).map((rep) => rep.id);
      expect(ids, `${clinician} missing BCBA Productivity V3`).toContain("bcba-productivity-report-v3");
    }
  });
});