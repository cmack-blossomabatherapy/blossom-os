import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Scheduling Pass 5 — durable Scheduling overlay", () => {
  const ctx = read("src/contexts/ClientsContext.tsx");
  const hook = read("src/hooks/useSchedulingClientState.ts");

  it("ClientsContext no longer describes Scheduling-critical mutations as local-only only", () => {
    expect(ctx).not.toMatch(/mutations apply optimistically to\s+\/\/ local state only/);
    expect(ctx).toMatch(/persist to the durable Scheduling overlay tables/);
  });

  it("refetch() fetches scheduling_client_overrides and schedule slots", () => {
    expect(ctx).toContain("listSchedulingClientOverrides");
    expect(ctx).toContain("listSchedulingScheduleSlots");
    expect(ctx).toMatch(/Promise\.all\(\[\s*listSchedulingClientOverrides/);
  });

  it("assignRbt upserts to scheduling_client_overrides", () => {
    const block = ctx.slice(ctx.indexOf("const assignRbt"), ctx.indexOf("const setStartDate"));
    expect(block).toContain("upsertSchedulingClientOverride");
    expect(block).toMatch(/rbtName:\s*rbt/);
    expect(block).toMatch(/source:\s*"scheduling_assign_rbt"/);
  });

  it("setStartDate upserts to scheduling_client_overrides", () => {
    const block = ctx.slice(ctx.indexOf("const setStartDate"), ctx.indexOf("const toggleTask"));
    expect(block).toContain("upsertSchedulingClientOverride");
    expect(block).toMatch(/startDate:\s*date/);
    expect(block).toMatch(/source:\s*"scheduling_start_date"/);
  });

  it("addScheduleSlot upserts a slot into the overlay table", () => {
    const block = ctx.slice(ctx.indexOf("const addScheduleSlot"), ctx.indexOf("const removeScheduleSlot"));
    expect(block).toContain("upsertSchedulingScheduleSlot");
    expect(block).toContain("removeSchedulingScheduleSlotsByClientDay");
  });

  it("removeScheduleSlot deletes overlay slots for the client/day", () => {
    const block = ctx.slice(ctx.indexOf("const removeScheduleSlot"), ctx.indexOf("const setSchedule"));
    expect(block).toContain("removeSchedulingScheduleSlotsByClientDay");
  });

  it("setSchedule replaces overlay slots via setSchedulingSchedule", () => {
    const block = ctx.slice(ctx.indexOf("const setSchedule"));
    expect(block).toContain("setSchedulingSchedule");
  });

  it("does not write Monday/raw client ids into public.client_schedule_slots", () => {
    expect(ctx).not.toMatch(/from\(["']client_schedule_slots["']\)/);
  });

  it("never marks CentralReach synced from these UI paths", () => {
    expect(ctx).not.toMatch(/centralreach_sync_status:\s*['"]synced['"]/i);
    expect(hook).not.toMatch(/centralreach_sync_status:\s*['"]synced['"]/i);
    expect(hook).toMatch(/"not_ready"/);
  });
});

describe("Scheduling Pass 5 — page map and Reports rule intact", () => {
  const app = read("src/App.tsx");
  const menus = read("src/lib/os/roleMenus.ts");

  it("/scheduling-team remains a redirect only", () => {
    expect(app).toMatch(/path="\/scheduling-team"[\s\S]{0,160}Navigate to="\/scheduling"/);
    expect(menus).not.toContain("/scheduling-team");
  });

  it("Reports home stays canonical and /scheduling/reports is absent", () => {
    expect(menus).not.toContain("/scheduling/reports");
    expect(menus).toContain('"/reports"');
    expect(app).toMatch(/path="\/reports\/bcba-productivity-report-v3"/);
    expect(app).toMatch(/path="\/reports\/cancellation-command-center"/);
  });
});