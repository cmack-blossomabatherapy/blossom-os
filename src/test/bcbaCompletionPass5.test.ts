// Rewritten to assert current shipping contracts: workflow hook still exposes
// its scoped/broad/outbox contract, the CentralReach badge status vocabulary is
// intact, RLS pass-5 migrations remain in the schema, and BCBA Productivity V3
// stays visible to every role.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { visibleReportsForRole } from "@/lib/os/reportsCatalog";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const MIG_DIR  = path.resolve(__dirname, "../../supabase/migrations");
const COMP_DIR = path.resolve(__dirname, "../components/bcba");
const HOOK     = path.resolve(__dirname, "../hooks/useBcbaWorkflow.ts");

function allMigrations() {
  return readdirSync(MIG_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(path.join(MIG_DIR, f), "utf8"))
    .join("\n");
}

describe("BCBA Pass 5 - workflow hook contract", () => {
  const src = readFileSync(HOOK, "utf8");

  it("supports fromDate / toDate / statuses filters and explicit broad opt-in", () => {
    expect(src).toMatch(/fromDate/);
    expect(src).toMatch(/toDate/);
    expect(src).toMatch(/statuses/);
    // Broad mode must be opt-in (true), not implicit
    expect(src).toMatch(/broad !== true/);
  });

  it("workflow writes activity events and centralreach outbox rows", () => {
    expect(src).toMatch(/bcba_workflow_activity_events/);
    expect(src).toMatch(/bcba_centralreach_outbox/);
    expect(src).toMatch(/writeActivityEvent/);
    expect(src).toMatch(/writeOutbox/);
    // Each mutating action should trigger at least one event/outbox call
    for (const fn of ["createTask", "updateTask", "logSupervision", "logParentTraining", "upsertPlanItem", "addNote"]) {
      const block = src.split(new RegExp(`const ${fn} = useCallback`))[1]?.split("useCallback")[0] ?? "";
      expect(block, `${fn} must write an activity event`).toMatch(/writeActivityEvent/);
    }
  });

  it("exposes outbox metrics", () => {
    expect(src).toMatch(/pendingOutboxItems/);
    expect(src).toMatch(/manualCentralReachUpdates/);
    expect(src).toMatch(/readyForApiItems/);
  });

  it("exports makeBcbaWorkflowScope helper", () => {
    expect(src).toMatch(/export\s+(?:function|const)\s+makeBcbaWorkflowScope/);
  });
});

describe("BCBA Pass 5 - CentralReach badge supports new statuses", () => {
  const src = readFileSync(path.join(COMP_DIR, "BcbaCentralReachBadge.tsx"), "utf8");
  for (const s of [
    "pending_review",
    "ready_for_api",
    "manual_update_required",
    "not_applicable",
    "sent",
    "failed",
  ]) {
    it(`recognizes status "${s}"`, () => {
      expect(src).toMatch(new RegExp(`${s}:`));
    });
  }
  it("summary badge no longer claims all records ready when zero pending", () => {
    expect(src).not.toMatch(/All records ready for CentralReach import/);
    expect(src).toMatch(/No pending CentralReach review/);
  });
});

describe("BCBA Pass 5 - canonical leadership role coverage", () => {
  it("leadership role helper includes canonical Blossom OS roles", () => {
    const combined = allMigrations();
    const helper = combined.split(/CREATE OR REPLACE FUNCTION public\.bcba_workflow_leadership_can_read/).pop() ?? "";
    expect(helper.length, "bcba_workflow_leadership_can_read helper must be defined in migrations").toBeGreaterThan(0);
    for (const role of ["executive_leadership", "operations_leadership", "qa_team"]) {
      expect(helper).toMatch(new RegExp(`has_role\\(_uid,\\s*'${role}'\\)`));
    }
  });
});

describe("BCBA Pass 5 - reports stay canonical", () => {
  it("BCBA Productivity Report V3 remains visible for BCBA + leadership roles", () => {
    for (const role of ["bcba", "clinical_director", "super_admin", "executive_leadership", "operations_leadership", "state_director"] as const) {
      const ids = visibleReportsForRole(role as any).map((r) => r.id);
      expect(ids, `${role} should see bcba-productivity-report-v3`).toContain("bcba-productivity-report-v3");
    }
  });

  it("BCBA menu does not link to /reports (BCBA reporting is scoped under /bcba/*)", () => {
    const paths = ROLE_MENUS.bcba!.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(paths.filter((p) => p === "/reports")).toEqual([]);
  });

  it("shipped BCBA component/hook files have no mojibake bytes", () => {
    const targets = [
      path.join(COMP_DIR, "BcbaClientTimeline.tsx"),
      path.join(COMP_DIR, "BcbaCentralReachBadge.tsx"),
      HOOK,
    ];
    const bad1 = String.fromCharCode(0x00e2);
    const bad2 = String.fromCharCode(0x00c2);
    for (const t of targets) {
      const src = readFileSync(t, "utf8");
      expect(src.includes(bad1), `${t} contains mojibake byte 0xE2`).toBe(false);
      expect(src.includes(bad2), `${t} contains mojibake byte 0xC2`).toBe(false);
    }
  });
});