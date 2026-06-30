import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const read = (p: string) => readFileSync(path.resolve(__dirname, "..", "..", p), "utf8");

describe("Scheduling Team Pass 2 wiring", () => {
  it("scheduling role menu contains required paths and not /scheduling/reports", () => {
    const menu = read("src/lib/os/roleMenus.ts");
    const block = menu.slice(menu.indexOf("scheduling_team:"), menu.indexOf("scheduling_team:") + 2000);
    expect(block).toContain("/scheduling/rbts");
    expect(block).toContain("/scheduling/bcbas");
    expect(block).toContain("/scheduling/resources");
    expect(block).toContain("/reports");
    expect(block).not.toContain("/scheduling/reports");
  });

  it("useSchedulingActions exposes the full Pass 2 surface", () => {
    const src = read("src/hooks/useSchedulingActions.ts");
    for (const name of [
      "logAction", "createCoverageCase", "logCancellation", "updateMakeUp",
      "createAdjustment", "logContactAttempt",
      "queueSchedulingChangeForCentralReach", "markSchedulingChangeSynced", "markSchedulingChangeFailed",
      "listClientSchedulingActions", "listClientContactAttempts",
      "listOpenCoverageCases", "listMakeUpCancellations",
    ]) expect(src).toContain(name);
  });

  it("OSScheduling and OSSchedulingWorkspace import useSchedulingActions and dialogs", () => {
    const a = read("src/pages/os/OSScheduling.tsx");
    const b = read("src/pages/os/OSSchedulingWorkspace.tsx");
    expect(a).toContain("useSchedulingActions");
    expect(a).toContain("SchedulingDialogs");
    expect(b).toContain("useSchedulingActions");
    expect(b).toContain("SchedulingDialogs");
    // hardcoded notes removed
    expect(a).not.toContain("Confirmed Tuesday session move");
  });

  it("MakeUpSessions no longer uses localStorage records workspace", () => {
    const src = read("src/pages/os/operations/MakeUpSessions.tsx");
    expect(src).not.toContain("OpsRecordsWorkspace");
    expect(src).not.toContain("OPS_STORE_KEYS");
    expect(src).toContain("scheduling_cancellations".replace(/_/g, "_")); // documented header text
    expect(src).toContain("updateMakeUp");
  });

  it("/ops/scheduling redirects (no SchedulingPhase6Page route)", () => {
    const src = read("src/App.tsx");
    expect(src).not.toContain("SchedulingPhase6Page");
    expect(src).toContain('path="/ops/scheduling"');
    expect(src).toMatch(/path="\/ops\/scheduling"[\s\S]{0,120}Navigate to="\/scheduling-workspace/);
  });

  it("Reports landing single-home redirects", () => {
    const src = read("src/App.tsx");
    expect(src).toMatch(/path="\/reports"/);
    expect(src).toMatch(/path="\/reports\/landing"[\s\S]{0,80}Navigate to="\/reports"/);
    expect(src).toMatch(/path="\/marketing\/reports"[\s\S]{0,120}Navigate to="\/reports/);
    expect(src).toMatch(/path="\/hr\/reports"[\s\S]{0,120}Navigate to="\/reports/);
    expect(src).toContain('path="/reports/bcba-productivity-report-v3"');
    expect(src).toContain('path="/system/bcba-productivity-uploads"');
  });

  it("CentralReach honest queue/sync helpers + read hook intact", () => {
    const dialogs = read("src/components/scheduling/SchedulingDialogs.tsx");
    expect(dialogs).toContain("CRSyncBadge");
    const cr = read("src/hooks/useCentralReachOps.ts");
    expect(cr.length).toBeGreaterThan(0);
  });
});