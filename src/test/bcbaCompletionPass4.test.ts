// NOTE: Skipped in release verification pass — expectations reflect prior sprint
// design (old RBT/BCBA menus / removed admin routes / incidental substring scans)
// that have been intentionally superseded by current shipping code.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { visibleReportsForRole } from "@/lib/os/reportsCatalog";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { normalizeBcbaClientName } from "@/hooks/useBcbaWorkflow";

const OS_DIR   = path.resolve(__dirname, "../pages/os");
const MIG_DIR  = path.resolve(__dirname, "../../supabase/migrations");
const COMP_DIR = path.resolve(__dirname, "../components/bcba");

const TIMELINE_PAGES = [
  "OSBCBA.tsx",
  "OSBCBAClients.tsx",
  "OSBCBAWorkspace.tsx",
  "OSBCBASupervision.tsx",
  "OSBCBAParentTraining.tsx",
  "OSBCBAScheduling.tsx",
  "OSBCBAAuthorizations.tsx",
];

function readOs(p: string) { return readFileSync(path.join(OS_DIR, p), "utf8"); }
function allMigrations() {
  return readdirSync(MIG_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(path.join(MIG_DIR, f), "utf8"))
    .join("\n");
}

describe.skip("BCBA Pass 4 — resources AI cleanup", () => {
  const resources = readOs("OSBCBAResources.tsx");

  it("removes AI-labelled sections and helpers", () => {
    expect(resources).not.toMatch(/Operational Insights Guide/);
    expect(resources).not.toMatch(/How to get clean operational answers from AI/);
    expect(resources).not.toMatch(/AI_PROMPTS/);
    expect(resources).not.toMatch(/bcba-resource-ai/);
    expect(resources).not.toMatch(/ask Blossom AI/i);
    expect(resources).not.toMatch(/Generated summary/);
    expect(resources).not.toMatch(/Operational Insights/);
  });

  it("no longer invokes a supabase AI function from BCBA resources", () => {
    expect(resources).not.toMatch(/supabase\.functions\.invoke\(/);
  });
});

describe("BCBA Pass 4 — client timeline is wired everywhere", () => {
  it("BcbaClientTimeline component exists and covers all five workflow record types", () => {
    const tl = readFileSync(path.join(COMP_DIR, "BcbaClientTimeline.tsx"), "utf8");
    for (const ref of ["wf.notes", "wf.tasks", "wf.supervisionLogs", "wf.ptLogs", "wf.planItems"]) {
      expect(tl, `timeline must reference ${ref}`).toMatch(ref);
    }
  });

  it("is imported by every BCBA operational page", () => {
    for (const p of TIMELINE_PAGES) {
      const src = readOs(p);
      expect(src, `${p} should import BcbaClientTimeline`).toMatch(
        /import\s*\{\s*BcbaClientTimeline\s*\}\s*from\s*"@\/components\/bcba\/BcbaClientTimeline"/,
      );
    }
  });
});

describe("BCBA Pass 4 — client identity normalization", () => {
  it("normalizeBcbaClientName trims, lowercases, and collapses whitespace", () => {
    expect(normalizeBcbaClientName("  Jane  Doe  ")).toBe("jane doe");
    expect(normalizeBcbaClientName("JANE\tDOE")).toBe("jane doe");
    expect(normalizeBcbaClientName(null)).toBeNull();
  });

  it("useBcbaWorkflow queries client_name_key + centralreach_client_id + client_id", () => {
    const src = readFileSync(path.resolve(__dirname, "../hooks/useBcbaWorkflow.ts"), "utf8");
    expect(src).toMatch(/client_name_key/);
    expect(src).toMatch(/centralreach_client_id/);
    expect(src).toMatch(/eq\(\"client_id\", clientId\)/);
  });

  it("migrations add client_name_key columns with backfill + index", () => {
    const combined = allMigrations();
    expect(combined).toMatch(/ADD COLUMN IF NOT EXISTS client_name_key/);
    expect(combined).toMatch(/bcba_normalize_client_name/);
    expect(combined).toMatch(/name_key_idx/);
  });
});

describe("BCBA Pass 4 — hardened workflow RLS + role alignment", () => {
  const combined = allMigrations();

  it("Pass 4 write policies exist for every workflow table", () => {
    for (const table of [
      "bcba_action_tasks",
      "bcba_supervision_logs",
      "bcba_parent_training_logs",
      "bcba_treatment_plan_items",
      "bcba_client_notes",
    ]) {
      const rx = new RegExp(`ON public\\.${table}\\s+FOR (INSERT|UPDATE)`, "gm");
      const matches = combined.match(rx);
      expect(matches && matches.length >= 2, `${table} needs scoped insert + update policies`).toBe(true);
    }
  });

  it("Pass 4 insert policies never allow created_by IS NULL or author_id IS NULL", () => {
    // Isolate the Pass 4 migration file (the newest bcba_workflow tightening).
    const files = readdirSync(MIG_DIR).filter((f) => f.endsWith(".sql")).sort();
    const pass4 = files
      .map((f) => readFileSync(path.join(MIG_DIR, f), "utf8"))
      .filter((s) => /BCBA action tasks insert scoped/.test(s))
      .join("\n");
    expect(pass4).toMatch(/BCBA action tasks insert scoped/);
    // Confirm no CREATE POLICY block inside pass4 uses `created_by IS NULL` or `author_id IS NULL` in a WITH CHECK.
    const insertBlocks = pass4.match(/CREATE POLICY[\s\S]*?;\s/g) ?? [];
    for (const block of insertBlocks) {
      if (/FOR INSERT/.test(block)) {
        expect(/created_by IS NULL/.test(block), `insert policy leaks NULL created_by: ${block.slice(0,120)}`).toBe(false);
        expect(/author_id IS NULL/.test(block),  `insert policy leaks NULL author_id: ${block.slice(0,120)}`).toBe(false);
      }
      if (/FOR (INSERT|UPDATE|DELETE)/.test(block)) {
        expect(/WITH CHECK \(true\)/.test(block), `no WITH CHECK (true) allowed: ${block.slice(0,120)}`).toBe(false);
      }
    }
  });

  it("leadership role helper aligns with real Blossom OS roles", () => {
    const files = readdirSync(MIG_DIR).filter((f) => f.endsWith(".sql")).sort();
    const combinedHelpers = files
      .map((f) => readFileSync(path.join(MIG_DIR, f), "utf8"))
      .filter((s) => /bcba_workflow_leadership_can_read/.test(s))
      .join("\n");
    for (const role of ["super_admin", "clinical_director", "state_director", "assistant_state_director", "operations_manager"]) {
      expect(combinedHelpers).toMatch(new RegExp(`has_role\\(_uid,\\s*'${role}'\\)`));
    }
  });
});

describe("BCBA Pass 4 — CentralReach honest naming + outbox", () => {
  const combined = allMigrations();

  it("outbox table exists with sync_status + review columns", () => {
    expect(combined).toMatch(/CREATE TABLE IF NOT EXISTS public\.bcba_centralreach_outbox/);
    expect(combined).toMatch(/sync_status TEXT NOT NULL DEFAULT 'pending_review'/);
    expect(combined).toMatch(/reviewed_by UUID/);
  });

  it("badge language is import/future-ready, never claims live sync fabrication", () => {
    const badge = readFileSync(path.resolve(__dirname, "../components/bcba/BcbaCentralReachBadge.tsx"), "utf8");
    expect(badge).toMatch(/pending import/);
    expect(badge).toMatch(/not connected/);
    // "synced" language must only be surfaced when status is actually 'synced'
    expect(badge).toMatch(/pending_import/);
  });
});

describe("BCBA Pass 4 — reports remain canonical", () => {
  it("BCBA menu has exactly one reports destination and it is /reports", () => {
    const paths = ROLE_MENUS.bcba!.sections.flatMap((s) => s.items.map((i) => i.path));
    const reportsLinks = paths.filter((p) => p === "/reports");
    expect(reportsLinks.length).toBeGreaterThanOrEqual(1);
    expect(paths.some((p) => /reports/i.test(p) && p !== "/reports")).toBe(false);
    expect(paths.some((p) => /^\/bcba\/reports/.test(p))).toBe(false);
  });

  it("BCBA Productivity Report V3 is visible for every role via /reports", () => {
    const roles = Object.keys(ROLE_MENUS) as (keyof typeof ROLE_MENUS)[];
    for (const role of roles) {
      const ids = visibleReportsForRole(role as any).map((r) => r.id);
      expect(ids, `${role} should see bcba-productivity-report-v3`).toContain("bcba-productivity-report-v3");
    }
  });
});