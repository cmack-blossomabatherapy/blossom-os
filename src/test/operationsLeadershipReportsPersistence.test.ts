/**
 * Operations Leadership completion — Task 3 persistence + menu tests.
 *
 * Verifies:
 * - saved report save/delete flows await Supabase (`report_saved_snapshots`)
 *   and are not fire-and-forget `void ...` calls.
 * - Cancellation follow-up status writes `report_followups`.
 * - ReportsHome delete handlers refresh via the async loaders.
 * - Operations Leadership visible reports include BCBA Productivity V3.
 * - Operations Leadership menu has one Reports link and no legacy report
 *   pages (`/hr/reports`, `/marketing/reports`, etc.).
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { visibleReportsForRole } from "@/lib/os/reportsCatalog";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const v3 = read("src/lib/os/bcbaProductivityV3/store.ts");
const legacy = read("src/lib/os/bcbaSavedReports.ts");
const cancel = read("src/lib/os/cancellationSavedReports.ts");
const cancelUi = read("src/pages/os/reports/CancellationCommandCenter.tsx");
const home = read("src/pages/os/reports/ReportsHome.tsx");

describe("Operations Leadership — reports persistence hardening", () => {
  it("saveReportV3 awaits upsertRemoteSnapshot for bcba_productivity_v3", () => {
    expect(v3).toMatch(/await\s+upsertRemoteSnapshot\("bcba_productivity_v3"/);
    expect(v3).not.toMatch(/void\s+upsertRemoteSnapshot/);
  });

  it("deleteSavedReportV3 awaits deleteRemoteSnapshot for bcba_productivity_v3", () => {
    expect(v3).toMatch(/await\s+deleteRemoteSnapshot\("bcba_productivity_v3"/);
    expect(v3).not.toMatch(/void\s+deleteRemoteSnapshot/);
  });

  it("legacy BCBA saveReport awaits upsertRemoteSnapshot for bcba_productivity_legacy", () => {
    expect(legacy).toMatch(/await\s+upsertRemoteSnapshot\("bcba_productivity_legacy"/);
    expect(legacy).not.toMatch(/void\s+upsertRemoteSnapshot/);
  });

  it("legacy BCBA deleteSavedReport awaits deleteRemoteSnapshot for bcba_productivity_legacy", () => {
    expect(legacy).toMatch(/await\s+deleteRemoteSnapshot\("bcba_productivity_legacy"/);
    expect(legacy).not.toMatch(/void\s+deleteRemoteSnapshot/);
  });

  it("saveCancellationReport awaits upsertRemoteSnapshot for cancellation_command_center", () => {
    expect(cancel).toMatch(/await\s+upsertRemoteSnapshot\("cancellation_command_center"/);
    expect(cancel).not.toMatch(/void\s+upsertRemoteSnapshot/);
  });

  it("deleteCancellationSavedReport awaits deleteRemoteSnapshot for cancellation_command_center", () => {
    expect(cancel).toMatch(/await\s+deleteRemoteSnapshot\("cancellation_command_center"/);
    expect(cancel).not.toMatch(/void\s+deleteRemoteSnapshot/);
  });

  it("Cancellation follow-up status persists to report_followups via upsertRemoteFollowup", () => {
    expect(cancelUi).toMatch(/upsertRemoteFollowup\("cancellation_command_center"/);
    expect(cancelUi).toMatch(/await\s+upsertRemoteFollowup\("cancellation_command_center"/);
  });

  it("Cancellation save handler checks remoteSyncError and warns when cloud sync fails", () => {
    expect(cancelUi).toMatch(/const\s+saved\s*=\s*await\s+saveCancellationReport\(/);
    expect(cancelUi).toMatch(/saved\.remoteSyncError/);
    expect(cancelUi).toMatch(/toast\.warning\(/);
    expect(cancelUi).toMatch(
      /cloud sync failed, so it may not appear on other devices yet/,
    );
  });

  it("ReportsHome delete handlers rehydrate via the async loaders", () => {
    expect(home).toMatch(/await\s+loadCancellationSavedReports\(\)/);
    expect(home).toMatch(/await\s+loadSavedReportsV3\(\)/);
  });
});

describe("Operations Leadership — reports catalog + menu", () => {
  it("Operations Leadership visible reports include BCBA Productivity Report V3", () => {
    const rs = visibleReportsForRole("operations_leadership");
    expect(rs.some((r) => r.id === "bcba-productivity-report-v3")).toBe(true);
  });

  const menu = ROLE_MENUS.operations_leadership!;
  const items = menu.sections.flatMap((s) => s.items);

  it("Operations Leadership menu has exactly one visible Reports link pointing at /reports", () => {
    const reports = items.filter((i) =>
      i.label.trim().toLowerCase() === "reports" || i.path === "/reports",
    );
    expect(reports.length).toBe(1);
    expect(reports[0].path).toBe("/reports");
  });

  it("Operations Leadership menu does not expose legacy report pages", () => {
    const banned = [
      "/hr/reports",
      "/marketing/reports",
      "/credentialing/reports",
      "/blossom/reports",
      "/intelligence/reports",
      "/admin/hr/reports",
    ];
    for (const p of banned) {
      expect(items.map((i) => i.path)).not.toContain(p);
    }
  });

  it("No Operations Leadership menu item points to a deep /reports/... detail route", () => {
    for (const it of items) {
      // /reports?category=… is a filter param and remains allowed.
      const p = it.path.split("?")[0];
      expect(p === "/reports" || !p.startsWith("/reports/")).toBe(true);
    }
  });
});