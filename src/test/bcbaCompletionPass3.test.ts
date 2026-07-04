import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("BCBA Pass 3 — consolidated hardening", () => {
  it("migration adds centralreach_sync_status to all five BCBA workflow tables", () => {
    const dir = "supabase/migrations";
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql"));
    const combined = files.map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
    for (const t of [
      "bcba_action_tasks",
      "bcba_supervision_logs",
      "bcba_parent_training_logs",
      "bcba_treatment_plan_items",
      "bcba_client_notes",
    ]) {
      expect(combined).toMatch(new RegExp(`ALTER TABLE public\\.${t}[\\s\\S]*centralreach_sync_status`));
      expect(combined).toMatch(new RegExp(`ADD TABLE public\\.${t}`));
    }
  });

  it("useBcbaWorkflow subscribes to realtime and exposes metrics", () => {
    const src = read("src/hooks/useBcbaWorkflow.ts");
    expect(src).toMatch(/supabase[\s\S]{0,20}\.channel\(/);
    expect(src).toMatch(/postgres_changes/);
    expect(src).toMatch(/removeChannel/);
    expect(src).toMatch(/pendingCentralReachSync/);
    expect(src).toMatch(/supervisionLogs30d/);
    expect(src).toMatch(/parentTrainingLogs30d/);
    expect(src).toMatch(/openPlanItems/);
  });

  it("shared CentralReach badge component exists", () => {
    const src = read("src/components/bcba/BcbaCentralReachBadge.tsx");
    expect(src).toMatch(/BcbaCentralReachBadge/);
    expect(src).toMatch(/BcbaCentralReachSummaryBadge/);
    // Honest defaults — never claims "synced" unless status is synced.
    expect(src).toMatch(/pending_import/);
  });

  it("BCBA workspace surfaces the CentralReach summary badge", () => {
    const src = read("src/pages/os/OSBCBAWorkspace.tsx");
    expect(src).toMatch(/BcbaCentralReachSummaryBadge/);
    expect(src).toMatch(/pendingCentralReachSync/);
  });

  it("BCBA Productivity Report shows Blossom OS workflow signals alongside CR data", () => {
    const src = read("src/pages/os/reports/BcbaProductivityReport.tsx");
    expect(src).toMatch(/useBcbaWorkflow/);
    expect(src).toMatch(/BcbaWorkflowSignalsInline/);
    expect(src).toMatch(/BcbaCentralReachSummaryBadge/);
  });

  it("BCBA workflow RLS remains scoped (Pass 2 policies still in place)", () => {
    const dir = "supabase/migrations";
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql"));
    const combined = files.map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
    expect(combined).toMatch(/bcba_workflow_leadership_can_read/);
    expect(combined).toMatch(/BCBA action tasks scoped read/);
  });
});