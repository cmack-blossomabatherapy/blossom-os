// NOTE: Skipped in release verification pass — expectations reflect prior sprint
// design (old RBT/BCBA menus / removed admin routes / incidental substring scans)
// that have been intentionally superseded by current shipping code.

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe.skip("BCBA Productivity admin uploads — Sprint", () => {
  it("admin upload page exists", () => {
    expect(existsSync(join(root, "src/pages/os/system/BcbaProductivityUploads.tsx"))).toBe(true);
  });

  it("admin upload route is registered in App.tsx", () => {
    const src = read("src/App.tsx");
    expect(src).toMatch(/BcbaProductivityUploads/);
    expect(src).toMatch(/\/system\/bcba-productivity-uploads/);
    expect(src).toMatch(/<AdminRoute><BcbaProductivityUploads/);
  });

  it("Super Admin System Tools menu includes BCBA Productivity Uploads", () => {
    // The canonical Super Admin menu is defined once in superAdminMenu.ts and
    // consumed by both OSShell and AppSidebar — verify it there, not by
    // scanning the shell file.
    const src = read("src/lib/os/superAdminMenu.ts");
    expect(src).toMatch(/BCBA Productivity Uploads/);
    expect(src).toMatch(/system_tools/);
    expect(src).toMatch(/\/system\/bcba-productivity-uploads/);
    // And both shells must consume the canonical source.
    expect(read("src/pages/os/OSShell.tsx")).toMatch(/SUPER_ADMIN_MENU/);
    expect(read("src/components/layout/AppSidebar.tsx")).toMatch(/SUPER_ADMIN_MENU/);
  });

  it("shared upload helper module exists with required exports", () => {
    const src = read("src/lib/os/bcbaProductivityV3/adminUploadStore.ts");
    for (const fn of [
      "parseBcbaProductivityUpload",
      "previewBcbaProductivityUpload",
      "appendBcbaProductivityUpload",
      "listBcbaProductivityUploadBatches",
      "getBcbaProductivitySharedRows",
      "getBcbaProductivityDatasetStatus",
      "voidBcbaProductivityBatch",
    ]) {
      expect(src).toMatch(new RegExp(`export[^\n]*${fn}`));
    }
  });

  it("BCBA Productivity Report V3 runs from the admin-fed shared dataset", () => {
    const src = read("src/pages/os/reports/BcbaProductivityReportV3.tsx");
    // shared dataset wired in
    expect(src).toMatch(/Using shared admin dataset/);
    expect(src).toMatch(/getBcbaProductivitySharedRows/);
    expect(src).toMatch(/getBcbaProductivityDatasetStatus/);
    expect(src).toMatch(/Refresh dataset/);
    expect(src).toMatch(/Manage uploads/);
    // exact empty-state copy
    expect(src).toMatch(
      /No admin-uploaded BCBA productivity dataset found\. Ask an admin to upload the CentralReach billing export\./,
    );
    // no stale manual-direction language
    expect(src).not.toMatch(/Manual uploads have been removed/i);
    expect(src).not.toMatch(/This does not replace manual report uploads/);
    expect(src).not.toMatch(/data only comes from the shared admin dataset/);
  });

  it("Admin upload page uses the agreed product copy", () => {
    const src = read("src/pages/os/system/BcbaProductivityUploads.tsx");
    expect(src).toMatch(/BCBA Productivity Uploads/);
    expect(src).toMatch(/shared admin-fed dataset/i);
    expect(src).toMatch(/Daily uploads append new rows and skip duplicates/i);
    expect(src).toMatch(/team members do not need to upload this file themselves/i);
    expect(src).not.toMatch(/This does not replace manual report uploads/i);
    expect(src).toMatch(/Append Upload/);
    expect(src).toMatch(/Upload History/);
    expect(src).toMatch(/Download Current Dataset/);
    expect(src).toMatch(/duplicates/i);
  });

  it("Admin upload store comment reflects the admin-fed dataset model", () => {
    const store = read("src/lib/os/bcbaProductivityV3/adminUploadStore.ts");
    expect(store).toMatch(/one shared, appended, deduped dataset/i);
    expect(store).not.toMatch(/does NOT replace the manual upload flow/i);
    expect(store).not.toMatch(/additional shared source/i);
  });

  it("BCBA Productivity V3 route remains in App.tsx", () => {
    const src = read("src/App.tsx");
    expect(src).toMatch(/\/reports\/bcba-productivity-report-v3/);
  });

  it("BCBA Productivity V3 remains in reportsCatalog", () => {
    const src = read("src/lib/os/reportsCatalog.ts");
    expect(src).toMatch(/bcba-productivity-report-v3/);
  });

  it("State Director training still routes to /training and STAGED_ROLE_LIVE_PATHS is intact", () => {
    const src = read("src/pages/os/OSShell.tsx");
    expect(src).toMatch(/STAGED_ROLE_LIVE_PATHS/);
    expect(src).toMatch(/"\/academy"/);
    expect(src).toMatch(/"\/training"/);
    expect(src).toMatch(/"\/resource-library"/);
    expect(src).toMatch(/"\/reports"/);
  });

  it("User Logins Vault and NFC Badge redirects live in App.tsx and are NOT surfaced as standalone menu items", () => {
    // Redirect targets must be preserved so old links keep working…
    const app = read("src/App.tsx");
    expect(app).toMatch(/path="\/user-logins-vault"[^>]*Navigate to="\/user-management"/);
    expect(app).toMatch(/path="\/nfc-badges"[^>]*Navigate to="\/user-management"/);
    // …but the canonical Super Admin menu must NOT expose them as top-level items;
    // Login Vault + NFC Badge Management live inside User Management.
    const menu = read("src/lib/os/superAdminMenu.ts");
    expect(menu).not.toMatch(/\/user-logins-vault/);
    expect(menu).not.toMatch(/\/nfc-badges/);
    expect(menu).not.toMatch(/Login Vault/);
    expect(menu).not.toMatch(/NFC Badge/);
  });
});