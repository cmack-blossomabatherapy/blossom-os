import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");

const NEW_HIRES = read("src/pages/os/OSHRNewHires.tsx");
const COMPLIANCE = read("src/pages/os/OSHRCompliance.tsx");
const SUPPORT = read("src/pages/os/OSHREmployeeSupport.tsx");
const REQUESTS = read("src/pages/os/OSHRRequests.tsx");
const MESSAGES = read("src/pages/os/OSHRMessages.tsx");
const ORIENTATION = read("src/pages/os/OSHROrientationQueue.tsx");

describe("HRIntegrationReadinessEditor is wired into HR pages", () => {
  for (const [name, src] of [
    ["OSHRNewHires", NEW_HIRES],
    ["OSHRCompliance", COMPLIANCE],
    ["OSHREmployeeSupport", SUPPORT],
    ["OSHRRequests", REQUESTS],
  ] as const) {
    it(`${name} imports and uses HRIntegrationReadinessEditor`, () => {
      expect(src).toContain("HRIntegrationReadinessEditor");
      expect(src).toMatch(/<HRIntegrationReadinessEditor/);
    });
  }
});

describe("Recent HR activity is visible in detail panels", () => {
  for (const [name, src] of [
    ["OSHRNewHires", NEW_HIRES],
    ["OSHRCompliance", COMPLIANCE],
    ["OSHREmployeeSupport", SUPPORT],
    ["OSHRRequests", REQUESTS],
  ] as const) {
    it(`${name} renders HRRecentActivity`, () => {
      expect(src).toMatch(/<HRRecentActivity/);
    });
  }
});

describe("Mark ready does not activate employee row", () => {
  const activePattern = /supabase\.from\(["']employees["']\)[\s\S]{0,80}update\([\s\S]{0,80}status:\s*["']active["']/;
  it("OSHRNewHires does not directly set employees.status = active", () => {
    expect(activePattern.test(NEW_HIRES)).toBe(false);
  });
  it("OSHRCompliance does not directly set employees.status = active", () => {
    expect(activePattern.test(COMPLIANCE)).toBe(false);
  });
  it("OSHRNewHires readiness check considers CentralReach", () => {
    expect(NEW_HIRES).toMatch(/centralreach_status/);
  });
  it("OSHRCompliance readiness check considers integrations", () => {
    expect(COMPLIANCE).toMatch(/viventium_status/);
    expect(COMPLIANCE).toMatch(/stellar_status/);
    expect(COMPLIANCE).toMatch(/centralreach_status/);
  });
  it("both pages log a 'ready_blocked' event when blockers exist", () => {
    expect(NEW_HIRES).toMatch(/ready_blocked/);
    expect(COMPLIANCE).toMatch(/ready_blocked/);
  });
});

describe("HR Messages page shows durable history", () => {
  it("OSHRMessages imports HRMessageHistory", () => {
    expect(MESSAGES).toContain("HRMessageHistory");
  });
  it("HRMessageHistory queries hr_messages", () => {
    const src = read("src/components/hr/HRMessageHistory.tsx");
    expect(src).toContain("hr_messages");
  });
  it("HR Messages does not falsely claim provider delivery", () => {
    expect(MESSAGES).not.toMatch(/Sent via Viventium/i);
    expect(MESSAGES).not.toMatch(/Sent via CentralReach/i);
    expect(MESSAGES).not.toMatch(/Sent via Stellar/i);
  });
  it("Message history labels expose blocked/queued channel status", () => {
    const src = read("src/components/hr/HRMessageHistory.tsx");
    expect(src).toMatch(/blocked/);
    expect(src).toMatch(/queued/);
  });
});

describe("Orientation queue has real schedule + no-show actions", () => {
  it("has a ScheduleOrientationDialog that inserts into recruiting_orientation_slots", () => {
    expect(ORIENTATION).toContain("ScheduleOrientationDialog");
    expect(ORIENTATION).toMatch(/from\(["']recruiting_orientation_slots["']\)[\s\S]{0,120}\.insert/);
  });
  it("has a Mark no-show action that writes no_show status and logs an event", () => {
    expect(ORIENTATION).toMatch(/status:\s*"no_show"/);
    expect(ORIENTATION).toMatch(/orientation_no_show/);
  });
  it("orientation reminders are durable via queueHrMessage", () => {
    expect(ORIENTATION).toMatch(/queueHrMessage\(/);
  });
  it("scheduling logs an orientation_scheduled activity event", () => {
    expect(ORIENTATION).toMatch(/orientation_scheduled/);
  });
});

describe("HR RLS migration is not broadly permissive", () => {
  const dir = join(root, "supabase/migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const hrTouching = files.filter((f) => {
    const s = readFileSync(join(dir, f), "utf8");
    return /hr_activity_events|hr_messages/.test(s);
  });
  it("has at least one migration touching hr_activity_events / hr_messages", () => {
    expect(hrTouching.length).toBeGreaterThan(0);
  });
  it("latest HR-touching migration does not leave USING (true) / WITH CHECK (true) on HR tables", () => {
    const latest = hrTouching[hrTouching.length - 1];
    const sql = readFileSync(join(dir, latest), "utf8");
    // Must not create a policy on hr_activity_events or hr_messages that uses USING (true)
    // or WITH CHECK (true) as its final gate.
    const badPolicy = /CREATE POLICY[^;]*ON\s+public\.(hr_activity_events|hr_messages)[^;]*(USING\s*\(\s*true\s*\)|WITH\s+CHECK\s*\(\s*true\s*\))/i;
    expect(badPolicy.test(sql)).toBe(false);
    // Must reference has_role or an HR role gate somewhere.
    expect(sql).toMatch(/has_role|is_hr_operator/);
  });
});

describe("Preserve existing guardrails", () => {
  it("Login Vault and NFC Badge redirects still point to /user-management", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/user-management/);
  });
  it("Reports remain unified at /reports", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/path=["']\/reports["']/);
  });
  it("OSHRResources stays data-driven via useLibraryResources", () => {
    const src = read("src/pages/os/OSHRResources.tsx");
    expect(src).toContain("useLibraryResources");
  });
});