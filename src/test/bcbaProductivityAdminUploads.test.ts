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

  it("BCBA Productivity Report V3 still has manual upload AND a shared admin source option", () => {
    const src = read("src/pages/os/reports/BcbaProductivityReportV3.tsx");
    // manual upload still wired
    expect(src).toMatch(/handleFiles/);
    expect(src).toMatch(/Choose file|choose file/);
    expect(src).toMatch(/saveLastBillingV3/);
    // data source selector + shared dataset
    expect(src).toMatch(/Shared admin dataset/);
    expect(src).toMatch(/Manual upload/);
    expect(src).toMatch(/getBcbaProductivitySharedRows/);
    expect(src).toMatch(/No admin-uploaded BCBA productivity dataset found/);
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