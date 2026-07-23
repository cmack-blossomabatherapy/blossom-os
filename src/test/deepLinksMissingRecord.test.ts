import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (rel: string) => readFileSync(resolve(__dirname, "../..", rel), "utf8");

/**
 * Legacy `/leads?lead=<id>` URLs are forwarded to the canonical `/leads/:id`
 * full-page record — no drawer is mounted anywhere. Missing records surface
 * the "Lead not found" empty state on the record page itself.
 */
describe("Legacy ?lead= deep links forward to /leads/:id (no drawer)", () => {
  const leadsV2 = read("src/pages/os/OSLeadsV2.tsx");
  const leadDetail = read("src/pages/LeadDetail.tsx");

  it("OSLeadsV2 no longer mounts LeadDetailDrawer", () => {
    expect(leadsV2).not.toMatch(/<LeadDetailDrawer\b/);
  });

  it("OSLeadsV2 forwards ?lead=<id> to the canonical /leads/:id record", () => {
    expect(leadsV2).toMatch(/searchParams\.get\("lead"\)/);
    expect(leadsV2).toMatch(/navigate\(`\/leads\/\$\{encodeURIComponent\(openLeadId\)\}`/);
  });

  it("LeadDetail renders a Lead-not-found empty state (record page owns the miss)", () => {
    expect(leadDetail).toMatch(/Lead not found/);
  });
});