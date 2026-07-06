import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("RBT Pass 7 - durable progress truth + shared reports integration + runtime safety", () => {
  /* ------------------------- FIX 1: Academy page ------------------------- */

  it("OSRBTTrainingAcademy no longer computes visible learner progress from pathStats(path) alone", () => {
    const src = read("src/pages/os/OSRBTTrainingAcademy.tsx");
    // The page must not re-derive stats from the static RBT_PATHS entry
    // via `pathStats(path)` at the top of the component — merged progress
    // comes from useMyRbtAcademyProgress.
    expect(src).not.toMatch(/const stats = useMemo\(\(\) => pathStats\(path\), \[path\]\)/);
    expect(src).toMatch(/useMyRbtAcademyProgress/);
    expect(src).toMatch(/merged\.state/);
  });

  it("Academy page merges rbt_readiness_records and academy_runtime_progress via the new hook", () => {
    const hook = read("src/hooks/useMyRbtAcademyProgress.ts");
    expect(hook).toMatch(/rbt_readiness_records/);
    expect(hook).toMatch(/academy_runtime_progress/);
    expect(hook).toMatch(/\.eq\("journey_slug", "rbt"\)/);
    expect(hook).toMatch(/export function mergeRbtPathProgress/);
    expect(hook).toMatch(/module_progress/);
  });

  it("A regular RBT with no readiness record gets a setup state, not a silent certified_no_experience default", () => {
    const src = read("src/pages/os/OSRBTTrainingAcademy.tsx");
    expect(src).toMatch(/UnassignedSetupState/);
    expect(src).toMatch(/Your RBT training path has not been assigned yet/);
    // The old default assignment fallback is gone from the component body.
    expect(src).not.toMatch(/setAssignedPath\(\{ id: "certified_no_experience"/);
  });

  /* ---------------------- FIX 2: runtimeStore key ----------------------- */

  it("runtimeStore uses a journey + track + module cache key, not moduleId-only", () => {
    const src = read("src/lib/academy/runtimeStore.ts");
    expect(src).toMatch(/export function runtimeKey\(/);
    expect(src).toMatch(/\$\{journey\}::\$\{track\}::\$\{moduleId\}/);
    // getRuntimeRecord + pushLocal read from the composite key, not the bare moduleId.
    expect(src).toMatch(/memory\[runtimeKey\(moduleId, ctx\)\]/);
    expect(src).not.toMatch(/memory\[moduleId\] \?\?/);
  });

  it("fetchRuntimeRow filters by track_id in addition to user + journey + module", () => {
    const src = read("src/lib/academy/runtimeStore.ts");
    expect(src).toMatch(/\.eq\("user_id", userId\)/);
    expect(src).toMatch(/\.eq\("module_id", moduleId\)/);
    expect(src).toMatch(/\.eq\("journey_slug", ctx\.journeySlug\)/);
    expect(src).toMatch(/\.eq\("track_id", ctx\.trackId\)/);
    expect(src).toMatch(/\.is\("track_id", null\)/);
  });

  /* ---------------------- FIX 3: RLS tightening ------------------------ */

  it("academy_runtime_progress admin update policy has both USING and WITH CHECK", () => {
    const dir = path.join(process.cwd(), "supabase/migrations");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql"));
    // The most recent migration mentioning the admin_update policy must add WITH CHECK.
    const relevant = files
      .map((f) => ({ f, sql: fs.readFileSync(path.join(dir, f), "utf8") }))
      .filter(({ sql }) => sql.includes("academy_runtime_progress_admin_update"))
      .sort((a, b) => a.f.localeCompare(b.f));
    expect(relevant.length).toBeGreaterThan(0);
    const latest = relevant[relevant.length - 1].sql;
    // The latest migration must define admin_update WITH CHECK.
    const policyBlock = latest.split(/CREATE POLICY academy_runtime_progress_admin_update/).pop() ?? "";
    expect(policyBlock).toMatch(/USING\s*\(/);
    expect(policyBlock).toMatch(/WITH CHECK\s*\(/);
  });

  /* --------------------- FIX 4: Shared /reports wiring ------------------- */

  it("ReportsHome imports and uses useRbtReportSummaries", () => {
    const src = read("src/pages/os/reports/ReportsHome.tsx");
    expect(src).toMatch(/from "@\/hooks\/useRbtReportSummaries"/);
    expect(src).toMatch(/const rbtSummaries = useRbtReportSummaries\(\)/);
    expect(src).toMatch(/rbtSummaries\.summaries/);
  });

  it("useRbtReportSummaries selects sync_status from academy_runtime_progress", () => {
    const src = read("src/hooks/useRbtReportSummaries.ts");
    expect(src).toMatch(/sync_status/);
    expect(src).toMatch(/academy_runtime_progress/);
  });

  it("RBT training progress denominator comes from the assigned path total, not runtimeRows.length only", () => {
    const src = read("src/hooks/useRbtReportSummaries.ts");
    expect(src).toMatch(/RBT_PATHS/);
    expect(src).toMatch(/mergeRbtPathProgress/);
    // The old naive denominator (runtimeRows.length as the sole source) is gone.
    expect(src).not.toMatch(/\(done \/ runtimeRows\.length\) \* 100/);
  });

  /* ------------------- FIX 5: No misleading mock wording ----------------- */

  it("ReportDetail no longer claims 'live mock data'", () => {
    const src = read("src/pages/os/reports/ReportDetail.tsx");
    expect(src).not.toMatch(/live mock data/i);
    expect(src).toMatch(/Live report shell|connect source data to populate/i);
  });

  /* ------------------- Preserve prior work / contracts ------------------ */

  it("/rbt/reports still redirects to /reports?audience=rbt", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/path="\/rbt\/reports"\s+element=\{<Navigate to="\/reports\?audience=rbt" replace \/>\}/);
  });

  it("BCBA Productivity Report V3 remains available and visible", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/BcbaProductivityReportV3/);
    expect(app).toMatch(/path="\/reports\/bcba-productivity-report-v3"/);
  });

  it("State Director training journey routes/files remain preserved", () => {
    const app = read("src/App.tsx");
    // The training journey lives at /training for State Director / Assistant SD.
    expect(app).toMatch(/path="\/training"/);
    expect(fs.existsSync(path.join(process.cwd(), "src/pages/os/OSTraining.tsx"))).toBeTruthy();
  });
});
