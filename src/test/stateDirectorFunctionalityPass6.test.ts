import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("State Director Functionality Pass 6 — final hardening", () => {
  const store = read("src/lib/os/stateDirector/stateDirectorStore.ts");
  const svc = read("src/lib/os/stateDirector/stateOperationsService.ts");
  const pages = read("src/pages/os/stateDirector/StateDirectorPages.tsx");
  const staffing = read("src/pages/os/OSStaffingWorkspace.tsx");
  const scheduling = read("src/pages/os/OSSchedulingWorkspace.tsx");
  const qa = read("src/pages/os/OSQATeam.tsx");
  const types = read("src/integrations/supabase/types.ts");

  it("store comment no longer says fire-and-forget or that metrics are only seeded", () => {
    expect(store).not.toMatch(/fire-and-forget/i);
    expect(store).not.toMatch(/metrics remain seeded until a real metrics source is wired/i);
    expect(store).toMatch(/State metrics hydrate from `state_operational_metrics`/);
  });

  it("store exposes refreshStateMetrics and useRefreshStateMetrics", () => {
    expect(store).toMatch(/export async function refreshStateMetrics/);
    expect(store).toMatch(/export function useRefreshStateMetrics/);
    // Merges live rows over the current in-memory snapshot (seed fallback preserved).
    expect(store).toMatch(/const nextMetrics = \{ \.\.\.current\.metrics \}/);
  });

  it("State Operations page wires upsertStateMetric + refreshStateMetrics into the UI", () => {
    expect(pages).toMatch(/import \{ upsertStateMetric \}/);
    expect(pages).toMatch(/refreshStateMetrics\(\)/);
    expect(pages).toMatch(/ManualMetricsDialog/);
    expect(pages).toMatch(/Update Metrics/);
  });

  it("Manual metrics editor is gated to non-assistant, non-department roles", () => {
    // canEditMetrics excludes assistant and requires leadership or state_director/super_admin.
    expect(pages).toMatch(/canEditMetrics[\s\S]{0,200}!isAssistant/);
    expect(pages).toMatch(/isLeadership \|\| role === "state_director" \|\| role === "super_admin"/);
    // Dialog + button both conditional on canEditMetrics
    expect(pages).toMatch(/canEditMetrics \? \(/);
  });

  it("Snapshot banners use real page data on Staffing / Scheduling / QA", () => {
    expect(staffing).toMatch(/openBlockers=\{needs\.length\}/);
    expect(staffing).toMatch(/topRisks=\{staffingTopRisks\}/);
    expect(scheduling).toMatch(/openBlockers=\{counts\.needs_rbt/);
    expect(scheduling).toMatch(/overdueCount=\{cr\.counts\.atRiskClients/);
    expect(qa).toMatch(/openBlockers=\{data\.counts\.needsReview \+ data\.counts\.missingInfo\}/);
    expect(qa).toMatch(/overdueCount=\{data\.counts\.overdue\}/);
    // No page still relies solely on the placeholder string.
    for (const src of [staffing, scheduling, qa]) {
      expect(src).not.toMatch(/topRisks=\{\["Snapshot counts not connected yet"\]\}/);
    }
  });

  it("CentralReach readiness / outbox layer exists (table, service, UI)", () => {
    expect(types).toMatch(/state_centralreach_outbox: \{/);
    expect(svc).toMatch(/loadStateCentralReachOutbox/);
    expect(svc).toMatch(/createStateCentralReachOutboxItem/);
    expect(svc).toMatch(/updateStateCentralReachOutboxStatus/);
    expect(pages).toMatch(/CentralReachReadinessPanel/);
    const panel = read("src/components/stateDirector/CentralReachReadinessPanel.tsx");
    expect(panel).toMatch(/not connected/);
    expect(panel).not.toMatch(/live CentralReach API is connected/i);
  });

  it("Reports remains unified at /reports and training remains at /training for state_director", () => {
    const menus = read("src/lib/os/roleMenus.ts");
    const start = menus.indexOf("state_director: {");
    const end = menus.indexOf("assistant_state_director: {");
    const block = menus.slice(start, end);
    const reports = (block.match(/path: "\/reports"/g) ?? []).length;
    expect(reports).toBeGreaterThanOrEqual(1);
    expect(block).toContain('path: "/training"');
  });
});
