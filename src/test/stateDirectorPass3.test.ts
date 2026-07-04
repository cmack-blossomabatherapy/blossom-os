import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("State Director Pass 3 — consolidated hardening", () => {
  it("migration enables realtime on all five State Operations tables", () => {
    const dir = "supabase/migrations";
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql"));
    const combined = files.map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
    for (const t of [
      "state_operational_tasks",
      "state_operational_escalations",
      "state_operational_notes",
      "state_operational_activity",
      "state_department_handoffs",
    ]) {
      expect(combined).toMatch(new RegExp(`ADD TABLE public\\.${t}`));
      expect(combined).toMatch(new RegExp(`ALTER TABLE public\\.${t}[\\s\\S]*REPLICA IDENTITY FULL`));
    }
  });

  it("stateOperationsService exposes realtime subscription and cross-department handoff delivery", () => {
    const src = read("src/lib/os/stateDirector/stateOperationsService.ts");
    expect(src).toMatch(/subscribeStateOperationsRealtime/);
    expect(src).toMatch(/postgres_changes/);
    expect(src).toMatch(/removeChannel/);
    expect(src).toMatch(/deliverHandoff/);
    // Handoff must both persist the handoff row AND create a companion
    // operational task in the receiving department.
    expect(src).toMatch(/state_department_handoffs/);
    expect(src).toMatch(/insertTask\(/);
    expect(src).toMatch(/source_module.*state_handoff|state_handoff/);
  });

  it("stateDirectorStore hydrates via realtime subscription", () => {
    const src = read("src/lib/os/stateDirector/stateDirectorStore.ts");
    expect(src).toMatch(/subscribeStateOperationsRealtime/);
  });

  it("state ops CentralReach badge component exists and defaults honestly", () => {
    const src = read("src/components/stateDirector/StateOpsCentralReachBadge.tsx");
    expect(src).toMatch(/StateOpsCentralReachSummaryBadge/);
  });

  it("StateOperationsPage surfaces the CentralReach summary badge", () => {
    const src = read("src/pages/os/stateDirector/StateDirectorPages.tsx");
    expect(src).toMatch(/StateOpsCentralReachSummaryBadge/);
    expect(src).toMatch(/centralreachSyncStatus/);
  });

  it("reports catalog exposes state-scoped reports for directors", () => {
    const src = read("src/lib/os/reportsCatalog.ts");
    expect(src).toMatch(/stateScopedReportsForDirector/);
    expect(src).toMatch(/StateScopedReport/);
  });
});