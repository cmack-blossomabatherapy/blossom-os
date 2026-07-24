import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Scheduling Pass 7 — transactional honesty", () => {
  const src = read("src/components/scheduling/SchedulingDialogs.tsx");

  it("AssignRbtDialog calls assignRbt BEFORE logAction(rbt_assigned)", () => {
    const block = src.slice(src.indexOf("export function AssignRbtDialog"), src.indexOf("export function StartDateDialog"));
    const assignIdx = block.search(/assignRbt\(\s*\[\s*client\.id\s*\]\s*,\s*trimmed\s*\)/);
    const logIdx = block.search(/actionType:\s*"rbt_assigned"/);
    expect(assignIdx).toBeGreaterThan(-1);
    expect(logIdx).toBeGreaterThan(-1);
    expect(assignIdx).toBeLessThan(logIdx);
  });

  it("AssignRbtDialog returns on assignRbt failure before logging or closing", () => {
    const block = src.slice(src.indexOf("export function AssignRbtDialog"), src.indexOf("export function StartDateDialog"));
    // Failure path must call toast.error with the durable-save copy and
    // return before logAction / success toast / onOpenChange(false).
    expect(block).toMatch(/Could not save assignment in Blossom OS/);
    // Ensure the catch block explicitly returns.
    expect(block).toMatch(/toast\.error\("Could not save assignment[\s\S]{0,300}return;/);
  });

  it("AdjustmentDialog awaits addScheduleSlot BEFORE any applied_local: true log", () => {
    const block = src.slice(src.indexOf("export function AdjustmentDialog"), src.indexOf("export function CoverageCaseDialog"));
    const slotIdx = block.search(/addScheduleSlot\(\s*client\.id\s*,\s*slot\s*\)/);
    const logAppliedIdx = block.search(/applied_local:\s*appliedLocal/);
    expect(slotIdx).toBeGreaterThan(-1);
    expect(logAppliedIdx).toBeGreaterThan(-1);
    expect(slotIdx).toBeLessThan(logAppliedIdx);
    // Must not hardcode applied_local: true from checkbox state.
    expect(block).not.toMatch(/applied_local:\s*applyLocal\s*&&\s*canApplyLocal\(\)/);
  });

  it("AdjustmentDialog failure path does not log applied_local: true", () => {
    const block = src.slice(src.indexOf("export function AdjustmentDialog"), src.indexOf("export function CoverageCaseDialog"));
    // The failure branch must return before writing the schedule_adjustment log.
    expect(block).toMatch(/Could not save schedule in Blossom OS[\s\S]{0,300}return;/);
  });

  it("SchedulingOverlayWarning component exists and reads schedulingOverlayError", () => {
    const p = "src/components/scheduling/SchedulingOverlayWarning.tsx";
    expect(existsSync(resolve(process.cwd(), p))).toBe(true);
    const c = read(p);
    expect(c).toMatch(/schedulingOverlayError/);
    expect(c).toMatch(/Scheduling overlay unavailable/);
  });

  it("OSSchedulingWorkspace renders SchedulingOverlayWarning", () => {
    const ws = read("src/pages/os/OSSchedulingWorkspace.tsx");
    expect(ws).toMatch(/import\s*\{\s*SchedulingOverlayWarning\s*\}\s*from\s*"@\/components\/scheduling\/SchedulingOverlayWarning"/);
    expect(ws).toMatch(/<SchedulingOverlayWarning\s*\/>/);
  });

  it("OSScheduling renders SchedulingOverlayWarning", () => {
    const sc = read("src/pages/os/OSScheduling.tsx");
    expect(sc).toMatch(/<SchedulingOverlayWarning\s*\/>/);
  });
});

describe("Scheduling Pass 7 — menu and route invariants", () => {
  const app = read("src/App.tsx");
  const menus = read("src/lib/os/roleMenus.ts");

  it("no /scheduling/reports route or menu entry", () => {
    expect(app).not.toMatch(/path="\/scheduling\/reports"/);
    expect(menus).not.toContain("/scheduling/reports");
  });

  it.skip("resolved Scheduling menu contains exactly one /reports item", async () => {
    const { ROLE_MENUS } = await import("@/lib/os/roleMenus");
    const menu = ROLE_MENUS.scheduling_team!;
    const paths = menu.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(paths.filter((p) => p === "/reports").length).toBe(1);
  });

  it("BCBA Productivity V3 and Cancellation Command Center remain mounted", () => {
    expect(app).toMatch(/path="\/reports\/bcba-productivity-report-v3"/);
    expect(app).toMatch(/path="\/reports\/cancellation-command-center"/);
  });

  it("/scheduling-team is a redirect only", () => {
    expect(app).toMatch(/path="\/scheduling-team"[\s\S]{0,160}Navigate to="\/scheduling"/);
  });
});