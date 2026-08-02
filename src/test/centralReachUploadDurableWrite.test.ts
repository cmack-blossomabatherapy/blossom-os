import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Proves the real upload handler path issues actual Supabase inserts into
 * cr_sync_runs, cr_sync_audit, cr_import_batches, cr_raw_rows and the
 * normalized fact table — the writes that were missing in production.
 */

type Insert = { table: string; rows: Record<string, unknown>[] };
const inserts: Insert[] = [];
const updates: Insert[] = [];
const rpcCalls: string[] = [];
let canManage: unknown = true;
let rpcError: { message: string } | null = null;
let userId: string | null = "admin-user-1";

function builder(table: string) {
  const api: Record<string, unknown> = {};
  const chain = () => api;
  Object.assign(api, {
    select: () => api,
    order: () => api,
    limit: async () => ({ data: [], error: null }),
    range: async () => ({ data: [], error: null }),
    eq: async () => ({ data: null, error: null }),
    single: async () => ({ data: { id: `${table}-id-1` }, error: null }),
    insert: (rows: Record<string, unknown> | Record<string, unknown>[]) => {
      inserts.push({ table, rows: Array.isArray(rows) ? rows : [rows] });
      return {
        select: () => ({ single: async () => ({ data: { id: `${table}-id-1` }, error: null }) }),
        then: (res: (v: { error: null }) => unknown) => Promise.resolve({ error: null }).then(res),
      };
    },
    upsert: (rows: Record<string, unknown> | Record<string, unknown>[]) => {
      inserts.push({ table, rows: Array.isArray(rows) ? rows : [rows] });
      return { then: (res: (v: { error: null }) => unknown) => Promise.resolve({ error: null }).then(res) };
    },
    update: (row: Record<string, unknown>) => {
      updates.push({ table, rows: [row] });
      return { eq: async () => ({ error: null }) };
    },
    delete: () => ({ eq: async () => ({ error: null }) }),
    chain,
  });
  return api;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => builder(table),
    rpc: async (fn: string) => {
      rpcCalls.push(fn);
      return { data: canManage, error: rpcError };
    },
    auth: { getUser: async () => ({ data: { user: userId ? { id: userId } : null }, error: null }) },
  },
}));

const parseAnyFile = vi.fn();
vi.mock("@/lib/os/dashboardEngine/excelParser", () => ({ parseAnyFile: (f: File) => parseAnyFile(f) }));

const { importCentralReachFiles } = await import("@/lib/os/centralreachUploads/importService");
const { crUploadPreflight } = await import("@/lib/os/centralreachUploads/syncRun");

const HEADERS = ["Date of Service", "Time Worked In Hours", "Procedure Code", "Client", "Provider", "Id"];
const ROWS = [
  { "Date of Service": "2026-07-01", "Time Worked In Hours": 2, "Procedure Code": "97155", Client: "Jane Doe", Provider: "Bob BCBA", Id: "9001" },
  { "Date of Service": "2026-07-08", "Time Worked In Hours": 1.5, "Procedure Code": "97153", Client: "Jane Doe", Provider: "Rita RBT", Id: "9002" },
];

const tables = () => inserts.map((i) => i.table);
const rowsFor = (table: string) => inserts.filter((i) => i.table === table).flatMap((i) => i.rows);

beforeEach(() => {
  inserts.length = 0;
  updates.length = 0;
  rpcCalls.length = 0;
  canManage = true;
  rpcError = null;
  userId = "admin-user-1";
  parseAnyFile.mockReset();
  parseAnyFile.mockResolvedValue([{ name: "Sheet1", headers: HEADERS, rows: ROWS }]);
});

describe("Upload handler writes durably to Supabase", () => {
  it("inserts a cr_sync_runs row for the upload attempt", async () => {
    await importCentralReachFiles([new File(["x"], "billing.csv", { type: "text/csv" })]);
    const runs = rowsFor("cr_sync_runs");
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({ type_key: "billing", file_name: "billing.csv", uploaded_by: "admin-user-1" });
    expect(runs[0].file_sha256).toBeTruthy();
  });

  it("writes cr_sync_audit entries and updates the run to committed with counts", async () => {
    await importCentralReachFiles([new File(["x"], "billing.csv", { type: "text/csv" })]);
    expect(rowsFor("cr_sync_audit").map((r) => r.action)).toEqual(["upload_started", "upload_committed"]);
    const runUpdate = updates.find((u) => u.table === "cr_sync_runs")!;
    expect(runUpdate.rows[0]).toMatchObject({ status: "committed", rows_added: 2, rows_unchanged: 0, rows_rejected: 0 });
    expect(runUpdate.rows[0].committed_at).toBeTruthy();
  });

  it("inserts cr_import_batches and cr_raw_rows for the upload", async () => {
    await importCentralReachFiles([new File(["x"], "billing.csv", { type: "text/csv" })]);
    const batch = rowsFor("cr_import_batches")[0];
    expect(batch).toMatchObject({ file_name: "billing.csv", export_type: "billing", is_active: true });
    expect(rowsFor("cr_raw_rows")).toHaveLength(2);
    expect(rowsFor("cr_raw_rows")[0]).toMatchObject({ export_type: "billing", row_hash: "id:9001" });
  });

  it("inserts normalized rows into cr_billing_sessions with stable row hashes", async () => {
    await importCentralReachFiles([new File(["x"], "billing.csv", { type: "text/csv" })]);
    const facts = rowsFor("cr_billing_sessions");
    expect(facts).toHaveLength(2);
    expect(facts.map((r) => r.row_hash)).toEqual(["id:9001", "id:9002"]);
    expect(facts[0].batch_id).toBe("cr_import_batches-id-1");
  });

  it("refreshes report freshness so reports pick the data up", async () => {
    await importCentralReachFiles([new File(["x"], "billing.csv", { type: "text/csv" })]);
    expect(tables()).toContain("cr_report_data_freshness");
  });

  it("orders the writes run → batch → facts", async () => {
    await importCentralReachFiles([new File(["x"], "billing.csv", { type: "text/csv" })]);
    const order = tables();
    expect(order.indexOf("cr_sync_runs")).toBeLessThan(order.indexOf("cr_import_batches"));
    expect(order.indexOf("cr_import_batches")).toBeLessThan(order.indexOf("cr_billing_sessions"));
  });
});

describe("Upload preflight blocks silent no-op uploads", () => {
  it("confirms write access when the hub manager check passes", async () => {
    const pre = await crUploadPreflight();
    expect(pre.canWrite).toBe(true);
    expect(rpcCalls).toContain("cr_hub_can_manage");
  });

  it("blocks and explains when the user lacks Data Hub write access", async () => {
    canManage = false;
    const pre = await crUploadPreflight();
    expect(pre.canWrite).toBe(false);
    expect(pre.reason).toMatch(/write access/i);
  });

  it("blocks and surfaces the database error when the check itself fails", async () => {
    rpcError = { message: "permission denied for function cr_hub_can_manage" };
    const pre = await crUploadPreflight();
    expect(pre.canWrite).toBe(false);
    expect(pre.reason).toMatch(/permission denied/);
  });

  it("blocks when there is no signed-in user", async () => {
    userId = null;
    const pre = await crUploadPreflight();
    expect(pre.canWrite).toBe(false);
    expect(pre.reason).toMatch(/not signed in/i);
  });
});