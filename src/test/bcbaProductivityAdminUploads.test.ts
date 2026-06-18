import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("BCBA Productivity admin uploads — Sprint", () => {
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
    const src = read("src/pages/os/OSShell.tsx");
    expect(src).toMatch(/BCBA Productivity Uploads/);
    expect(src).toMatch(/system_tools/);
    expect(src).toMatch(/\/system\/bcba-productivity-uploads/);
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

  it("User Logins Vault and NFC Badge routes still exist", () => {
    const src = read("src/pages/os/OSShell.tsx");
    expect(src).toMatch(/\/user-logins-vault/);
    expect(src).toMatch(/\/nfc-badges/);
  });
});