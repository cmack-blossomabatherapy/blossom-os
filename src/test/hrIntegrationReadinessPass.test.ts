import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(p: string) {
  return readFileSync(join(root, p), "utf8");
}

describe("HR integration readiness — Ship 2", () => {
  it("readiness panel exists and lists all three providers", () => {
    const src = read("src/components/hr/IntegrationReadinessPanel.tsx");
    expect(src).toContain("viventium");
    expect(src).toContain("stellar_checks");
    expect(src).toContain("centralreach");
    // never claims "synced" without a connected catalog + real timestamp
    expect(src).toContain("catalogStatus !== \"connected\"");
    expect(src).toContain("not connected");
  });

  it("OSHRNewHires drops the fake 'Viventium: synced' pill and mounts the readiness panel", () => {
    const src = read("src/pages/os/OSHRNewHires.tsx");
    // The old hardcoded pill must be gone
    expect(src).not.toMatch(/label="Viventium"\s+value=\{emp \? "synced" : "pending"\}/);
    // Panel is imported and rendered
    expect(src).toContain("IntegrationReadinessPanel");
    // Onboarding select pulls the new readiness columns
    expect(src).toContain("viventium_status");
    expect(src).toContain("stellar_status");
    expect(src).toContain("centralreach_status");
  });
});