/**
 * Executive Leadership completion pass — persistence + access hardening.
 *
 * Covers:
 * - /marketing/state-growth route uses the executive-friendly
 *   GROWTH_SNAPSHOT_ROLES set (not just MARKETING_ROLES).
 * - OpsExecutiveDashboard no longer uses localStorage for leadership
 *   priorities and instead persists them through executive_work_items.
 * - OSCommandCenter no longer defines the hardcoded MESSAGES sample.
 * - Existing Executive discipline guards remain in place (org-chart
 *   canonical, no deep report menu links, coming-soon copy removed).
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => fs.readFileSync(p, "utf8");
const appSrc = read("src/App.tsx");
const opsExec = read("src/pages/os/operations/OpsExecutiveDashboard.tsx");
const cmd = read("src/pages/os/OSCommandCenter.tsx");

describe("Executive Leadership completion — pass 2", () => {
  it("/marketing/state-growth guard uses GROWTH_SNAPSHOT_ROLES", () => {
    expect(appSrc).toMatch(/GROWTH_SNAPSHOT_ROLES\s*=\s*\[/);
    for (const role of ["executive_leadership", "exec", "executive", "ceo", "coo"]) {
      expect(appSrc).toMatch(new RegExp(`"${role}"`));
    }
    const line = appSrc
      .split("\n")
      .find((l) => l.includes('path="/marketing/state-growth"'));
    expect(line, "state-growth route not found").toBeTruthy();
    expect(line!).toMatch(/GROWTH_SNAPSHOT_ROLES/);
  });

  it("Executive Leadership menu still lists /marketing/state-growth", () => {
    const items = ROLE_MENUS.executive_leadership!.sections.flatMap((s) => s.items);
    expect(items.map((i) => i.path)).toContain("/marketing/state-growth");
  });

  it("OpsExecutiveDashboard drops localStorage for leadership priorities", () => {
    expect(opsExec).not.toMatch(/PRIORITIES_KEY/);
    expect(opsExec).not.toMatch(/ops\.leadership\.priorities/);
    expect(opsExec).not.toMatch(/localStorage/);
  });

  it("OpsExecutiveDashboard persists priorities through executive_work_items", () => {
    expect(opsExec).toMatch(/useExecutiveWorkItems/);
    expect(opsExec).toMatch(/"leadership_priority"/);
    expect(opsExec).toMatch(/display_context:\s*"executive_dashboard_priority"/);
    // Unpin marks resolved, not delete.
    expect(opsExec).toMatch(/status:\s*"resolved"/);
  });

  it("OSCommandCenter no longer defines the hardcoded MESSAGES sample", () => {
    expect(cmd).not.toMatch(/const MESSAGES\s*=\s*\[/);
    expect(cmd).not.toMatch(/#state-leadership/);
    expect(cmd).not.toMatch(/Greene match approved/);
  });

  it("Existing Executive discipline still holds", () => {
    // /org-chart is still canonical (not a redirect to /hr/org-chart).
    expect(appSrc).not.toMatch(
      /path="\/org-chart"\s+element=\{<Navigate\s+to="\/hr\/org-chart"/,
    );
    // No Executive menu item points at deep report routes.
    const execPaths = ROLE_MENUS.executive_leadership!.sections
      .flatMap((s) => s.items)
      .map((i) => i.path);
    for (const p of execPaths) expect(p).not.toMatch(/^\/reports\/.+/);
  });
});