import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  planAppendRows,
  applyAppendBatch,
  applySnapshotBatches,
  activeReportBatches,
  crRowIdentity,
  type CRBatchDescriptor,
} from "@/lib/os/centralreachUploads/dataHub";

const row = (id: string, extra: Record<string, unknown> = {}) => ({
  "Billing Id": id,
  "Date of Service": "2026-07-01",
  Code: "97153",
  Hours: 2,
  ...extra,
});

const batch = (over: Partial<CRBatchDescriptor> = {}): CRBatchDescriptor => ({
  fileName: "billing.csv",
  fileHash: "abcdef1234",
  exportType: "billing",
  rowCount: 10,
  ...over,
});

describe("Data Hub append mode — multi-file uploads append unique rows", () => {
  it("appends every unique row across multiple files in one session", () => {
    const plan = planAppendRows([], [[row("1"), row("2")], [row("3")]]);
    expect(plan.parsedRowCount).toBe(3);
    expect(plan.appendedRowCount).toBe(3);
    expect(plan.duplicateRowCount).toBe(0);
  });

  it("skips duplicate rows repeated across files of the same session", () => {
    const plan = planAppendRows([], [[row("1"), row("2")], [row("2"), row("4")]]);
    expect(plan.appendedRowCount).toBe(3);
    expect(plan.duplicateRowCount).toBe(1);
    expect(plan.toInsert.map((r) => r["Billing Id"])).toEqual(["1", "2", "4"]);
  });

  it("skips rows already stored by a separate earlier batch (global dedupe)", () => {
    const first = planAppendRows([], [[row("1"), row("2")]]);
    const second = planAppendRows(first.identities, [[row("2"), row("3")]]);
    expect(second.appendedRowCount).toBe(1);
    expect(second.duplicateRowCount).toBe(1);
    expect(second.toInsert[0]["Billing Id"]).toBe("3");
  });

  it("dedupes hash-identity rows with no CentralReach row id", () => {
    const a = { Client: "Jane", Date: "2026-07-01", Hours: 2 };
    const plan = planAppendRows([], [[a], [{ ...a }]]);
    expect(plan.appendedRowCount).toBe(1);
    expect(plan.duplicateRowCount).toBe(1);
    expect(crRowIdentity(a).startsWith("hash:")).toBe(true);
  });

  it("normal append never deactivates prior batches", () => {
    const existing = [batch({ isActive: true, status: "active" })];
    const after = applyAppendBatch(existing, batch({ fileHash: "999888777", fileName: "b2.csv" }));
    expect(after).toHaveLength(2);
    expect(after.every((b) => b.isActive === true)).toBe(true);
  });

  it("explicit snapshot/reset path still archives prior batches", () => {
    const existing = [batch({ isActive: true, status: "active" })];
    const after = applySnapshotBatches(existing, batch({ fileHash: "999888777" }));
    expect(after[0].isActive).toBe(false);
    expect(after[0].status).toBe("archived");
    expect(after[1].isActive).toBe(true);
  });

  it("reports read only active/current batches", () => {
    const batches = [
      batch({ fileHash: "aaa11111", isActive: false, status: "archived" }),
      batch({ fileHash: "bbb22222", isActive: true, status: "active" }),
      batch({ fileHash: "ccc33333", isActive: true, status: "failed" }),
    ];
    const active = activeReportBatches(batches);
    expect(active).toHaveLength(1);
    expect(active[0].fileHash).toBe("bbb22222");
  });

  it("carries honest per-batch counters", () => {
    const plan = planAppendRows([crRowIdentity(row("1"))], [[row("1"), row("2"), row("2")]]);
    const rec = applyAppendBatch([], batch({
      parsedRowCount: plan.parsedRowCount,
      appendedRowCount: plan.appendedRowCount,
      duplicateRowCount: plan.duplicateRowCount,
      coverageStart: "2026-07-01",
      coverageEnd: "2026-07-31",
    }))[0];
    expect(rec.parsedRowCount).toBe(3);
    expect(rec.appendedRowCount).toBe(1);
    expect(rec.duplicateRowCount).toBe(2);
    expect(rec.status).toBe("active");
  });
});

describe("BCBA Productivity — inactive historical rows excluded from reports", () => {
  const store = readFileSync("src/lib/os/bcbaProductivityV3/adminUploadStore.ts", "utf8");

  it("shared report rows only read active = true", () => {
    expect(store).toMatch(/getBcbaProductivitySharedRows[\s\S]*?\.eq\("active", true\)/);
  });

  it("ownership context returns empty when no active rows exist", () => {
    expect(store).toMatch(/await drain\("active"\);[\s\S]{0,600}if \(acc\.length === 0\) return \[\];/);
  });

  it("never deletes historical rows — void only deactivates", () => {
    expect(store).toMatch(/voidBcbaProductivityBatch[\s\S]*?update\(\{ active: false \}\)/);
    expect(store).not.toMatch(/from\("bcba_productivity_billing_rows"\)\s*\.delete\(\)/);
  });
});

describe("Migration — cross-batch dedupe on normalized CR tables", () => {
  const dir = "supabase/migrations";
  const allSql = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => readFileSync(join(dir, f), "utf8"))
    .join("\n");

  for (const t of [
    "cr_billing_sessions",
    "cr_schedule_events",
    "cr_authorizations",
    "cr_authorization_utilization",
    "cr_claims",
    "cr_contacts",
  ]) {
    it(`${t} has a global unique index on row_hash`, () => {
      expect(allSql).toMatch(
        new RegExp(`CREATE UNIQUE INDEX (IF NOT EXISTS )?\\w+\\s+ON public\\.${t}\\(row_hash\\)`, "i"),
      );
    });
  }

  it("import batches track parsed / appended / duplicate counters", () => {
    expect(allSql).toMatch(/cr_import_batches[\s\S]{0,400}parsed_row_count/);
    expect(allSql).toMatch(/appended_row_count/);
    expect(allSql).toMatch(/duplicate_row_count/);
  });

  it("dedupe migration does not delete CR data", () => {
    expect(allSql).not.toMatch(/TRUNCATE TABLE public\.cr_/i);
    expect(allSql).not.toMatch(/DROP TABLE (IF EXISTS )?public\.cr_/i);
  });
});
