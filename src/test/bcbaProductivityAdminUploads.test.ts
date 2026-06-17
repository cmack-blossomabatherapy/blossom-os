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

  it("BCBA Productivity Report V3 runs on the shared admin dataset (manual upload retired)", () => {
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
    // user-facing manual upload UI removed
    expect(src).not.toMatch(/Choose file/);
    expect(src).not.toMatch(/Drag a file here/);
    expect(src).not.toMatch(/Upload a single Billing Report/);
    expect(src).not.toMatch(/Upload a billing report to populate productivity/);
  });

  it("Admin upload page uses the agreed product copy", () => {
    const src = read("src/pages/os/system/BcbaProductivityUploads.tsx");
    expect(src).toMatch(/BCBA Productivity Uploads/);
    expect(src).toMatch(
      /Upload CentralReach billing exports here so the BCBA Productivity Report can use a shared admin dataset\./,
    );
    expect(src).toMatch(/Append Upload/);
    expect(src).toMatch(/Upload History/);
    expect(src).toMatch(/Download Current Dataset/);
    expect(src).toMatch(/duplicates/i);
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