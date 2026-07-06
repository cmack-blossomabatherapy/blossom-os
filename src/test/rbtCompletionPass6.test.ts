import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("RBT Pass 6 - durable academy runtime + assigned learner path + live reports", () => {
  it("runtimeStore no longer claims localStorage is the source of truth", () => {
    const src = read("src/lib/academy/runtimeStore.ts");
    expect(src).not.toMatch(/localStorage is the runtime source of truth/i);
    expect(src).not.toMatch(/temporary bridge/i);
    expect(src).toMatch(/Source of truth: `public\.academy_runtime_progress`/);
  });

  it("runtimeStore writes to public.academy_runtime_progress and threads a RuntimeContext", () => {
    const src = read("src/lib/academy/runtimeStore.ts");
    expect(src).toMatch(/academy_runtime_progress/);
    expect(src).toMatch(/export interface RuntimeContext/);
    expect(src).toMatch(/export async function startRuntime\(moduleId: string, ctx: RuntimeContext\)/);
    expect(src).toMatch(/export async function completeRuntime\(moduleId: string, ctx: RuntimeContext\)/);
    expect(src).toMatch(/persistRuntimeElapsed/);
    expect(src).toMatch(/hydrateRuntime/);
  });

  it("TrainingModuleRuntime page uses the Supabase-backed runtime API with context", () => {
    const src = read("src/pages/academy/TrainingModuleRuntime.tsx");
    expect(src).toMatch(/RuntimeContext/);
    expect(src).toMatch(/persistRuntimeElapsed\(decodedId, runtimeCtx\)/);
    expect(src).toMatch(/startRuntime\(decodedId, runtimeCtx\)/);
    expect(src).toMatch(/completeRuntime\(decodedId, runtimeCtx\)/);
    expect(src).not.toMatch(/stored in localStorage via the/);
  });

  it("readiness sync helper mirrors runtime progress into rbt_readiness_records for the current user", () => {
    const src = read("src/lib/training/rbtReadinessSync.ts");
    expect(src).toMatch(/syncReadinessModuleProgress/);
    expect(src).toMatch(/rbt_readiness_records/);
    expect(src).toMatch(/module_progress/);
    expect(src).toMatch(/nextRequiredModule/);
  });

  it("RBT Academy home reads the assigned path from rbt_readiness_records", () => {
    const src = read("src/pages/os/OSRBTTrainingAcademy.tsx");
    expect(src).toMatch(/from\("rbt_readiness_records"\)/);
    expect(src).toMatch(/assignedPath/);
    // Regular RBTs no longer default to certified_no_experience without a lookup.
    expect(src).toMatch(/Your assigned path|Admin preview - assigned path/);
    // Admin preview control is present.
    expect(src).toMatch(/Admin preview - assigned path/);
  });

  it("useRbtReportSummaries hook exists and queries the durable runtime + readiness + prefs tables", () => {
    const src = read("src/hooks/useRbtReportSummaries.ts");
    expect(src).toMatch(/export function useRbtReportSummaries/);
    expect(src).toMatch(/academy_runtime_progress/);
    expect(src).toMatch(/rbt_readiness_records/);
    expect(src).toMatch(/rbt_resource_prefs/);
  });

  it("migration adds public.academy_runtime_progress with RLS and role-scoped admin policies", () => {
    const dir = "supabase/migrations";
    const combined = fs.readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => fs.readFileSync(path.join(dir, f), "utf8"))
      .join("\n");
    expect(combined).toMatch(/CREATE TABLE IF NOT EXISTS public\.academy_runtime_progress/);
    expect(combined).toMatch(/GRANT SELECT, INSERT, UPDATE, DELETE ON public\.academy_runtime_progress TO authenticated/);
    expect(combined).toMatch(/ENABLE ROW LEVEL SECURITY[\s\S]{0,400}academy_runtime_progress/);
    expect(combined).toMatch(/academy_runtime_progress_own_(select|insert|update)/);
    expect(combined).toMatch(/academy_runtime_progress_admin_(select|update)/);
    expect(combined).toMatch(/training_admin/);
    expect(combined).toMatch(/centralreach_id\s+text/);
  });

  it("preserves canonical /reports, /rbt/reports redirect, BCBA Productivity Report, and State Director training", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/\/rbt\/reports[\s\S]{0,200}Navigate to=\"\/reports\?audience=rbt\"/);
    const catalog = read("src/lib/os/reportsCatalog.ts");
    expect(catalog).toMatch(/bcba-productivity/i);
    expect(fs.existsSync("src/pages/os/stateDirector/StateDirectorPages.tsx")).toBe(true);
  });
});