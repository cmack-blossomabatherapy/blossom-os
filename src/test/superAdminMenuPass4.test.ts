import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SUPER_ADMIN_MENU, superAdminMenuPaths } from "@/lib/os/superAdminMenu";

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("Super Admin Pass 4 — canonical menu integrity", () => {
  it("AppSidebar and OSShell both consume SUPER_ADMIN_MENU", () => {
    expect(read("src/components/layout/AppSidebar.tsx")).toMatch(/SUPER_ADMIN_MENU/);
    expect(read("src/pages/os/OSShell.tsx")).toMatch(/SUPER_ADMIN_MENU/);
  });

  it("has no duplicate paths across the visible menu", () => {
    const all = SUPER_ADMIN_MENU.flatMap((s) => s.items.map((i) => i.to));
    const dupes = all.filter((p, i, arr) => arr.indexOf(p) !== i);
    expect(dupes).toEqual([]);
  });

  it("has exactly one visible Reports item pointing at /reports", () => {
    const reports = SUPER_ADMIN_MENU.flatMap((s) => s.items).filter(
      (i) => i.label === "Reports",
    );
    expect(reports).toHaveLength(1);
    expect(reports[0]!.to).toBe("/reports");
  });

  it("does not expose Login Vault as a standalone menu item", () => {
    const labels = SUPER_ADMIN_MENU.flatMap((s) => s.items).map((i) => i.label.toLowerCase());
    expect(labels.some((l) => l.includes("login vault"))).toBe(false);
    expect(superAdminMenuPaths()).not.toContain("/user-logins-vault");
  });

  it("does not expose NFC Badges as a standalone menu item", () => {
    const labels = SUPER_ADMIN_MENU.flatMap((s) => s.items).map((i) => i.label.toLowerCase());
    expect(labels.some((l) => l.includes("nfc"))).toBe(false);
    expect(superAdminMenuPaths()).not.toContain("/nfc-badges");
  });

  it("has no AI menu section", () => {
    const sectionIds = SUPER_ADMIN_MENU.map((s) => s.id.toLowerCase());
    const sectionLabels = SUPER_ADMIN_MENU.map((s) => s.label.toLowerCase());
    expect(sectionIds.every((id) => !id.startsWith("ai"))).toBe(true);
    expect(sectionLabels.every((l) => !/\bai\b/.test(l))).toBe(true);
  });

  it("every menu path is registered in App.tsx (as a route or intentional redirect)", () => {
    const app = read("src/App.tsx");
    const paths = superAdminMenuPaths();
    // Strip query strings — router matches on pathname.
    const missing = paths
      .map((p) => p.split("?")[0]!)
      .filter((p) => {
        if (p === "/") return !app.includes('path="/"');
        // Accept either a Route or a Navigate redirect
        return !app.includes(`path="${p}"`);
      });
    expect(missing).toEqual([]);
  });

  it("/reports/bcba-productivity-report-v3 remains a hidden runtime route, not a sidebar Reports item", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/\/reports\/bcba-productivity-report-v3/);
    const paths = superAdminMenuPaths();
    expect(paths).not.toContain("/reports/bcba-productivity-report-v3");
    expect(paths).not.toContain("/reports/bcba-productivity-report");
  });
});