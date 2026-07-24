import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Scheduling Pass 4 — AssignRbtDialog updates local client state", () => {
  const src = read("src/components/scheduling/SchedulingDialogs.tsx");

  it("imports useClients from ClientsContext", () => {
    expect(src).toMatch(/from\s+"@\/contexts\/ClientsContext"/);
    expect(src).toContain("useClients");
  });

  it("AssignRbtDialog destructures assignRbt from useClients", () => {
    const block = src.slice(src.indexOf("AssignRbtDialog"));
    expect(block).toMatch(/const\s*\{\s*assignRbt\s*\}\s*=\s*useClients\(\)/);
  });

  it("AssignRbtDialog save calls assignRbt with [client.id] and the trimmed RBT name", () => {
    const block = src.slice(src.indexOf("AssignRbtDialog"), src.indexOf("StartDateDialog"));
    expect(block).toMatch(/const\s+trimmed\s*=\s*rbt\.trim\(\)/);
    expect(block).toMatch(/assignRbt\(\s*\[\s*client\.id\s*\]\s*,\s*trimmed\s*\)/);
    expect(block).toMatch(/onSaved\?\.\(\s*trimmed\s*\)/);
  });

  it("AssignRbtDialog does not pretend CentralReach is synced", () => {
    const block = src.slice(src.indexOf("AssignRbtDialog"), src.indexOf("StartDateDialog"));
    expect(block).not.toMatch(/centralreach_sync_status:\s*['"]synced['"]/);
    expect(block).toMatch(/CentralReach sync not connected/);
  });
});

describe("Scheduling Pass 4 — StartDateDialog", () => {
  const src = read("src/components/scheduling/SchedulingDialogs.tsx");

  it("exports StartDateDialog", () => {
    expect(src).toMatch(/export function StartDateDialog/);
  });

  it("StartDateDialog uses setStartDate from useClients and logs start_date_confirmed", () => {
    const block = src.slice(src.indexOf("export function StartDateDialog"));
    expect(block).toMatch(/const\s*\{\s*setStartDate\s*\}\s*=\s*useClients\(\)/);
    expect(block).toMatch(/setStartDate\(\s*\[\s*client\.id\s*\]\s*,\s*date\s*\)/);
    expect(block).toMatch(/actionType:\s*"start_date_confirmed"/);
  });

  it("Scheduling Workspace mounts StartDateDialog and a Confirm Start Date button", () => {
    const ws = read("src/pages/os/OSSchedulingWorkspace.tsx");
    expect(ws).toContain("StartDateDialog");
    expect(ws).toMatch(/Confirm Start Date/);
    expect(ws).toMatch(/setStartDateOpen/);
  });
});

describe("Scheduling Pass 4 — AdjustmentDialog can apply to local schedule when safe", () => {
  const src = read("src/components/scheduling/SchedulingDialogs.tsx");

  it("offers the 'Apply to Blossom OS schedule now' option", () => {
    expect(src).toMatch(/Apply to Blossom OS schedule now/);
  });

  it("uses addScheduleSlot from useClients", () => {
    const block = src.slice(src.indexOf("AdjustmentDialog"), src.indexOf("AssignRbtDialog"));
    expect(block).toMatch(/const\s*\{\s*addScheduleSlot\s*\}\s*=\s*useClients\(\)/);
    expect(block).toMatch(/addScheduleSlot\(\s*client\.id\s*,\s*slot\s*\)/);
  });

  it("only applies locally for safe adjustment types", () => {
    const block = src.slice(src.indexOf("AdjustmentDialog"), src.indexOf("AssignRbtDialog"));
    // canApplyLocal helper exists and restricts to add_session / change_rbt
    expect(block).toMatch(/function canApplyLocal/);
    expect(block).toMatch(/type === "add_session"/);
    // move_session / change_time / remove_session / change_location must NOT enable apply-local
    expect(block).toMatch(/too ambiguous|return false/);
  });

  it("does not pretend CentralReach was synced", () => {
    const block = src.slice(src.indexOf("AdjustmentDialog"), src.indexOf("AssignRbtDialog"));
    expect(block).not.toMatch(/centralreach_sync_status:\s*['"]synced['"]/);
    expect(block).toMatch(/CentralReach sync not connected/);
  });
});

describe("Scheduling Pass 4 — coverage cases visible on selected client", () => {
  const ws = read("src/pages/os/OSSchedulingWorkspace.tsx");

  it("workspace lists open coverage cases scoped to the active client", () => {
    expect(ws).toMatch(/listOpenCoverageCases/);
    expect(ws).toMatch(/clientCoverageCases/);
    expect(ws).toMatch(/Open Coverage Cases/);
  });

  it("workspace exposes Resolve / Mark Watching actions for coverage cases", () => {
    expect(ws).toMatch(/updateCoverageCase\(\s*id\s*,\s*\{\s*status:\s*"resolved"/);
    expect(ws).toMatch(/updateCoverageCase\(\s*id\s*,\s*\{\s*status:\s*"watching"/);
  });
});

describe("Scheduling Pass 4 — page map and Reports rule intact", () => {
  const app = read("src/App.tsx");
  const menus = read("src/lib/os/roleMenus.ts");

  it("/scheduling-team remains a redirect only (no live page component)", () => {
    expect(app).toMatch(/path="\/scheduling-team"[\s\S]{0,160}Navigate to="\/scheduling"/);
    // Live nav must not reference it.
    expect(menus).not.toContain("/scheduling-team");
  });

  it.skip("Scheduling menu does not include /scheduling/reports and resolves to exactly one /reports item", async () => {
    const block = menus.slice(menus.indexOf("scheduling_team:"), menus.indexOf("scheduling_team:") + 4000);
    expect(block).not.toContain("/scheduling/reports");
    // /reports is delivered via the shared TRAINING_AND_RESOURCES section
    // appended to the scheduling_team menu.
    expect(block).toContain("TRAINING_AND_RESOURCES");
    // Resolve the live menu and prove exactly one /reports entry exists.
    const { ROLE_MENUS } = await import("@/lib/os/roleMenus");
    const menu = ROLE_MENUS.scheduling_team;
    expect(menu).toBeTruthy();
    const paths = (menu?.sections ?? []).flatMap((s) => s.items.map((i) => i.path));
    const reportPaths = paths.filter((p) => p === "/reports");
    expect(reportPaths.length).toBe(1);
    expect(paths).not.toContain("/scheduling/reports");
  });

  it("BCBA Productivity V3 and Cancellation Command Center remain mounted", () => {
    expect(app).toMatch(/path="\/reports\/bcba-productivity-report-v3"/);
    expect(app).toMatch(/path="\/reports\/cancellation-command-center"/);
  });
});