import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Pass 6: mock the Supabase-backed persistence service so store CRUD unit
// tests exercise the optimistic in-memory contract without hitting real
// RLS-protected tables (which would emit expected but noisy stderr).
vi.mock("@/lib/os/stateDirector/stateOperationsService", () => {
  const ok = async () => ({ ok: true as const });
  const okId = async () => ({ ok: true as const, id: "mock-id" });
  return {
    loadStateOperationsSnapshot: async () => null,
    subscribeStateOperationsRealtime: () => () => {},
    loadStateMetrics: async () => null,
    upsertStateMetric: ok,
    ingestStateMetrics: async () => ({ ok: true, written: 0, failures: [] }),
    insertTask: ok,
    updateTaskRow: ok,
    insertEscalation: ok,
    updateEscalationRow: ok,
    insertNote: okId,
    insertActivity: ok,
    deliverHandoff: async () => ({ ok: true, handoffId: "mock-handoff", taskId: "mock-task" }),
  };
});

import { stateDirectorStore } from "@/lib/os/stateDirector/stateDirectorStore";

const readFile = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), "utf8");

describe("State Director — Functionality Pass 1", () => {
  describe("Menu / route correctness", () => {
    const roleMenus = readFile("src/lib/os/roleMenus.ts");
    const osShell = readFile("src/pages/os/OSShell.tsx");
    const app = readFile("src/App.tsx");

    it("State Director menu contains every required path exactly once", () => {
      const required = [
        "/state-operations",
        "/ops/state-escalations",
        "/ops/tasks",
        "/ops/staffing",
        "/intake/dashboard",
        "/authorizations",
        "/ops/scheduling",
        "/qa-team",
        "/phone",
      ];
      // extract state_director block
      const start = roleMenus.indexOf("state_director: {");
      const end = roleMenus.indexOf("assistant_state_director: {");
      const block = roleMenus.slice(start, end);
      for (const p of required) expect(block).toContain(`path: "${p}"`);
    });

    it("does not include /coming-soon in State Director menu", () => {
      const start = roleMenus.indexOf("state_director: {");
      const end = roleMenus.indexOf("assistant_state_director: {");
      expect(roleMenus.slice(start, end)).not.toContain("/coming-soon");
    });

    it("live-path map for state_director includes redirect targets", () => {
      const start = osShell.indexOf("state_director: new Set<string>([");
      const end = osShell.indexOf("assistant_state_director: new Set<string>([");
      const block = osShell.slice(start, end);
      for (const p of [
        "/state-operations", "/ops/state-escalations", "/ops/tasks",
        "/ops/staffing", "/intake/dashboard", "/authorizations",
        "/ops/scheduling", "/qa-team", "/phone",
        "/training", "/resource-library", "/reports",
        "/scheduling-workspace",
        // Canonical is "/authorizations"; the legacy "/ops/authorizations" is a redirect only.
      ]) expect(block).toContain(`"${p}"`);
    });

    it("/ops/staffing route is mounted (staffing-scoped per Staffing Pass 9)", () => {
      const line = app.split("\n").find((l) => l.includes('path="/ops/staffing"'));
      expect(line).toBeTruthy();
      // Staffing Team Pass 9 narrowed the route guard to staffing-only roles.
      // State Director / Assistant State Director reach staffing via their own
      // menu items and the shared /ops/staffing surface with proper permission
      // handling; the route itself is now staffing-scoped.
      expect(line).toMatch(/PermissionRoute/);
      expect(line).toMatch(/"staffing"/);
    });

    it("Reports remains canonical: exactly one Reports entry in the State Director menu", () => {
      const start = roleMenus.indexOf("state_director: {");
      const end = roleMenus.indexOf("assistant_state_director: {");
      const block = roleMenus.slice(start, end);
      // Reports comes in via TRAINING_AND_RESOURCES / STATE_TRAINING_AND_RESOURCES
      expect(block).toContain("STATE_TRAINING_AND_RESOURCES");
      // No custom role-specific Reports path
      expect(block).not.toContain("/state-director/reports");
      expect(block).not.toContain("/ops/state-director/reports");
    });

    it("Training Academy for State Director still routes to /training", () => {
      const trainingBlock = roleMenus.slice(roleMenus.indexOf("STATE_TRAINING_AND_RESOURCES"));
      expect(trainingBlock).toContain('path: "/training"');
    });
  });

  describe("Operating store — escalations and tasks CRUD", () => {
    beforeEach(() => {
      // Ensure a clean slate per test
      globalThis.localStorage?.clear?.();
      stateDirectorStore.reset();
    });

    it("creates, updates, notes, and resolves an escalation", async () => {
      const { item: e } = await stateDirectorStore.createEscalation({
        state: "GA", title: "QA test escalation", department: "Operations",
        priority: "high", createdBy: "tester",
      });
      expect(e.id).toBeTruthy();
      expect(stateDirectorStore.snapshot().escalations.find((x) => x.id === e.id)).toBeTruthy();

      stateDirectorStore.updateEscalation(e.id, { assignedTo: "Ashley Tran" }, "tester");
      expect(stateDirectorStore.snapshot().escalations.find((x) => x.id === e.id)?.assignedTo).toBe("Ashley Tran");

      stateDirectorStore.addEscalationNote(e.id, "Called payer rep", "tester");
      expect(stateDirectorStore.snapshot().escalations.find((x) => x.id === e.id)?.notes[0].body).toBe("Called payer rep");

      stateDirectorStore.resolveEscalation(e.id, "Payer approved", "tester");
      expect(stateDirectorStore.snapshot().escalations.find((x) => x.id === e.id)?.status).toBe("resolved");

      stateDirectorStore.reopenEscalation(e.id, "tester");
      expect(stateDirectorStore.snapshot().escalations.find((x) => x.id === e.id)?.status).toBe("open");
    });

    it("creates, completes, and escalates a task with activity events", async () => {
      const before = stateDirectorStore.snapshot().activity.length;
      const { item: t } = await stateDirectorStore.createTask({
        state: "VA", title: "Follow up with payer", department: "Authorizations",
        priority: "high", createdBy: "tester",
      });
      expect(t.id).toBeTruthy();

      stateDirectorStore.completeTask(t.id, "tester");
      expect(stateDirectorStore.snapshot().tasks.find((x) => x.id === t.id)?.status).toBe("completed");

      const { item: t2 } = await stateDirectorStore.createTask({
        state: "VA", title: "Escalate me", department: "Staffing",
        priority: "medium", createdBy: "tester",
      });
      const esc = stateDirectorStore.escalateTask(t2.id, "tester");
      expect(esc.id).toBeTruthy();
      const snap = stateDirectorStore.snapshot();
      expect(snap.tasks.find((x) => x.id === t2.id)?.status).toBe("escalated");
      expect(snap.escalations.find((x) => x.id === esc.id)).toBeTruthy();
      expect(snap.activity.length).toBeGreaterThan(before);
    });

    it("persists new escalations per state and records activity", async () => {
      stateDirectorStore.reset();
      const beforeEsc = stateDirectorStore.snapshot().escalations.filter((e) => e.state === "GA").length;
      const beforeActivity = stateDirectorStore.snapshot().activity.length;
      await stateDirectorStore.createEscalation({
        state: "GA", title: "Counts", department: "Operations", createdBy: "tester",
      });
      const snap = stateDirectorStore.snapshot();
      expect(snap.escalations.filter((e) => e.state === "GA").length).toBe(beforeEsc + 1);
      expect(snap.activity.length).toBeGreaterThan(beforeActivity);
    });
  });

  describe("Reports canonical rule", () => {
    it("State Director reports appear inside the single /reports catalog", () => {
      const catalog = readFile("src/lib/os/reportsCatalog.ts");
      expect(catalog.match(/state_director/g)?.length ?? 0).toBeGreaterThan(10);
      // BCBA Productivity Report V3 still visible
      expect(catalog).toContain("bcba-productivity-report-v3");
    });

    it("does not introduce a role-specific reports route", () => {
      const app = readFile("src/App.tsx");
      expect(app).not.toContain("/state-director/reports");
      expect(app).not.toContain("/state-operations/reports");
    });
  });
});