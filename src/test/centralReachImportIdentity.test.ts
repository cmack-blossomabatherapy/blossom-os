import { describe, it, expect } from "vitest";
import {
  runCrImportSession,
  crImportRowIdentity,
  crImportRowHash,
  identityToRowHash,
  type CrImportStore,
} from "@/lib/os/centralreachUploads/importSession";
import { CR_RAW_PAYLOAD } from "@/lib/os/centralreachUploads/normalize";

type Row = Record<string, unknown>;

function withRaw(row: Row, raw: Row): Row {
  const out = { ...row };
  Object.defineProperty(out, CR_RAW_PAYLOAD, { value: raw, enumerable: false, configurable: true });
  return out;
}

const normalized = (): Row => ({
  client_name: "Jane Doe",
  provider_name: "Bob RBT",
  service_date: "2026-07-01",
  service_code: "97153",
  hours: 2,
});

function makeStore() {
  const tables = new Map<string, Array<Row & { row_hash: string; batch_id: string }>>();
  let seq = 0;
  const store: CrImportStore<Row> = {
    async loadExistingIdentities(table) {
      return (tables.get(table) ?? []).map((r) =>
        r.row_hash.startsWith("id:") ? r.row_hash : `hash:${r.row_hash}`,
      );
    },
    async insertRows(table, rows) {
      const existing = tables.get(table) ?? [];
      const hashes = new Set(existing.map((r) => r.row_hash));
      rows.forEach((r) => {
        if (hashes.has(r.row_hash)) throw new Error(`duplicate row_hash ${r.row_hash}`);
        hashes.add(r.row_hash);
        existing.push(r);
      });
      tables.set(table, existing);
    },
    async createBatch() {
      seq += 1;
      return `batch-${seq}`;
    },
    async finalizeBatch() {},
  };
  return { store, tables };
}

const tableFor = () => "cr_billing_sessions";
const file = (name: string, rows: Row[]) => ({
  fileName: name,
  fileHash: `${name}-hash-0000`,
  exportType: "billing" as const,
  rows,
});

describe("CR import identity — raw CentralReach Id is the primary dedupe identity", () => {
  it("uses raw payload Id when the normalized row has no id column", () => {
    expect(crImportRowIdentity(withRaw(normalized(), { Id: "41625286" }))).toBe("id:41625286");
    expect(crImportRowHash(withRaw(normalized(), { Id: "41625286" }))).toBe("id:41625286");
    expect(identityToRowHash(withRaw(normalized(), { Id: "41625286" }))).toBe("id:41625286");
  });

  it("supports other id-like raw headers", () => {
    expect(crImportRowIdentity(withRaw(normalized(), { AppointmentId: "77" }))).toBe("id:77");
    expect(crImportRowIdentity(withRaw(normalized(), { ClaimId: "C9" }))).toBe("id:C9");
    expect(crImportRowIdentity(withRaw(normalized(), { RowNum: "12" }))).toBe("id:12");
  });

  it("falls back to a deterministic hash when no source id exists", () => {
    const id = crImportRowIdentity(withRaw(normalized(), { ClientName: "Jane Doe" }));
    expect(id.startsWith("hash:")).toBe(true);
    expect(crImportRowHash(normalized())).toBe(crImportRowHash({ ...normalized() }));
    expect(crImportRowHash(normalized()).startsWith("id:")).toBe(false);
  });

  it("appends two rows with identical normalized fields but different raw Ids", async () => {
    const { store, tables } = makeStore();
    const result = await runCrImportSession(store, tableFor, [
      file("a.csv", [
        withRaw(normalized(), { Id: "1001" }),
        withRaw(normalized(), { Id: "1002" }),
      ]),
    ]);
    expect(result.appendedRowCount).toBe(2);
    expect(result.duplicateRowCount).toBe(0);
    const stored = tables.get("cr_billing_sessions")!;
    expect(stored.map((r) => r.row_hash)).toEqual(["id:1001", "id:1002"]);
  });

  it("skips reuploads of the same raw Id across sessions", async () => {
    const { store, tables } = makeStore();
    await runCrImportSession(store, tableFor, [file("a.csv", [withRaw(normalized(), { Id: "1001" })])]);
    const second = await runCrImportSession(store, tableFor, [
      file("b.csv", [withRaw(normalized(), { Id: "1001" }), withRaw(normalized(), { Id: "1003" })]),
    ]);
    expect(second.appendedRowCount).toBe(1);
    expect(second.duplicateRowCount).toBe(1);
    expect(tables.get("cr_billing_sessions")).toHaveLength(2);
  });

  it("dedupes identical rows with no source id via the hash fallback", async () => {
    const { store, tables } = makeStore();
    const result = await runCrImportSession(store, tableFor, [
      file("a.csv", [normalized(), { ...normalized() }]),
    ]);
    expect(result.appendedRowCount).toBe(1);
    expect(result.duplicateRowCount).toBe(1);
    expect(tables.get("cr_billing_sessions")![0].row_hash.startsWith("id:")).toBe(false);
  });
});
