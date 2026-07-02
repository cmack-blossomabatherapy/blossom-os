import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { validateReadinessUpdate } from "@/components/hr/HRIntegrationReadinessEditor";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("HR Completion Pass — durable actions and data-driven resources", () => {
  it("OSHRResources.tsx does not declare a hardcoded resources array", () => {
    const src = read("src/pages/os/OSHRResources.tsx");
    // No hardcoded `const resources: Resource[] = [...]`
    expect(/const\s+resources\s*:\s*Resource\[\]\s*=/.test(src)).toBe(false);
    // Uses the shared library data layer
    expect(src).toContain("useLibraryResources");
    // No visible "Skeleton" badge and no placeholder markers
    expect(src).not.toMatch(/Skeleton</);
    expect(src).not.toContain("placeholder: true");
  });

  it("OSHRMessages.tsx queues durable messages instead of fake 'Sent via' toasts", () => {
    const src = read("src/pages/os/OSHRMessages.tsx");
    expect(src).toContain("queueHrMessage");
    // No hardcoded "Sent via Viventium" style claims.
    expect(src).not.toMatch(/Sent via Viventium/);
    expect(src).not.toMatch(/Sent via CentralReach/);
    expect(src).not.toMatch(/Sent via Stellar/);
  });

  it("OSHRNewHires.tsx add-note and mark-ready use durable helpers", () => {
    const src = read("src/pages/os/OSHRNewHires.tsx");
    expect(src).toContain("logHrEvent");
    // Mark ready considers blockers before advancing onboarding.
    expect(src).toMatch(/Cannot mark ready/);
  });

  it("OSHROrientationQueue.tsx uses durable reminders (no toast-only)", () => {
    const src = read("src/pages/os/OSHROrientationQueue.tsx");
    expect(src).toContain("queueHrMessage");
    expect(src).not.toMatch(/toast\(\{ title: "Reminder sent"/);
    expect(src).not.toMatch(/toast\(\{ title: "Reminders sent"/);
  });

  it("OSHRTrainingCerts.tsx queues durable training reminders", () => {
    const src = read("src/pages/os/OSHRTrainingCerts.tsx");
    expect(src).toContain("queueHrMessage");
    expect(src).not.toMatch(/toast\(\{ title: "Reminder sent"/);
  });

  it("OSHREmployeeSupport.tsx and OSHRRequests.tsx log durable events on actions", () => {
    const support = read("src/pages/os/OSHREmployeeSupport.tsx");
    const requests = read("src/pages/os/OSHRRequests.tsx");
    for (const src of [support, requests]) {
      expect(src).toContain("logHrEvent");
    }
  });

  it("OSHRCompliance.tsx blocks staffing-ready when documents are pending", () => {
    const src = read("src/pages/os/OSHRCompliance.tsx");
    expect(src).toContain("Cannot mark ready");
    expect(src).toContain("ready_blocked");
  });

  it("HRIntegrationReadinessEditor validation enforces synced/error rules", () => {
    expect(validateReadinessUpdate("synced", "", "").ok).toBe(false);
    expect(validateReadinessUpdate("synced", "abc123", "").ok).toBe(true);
    expect(validateReadinessUpdate("synced", "", "manual reconciliation").ok).toBe(true);
    expect(validateReadinessUpdate("error", "", "").ok).toBe(false);
    expect(validateReadinessUpdate("error", "", "provider returned 500").ok).toBe(true);
    expect(validateReadinessUpdate("ready", "", "").ok).toBe(true);
  });
});