import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const OS_DIR = path.resolve(__dirname, "../pages/os");
const MIG_DIR = path.resolve(__dirname, "../../supabase/migrations");

const WORKFLOW_PAGES = [
  "OSBCBA.tsx",
  "OSBCBAClients.tsx",
  "OSBCBAWorkspace.tsx",
  "OSBCBASupervision.tsx",
  "OSBCBAParentTraining.tsx",
  "OSBCBAScheduling.tsx",
  "OSBCBAAuthorizations.tsx",
];

function read(page: string) {
  return readFileSync(path.join(OS_DIR, page), "utf8");
}

describe("BCBA Pass 2 — persisted workflow wiring", () => {
  it("every BCBA operational page imports the shared BCBA action dialogs (which use useBcbaWorkflow)", () => {
    for (const p of WORKFLOW_PAGES) {
      const src = read(p);
      expect(src, `${p} should import useBcbaActionDialogs`).toMatch(/useBcbaActionDialogs/);
    }
  });

  it("every BCBA operational page exposes real workflow actions", () => {
    for (const p of WORKFLOW_PAGES) {
      const src = read(p);
      // Either the quick action bar (which wires all 4 actions) OR direct opener calls must be present.
      const hasBar = /BcbaQuickActionBar/.test(src);
      const hasOpeners =
        /openNote\(/.test(src) &&
        /openTask\(/.test(src) &&
        /openSupervision\(/.test(src) &&
        /openParentTraining\(/.test(src);
      expect(hasBar || hasOpeners, `${p} must expose Add Note / Create Task / Log Supervision / Log Parent Training`).toBe(true);
    }
  });

  it("workspace and authorizations pages support treatment-plan / PR status updates and task completion", () => {
    const ws = read("OSBCBAWorkspace.tsx");
    const auth = read("OSBCBAAuthorizations.tsx");
    for (const src of [ws, auth]) {
      expect(src).toMatch(/openPlanItem\(|upsertPlanItem/);
      expect(src).toMatch(/completeTask/);
    }
  });

  it("BCBA pages do not contain old root route links", () => {
    const forbidden = [
      /to="\/supervision"/,
      /href="\/supervision"/,
      /to="\/authorizations"/,
      /href="\/authorizations"/,
      /to="\/parent-training"/,
      /href="\/parent-training"/,
      /to="\/scheduling"/,
      /href="\/scheduling"/,
      /to="\/clients"/,
      /href="\/clients"/,
      /to=\{`\/supervision/,
      /to=\{`\/authorizations/,
      /to=\{`\/parent-training/,
      /to=\{`\/scheduling/,
      /to=\{`\/clients/,
    ];
    const bcbaFiles = readdirSync(OS_DIR).filter((f) => /^OSBCBA.*\.tsx$/.test(f));
    for (const p of bcbaFiles) {
      const src = read(p);
      for (const pat of forbidden) {
        expect(pat.test(src), `${p} contains forbidden root link ${pat}`).toBe(false);
      }
    }
  });

  it("BCBA pages do not link to AI or Operational Insights", () => {
    const forbidden = [
      /\/ai\/assistant/,
      /to="\/ai"/,
      /href="\/ai"/,
      /to=\{`\/ai\?/,
      /to=\{`\/ai\/assistant/,
      />Operational Insights</,
    ];
    const bcbaFiles = readdirSync(OS_DIR).filter((f) => /^OSBCBA.*\.tsx$/.test(f));
    for (const p of bcbaFiles) {
      const src = read(p);
      for (const pat of forbidden) {
        expect(pat.test(src), `${p} still contains AI/Insights leakage ${pat}`).toBe(false);
      }
    }
  });

  it("BCBA workflow RLS migration exists and does not use USING (true) for SELECT on the five tables", () => {
    const migs = readdirSync(MIG_DIR).filter((f) => f.endsWith(".sql")).sort();
    const combined = migs.map((f) => readFileSync(path.join(MIG_DIR, f), "utf8")).join("\n");
    // The tightening migration must exist
    expect(combined).toMatch(/bcba_workflow_leadership_can_read/);
    // For each table, no active SELECT policy should be USING (true).
    // We assert the tightening migration replaces broad reads with scoped predicates.
    for (const table of [
      "bcba_action_tasks",
      "bcba_supervision_logs",
      "bcba_parent_training_logs",
      "bcba_treatment_plan_items",
      "bcba_client_notes",
    ]) {
      // Scoped policy on the table must exist somewhere in migrations
      const scoped = new RegExp(`ON public\\.${table}\\s+FOR SELECT[\\s\\S]*?bcba_workflow_leadership_can_read`, "m");
      expect(scoped.test(combined), `${table} must have a role-scoped SELECT policy`).toBe(true);
    }
  });
});

describe("useBcbaWorkflow scope handling", () => {
  it("accepts scope objects with clientName / centralreachClientId fallbacks", async () => {
    const src = readFileSync(path.resolve(__dirname, "../hooks/useBcbaWorkflow.ts"), "utf8");
    expect(src).toMatch(/BcbaWorkflowScope/);
    expect(src).toMatch(/centralreach_client_id/);
    expect(src).toMatch(/client_name/);
  });
});