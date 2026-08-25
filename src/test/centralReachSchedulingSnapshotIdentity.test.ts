import { describe, it, expect } from "vitest";
import {
  crImportRowIdentity,
  crSourceRowId,
  runCrImportSession,
  type CrImportStore,
  type CrRawRowRecord,
} from "@/lib/os/centralreachUploads/importSession";
import { normalizeCrRow, crClockTime } from "@/lib/os/centralreachUploads/normalize";

type Row = Record<string, unknown>;

/** Real August 24 CentralReach scheduling export headers. */
const schedulingRaw = (over: Row = {}): Row => ({
  Course: "ABA",
  Segment: "1375558466",
  Event: "1375558467",
  EventStartDateTime: "8/24/2026 21:45",
  EventEndDateTime: "8/24/2026 23:15",
  Principal1Name: "Jane Client",
  Principal2Name: "Bob RBT",
  Code: "1049",
  CodeName: "97153 Adaptive Behavior Treatment",
  Deleted: "0",
  Cancelled: "0",
  Attendance: "0",
  ConvertedToTimesheet: "0",
  CancelledReason: "0",
  SegmentHours: "1.5",
  LocationStateProvince: "GA",
  ...over,
});

const normalized = (over: Row = {}) => normalizeCrRow("scheduling", schedulingRaw(over));

function makeStore() {
  const tables = new Map<string, Array<Row & { row_hash: string }>>();
  const raw: CrRawRowRecord[] = [];
  let seq = 0;
  const store: CrImportStore<Row> = {
    async loadExistingIdentities(table) {
      return (tables.get(table) ?? []).map((r) =>
        String(r.row_hash).startsWith("id:") ? String(r.row_hash) : `hash:${r.row_hash}`,
      );
    },
    async insertRows(table, rows) {
      const existing = tables.get(table) ?? [];
      existing.push(...rows);
      tables.set(table, existing);
    },
    async updateRows(table, rows) {
      const existing = tables.get(table) ?? [];
      for (const row of rows) {
        const idx = existing.findIndex((r) => r.row_hash === row.row_hash);
        if (idx < 0) throw new Error(`update missed ${row.row_hash}`);
        existing[idx] = { ...existing[idx], ...row };
      }
      tables.set(table, existing);
    },
    async saveRawRows(rows) {
      raw.push(...rows);
    },
    async createBatch() {
      seq += 1;
      return `batch-${seq}`;
    },
    async finalizeBatch() {},
  };
  return { store, tables, raw };
}

const tableFor = () => "cr_schedule_events";
const file = (name: string, rows: Row[]) => ({
  fileName: name,
  fileHash: `${name}-hash-0000`,
  exportType: "scheduling" as const,
  rows,
});

describe("scheduling snapshot identity — raw Event column", () => {
  it("uses Event as the scheduling source row id", () => {
    const row = normalized();
    expect(crImportRowIdentity(row, "scheduling")).toBe("id:1375558467");
    expect(crSourceRowId(row, "scheduling")).toBe("1375558467");
  });

  it("does not let a generic Event field become the key for other report types", () => {
    const billing = normalizeCrRow("billing", {
      DateOfService: "8/24/2026",
      TimeWorkedInHours: "2",
      ProcedureCode: "97153",
      ClientName: "Jane Client",
      Event: "999999",
    });
    expect(crImportRowIdentity(billing, "billing")).not.toBe("id:999999");
  });

  it("updates the current fact when the same Event is re-exported", async () => {
    const { store, tables, raw } = makeStore();
    await runCrImportSession(store, tableFor, [file("sched-1.csv", [normalized()])]);
    const second = await runCrImportSession(store, tableFor, [
      file("sched-2.csv", [normalized({ Cancelled: "1", CancelledReason: "Client illness" })]),
    ]);

    expect(second.appendedRowCount).toBe(0);
    expect(second.updatedRowCount).toBe(1);
    const stored = tables.get("cr_schedule_events")!;
    expect(stored).toHaveLength(1);
    expect(stored[0].cancelled).toBe(true);
    expect(stored[0].status).toBe("Cancelled");
    expect(stored[0].cancellation_reason).toBe("Client illness");

    // Raw history keeps one version per batch for the same identity.
    const versions = raw.filter((r) => r.cr_row_id === "1375558467");
    expect(versions).toHaveLength(2);
    expect(new Set(versions.map((v) => v.batch_id)).size).toBe(2);
  });
});

describe("scheduling date/time and flag normalization", () => {
  it("populates event_date and start/end times from the event timestamps", () => {
    const row = normalized();
    expect(row.event_date).toBe("2026-08-24");
    expect(row.start_time).toBe("21:45:00");
    expect(row.end_time).toBe("23:15:00");
  });

  it("preserves local wall-clock meaning with no timezone shift", () => {
    expect(crClockTime("8/24/2026 21:45")).toBe("21:45:00");
    expect(crClockTime("8/24/2026 9:05 PM")).toBe("21:05:00");
    expect(crClockTime("8/24/2026 12:30 AM")).toBe("00:30:00");
  });

  it("keeps CodeName as the human billing code", () => {
    const row = normalized();
    expect(row.billing_code_name).toBe("97153 Adaptive Behavior Treatment");
    expect(row.billing_code).toBe("1049");
    expect(row.procedure_code).toBe("97153");
  });

  it("normalizes Deleted and Cancelled independently", () => {
    expect(normalized().deleted).toBe(false);
    expect(normalized().cancelled).toBe(false);
    expect(normalized({ Deleted: "1" }).deleted).toBe(true);
    expect(normalized({ Deleted: "1" }).cancelled).toBe(false);
    expect(normalized({ Cancelled: "1" }).deleted).toBe(false);
    expect(normalized({ Cancelled: "1" }).cancelled).toBe(true);
  });

  it("treats placeholder reason 0 as no reason and never as a cancellation", () => {
    const row = normalized({ CancelledReason: "0" });
    expect(row.cancellation_reason).toBeNull();
    expect(row.cancelled).toBe(false);
    expect(row.status).not.toBe("Cancelled");
  });
});
