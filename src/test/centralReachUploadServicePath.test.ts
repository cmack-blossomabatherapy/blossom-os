import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";

const parseAnyFile = vi.fn();
vi.mock("@/lib/os/dashboardEngine/excelParser", () => ({ parseAnyFile: (f: File) => parseAnyFile(f) }));

import { importCentralReachFiles, summarizeCrImport } from "@/lib/os/centralreachUploads/importService";
import type { CrImportStore } from "@/lib/os/centralreachUploads/importSession";
import { rowHashToIdentity } from "@/lib/os/centralreachUploads/supabaseStore";

const BILLING_HEADERS = ["Date of Service", "Time Worked In Hours", "Procedure Code", "Client", "Provider", "Billing Id"];
const SCHED_HEADERS = ["Course", "Segment", "Event", "Cancelled", "Client", "Provider", "Date"];
const AUTH_HEADERS = ["Authorization Number", "Authorized Hours Month", "Client", "Payor", "Start Date", "End Date"];
const UTIL_HEADERS = ["Utilization Percent", "Week Start", "Authorization Number", "Client", "Authorized Hours"];

function sheet(headers: string[], rows: Record<string, unknown>[]) {
  return [{ name: "Sheet1", headers, rows }];
}
const file = (name = "export.csv") => new File(["x"], name, { type: "text/csv" });

interface Captured { table: string; rows: Record<string, unknown>[] }

function makeFakeStore(state: { rows: Captured[]; batches: any[]; identities: Map<string, string[]> }) {
  return (): CrImportStore<Record<string, unknown>> => ({
    loadExistingIdentities: async (table) => state.identities.get(table) ?? [],
    insertRows: async (table, rows) => {
      state.rows.push({ table, rows });
      const prev = state.identities.get(table) ?? [];
      state.identities.set(table, [...prev, ...rows.map((r) => rowHashToIdentity(String(r.row_hash)))]);
    },
    createBatch: async (batch) => {
      state.batches.push({ ...batch, id: `batch-${state.batches.length + 1}` });
      return `batch-${state.batches.length}`;
    },
    finalizeBatch: async (id, batch) => {
      const idx = state.batches.findIndex((b) => b.id === id);
      if (idx >= 0) state.batches[idx] = { ...state.batches[idx], ...batch };
    },
  });
}

function freshState() {
  return { rows: [] as Captured[], batches: [] as any[], identities: new Map<string, string[]>() };
}

describe("CentralReach Data Hub real upload path", () => {
  beforeEach(() => parseAnyFile.mockReset());

  it("billing upload writes cr_billing_sessions and an import batch", async () => {
    const state = freshState();
    parseAnyFile.mockResolvedValue(sheet(BILLING_HEADERS, [
      { "Date of Service": "2026-07-01", "Time Worked In Hours": 2, "Procedure Code": "97155", Client: "A", Provider: "B", "Billing Id": "1" },
      { "Date of Service": "2026-07-02", "Time Worked In Hours": 1, "Procedure Code": "97153", Client: "C", Provider: "D", "Billing Id": "2" },
    ]));
    const out = await importCentralReachFiles([file("billing.csv")], { makeStore: makeFakeStore(state) });
    expect(out[0].exportType).toBe("billing");
    expect(out[0].table).toBe("cr_billing_sessions");
    expect(out[0].appendedRowCount).toBe(2);
    expect(out[0].ok).toBe(true);
    expect(state.batches).toHaveLength(1);
    expect(state.batches[0].parsedRowCount).toBe(2);
    expect(state.rows[0].table).toBe("cr_billing_sessions");
    expect(state.rows[0].rows.every((r) => typeof r.row_hash === "string" && r.batch_id)).toBe(true);
  });

  it("scheduling upload writes cr_schedule_events", async () => {
    const state = freshState();
    parseAnyFile.mockResolvedValue(sheet(SCHED_HEADERS, [
      { Course: "c", Segment: "s", Event: "e", Cancelled: "Yes", Client: "A", Provider: "B", Date: "2026-07-01" },
    ]));
    const out = await importCentralReachFiles([file("sched.csv")], { makeStore: makeFakeStore(state) });
    expect(out[0].table).toBe("cr_schedule_events");
    expect(state.rows[0].table).toBe("cr_schedule_events");
  });

  it("authorization upload writes cr_authorizations", async () => {
    const state = freshState();
    parseAnyFile.mockResolvedValue(sheet(AUTH_HEADERS, [
      { "Authorization Number": "AU1", "Authorized Hours Month": 40, Client: "A", Payor: "P", "Start Date": "2026-07-01", "End Date": "2026-12-31" },
    ]));
    const out = await importCentralReachFiles([file("auth.csv")], { makeStore: makeFakeStore(state) });
    expect(out[0].table).toBe("cr_authorizations");
    expect(out[0].appendedRowCount).toBe(1);
  });

  it("utilization upload writes cr_authorization_utilization", async () => {
    const state = freshState();
    parseAnyFile.mockResolvedValue(sheet(UTIL_HEADERS, [
      { "Utilization Percent": 82, "Week Start": "2026-07-01", "Authorization Number": "AU1", Client: "A", "Authorized Hours": 10 },
    ]));
    const out = await importCentralReachFiles([file("util.csv")], { makeStore: makeFakeStore(state) });
    expect(out[0].table).toBe("cr_authorization_utilization");
  });

  it("multiple files append without archiving prior batches", async () => {
    const state = freshState();
    const make = makeFakeStore(state);
    parseAnyFile.mockResolvedValueOnce(sheet(BILLING_HEADERS, [
      { "Date of Service": "2026-07-01", "Time Worked In Hours": 2, "Procedure Code": "97155", Client: "A", Provider: "B", "Billing Id": "1" },
    ]));
    parseAnyFile.mockResolvedValueOnce(sheet(BILLING_HEADERS, [
      { "Date of Service": "2026-07-03", "Time Worked In Hours": 3, "Procedure Code": "97155", Client: "Z", Provider: "B", "Billing Id": "9" },
    ]));
    await importCentralReachFiles([file("b1.csv"), file("b2.csv")], { makeStore: make });
    expect(state.batches).toHaveLength(2);
    expect(state.batches.every((b) => b.isActive === true && b.status === "active")).toBe(true);
    expect(state.rows.flatMap((r) => r.rows)).toHaveLength(2);
  });

  it("re-uploading the same rows skips facts and counts duplicates", async () => {
    const state = freshState();
    const make = makeFakeStore(state);
    const rows = [{ "Date of Service": "2026-07-01", "Time Worked In Hours": 2, "Procedure Code": "97155", Client: "A", Provider: "B", "Billing Id": "1" }];
    parseAnyFile.mockResolvedValue(sheet(BILLING_HEADERS, rows));
    const first = await importCentralReachFiles([file("b.csv")], { makeStore: make });
    const second = await importCentralReachFiles([file("b.csv")], { makeStore: make });
    expect(first[0].appendedRowCount).toBe(1);
    expect(second[0].appendedRowCount).toBe(0);
    expect(second[0].duplicateRowCount).toBe(1);
    expect(second[0].ok).toBe(true);
    expect(state.rows.flatMap((r) => r.rows)).toHaveLength(1);
  });

  it("unrecognized exports fail loudly instead of reporting success", async () => {
    const state = freshState();
    parseAnyFile.mockResolvedValue(sheet(["Foo", "Bar"], [{ Foo: 1, Bar: 2 }]));
    const out = await importCentralReachFiles([file("mystery.csv")], { makeStore: makeFakeStore(state) });
    expect(out[0].ok).toBe(false);
    expect(out[0].errors.join(" ")).toMatch(/recognize/i);
    expect(state.batches).toHaveLength(0);
    expect(summarizeCrImport(out).ok).toBe(false);
  });

  it("a workbook with billing and scheduling sheets writes both tables", async () => {
    const state = freshState();
    parseAnyFile.mockResolvedValue([
      { name: "Billing", headers: BILLING_HEADERS, rows: [{ "Date of Service": "2026-07-01", "Time Worked In Hours": 2, "Procedure Code": "97155", Client: "A", Provider: "B", "Billing Id": "1" }] },
      { name: "Sched", headers: SCHED_HEADERS, rows: [{ Course: "c", Segment: "s", Event: "e", Cancelled: "Yes", Client: "A", Provider: "B", Date: "2026-07-01" }] },
    ]);
    const out = await importCentralReachFiles([file("mixed.xlsx")], { makeStore: makeFakeStore(state) });
    expect(out.map((o) => o.table).sort()).toEqual(["cr_billing_sessions", "cr_schedule_events"]);
    expect(state.batches).toHaveLength(2);
  });
});

describe("Data Hub UI is wired to the normalized path", () => {
  const ui = readFileSync("src/pages/os/system/CentralReachUploads.tsx", "utf8");

  it("uses importCentralReachFiles as the primary upload path", () => {
    expect(ui).toMatch(/importCentralReachFiles\(\[item\.file\]/);
  });

  it("bases readiness on true normalized row counts", () => {
    expect(ui).toMatch(/fetchCrNormalizedCounts/);
    expect(ui).toMatch(/NORMALIZED_CARDS/);
  });

  it("shows cr_import_batches history and a legacy reprocess action", () => {
    expect(ui).toMatch(/listCrImportBatches/);
    expect(ui).toMatch(/reprocessLegacySharedDatasets/);
  });

  it("marks a file done only after normalized rows are accounted for", () => {
    expect(ui).toMatch(/if \(!summary\.ok\)[\s\S]{0,400}status: "error"/);
  });

  it("legacy shared_report_datasets is demoted to reference history", () => {
    expect(ui).toMatch(/Legacy upload history/);
  });
});
