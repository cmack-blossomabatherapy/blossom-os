import { describe, it, expect, vi, beforeEach } from "vitest";

const parseAnyFile = vi.fn();
vi.mock("@/lib/os/dashboardEngine/excelParser", () => ({ parseAnyFile: (f: File) => parseAnyFile(f) }));

import { importCentralReachFiles, summarizeCrImport } from "@/lib/os/centralreachUploads/importService";
import type { CrImportStore } from "@/lib/os/centralreachUploads/importSession";
import { rowHashToIdentity } from "@/lib/os/centralreachUploads/supabaseStore";
import { crRunTypeForKind } from "@/lib/os/centralreachUploads/syncRun";
import type { CrRunTracker, CrRunCounts } from "@/lib/os/centralreachUploads/syncRun";
import type { CrSupportRefresher, CrSupportRefreshInput } from "@/lib/os/centralreachUploads/supportTables";
import { CR_FRESHNESS_KEYS } from "@/lib/os/centralreachUploads/supportTables";

const HEADERS = {
  billing: ["Date of Service", "Time Worked In Hours", "Procedure Code", "Client", "Provider", "Billing Id"],
  scheduling: ["Course", "Segment", "Event", "Cancelled", "Client", "Provider", "Date"],
  authorization: ["Authorization Number", "Authorized Hours Month", "Client", "Payor", "Start Date", "End Date"],
  utilization: ["Utilization Percent", "Week Start", "Authorization Number", "Client", "Authorized Hours"],
  claims: ["Claim Number", "Billed Amount", "Paid Amount", "Client", "Date of Service"],
  contacts: ["Contact Id", "Contact Type", "Client", "Email"],
};

const ROWS: Record<keyof typeof HEADERS, Record<string, unknown>[]> = {
  billing: [
    { "Date of Service": "2026-07-01", "Time Worked In Hours": 2, "Procedure Code": "97155", Client: "Jane Doe", Provider: "Bob BCBA", "Billing Id": "1" },
    { "Date of Service": "2026-07-05", "Time Worked In Hours": 1, "Procedure Code": "97153", Client: "Jane Doe", Provider: "Rita RBT", "Billing Id": "2" },
  ],
  scheduling: [{ Course: "c", Segment: "s", Event: "e", Cancelled: "Yes", Client: "Jane Doe", Provider: "Bob BCBA", Date: "2026-07-01" }],
  authorization: [{ "Authorization Number": "AU1", "Authorized Hours Month": 40, Client: "Jane Doe", Payor: "P", "Start Date": "2026-07-01", "End Date": "2026-12-31" }],
  utilization: [{ "Utilization Percent": 80, "Week Start": "2026-07-01", "Authorization Number": "AU1", Client: "Jane Doe", "Authorized Hours": 40 }],
  claims: [{ "Claim Number": "C1", "Billed Amount": 100, "Paid Amount": 90, Client: "Jane Doe", "Date of Service": "2026-07-01" }],
  contacts: [{ "Contact Id": "K1", "Contact Type": "Client", Client: "Jane Doe", Email: "a@b.co" }],
};

const sheet = (kind: keyof typeof HEADERS) => [{ name: "Sheet1", headers: HEADERS[kind], rows: ROWS[kind] }];
const file = (name = "export.csv") => new File(["x"], name, { type: "text/csv" });

function makeState() {
  return {
    inserted: [] as Array<{ table: string; rows: Record<string, unknown>[] }>,
    batches: [] as any[],
    identities: new Map<string, string[]>(),
    fail: null as string | null,
  };
}
type State = ReturnType<typeof makeState>;

function makeStore(state: State) {
  return (): CrImportStore<Record<string, unknown>> => ({
    loadExistingIdentities: async (t) => state.identities.get(t) ?? [],
    insertRows: async (t, rows) => {
      if (state.fail) throw new Error(state.fail);
      state.inserted.push({ table: t, rows });
      state.identities.set(t, [
        ...(state.identities.get(t) ?? []),
        ...rows.map((r) => rowHashToIdentity(String(r.row_hash))),
      ]);
    },
    createBatch: async (b) => {
      if (state.fail) throw new Error(state.fail);
      state.batches.push({ ...b, id: `batch-${state.batches.length + 1}` });
      return `batch-${state.batches.length}`;
    },
    finalizeBatch: async (id, b) => {
      const i = state.batches.findIndex((x) => x.id === id);
      if (i >= 0) state.batches[i] = { ...state.batches[i], ...b };
    },
  });
}

function makeTracker() {
  const runs: Array<{ id: string; exportType: string; typeKey: string; fileName: string }> = [];
  const audits: Array<{ runId: string | null; action: string }> = [];
  const commits: Array<{ runId: string | null; counts: CrRunCounts }> = [];
  const failures: Array<{ runId: string | null; message: string }> = [];
  const tracker: CrRunTracker = {
    async start(input) {
      const id = `run-${runs.length + 1}`;
      runs.push({ id, exportType: input.exportType, typeKey: crRunTypeForKind(input.exportType), fileName: input.fileName });
      return id;
    },
    async audit(runId, action) { audits.push({ runId, action }); },
    async commit(runId, counts) { commits.push({ runId, counts }); },
    async fail(runId, message) { failures.push({ runId, message }); },
  };
  return { tracker, runs, audits, commits, failures };
}

function makeRefresher() {
  const calls: CrSupportRefreshInput[] = [];
  const refresher: CrSupportRefresher = {
    async refresh(input) { calls.push(input); return []; },
  };
  return { refresher, calls };
}

function run(state: State, tracker: CrRunTracker, refresher: CrSupportRefresher, name = "billing.csv") {
  return importCentralReachFiles([file(name)], {
    makeStore: makeStore(state),
    makeRunTracker: () => tracker,
    makeSupportRefresher: () => refresher,
  });
}

describe("CentralReach upload — durable run tracking", () => {
  beforeEach(() => parseAnyFile.mockReset());

  it("creates a sync run, audit entries and a committed status with counts", async () => {
    parseAnyFile.mockResolvedValue(sheet("billing"));
    const state = makeState();
    const t = makeTracker();
    const r = makeRefresher();
    const out = await run(state, t.tracker, r.refresher);

    expect(t.runs).toHaveLength(1);
    expect(t.runs[0].typeKey).toBe("billing");
    expect(t.audits.map((a) => a.action)).toContain("upload_started");
    expect(t.audits.map((a) => a.action)).toContain("upload_committed");
    expect(t.commits[0].counts).toMatchObject({ rowCountTotal: 2, rowsAdded: 2, rowsUnchanged: 0, rowsRejected: 0 });
    expect(t.failures).toHaveLength(0);
    expect(out[0].runId).toBe("run-1");
  });

  it("creates the import batch and normalized rows for billing", async () => {
    parseAnyFile.mockResolvedValue(sheet("billing"));
    const state = makeState();
    const t = makeTracker();
    const out = await run(state, t.tracker, makeRefresher().refresher);
    expect(state.batches).toHaveLength(1);
    expect(state.inserted[0].table).toBe("cr_billing_sessions");
    expect(state.inserted[0].rows).toHaveLength(2);
    expect(out[0].batchId).toBe("batch-1");
    expect(out[0].batchStatus).toBe("active");
  });

  it("refreshes report freshness and support tables after a successful append", async () => {
    parseAnyFile.mockResolvedValue(sheet("billing"));
    const r = makeRefresher();
    await run(makeState(), makeTracker().tracker, r.refresher);
    expect(r.calls).toHaveLength(1);
    expect(r.calls[0]).toMatchObject({ kind: "billing", table: "cr_billing_sessions", rowCount: 2 });
    expect(r.calls[0].coverageStart).toBe("2026-07-01");
    expect(r.calls[0].coverageEnd).toBe("2026-07-05");
    expect(CR_FRESHNESS_KEYS.billing).toContain("bcba-productivity");
  });

  it("marks a full reupload as archived duplicates without changing totals", async () => {
    parseAnyFile.mockResolvedValue(sheet("billing"));
    const state = makeState();
    const t = makeTracker();
    const r = makeRefresher();
    await run(state, t.tracker, r.refresher);
    const second = await run(state, t.tracker, r.refresher);

    expect(second[0].appendedRowCount).toBe(0);
    expect(second[0].duplicateRowCount).toBe(2);
    expect(second[0].batchStatus).toBe("archived");
    expect(second[0].statusReason).toMatch(/already imported/i);
    expect(state.inserted).toHaveLength(1); // no second write
    expect(r.calls).toHaveLength(1); // support tables untouched by a pure duplicate
    expect(t.audits.map((a) => a.action)).toContain("upload_duplicate");
  });

  it("appends only the extra rows when a newer file extends coverage", async () => {
    parseAnyFile.mockResolvedValue(sheet("billing"));
    const state = makeState();
    const t = makeTracker();
    await run(state, t.tracker, makeRefresher().refresher);
    parseAnyFile.mockResolvedValue([{
      name: "Sheet1",
      headers: HEADERS.billing,
      rows: [
        ...ROWS.billing,
        { "Date of Service": "2026-08-01", "Time Worked In Hours": 3, "Procedure Code": "97155", Client: "Jane Doe", Provider: "Bob BCBA", "Billing Id": "3" },
      ],
    }]);
    const second = await run(state, t.tracker, makeRefresher().refresher, "billing-v2.csv");
    expect(second[0].appendedRowCount).toBe(1);
    expect(second[0].duplicateRowCount).toBe(2);
    expect(second[0].batchStatus).toBe("active");
    expect(second[0].coverageEnd).toBe("2026-08-01");
  });

  it("routes every export kind to its normalized table in one multi-file upload", async () => {
    const kinds = Object.keys(HEADERS) as Array<keyof typeof HEADERS>;
    const state = makeState();
    const t = makeTracker();
    for (const kind of kinds) {
      parseAnyFile.mockResolvedValue(sheet(kind));
      await run(state, t.tracker, makeRefresher().refresher, `${kind}.csv`);
    }
    expect(state.inserted.map((r) => r.table)).toEqual([
      "cr_billing_sessions",
      "cr_schedule_events",
      "cr_authorizations",
      "cr_authorization_utilization",
      "cr_claims",
      "cr_contacts",
    ]);
    expect(t.commits).toHaveLength(6);
  });

  it("surfaces a permission/RLS failure and records a failed run", async () => {
    parseAnyFile.mockResolvedValue(sheet("billing"));
    const state = makeState();
    state.fail = "permission denied for table cr_billing_sessions";
    const t = makeTracker();
    const out = await run(state, t.tracker, makeRefresher().refresher);

    expect(out[0].ok).toBe(false);
    expect(out[0].batchStatus).toBe("failed");
    expect(out[0].errors[0]).toMatch(/permission denied/);
    expect(t.failures[0].message).toMatch(/permission denied/);
    expect(summarizeCrImport(out).ok).toBe(false);
  });

  it("records a failed run when the export cannot be recognized", async () => {
    parseAnyFile.mockResolvedValue([{ name: "Sheet1", headers: ["Foo", "Bar"], rows: [{ Foo: 1 }] }]);
    const t = makeTracker();
    const out = await run(makeState(), t.tracker, makeRefresher().refresher, "mystery.csv");
    expect(out[0].ok).toBe(false);
    expect(out[0].errors[0]).toMatch(/Could not recognize/);
    expect(t.failures).toHaveLength(1);
  });
});