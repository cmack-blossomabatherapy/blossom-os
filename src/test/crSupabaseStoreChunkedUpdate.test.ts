import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Importer performance contract: a snapshot refresh of many EXISTING rows must
 * use chunked upserts (one request per 500 rows), never one request per row,
 * while still stamping last_seen_batch_id/last_seen_at, finalizing the batch and
 * preserving raw-row history.
 */

type Call = { table: string; op: string; rows?: Record<string, unknown>[]; opts?: unknown };

const calls: Call[] = [];

function builder(table: string) {
  const api: Record<string, unknown> = {
    insert(rows: Record<string, unknown>[] | Record<string, unknown>) {
      calls.push({ table, op: "insert", rows: Array.isArray(rows) ? rows : [rows] });
      const res = { data: { id: "batch-1" }, error: null };
      return {
        ...res,
        select: () => ({ single: async () => res }),
        then: (r: (v: typeof res) => unknown) => Promise.resolve(res).then(r),
      };
    },
    upsert(rows: Record<string, unknown>[], opts: unknown) {
      calls.push({ table, op: "upsert", rows, opts });
      return Promise.resolve({ error: null });
    },
    update(values: Record<string, unknown>) {
      calls.push({ table, op: "update", rows: [values] });
      return { eq: async () => ({ error: null }) };
    },
    select() {
      return {
        range: async () => ({ data: [], error: null }),
      };
    },
  };
  return api;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => builder(table),
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
  },
}));

const { createSupabaseCrImportStore } = await import(
  "@/lib/os/centralreachUploads/supabaseStore"
);

const rows = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    row_hash: `id:auth:${i}`,
    batch_id: "batch-1",
    last_seen_batch_id: "batch-1",
    last_seen_at: "2026-08-25T00:00:00.000Z",
    authorization_number: `A-${i}`,
  }));

beforeEach(() => {
  calls.length = 0;
});

describe("supabase CR store — chunked snapshot updates", () => {
  it("updates 1200 existing rows with 3 chunked upserts, not 1200 requests", async () => {
    const store = createSupabaseCrImportStore();
    await store.updateRows!("cr_authorizations", rows(1200) as never);

    const upserts = calls.filter((c) => c.op === "upsert");
    expect(upserts).toHaveLength(3);
    expect(upserts.map((c) => c.rows!.length)).toEqual([500, 500, 200]);
    expect(calls.some((c) => c.op === "update")).toBe(false);
  });

  it("upserts on row_hash against the target table", async () => {
    const store = createSupabaseCrImportStore();
    await store.updateRows!("cr_schedule_events", rows(2) as never);

    expect(calls[0].table).toBe("cr_schedule_events");
    expect(calls[0].opts).toEqual({ onConflict: "row_hash" });
  });

  it("preserves every stamped value including last_seen provenance", async () => {
    const store = createSupabaseCrImportStore();
    await store.updateRows!("cr_authorizations", rows(1) as never);

    expect(calls[0].rows![0]).toMatchObject({
      row_hash: "id:auth:0",
      batch_id: "batch-1",
      last_seen_batch_id: "batch-1",
      last_seen_at: "2026-08-25T00:00:00.000Z",
      authorization_number: "A-0",
    });
  });

  it("no rows means no network call", async () => {
    const store = createSupabaseCrImportStore();
    await store.updateRows!("cr_authorizations", [] as never);
    expect(calls).toHaveLength(0);
  });

  it("still preserves raw-row history in chunks", async () => {
    const store = createSupabaseCrImportStore();
    await store.saveRawRows!(
      Array.from({ length: 600 }, (_, i) => ({
        batch_id: "batch-1",
        export_type: "authorization",
        row_hash: `id:auth:${i}`,
        cr_row_id: String(i),
        payload: { AuthorizationId: String(i) },
      })),
    );
    const raw = calls.filter((c) => c.table === "cr_raw_rows");
    expect(raw).toHaveLength(2);
    expect(raw.map((c) => c.rows!.length)).toEqual([500, 100]);
  });

  it("still finalizes the batch after a snapshot update", async () => {
    const store = createSupabaseCrImportStore();
    await store.updateRows!("cr_authorizations", rows(3) as never);
    await store.finalizeBatch!("batch-1", {
      fileName: "auth.csv",
      fileHash: "abc123",
      exportType: "authorization",
      rowCount: 3,
      updatedRowCount: 3,
      status: "active",
      isActive: true,
    } as never);

    const finalize = calls.find((c) => c.table === "cr_import_batches" && c.op === "update");
    expect(finalize).toBeTruthy();
    expect(finalize!.rows![0]).toMatchObject({
      updated_row_count: 3,
      status: "active",
      is_active: true,
    });
  });
});
