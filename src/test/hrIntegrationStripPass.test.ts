import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const HR_PAGES = [
  "src/pages/os/OSHRCompliance.tsx",
  "src/pages/os/OSHRRequests.tsx",
  "src/pages/os/OSHREmployeeSupport.tsx",
  "src/pages/os/OSHRMessages.tsx",
  "src/pages/os/OSHRTrainingCerts.tsx",
];

describe("HR integration status strip wiring", () => {
  for (const p of HR_PAGES) {
    it(`${p} imports and renders HRIntegrationStatusStrip`, () => {
      const src = readFileSync(p, "utf8");
      expect(src).toContain('from "@/components/hr/HRIntegrationStatusStrip"');
      expect(src).toContain("<HRIntegrationStatusStrip");
    });
  }

  it("strip component queries integration_catalog for the three HR providers", () => {
    const src = readFileSync("src/components/hr/HRIntegrationStatusStrip.tsx", "utf8");
    expect(src).toContain('from("integration_catalog")');
    expect(src).toContain("viventium");
    expect(src).toContain("stellar_checks");
    expect(src).toContain("centralreach");
  });

  it("strip never claims 'synced' unless catalog is connected", () => {
    const src = readFileSync("src/components/hr/HRIntegrationStatusStrip.tsx", "utf8");
    // We removed synced messaging; ensure no fabricated 'synced' string.
    expect(src).not.toMatch(/"synced"/);
  });
});