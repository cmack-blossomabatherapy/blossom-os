import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Importer scalability contract: loadExistingIdentities() must page the
 * existing unique `row_hash` index with keyset (seek) pagination — never
 * OFFSET/range — so large CURRENT tables (cr_payments, cr_schedule_events)
 * load without statement_timeout, and never duplicate or omit an identity.
 */

type Query = { table: string; gt: string | null; order: unknown; limit: number };

const queries: Query[] = [];
let rowsByTable: Record<string, string[]> = {};
let rangeCalled = false;

function selectBuilder(table: string) {
  const state: Query = { table, gt: null, order: null, limit: 0 };
  const api: Record<string, unknown> = {
    order(col: string, opts: unknown) {
      state.order = { col, opts };
      return api;
    },
    limit(n: number) {
      state.limit = n;
      return api;
    },
    gt(col: string, value: string) {
      if (col !== "row_hash") throw new Error(`unexpected keyset column ${col}`);
      state.gt = value;
      return api;
    },
    range() {
      rangeCalled = true;
      return api;
    },
    then(resolve: (v: unknown) => unknown) {
      queries.push({ ...state });
      const all = [...(rowsByTable[table] ?? [])].sort();
      const filtered = state.gt === null ? all : all.filter((h) => h > state.gt!);
      const page = filtered.slice(0, state.limit || filtered.length);
      return Promise.resolve({ data: page.map((row_hash) => ({ row_hash })), error: null }).then(
        resolve,
      );
    },
  };
  return api;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => ({ select: () => selectBuilder(table) }),
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
  },
}));

const { createSupabaseCrImportStore, rowHashToIdentity } = await import(
  "@/lib/os/centralreachUploads/supabaseStore"
);

const hashes = (n: number, prefix = "id:") =>
  Array.from({ length: n }, (_, i) => `${prefix}${String(i).padStart(7, "0")}`);

beforeEach(() => {
  queries.length = 0;
  rowsByTable = {};
  rangeCalled = false;
});

describe("loadExistingIdentities — keyset pagination on row_hash", () => {
  it("loads a large current table across multiple pages with no OFFSET/range use", async () => {
    rowsByTable.cr_payments = hashes(46_488);
    const store = createSupabaseCrImportStore();
    const ids = await store.loadExistingIdentities!("cr_payments");

    expect(ids).toHaveLength(46_488);
    expect(rangeCalled).toBe(false);
    // 46 full pages plus a short 488-row final page ends the scan.
    expect(queries.length).toBe(47);

    expect(queries.every((q) => q.limit === 1000)).toBe(true);
    expect(queries.every((q) => q.table === "cr_payments")).toBe(true);
  });

  it("orders ascending by row_hash and seeks forward with gt on each later page", async () => {
    rowsByTable.cr_schedule_events = hashes(24_230);
    const store = createSupabaseCrImportStore();
    await store.loadExistingIdentities!("cr_schedule_events");

    expect(queries[0].order).toEqual({ col: "row_hash", opts: { ascending: true } });
    expect(queries[0].gt).toBeNull();
    // Each subsequent page seeks past the last row_hash of the previous page.
    const sorted = hashes(24_230);
    expect(queries[1].gt).toBe(sorted[999]);
    expect(queries[2].gt).toBe(sorted[1999]);
    expect(queries.slice(1).every((q) => q.gt !== null)).toBe(true);
  });

  it("returns no duplicate and no omitted identities", async () => {
    rowsByTable.cr_payments = hashes(3_500);
    const store = createSupabaseCrImportStore();
    const ids = await store.loadExistingIdentities!("cr_payments");

    expect(new Set(ids).size).toBe(3_500);
    expect([...ids].sort()).toEqual(hashes(3_500).map(rowHashToIdentity).sort());
  });

  it("terminates on an exact page-size boundary without re-reading rows", async () => {
    rowsByTable.cr_payments = hashes(2_000);
    const store = createSupabaseCrImportStore();
    const ids = await store.loadExistingIdentities!("cr_payments");

    expect(ids).toHaveLength(2_000);
    // 2 full pages plus one empty page proving exhaustion.
    expect(queries).toHaveLength(3);
  });

  it("terminates on a short final page and on an empty table", async () => {
    rowsByTable.cr_payments = hashes(1_250);
    const store = createSupabaseCrImportStore();
    expect(await store.loadExistingIdentities!("cr_payments")).toHaveLength(1_250);
    expect(queries).toHaveLength(2);

    queries.length = 0;
    expect(await store.loadExistingIdentities!("cr_empty")).toEqual([]);
    expect(queries).toHaveLength(1);
  });

  it("maps stored hashes to identities, preserving the id:/hash: distinction", async () => {
    rowsByTable.cr_billing_sessions = ["id:1001", "abcdef0123"];
    const store = createSupabaseCrImportStore();
    const ids = await store.loadExistingIdentities!("cr_billing_sessions");
    expect(ids.sort()).toEqual(["hash:abcdef0123", "id:1001"]);
  });
});
