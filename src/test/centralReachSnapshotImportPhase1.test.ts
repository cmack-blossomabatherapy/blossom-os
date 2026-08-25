import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  runCrImportSession,
  crSourceRowId,
  type CrImportStore,
  type CrRawRowRecord,
} from "@/lib/os/centralreachUploads/importSession";
import {
  CR_IMPORT_STRATEGY,
  crImportStrategyFor,
  CR_SIDE_TABLE_FOR_KIND,
} from "@/lib/os/centralreachUploads/strategy";
import {
  CR_RAW_PAYLOAD,
  billingStatusRow,
  crTableForKind,
  normalizeCrRow,
  resolveServiceCode,
} from "@/lib/os/centralreachUploads/normalize";

type Row = Record<string, unknown>;

function withRaw(row: Row, raw: Row): Row {
  const out = { ...row };
  Object.defineProperty(out, CR_RAW_PAYLOAD, { value: raw, enumerable: false, configurable: true });
  return out;
}

function makeStore() {
  const tables = new Map<string, Array<Row & { row_hash: string }>>();
  const raw: CrRawRowRecord[] = [];
  let seq = 0;
  const store: CrImportStore<Row> = {
    async loadExistingIdentities(table) {
      return (tables.get(table) ?? []).map((r) =>
        r.row_hash.startsWith("id:") ? r.row_hash : `hash:${r.row_hash}`,
      );
    },
    async insertRows(table, rows) {
      const existing = tables.get(table) ?? [];
      existing.push(...(rows as Array<Row & { row_hash: string }>));
      tables.set(table, existing);
    },
    async updateRows(table, rows) {
      const existing = tables.get(table) ?? [];
      rows.forEach((row) => {
        const index = existing.findIndex((r) => r.row_hash === row.row_hash);
        if (index < 0) throw new Error(`update missed ${row.row_hash}`);
        existing[index] = { ...existing[index], ...row };
      });
      tables.set(table, existing);
    },
    async upsertRows(table, rows) {
      const existing = tables.get(table) ?? [];
      rows.forEach((row) => {
        const index = existing.findIndex((r) => r.row_hash === row.row_hash);
        if (index >= 0) existing[index] = { ...existing[index], ...row };
        else existing.push(row as Row & { row_hash: string });
      });
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

const file = (name: string, exportType: "billing" | "authorization" | "scheduling", rows: Row[]) => ({
  fileName: name,
  fileHash: `${name}-hash-0000`,
  exportType,
  rows,
});

const sideRowFor = (_kind: unknown, row: Row) => billingStatusRow(row);

describe("import strategies", () => {
  it("bills append, mutable current exports upsert", () => {
    expect(CR_IMPORT_STRATEGY.billing).toBe("append_fact");
    expect(CR_IMPORT_STRATEGY.contacts).toBe("append_fact");
    expect(crImportStrategyFor("scheduling")).toBe("upsert_snapshot");
    expect(crImportStrategyFor("authorization")).toBe("upsert_snapshot");
    expect(crImportStrategyFor("utilization")).toBe("upsert_snapshot");
    expect(crImportStrategyFor("claims")).toBe("upsert_snapshot");
  });
});

describe("snapshot upserts keep current facts fresh", () => {
  const auth = (over: Row = {}) =>
    normalizeCrRow("authorization", {
      AuthorizationId: "555",
      AuthorizationNumber: "A-1",
      ClientFirstName: "Jane",
      ClientLastName: "Doe",
      WorkedHoursAuthRange: 10,
      AuthorizedHoursAuthRange: 100,
      ...over,
    }) as Row;

  it("a repeated authorization source id updates the stored current row", async () => {
    const { store, tables } = makeStore();
    await runCrImportSession(store, crTableForKind, [file("a.csv", "authorization", [auth()])]);
    const second = await runCrImportSession(store, crTableForKind, [
      file("b.csv", "authorization", [auth({ WorkedHoursAuthRange: 42 })]),
    ]);
    const rows = tables.get("cr_authorizations")!;
    expect(rows).toHaveLength(1);
    expect(rows[0].worked_hours).toBe(42);
    expect(rows[0].worked_hours_auth_range).toBe(42);
    expect(rows[0].source_row_id).toBe("555");
    expect(rows[0].last_seen_batch_id).toBe("batch-2");
    expect(second.updatedRowCount).toBe(1);
    expect(second.appendedRowCount).toBe(0);
    expect(second.duplicateRowCount).toBe(0);
  });

  it("a repeated scheduling source id updates the stored current row", async () => {
    const { store, tables } = makeStore();
    const event = (over: Row = {}) =>
      normalizeCrRow("scheduling", {
        AppointmentId: "88",
        EventDate: "2026-07-01",
        Cancelled: "0",
        Attendance: "1",
        ...over,
      }) as Row;
    await runCrImportSession(store, crTableForKind, [file("s1.csv", "scheduling", [event()])]);
    await runCrImportSession(store, crTableForKind, [
      file("s2.csv", "scheduling", [event({ Cancelled: "1", CancellationReason: "Client illness" })]),
    ]);
    const rows = tables.get("cr_schedule_events")!;
    expect(rows).toHaveLength(1);
    expect(rows[0].cancelled).toBe(true);
    expect(rows[0].status).toBe("Cancelled");
    expect(rows[0].cancellation_reason).toBe("Client illness");
  });

  it("a snapshot reimport with zero new identities is still a successful batch", async () => {
    const { store } = makeStore();
    await runCrImportSession(store, crTableForKind, [file("a.csv", "authorization", [auth()])]);
    const second = await runCrImportSession(store, crTableForKind, [
      file("a.csv", "authorization", [auth({ WorkedHoursAuthRange: 11 })]),
    ]);
    const result = second.files[0];
    expect(result.skipped).toBe(false);
    expect(result.errors).toEqual([]);
    expect(result.appendedRowCount).toBe(0);
    expect(result.updatedRowCount).toBe(1);
    expect(second.batches.at(-1)!.status).toBe("active");
    expect(second.batches.at(-1)!.isActive).toBe(true);
    expect(second.batches.at(-1)!.importStrategy).toBe("upsert_snapshot");
  });
});

describe("append-fact billing stays immutable while billing status refreshes", () => {
  const billing = (over: Row = {}) =>
    withRaw(
      normalizeCrRow("billing", {
        Id: "9001",
        DateOfService: "2026-07-01",
        Code: "97153",
        Hours: 2,
        ClientFirstName: "Jane",
        ClientLastName: "Doe",
        IsVoid: "0",
        SignedByProvider: "0",
        ...over,
      }) as Row,
      { Id: "9001", IsVoid: over.IsVoid ?? "0", SignedByProvider: over.SignedByProvider ?? "0", FirstClaimDate: over.FirstClaimDate ?? "" },
    );

  it("keeps one immutable fact and updates the documentation status row", async () => {
    const { store, tables } = makeStore();
    await runCrImportSession(store, crTableForKind, [file("b1.csv", "billing", [billing()])], {
      sideRowFor,
    });
    const second = await runCrImportSession(
      store,
      crTableForKind,
      [file("b2.csv", "billing", [billing({ SignedByProvider: "1", FirstClaimDate: "2026-07-20" })])],
      { sideRowFor },
    );

    expect(tables.get("cr_billing_sessions")).toHaveLength(1);
    expect(second.files[0].duplicateRowCount).toBe(1);
    expect(second.files[0].appendedRowCount).toBe(0);

    const status = tables.get("cr_billing_session_status")!;
    expect(CR_SIDE_TABLE_FOR_KIND.billing).toBe("cr_billing_session_status");
    expect(status).toHaveLength(1);
    expect(status[0].signed_by_provider).toBe(true);
    expect(status[0].first_claim_date).toBe("2026-07-20");
    expect(status[0].source_row_id).toBe("9001");
  });
});

describe("raw history", () => {
  it("keeps one raw version per batch for every parsed row, updates and duplicates included", async () => {
    const { store, raw } = makeStore();
    const authRow = () =>
      normalizeCrRow("authorization", { AuthorizationId: "7", AuthorizationNumber: "A-7" }) as Row;
    await runCrImportSession(store, crTableForKind, [
      file("a.csv", "authorization", [authRow(), authRow()]),
    ]);
    await runCrImportSession(store, crTableForKind, [file("b.csv", "authorization", [authRow()])]);
    expect(raw).toHaveLength(2);
    expect(raw.map((r) => r.batch_id)).toEqual(["batch-1", "batch-2"]);
    expect(raw.every((r) => r.cr_row_id === "7")).toBe(true);
  });

  it("exposes the CentralReach source row id explicitly", () => {
    expect(crSourceRowId(withRaw({ a: 1 }, { Id: "4321" }))).toBe("4321");
    expect(crSourceRowId({ client_name: "Jane" })).toBeNull();
  });
});

describe("normalization corrections", () => {
  it("prefers the human billing code name over the internal numeric code", () => {
    const resolved = resolveServiceCode({ Code: "418", BillingCodeName: "97153 - Direct Therapy" });
    expect(resolved.procedureCode).toBe("97153");
    expect(resolved.billingCode).toBe("418");
    expect(resolved.billingCodeName).toBe("97153 - Direct Therapy");
  });

  it("never lets Attendance=0 outrank a Cancelled event", () => {
    const row = normalizeCrRow("scheduling", {
      EventDate: "2026-07-01",
      Attendance: "0",
      Cancelled: "1",
    });
    expect(row.cancelled).toBe(true);
    expect(row.status).toBe("Cancelled");
    expect(row.attendance).toBe("0");
  });

  it("marks deleted events deleted and treats Reason=0/blank as no reason", () => {
    const deleted = normalizeCrRow("scheduling", {
      EventDate: "2026-07-01",
      Deleted: "1",
      Cancelled: "1",
      CancellationReason: "0",
      CancelledBy: "",
    });
    expect(deleted.deleted).toBe(true);
    expect(deleted.status).toBe("Deleted");
    expect(deleted.cancellation_reason).toBeNull();
    expect(deleted.cancelled_by).toBeNull();
  });

  it("keeps claim amount units explicitly unknown", () => {
    const claim = normalizeCrRow("claims", { ClaimId: "C1", Amount: "1200", PaidAmount: "0" });
    expect(claim.amount_unit).toBe("unknown");
    expect(claim.amount_raw).toBe(1200);
    expect(claim.paid_amount_raw).toBe(0);
  });

  it("keeps legacy authorization hour columns populated alongside explicit windows", () => {
    const row = normalizeCrRow("authorization", {
      AuthorizationId: "1",
      AuthorizedHoursAll: 200,
      AuthorizedHoursMonth: 40,
      AuthorizedHoursAuthRange: 100,
      WorkedHoursAuthRange: 25,
      ScheduledHoursMonth: 12,
      PendingHoursAuthRange: 3,
    });
    expect(row.authorized_hours).toBe(100);
    expect(row.authorized_hours_all).toBe(200);
    expect(row.authorized_hours_month).toBe(40);
    expect(row.scheduled_hours_month).toBe(12);
    expect(row.pending_hours_auth_range).toBe(3);
    expect(row.remaining_hours).toBe(75);
  });
});

describe("V3 boundary and security migrations", () => {
  const sql = readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .map((f) => readFileSync(join("supabase/migrations", f), "utf8"))
    .join("\n");

  it("does not remove or rewrite the V3 billing fact columns", () => {
    const store = readFileSync("src/lib/os/bcbaProductivityV3/adminUploadStore.ts", "utf8");
    expect(store).toContain("cr_billing_sessions");
    expect(sql).not.toMatch(/ALTER TABLE public\.cr_billing_sessions\s+DROP/i);
    expect(sql).not.toMatch(/TRUNCATE TABLE public\.cr_/i);
  });

  it("adds source tracking + new current fields", () => {
    expect(sql).toMatch(/source_row_id/);
    expect(sql).toMatch(/last_seen_batch_id/);
    expect(sql).toMatch(/source_quality jsonb/);
    expect(sql).toMatch(/converted_to_timesheet/);
    expect(sql).toMatch(/billing_code_name/);
    expect(sql).toMatch(/amount_unit text NOT NULL DEFAULT 'unknown'/);
    expect(sql).toMatch(/import_strategy/);
    expect(sql).toMatch(/updated_row_count/);
    expect(sql).toMatch(/unchanged_row_count/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.cr_billing_session_status/);
  });

  it("restricts raw payload reads to Data Hub managers", () => {
    expect(sql).toMatch(/DROP POLICY IF EXISTS cr_raw_rows_read ON public\.cr_raw_rows/);
    expect(sql).toMatch(
      /CREATE POLICY cr_raw_rows_read_admin[\s\S]{0,200}public\.cr_hub_can_manage\(\)/,
    );
  });

  it("adds curated report views that respect RLS", () => {
    for (const view of [
      "v_cr_schedule_current",
      "v_cr_authorization_current",
      "v_cr_billing_documentation_status",
      "v_cr_claims_status",
      "v_authorization_operational_events",
    ]) {
      expect(sql).toMatch(new RegExp(`CREATE VIEW public\\.${view}\\s+WITH \\(security_invoker = on\\)`));
      expect(sql).toMatch(new RegExp(`GRANT SELECT ON public\\.${view} TO authenticated`));
    }
  });

  it("derives authorization events only from logged operational sources", () => {
    const eventView = sql.slice(sql.lastIndexOf("CREATE VIEW public.v_authorization_operational_events"));
    expect(eventView).toContain("authorization_weekly_events");
    expect(eventView).toContain("authorization_operational_records");
    expect(eventView).toMatch(/'submitted', r\.submitted_date/);
    expect(eventView).toMatch(/'approved', r\.approved_date/);
    expect(eventView).toMatch(/'denied', r\.denied_date/);
    expect(eventView).not.toMatch(/'submitted', r\.start_date/);
  });
});
