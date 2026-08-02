import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Production symptom: uploads ran but cr_sync_runs / cr_sync_audit stayed empty,
 * and re-uploading an already-loaded export gave no clear "nothing changed"
 * signal. These tests pin the audit wrapper without touching dedupe math.
 */

const rows: Record<string, unknown>[] = [];
const inserted: { table: string; rows: Record<string, unknown>[] }[] = [];
const updated: { table: string; row: Record<string, unknown> }[] = [];
let insertError: { message: string } | null = null;

function builder(table: string) {
  const api: Record<string, unknown> = {};
  Object.assign(api, {
    select: () => api,
    order: () => api,
    limit: async () => ({ data: [], error: null }),
    insert: (r: Record<string, unknown> | Record<string, unknown>[]) => {
      const list = Array.isArray(r) ? r : [r];
      if (!insertError) inserted.push({ table, rows: list });
      return {
        select: () => ({
          single: async () =>
            insertError ? { data: null, error: insertError } : { data: { id: `${table}-1` }, error: null },
        }),
        then: (res: (v: { error: unknown }) => unknown) =>
          Promise.resolve({ error: insertError }).then(res),
      };
    },
    update: (row: Record<string, unknown>) => {
      updated.push({ table, row });
      return { eq: async () => ({ error: null }) };
    },
  });
  return api;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => builder(table),
    auth: { getUser: async () => ({ data: { user: { id: "operator-1" } }, error: null }) },
  },
}));

const { createSupabaseCrRunTracker } = await import("@/lib/os/centralreachUploads/syncRun");
const { importCentralReachFiles } = await import("@/lib/os/centralreachUploads/importService");

const HEADERS = ["Date of Service", "Time Worked In Hours", "Procedure Code", "Client", "Provider", "Billing Id"];
const RAW = [
  { "Date of Service": "2026-07-01", "Time Worked In Hours": 2, "Procedure Code": "97155", Client: "Jane Doe", Provider: "Bob BCBA", "Billing Id": "1" },
  { "Date of Service": "2026-07-05", "Time Worked In Hours": 1, "Procedure Code": "97153", Client: "Jane Doe", Provider: "Rita RBT", "Billing Id": "2" },
];

const parseAnyFile = vi.fn();
vi.mock("@/lib/os/dashboardEngine/excelParser", () => ({ parseAnyFile: (f: File) => parseAnyFile(f) }));

/** In-memory fact store so dedupe behaviour is exercised for real. */
function makeStore() {
  const existing = new Set<string>();
  const writes: Record<string, unknown>[][] = [];
  return {
    writes,
    store: {
      async findActiveBatch() { return null; },
      async existingRowHashes(_table: string, hashes: string[]) {
        return new Set(hashes.filter((h) => existing.has(h)));
      },
      async createBatch() { return "batch-1"; },
      async insertRows(_table: string, rowsIn: Record<string, unknown>[]) {
        rowsIn.forEach((r) => existing.add(String(r.row_hash)));
        writes.push(rowsIn);
        return rowsIn.length;
      },
      async finalizeBatch() {},
      async archiveBatch() {},
    } as never,
  };
}

const audits = () => inserted.filter((i) => i.table === "cr_sync_audit").flatMap((i) => i.rows);
const runs = () => inserted.filter((i) => i.table === "cr_sync_runs").flatMap((i) => i.rows);
const runUpdates = () => updated.filter((u) => u.table === "cr_sync_runs").map((u) => u.row);

async function upload(store: ReturnType<typeof makeStore>) {
  return importCentralReachFiles([new File(["x"], "billing.csv", { type: "text/csv" })], {
    makeStore: () => store.store,
    makeRunTracker: () => createSupabaseCrRunTracker(),
    makeSupportRefresher: () => ({ async refresh() { return []; } }) as never,
  });
}

beforeEach(() => {
  inserted.length = 0;
  updated.length = 0;
  rows.length = 0;
  insertError = null;
  parseAnyFile.mockReset();
  parseAnyFile.mockResolvedValue([{ name: "Sheet1", headers: HEADERS, rows: RAW }]);
});

describe("Upload attempts always create durable run + audit rows", () => {
  it("records a started run before the file is imported", async () => {
    const store = makeStore();
    await upload(store);
    expect(runs()).toHaveLength(1);
    expect(runs()[0]).toMatchObject({
      type_key: "billing",
      status: "uploaded",
      file_name: "billing.csv",
      uploaded_by: "operator-1",
    });
    expect(runs()[0].file_sha256).toBeTruthy();
    expect(runs()[0].file_size_bytes).toBe(1);
    expect(runs()[0].detected_headers).toEqual(expect.arrayContaining(["Date of Service"]));
  });

  it("audits upload_started then upload_committed on a first load", async () => {
    const store = makeStore();
    await upload(store);
    expect(audits().map((a) => a.action)).toEqual(["upload_started", "upload_committed"]);
    expect(runUpdates()[0]).toMatchObject({ status: "committed", rows_added: 2, rows_unchanged: 0, rows_rejected: 0 });
    expect(runUpdates()[0].committed_at).toBeTruthy();
  });

  it("creates a run and duplicate_no_change audit for a duplicate reupload", async () => {
    const store = makeStore();
    await upload(store);
    inserted.length = 0;
    updated.length = 0;

    const second = await upload(store);

    expect(runs()).toHaveLength(1);
    expect(audits().map((a) => a.action)).toEqual(["upload_started", "duplicate_no_change"]);
    expect(second[0].appendedRowCount).toBe(0);
    expect(second[0].duplicateRowCount).toBe(2);
  });

  it("does not change normalized row counts on a duplicate reupload", async () => {
    const store = makeStore();
    await upload(store);
    const writesAfterFirst = store.writes.length;
    const rowsAfterFirst = store.writes.flat().length;

    await upload(store);

    expect(store.writes.length).toBe(writesAfterFirst);
    expect(store.writes.flat().length).toBe(rowsAfterFirst);
  });

  it("explains the no-change outcome on the run notes and outcome", async () => {
    const store = makeStore();
    await upload(store);
    updated.length = 0;
    const second = await upload(store);

    expect(second[0].statusReason).toMatch(/Already loaded: no report totals changed/);
    expect(String(runUpdates()[0].notes)).toMatch(/Already loaded: no report totals changed/);
  });

  it("marks the run failed and audits upload_failed when the export is unrecognized", async () => {
    parseAnyFile.mockResolvedValue([{ name: "Sheet1", headers: ["Nope"], rows: [{ Nope: 1 }] }]);
    const store = makeStore();
    const outcomes = await upload(store);

    expect(outcomes[0].ok).toBe(false);
    expect(runUpdates()[0]).toMatchObject({ status: "failed" });
    expect(audits().map((a) => a.action)).toContain("upload_failed");
    const errs = inserted.filter((i) => i.table === "cr_sync_run_errors").flatMap((i) => i.rows);
    expect(errs.length).toBeGreaterThan(0);
    expect(String(errs[0].error_message)).toMatch(/recognize/i);
  });
});