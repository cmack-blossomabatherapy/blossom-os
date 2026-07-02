import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Scheduling Pass 6 — no false success on overlay persist failure", () => {
  const ctx = read("src/contexts/ClientsContext.tsx");
  const dialogs = read("src/components/scheduling/SchedulingDialogs.tsx");

  it("ClientsContext no longer swallows Scheduling overlay persist failures with console.warn only", () => {
    expect(ctx).not.toMatch(/console\.warn\(\s*["']assignRbt overlay persist failed/);
    expect(ctx).not.toMatch(/console\.warn\(\s*["']setStartDate overlay persist failed/);
    expect(ctx).not.toMatch(/console\.warn\(\s*["']addScheduleSlot overlay persist failed/);
    expect(ctx).not.toMatch(/console\.warn\(\s*["']removeScheduleSlot overlay persist failed/);
    expect(ctx).not.toMatch(/console\.warn\(\s*["']setSchedule overlay persist failed/);
  });

  it("assignRbt persists to overlay BEFORE mutating local state (persist-first)", () => {
    const block = ctx.slice(ctx.indexOf("const assignRbt"), ctx.indexOf("const setStartDate"));
    const upsertIdx = block.indexOf("upsertSchedulingClientOverride");
    const applyIdx = block.indexOf("applyPatch(id, { rbt");
    expect(upsertIdx).toBeGreaterThan(-1);
    expect(applyIdx).toBeGreaterThan(-1);
    expect(upsertIdx).toBeLessThan(applyIdx);
  });

  it("setStartDate persists to overlay BEFORE mutating local state (persist-first)", () => {
    const block = ctx.slice(ctx.indexOf("const setStartDate"), ctx.indexOf("const toggleTask"));
    const upsertIdx = block.indexOf("upsertSchedulingClientOverride");
    const applyIdx = block.indexOf("applyPatch(id, { startDate");
    expect(upsertIdx).toBeGreaterThan(-1);
    expect(applyIdx).toBeGreaterThan(-1);
    expect(upsertIdx).toBeLessThan(applyIdx);
  });

  it("addScheduleSlot persists to overlay BEFORE mutating local state", () => {
    const block = ctx.slice(ctx.indexOf("const addScheduleSlot"), ctx.indexOf("const removeScheduleSlot"));
    const upsertIdx = block.indexOf("upsertSchedulingScheduleSlot");
    const setStateIdx = block.indexOf("setClients((prev) =>");
    expect(upsertIdx).toBeGreaterThan(-1);
    expect(setStateIdx).toBeGreaterThan(-1);
    expect(upsertIdx).toBeLessThan(setStateIdx);
  });

  it("ClientsContext exposes schedulingOverlayError so pages can warn on stale data", () => {
    expect(ctx).toMatch(/schedulingOverlayError/);
    expect(ctx).toMatch(/setSchedulingOverlayError/);
  });

  it("AssignRbtDialog shows explicit error toast on durable failure and does not close", () => {
    const start = dialogs.indexOf("export function AssignRbtDialog");
    const end = dialogs.indexOf("export function StartDateDialog");
    const block = dialogs.slice(start, end);
    expect(block).toMatch(/Could not save assignment in Blossom OS/);
    // error path must return before closing / success-toasting
    const errIdx = block.indexOf("Could not save assignment in Blossom OS");
    const successIdx = block.indexOf("Paired ");
    expect(errIdx).toBeLessThan(successIdx);
  });

  it("StartDateDialog shows explicit error toast on durable failure and does not close", () => {
    const start = dialogs.indexOf("export function StartDateDialog");
    const block = dialogs.slice(start);
    expect(block).toMatch(/Could not save start date in Blossom OS/);
  });

  it("AdjustmentDialog surfaces overlay failure instead of falsely claiming Saved and applied", () => {
    const start = dialogs.indexOf("export function AdjustmentDialog");
    const end = dialogs.indexOf("export function CoverageCaseDialog");
    const block = dialogs.slice(start, end);
    expect(block).toMatch(/Could not save schedule in Blossom OS/);
  });
});

describe("Scheduling Pass 6 — overlay RLS is permission-scoped", () => {
  // Find the most recent migration that touches scheduling overlay policies.
  const dir = resolve(process.cwd(), "supabase/migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql"));
  const corpus = files
    .map((f) => ({ f, body: readFileSync(resolve(dir, f), "utf8") }))
    .filter((x) => /scheduling_client_overrides|scheduling_client_schedule_slots/.test(x.body));
  const latest = corpus[corpus.length - 1];

  it("has a migration that drops the broad USING(true) SELECT policies", () => {
    const all = corpus.map((c) => c.body).join("\n");
    expect(all).toMatch(/DROP POLICY IF EXISTS "sched_overrides_select_authenticated"/);
    expect(all).toMatch(/DROP POLICY IF EXISTS "sched_slots_select_authenticated"/);
  });

  it("adds permission-scoped SELECT policies using has_permission(scheduling.view or clients.view)", () => {
    expect(latest, "no scheduling overlay migration found").toBeTruthy();
    const body = latest!.body;
    expect(body).toMatch(/CREATE POLICY "sched_overrides_select_with_permission"/);
    expect(body).toMatch(/CREATE POLICY "sched_slots_select_with_permission"/);
    expect(body).toMatch(/has_permission\(auth\.uid\(\),\s*'scheduling\.view'\)/);
    expect(body).toMatch(/has_permission\(auth\.uid\(\),\s*'clients\.view'\)/);
    // Must not reintroduce deprecated auth.role().
    expect(body).not.toMatch(/auth\.role\(\)/);
  });
});

describe("Scheduling Pass 6 — route/report invariants intact", () => {
  const app = read("src/App.tsx");
  const menus = read("src/lib/os/roleMenus.ts");

  it("/scheduling-team remains redirect-only", () => {
    expect(app).toMatch(/path="\/scheduling-team"[\s\S]{0,160}Navigate to="\/scheduling"/);
    expect(menus).not.toContain("/scheduling-team");
  });

  it("/reports remains canonical and /scheduling/reports is absent", () => {
    expect(menus).not.toContain("/scheduling/reports");
    expect(app).toMatch(/path="\/reports\/bcba-productivity-report-v3"/);
    expect(app).toMatch(/path="\/reports\/cancellation-command-center"/);
  });
});