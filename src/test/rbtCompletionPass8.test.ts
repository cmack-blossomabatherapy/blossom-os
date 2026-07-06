import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { mergeRbtPathProgress } from "@/hooks/useMyRbtAcademyProgress";
import { RBT_PATHS } from "@/lib/training/rbtAcademy";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("RBT Pass 8 - track-safe progress isolation + final QA", () => {
  const notCertified = RBT_PATHS.find((p) => p.id === "not_certified")!;
  const certNoExp = RBT_PATHS.find((p) => p.id === "certified_no_experience")!;

  it("1. mergeRbtPathProgress ignores runtime rows whose track_id != active path", () => {
    const runtime = [
      { module_id: "welcome-1", source_module_id: "welcome-1", status: "completed",
        elapsed_seconds: 60, track_id: "not_certified" },
    ];
    const merged = mergeRbtPathProgress(certNoExp, null, runtime, "certified_no_experience");
    const w1 = merged.phases.flatMap((p) => p.modules).find((m) => m.id === "welcome-1")!;
    expect(w1.status).not.toBe("completed");
  });

  it("2. Completing welcome-1 on not_certified does NOT mark welcome-1 complete on certified_no_experience", () => {
    const runtime = [
      { module_id: "welcome-1", source_module_id: "welcome-1", status: "completed",
        elapsed_seconds: 120, track_id: "not_certified" },
    ];
    const other = mergeRbtPathProgress(certNoExp, null, runtime, "certified_no_experience");
    const w1Other = other.phases.flatMap((p) => p.modules).find((m) => m.id === "welcome-1")!;
    expect(w1Other.status).not.toBe("completed");

    const same = mergeRbtPathProgress(notCertified, null, runtime, "not_certified");
    const w1Same = same.phases.flatMap((p) => p.modules).find((m) => m.id === "welcome-1")!;
    expect(w1Same.status).toBe("completed");
  });

  it("3. Track-specific runtime rows win over legacy/null track rows", () => {
    const runtime = [
      { module_id: "welcome-1", source_module_id: "welcome-1", status: "in_progress",
        elapsed_seconds: 30, track_id: null },
      { module_id: "welcome-1", source_module_id: "welcome-1", status: "completed",
        elapsed_seconds: 300, track_id: "not_certified" },
    ];
    const merged = mergeRbtPathProgress(notCertified, null, runtime, "not_certified");
    const w1 = merged.phases.flatMap((p) => p.modules).find((m) => m.id === "welcome-1")!;
    expect(w1.status).toBe("completed");
  });

  it("3b. Null-track rows are used as fallback ONLY when no track-specific row exists", () => {
    const runtime = [
      { module_id: "welcome-2", source_module_id: "welcome-2", status: "completed",
        elapsed_seconds: 300, track_id: null },
    ];
    const merged = mergeRbtPathProgress(notCertified, null, runtime, "not_certified");
    const w2 = merged.phases.flatMap((p) => p.modules).find((m) => m.id === "welcome-2")!;
    expect(w2.status).toBe("completed");
  });

  it("4. useMyRbtAcademyProgress passes assigned track id into merge", () => {
    const src = read("src/hooks/useMyRbtAcademyProgress.ts");
    expect(src).toMatch(/mergeRbtPathProgress\(\s*base,\s*readinessModuleProgress,\s*runtimeRows,\s*assignedPathId\s*\)/);
    // Runtime query still scopes by journey.
    expect(src).toMatch(/\.eq\("journey_slug", "rbt"\)/);
  });

  it("5. useRbtReportSummaries computes RBT training progress using only the assigned track", () => {
    const src = read("src/hooks/useRbtReportSummaries.ts");
    expect(src).toMatch(/mergeRbtPathProgress\(\s*basePath,[\s\S]{0,120}pathId/);
    expect(src).toMatch(/track_id/);
  });

  it("6. /rbt/reports still redirects to /reports?audience=rbt", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/path="\/rbt\/reports"\s+element=\{<Navigate to="\/reports\?audience=rbt" replace \/>\}/);
  });

  it("7. Shared /reports still imports and uses useRbtReportSummaries", () => {
    const src = read("src/pages/os/reports/ReportsHome.tsx");
    expect(src).toMatch(/from "@\/hooks\/useRbtReportSummaries"/);
    expect(src).toMatch(/useRbtReportSummaries\(\)/);
  });

  it("8. BCBA Productivity Report V3 remains present", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/BcbaProductivityReportV3/);
    expect(app).toMatch(/path="\/reports\/bcba-productivity-report-v3"/);
  });

  it("9. State Director training journey remains present", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/path="\/training"/);
    expect(fs.existsSync(path.join(process.cwd(), "src/pages/os/OSTraining.tsx"))).toBeTruthy();
  });

  it("10. No new separate RBT reports page exists", () => {
    const reportsDir = path.join(process.cwd(), "src/pages/os/reports");
    const files = fs.readdirSync(reportsDir);
    const rbtPage = files.find(
      (f) => /^rbt/i.test(f) && (f.endsWith(".tsx") || f.endsWith(".ts")),
    );
    expect(rbtPage).toBeUndefined();
    // /rbt/reports must redirect, not render a page component.
    const app = read("src/App.tsx");
    expect(app).not.toMatch(/path="\/rbt\/reports"\s+element=\{<Rbt/);
  });

  it("CentralReach readiness fields exist on RBT sessions/help/supervision tables", () => {
    const dir = path.join(process.cwd(), "supabase/migrations");
    const all = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => fs.readFileSync(path.join(dir, f), "utf8"))
      .join("\n");
    expect(all).toMatch(/rbt_supervision[\s\S]*centralreach_sync_status/);
    expect(all).toMatch(/rbt_help_requests[\s\S]*centralreach_sync_status/);
    expect(all).toMatch(/(rbt_session_support_logs|rbt_sessions)[\s\S]*centralreach_sync_status/);
  });
});