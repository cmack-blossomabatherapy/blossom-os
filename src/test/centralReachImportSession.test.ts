import { describe, it, expect } from "vitest";
import {
  runCrImportSession,
  identityToRowHash,
  type CrImportStore,
} from "@/lib/os/centralreachUploads/importSession";
import { billingFacts, groupFacts, utilizationFacts } from "@/lib/os/reports/crPrimary/sharedReport";

type Row = Record<string, unknown>;

const row = (id: string, extra: Row = {}): Row => ({
  "Billing Id": id,
  "Date of Service": "2026-07-01",
  Code: "97153",
  Hours: 2,
  ...extra,
});

function makeStore() {
  const tables = new Map<string, Array<Row & { row_hash: string; batch_id: string }>>();
  const batches: Array<{ id: string; descriptor: Record<string, unknown> }> = [];
  const deletions: string[] = [];
  let seq = 0;

  const store: CrImportStore<Row> = {
    async loadExistingIdentities(table) {
      return (tables.get(table) ?? []).map((r) =>
        r.row_hash.startsWith("id:") ? r.row_hash : `hash:${r.row_hash}`,
      );
    },
    async insertRows(table, rows) {
      const existing = tables.get(table) ?? [];
      // emulate the global unique index on row_hash
      const hashes = new Set(existing.map((r) => r.row_hash));
      rows.forEach((r) => {
        if (hashes.has(r.row_hash)) throw new Error(`duplicate row_hash ${r.row_hash}`);
        hashes.add(r.row_hash);
        existing.push(r);
      });
      tables.set(table, existing);
    },
    async createBatch(descriptor) {
      seq += 1;
      const id = `batch-${seq}`;
      batches.push({ id, descriptor: { ...descriptor } });
      return id;
    },
    async finalizeBatch(batchId, descriptor) {
      const found = batches.find((b) => b.id === batchId);
      if (found) found.descriptor = { ...descriptor };
    },
  };

  return { store, tables, batches, deletions };
}

const tableFor = () => "cr_billing_sessions";

describe("CR import session — append mode across files and sessions", () => {
  it("appends unique rows from multiple files in one session", async () => {
    const { store, tables } = makeStore();
    const result = await runCrImportSession(store, tableFor, [
      { fileName: "a.csv", fileHash: "hash-a-000", exportType: "billing", rows: [row("1"), row("2")] },
      { fileName: "b.csv", fileHash: "hash-b-000", exportType: "billing", rows: [row("3")] },
    ]);
    expect(result.appendedRowCount).toBe(3);
    expect(result.duplicateRowCount).toBe(0);
    expect(tables.get("cr_billing_sessions")).toHaveLength(3);
  });

  it("skips duplicate rows repeated across files in the same session", async () => {
    const { store, tables } = makeStore();
    const result = await runCrImportSession(store, tableFor, [
      { fileName: "a.csv", fileHash: "hash-a-000", exportType: "billing", rows: [row("1"), row("2")] },
      { fileName: "b.csv", fileHash: "hash-b-000", exportType: "billing", rows: [row("2"), row("3")] },
    ]);
    expect(result.appendedRowCount).toBe(3);
    expect(result.duplicateRowCount).toBe(1);
    expect(tables.get("cr_billing_sessions")).toHaveLength(3);
  });

  it("skips duplicate rows across separate import sessions (global dedupe)", async () => {
    const { store, tables } = makeStore();
    await runCrImportSession(store, tableFor, [
      { fileName: "a.csv", fileHash: "hash-a-000", exportType: "billing", rows: [row("1"), row("2")] },
    ]);
    const second = await runCrImportSession(store, tableFor, [
      { fileName: "c.csv", fileHash: "hash-c-000", exportType: "billing", rows: [row("2"), row("4")] },
    ]);
    expect(second.appendedRowCount).toBe(1);
    expect(second.duplicateRowCount).toBe(1);
    expect(tables.get("cr_billing_sessions")).toHaveLength(3);
  });

  it("normal upload never resets, deletes, or deactivates existing rows/batches", async () => {
    const { store, tables, batches } = makeStore();
    await runCrImportSession(store, tableFor, [
      { fileName: "a.csv", fileHash: "hash-a-000", exportType: "billing", rows: [row("1")] },
    ]);
    const second = await runCrImportSession(store, tableFor, [
      { fileName: "b.csv", fileHash: "hash-b-000", exportType: "billing", rows: [row("9")] },
    ]);
    expect(second.reset).toBe(false);
    expect(tables.get("cr_billing_sessions")).toHaveLength(2);
    expect(batches).toHaveLength(2);
    expect(batches.every((b) => b.descriptor.isActive === true)).toBe(true);
    expect(batches.every((b) => b.descriptor.status === "active")).toBe(true);
  });

  it("records one batch per uploaded file with honest counters and coverage", async () => {
    const { store, batches } = makeStore();
    await runCrImportSession(
      store,
      tableFor,
      [
        {
          fileName: "a.csv",
          fileHash: "hash-a-000",
          exportType: "billing",
          rows: [row("1"), row("1")],
          coverageStart: "2026-07-01",
          coverageEnd: "2026-07-31",
        },
      ],
      { uploadedBy: "user-1" },
    );
    expect(batches).toHaveLength(1);
    expect(batches[0].descriptor).toMatchObject({
      fileName: "a.csv",
      fileHash: "hash-a-000",
      exportType: "billing",
      parsedRowCount: 2,
      appendedRowCount: 1,
      duplicateRowCount: 1,
      coverageStart: "2026-07-01",
      coverageEnd: "2026-07-31",
      uploadedBy: "user-1",
    });
  });

  it("row_hash written to the DB matches the identity used for dedupe", () => {
    expect(identityToRowHash(row("42"))).toBe("id:42");
    const noId = { Client: "A", Hours: 1 };
    expect(identityToRowHash(noId)).not.toMatch(/^id:/);
    expect(identityToRowHash(noId)).toBe(identityToRowHash({ Hours: 1, Client: "A" }));
  });

  it("invalid files are skipped without touching stored rows", async () => {
    const { store, tables } = makeStore();
    const result = await runCrImportSession(store, tableFor, [
      { fileName: "notes.txt", fileHash: "hash-x-000", exportType: "billing", rows: [row("1")] },
    ]);
    expect(result.files[0].skipped).toBe(true);
    expect(result.appendedRowCount).toBe(0);
    expect(tables.get("cr_billing_sessions")).toBeUndefined();
  });
});

describe("Reports show empty states when normalized CR tables are empty", () => {
  it("empty normalized CR tables produce no facts and no groups (empty state)", () => {
    expect(billingFacts([])).toEqual([]);
    expect(utilizationFacts([])).toEqual([]);
    expect(groupFacts([], "provider")).toEqual([]);
  });
});