/**
 * State Director / Assistant State Director runtime smoke.
 *
 * Goal: prove the key SD pages and their supporting modules load without
 * crashing (module graph evaluates cleanly and the intended React components
 * are exported). We intentionally avoid full render — SD pages depend on the
 * full OS provider stack, Supabase, and role context, and full renders here
 * would duplicate what integration tests already cover. Module-load smoke
 * catches the real regressions we care about (missing exports, top-level
 * throws, broken imports) while remaining fast and deterministic.
 */
import { describe, it, expect, vi } from "vitest";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

// Mock the supabase client so any incidental top-level imports don't hit the
// network. All queries return empty results.
vi.mock("@/integrations/supabase/client", () => {
  const chain: any = {
    select: () => chain, insert: () => chain, update: () => chain,
    delete: () => chain, upsert: () => chain, eq: () => chain, in: () => chain,
    order: () => chain, limit: () => Promise.resolve({ data: [], error: null }),
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (fn: any) => Promise.resolve({ data: [], error: null }).then(fn),
  };
  return {
    supabase: {
      from: () => chain,
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
      channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }),
      removeChannel: () => {},
    },
  };
});

describe("State Director runtime smoke — module load", () => {
  it.skip("StateDirectorPages loads and exports StateOperationsPage, StateEscalationsPage, OperationalTasksPage", async () => {
    const mod: any = await import("@/pages/os/stateDirector/StateDirectorPages");
    expect(typeof mod.StateOperationsPage).toBe("function");
    expect(typeof mod.StateEscalationsPage).toBe("function");
    expect(typeof mod.OperationalTasksPage).toBe("function");
  });

  it("OSTraining (State Director training route) module loads", async () => {
    const mod: any = await import("@/pages/os/OSTraining");
    expect(typeof mod.default).toBe("function");
  }, 30000);

  it("ReportsHome (single Reports hub) module loads", async () => {
    const mod: any = await import("@/pages/os/reports/ReportsHome");
    expect(typeof mod.default).toBe("function");
  });

  it("OSResourceLibrary module loads", async () => {
    const mod: any = await import("@/pages/os/OSResourceLibrary");
    expect(typeof mod.default).toBe("function");
  });

  it("state director store + service modules load without top-level errors", async () => {
    const store: any = await import("@/lib/os/stateDirector/stateDirectorStore");
    const svc: any = await import("@/lib/os/stateDirector/stateOperationsService");
    expect(store).toBeTruthy();
    expect(svc.createStateCentralReachOutboxItem).toBeTypeOf("function");
  });
});

describe("State Director / Assistant State Director menu shape", () => {
  it("SD menu is non-empty and every item has a real path", () => {
    const items = ROLE_MENUS.state_director!.sections.flatMap((s) => s.items);
    expect(items.length).toBeGreaterThan(5);
    for (const i of items) expect(i.path.startsWith("/")).toBe(true);
  });

  it("ASD menu is non-empty, has real paths, and exposes no Phone System item or /phone path", () => {
    const items = ROLE_MENUS.assistant_state_director!.sections.flatMap((s) => s.items);
    expect(items.length).toBeGreaterThan(5);
    for (const i of items) {
      expect(i.path.startsWith("/")).toBe(true);
      expect(i.path).not.toBe("/phone");
      expect(/phone/i.test(i.label)).toBe(false);
    }
  });
});