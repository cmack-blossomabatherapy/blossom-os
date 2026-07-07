import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { mergeRbtPathProgress } from "@/hooks/useMyRbtAcademyProgress";
import { RBT_PATHS } from "@/lib/training/rbtAcademy";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

// ---------------- Supabase client mock (shared) ----------------
let capturedUpdate: any = null;
let readinessRow: any = null;

vi.mock("@/integrations/supabase/client", () => {
  const chain = (rows: any[]) => {
    const api: any = {
      select: () => api,
      eq: () => api,
      limit: () => Promise.resolve({ data: rows, error: null }),
      update: (patch: any) => {
        capturedUpdate = patch;
        return { eq: () => Promise.resolve({ data: null, error: null }) };
      },
    };
    return api;
  };
  return {
    supabase: {
      from: () => chain(readinessRow ? [readinessRow] : []),
    },
  };
});

import { syncReadinessModuleProgress } from "@/lib/training/rbtReadinessSync";

describe("RBT Pass 9 - track-safe readiness module_progress", () => {
  const notCertified = RBT_PATHS.find((p) => p.id === "not_certified")!;
  const certNoExp = RBT_PATHS.find((p) => p.id === "certified_no_experience")!;

  beforeEach(() => {
    capturedUpdate = null;
    readinessRow = null;
  });

  it("1. byTrack readiness on not_certified does NOT complete welcome-1 on certified_no_experience", () => {
    const mp = {
      byTrack: {
        not_certified: { "welcome-1": { status: "completed", progress: 100 } },
      },
    };
    const other = mergeRbtPathProgress(certNoExp, mp as any, [], "certified_no_experience");
    const w1 = other.phases.flatMap((p) => p.modules).find((m) => m.id === "welcome-1")!;
    expect(w1.status).not.toBe("completed");

    const same = mergeRbtPathProgress(notCertified, mp as any, [], "not_certified");
    const w1Same = same.phases.flatMap((p) => p.modules).find((m) => m.id === "welcome-1")!;
    expect(w1Same.status).toBe("completed");
  });

  it("2. Legacy top-level module_progress is used only as fallback when no active-track entry exists", () => {
    const mp = {
      "welcome-2": { status: "completed", progress: 100 },
      byTrack: {
        not_certified: { "welcome-1": { status: "in_progress", progress: 50 } },
      },
    };
    const merged = mergeRbtPathProgress(notCertified, mp as any, [], "not_certified");
    const modules = merged.phases.flatMap((p) => p.modules);
    // Active-track wins for welcome-1
    const w1 = modules.find((m) => m.id === "welcome-1")!;
    expect(w1.status).toBe("in_progress");
    // Legacy fallback fills welcome-2 since byTrack has no entry
    const w2 = modules.find((m) => m.id === "welcome-2");
    if (w2) expect(w2.status).toBe("completed");
  });

  it("3. Active-track readiness beats a differently-keyed legacy entry", () => {
    const mp = {
      "welcome-1": { status: "completed", progress: 100 },
      byTrack: {
        not_certified: { "welcome-1": { status: "in_progress", progress: 50 } },
      },
    };
    const merged = mergeRbtPathProgress(notCertified, mp as any, [], "not_certified");
    const w1 = merged.phases.flatMap((p) => p.modules).find((m) => m.id === "welcome-1")!;
    expect(w1.status).toBe("in_progress");
  });

  it("4. Runtime rows still beat readiness rows on the same track", () => {
    const mp = {
      byTrack: { not_certified: { "welcome-1": { status: "in_progress", progress: 50 } } },
    };
    const runtime = [{
      module_id: "welcome-1", source_module_id: "welcome-1",
      status: "completed", elapsed_seconds: 100, track_id: "not_certified",
    }];
    const merged = mergeRbtPathProgress(notCertified, mp as any, runtime, "not_certified");
    const w1 = merged.phases.flatMap((p) => p.modules).find((m) => m.id === "welcome-1")!;
    expect(w1.status).toBe("completed");
  });

  it("5. syncReadinessModuleProgress writes into byTrack[activeTrack]", async () => {
    readinessRow = { id: "rr1", path_id: "not_certified", current_module_id: "welcome-1", current_phase_index: 0, module_progress: {} };
    await syncReadinessModuleProgress("uid1", "welcome-1", { status: "completed" }, "not_certified");
    expect(capturedUpdate?.module_progress?.byTrack?.not_certified?.["welcome-1"]?.status).toBe("completed");
    // Advanced current_module_id because activeTrack === path_id
    expect(capturedUpdate).toHaveProperty("current_module_id");
  });

  it("6. syncReadinessModuleProgress does NOT advance current_module_id when trackId differs from path_id", async () => {
    readinessRow = { id: "rr1", path_id: "certified_no_experience", current_module_id: "welcome-1", current_phase_index: 0, module_progress: {} };
    await syncReadinessModuleProgress("uid1", "welcome-1", { status: "completed" }, "not_certified");
    expect(capturedUpdate?.module_progress?.byTrack?.not_certified?.["welcome-1"]?.status).toBe("completed");
    expect(capturedUpdate?.module_progress?.byTrack?.certified_no_experience).toBeUndefined();
    expect(capturedUpdate.current_module_id).toBeUndefined();
  });

  it("7. runtimeStore startRuntime/completeRuntime pass trackId into readiness sync", () => {
    const src = read("src/lib/academy/runtimeStore.ts");
    // Both call sites must forward ctx.trackId as the 4th arg
    const startBlock = src.slice(src.indexOf("startRuntime"));
    const completeBlock = src.slice(src.indexOf("completeRuntime"));
    expect(startBlock).toMatch(/syncReadinessModuleProgress\([\s\S]*?,\s*ctx\.trackId\s*\?\?\s*null\s*\)/);
    expect(completeBlock).toMatch(/syncReadinessModuleProgress\([\s\S]*?,\s*ctx\.trackId\s*\?\?\s*null\s*\)/);
  });

  it("8. RLS migration adds own-row UPDATE policy for rbt_readiness_records with USING and WITH CHECK", () => {
    const dir = path.join(process.cwd(), "supabase/migrations");
    const all = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => fs.readFileSync(path.join(dir, f), "utf8"))
      .join("\n");
    expect(all).toMatch(/CREATE POLICY[\s\S]*rbt_readiness_records[\s\S]*FOR UPDATE[\s\S]*USING\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\)[\s\S]*WITH CHECK\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\)/i);
  });

  it("9. useRbtReportSummaries filters CentralReach sync rows by active RBT track", () => {
    const src = read("src/hooks/useRbtReportSummaries.ts");
    expect(src).toMatch(/r\.track_id === pathId/);
    expect(src).toMatch(/track_id \?\? null\) === null/);
  });

  it("10. /rbt/reports still redirects to /reports?audience=rbt and no separate page exists", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/path="\/rbt\/reports"\s+element=\{<Navigate to="\/reports\?audience=rbt" replace \/>\}/);
    const reportsDir = path.join(process.cwd(), "src/pages/os/reports");
    const rbtPage = fs.readdirSync(reportsDir).find(
      (f) => /^rbt/i.test(f) && (f.endsWith(".tsx") || f.endsWith(".ts")),
    );
    expect(rbtPage).toBeUndefined();
  });
});