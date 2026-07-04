import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("State Director Functionality Pass 2 — final hardening", () => {
  it("State Director menu has exactly one Reports item pointing at /reports", () => {
    const menu = ROLE_MENUS.state_director!;
    const reports = menu.sections
      .flatMap((s) => s.items)
      .filter((i) => /reports/i.test(i.label) || i.path === "/reports");
    expect(reports.length).toBe(1);
    expect(reports[0].path).toBe("/reports");
  });

  it("State Director Training Academy still points to /training (preserve journey)", () => {
    const menu = ROLE_MENUS.state_director!;
    const training = menu.sections
      .flatMap((s) => s.items)
      .find((i) => i.label === "Training Academy");
    expect(training?.path).toBe("/training");
  });

  it("Assistant State Director Training Academy also points to /training", () => {
    const menu = ROLE_MENUS.assistant_state_director!;
    const training = menu.sections
      .flatMap((s) => s.items)
      .find((i) => i.label === "Training Academy");
    expect(training?.path).toBe("/training");
  });

  it("State Director menu links to the required department snapshot paths", () => {
    const menu = ROLE_MENUS.state_director!;
    const paths = new Set(menu.sections.flatMap((s) => s.items).map((i) => i.path));
    for (const p of [
      "/state-operations",
      "/ops/state-escalations",
      "/ops/tasks",
      "/ops/staffing",
      "/intake/dashboard",
      "/authorizations",
      "/ops/scheduling",
      "/qa-team",
      "/phone",
      "/training",
      "/resource-library",
      "/reports",
    ]) {
      expect(paths.has(p)).toBe(true);
    }
  });

  it("store passes persisted UUIDs into Supabase inserts for tasks and escalations", () => {
    const src = read("src/lib/os/stateDirector/stateDirectorStore.ts");
    // createTask + createEscalation + escalateTask all send id: created.id / created!.id
    const idInsertMatches = src.match(/id:\s*created!?\.id/g) ?? [];
    expect(idInsertMatches.length).toBeGreaterThanOrEqual(3);
  });

  it("activity inserts pass relatedId to keep timeline aligned with parent records", () => {
    const src = read("src/lib/os/stateDirector/stateDirectorStore.ts");
    const relatedMatches = src.match(/relatedId:\s*created!?\.id/g) ?? [];
    expect(relatedMatches.length).toBeGreaterThanOrEqual(3);
  });

  it("store adapter is renamed away from localStorage and no longer claims localStorage as the source", () => {
    const src = read("src/lib/os/stateDirector/stateDirectorStore.ts");
    expect(src).not.toMatch(/createLocalStorageAdapter/);
    expect(src).toMatch(/createSupabaseBackedStateOperationsAdapter/);
    expect(src).not.toMatch(/default is a localStorage adapter/);
    expect(src).not.toMatch(/no Supabase dependency/);
  });

  it("CentralReach badge uses honest not-connected wording and drops 'import' language", () => {
    const src = read("src/components/stateDirector/StateOpsCentralReachBadge.tsx");
    expect(src).not.toMatch(/pending CentralReach import/);
    expect(src).not.toMatch(/ready for CentralReach import/);
    expect(src).toMatch(/not connected yet/);
  });

  it("State Operations footer no longer says CentralReach is 'import-ready'", () => {
    const src = read("src/pages/os/stateDirector/StateDirectorPages.tsx");
    expect(src).not.toMatch(/import-ready/);
    expect(src).toMatch(/CentralReach context: not connected yet/);
  });

  it("QA doc for Pass 2 exists and does not claim localStorage is the source of truth", () => {
    const qaPath = "docs/state-director-functionality-pass-2-qa.md";
    expect(fs.existsSync(path.join(process.cwd(), qaPath))).toBe(true);
    const src = read(qaPath);
    expect(src).not.toMatch(/localStorage is the source/i);
    expect(src).toMatch(/Supabase/);
  });

  it("Supabase types include the State Operations tables", () => {
    const src = read("src/integrations/supabase/types.ts");
    for (const t of [
      "state_operational_tasks",
      "state_operational_escalations",
      "state_operational_notes",
      "state_operational_activity",
      "state_department_handoffs",
    ]) {
      expect(src.includes(t)).toBe(true);
    }
  });
});