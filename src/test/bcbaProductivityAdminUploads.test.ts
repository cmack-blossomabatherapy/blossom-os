// Rewritten to assert the CURRENT shipping contract: the standalone
// /system/bcba-productivity-uploads admin route has been retired and now
// redirects into the CentralReach Data Hub, while the shared upload adapter
// and V3 report data path remain intact.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("BCBA Productivity uploads — obsolete admin route retired", () => {
  const app = read("src/App.tsx");
  const menu = read("src/lib/os/superAdminMenu.ts");

  it("legacy /system/bcba-productivity-uploads redirects into the CentralReach hub", () => {
    expect(app).toMatch(
      /path="\/system\/bcba-productivity-uploads"[\s\S]{0,180}Navigate to="\/system\/centralreach\?tab=reporting"/,
    );
  });

  it("Super Admin menu no longer exposes a standalone BCBA Productivity Uploads item", () => {
    expect(menu).not.toMatch(/BCBA Productivity Uploads/);
    expect(menu).not.toMatch(/\/system\/bcba-productivity-uploads/);
  });

  it("CentralReach Data Hub is the canonical admin upload surface", () => {
    expect(app).toMatch(/path="\/system\/centralreach"/);
    expect(menu).toMatch(/\/system\/centralreach-uploads|\/system\/centralreach/);
  });
});

describe("BCBA Productivity uploads — shared dataset adapter still ships", () => {
  const store = read("src/lib/os/bcbaProductivityV3/adminUploadStore.ts");

  it("shared upload helper module exposes the full ingest/read/void surface", () => {
    for (const fn of [
      "parseBcbaProductivityUpload",
      "previewBcbaProductivityUpload",
      "appendBcbaProductivityUpload",
      "listBcbaProductivityUploadBatches",
      "getBcbaProductivitySharedRows",
      "getBcbaProductivityDatasetStatus",
      "voidBcbaProductivityBatch",
    ]) {
      expect(store).toMatch(new RegExp(`export[^\n]*${fn}`));
    }
  });
});

describe("BCBA Productivity Report V3 — canonical report route + dataset", () => {
  const app = read("src/App.tsx");
  const report = read("src/pages/os/reports/BcbaProductivityReportV3.tsx");
  const catalog = read("src/lib/os/reportsCatalog.ts");

  it("V3 route is mounted", () => {
    expect(app).toMatch(/path="\/reports\/bcba-productivity-report-v3"/);
  });

  it("V3 auto-loads the canonical report dataset, not just the legacy upload status", () => {
    expect(report).toMatch(/fetchCanonicalReportTotals/);
    expect(report).toMatch(/fetchBcbaBillingRowsAsSharedShape/);
    expect(report).toMatch(/void loadSharedDataset\(\{ silent: true \}\)/);
    expect(report).not.toMatch(/getBcbaProductivityDatasetStatus/);
  });

  it("V3 remains in the reports catalog", () => {
    expect(catalog).toMatch(/id:\s*"bcba-productivity-report-v3"/);
  });
});

describe("User Logins Vault + NFC Badges — redirect-only, never surfaced", () => {
  const app = read("src/App.tsx");
  const menu = read("src/lib/os/superAdminMenu.ts");

  it("legacy /user-logins-vault and /nfc-badges redirect to /user-management", () => {
    expect(app).toMatch(/path="\/user-logins-vault"[^>]*Navigate to="\/user-management"/);
    expect(app).toMatch(/path="\/nfc-badges"[^>]*Navigate to="\/user-management"/);
  });

  it("Super Admin menu does not expose Login Vault or NFC Badges as standalone items", () => {
    expect(menu).not.toMatch(/\/user-logins-vault/);
    expect(menu).not.toMatch(/\/nfc-badges/);
    expect(menu).not.toMatch(/Login Vault/);
    expect(menu).not.toMatch(/NFC Badge/);
  });
});