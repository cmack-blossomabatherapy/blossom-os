import { describe, it, expect, vi, beforeEach } from "vitest";
import { inferAssignmentHistory, type InferBillingRow } from "@/lib/os/bcbaProductivityV3/inferAssignments";

type Row = Record<string, any>;

const state: {
  cr: Row[];
  legacy: Row[];
  legacyBatches: Row[];
  crBatches: Row[];
  ranges: Record<string, number[][]>;
} = { cr: [], legacy: [], legacyBatches: [], crBatches: [], ranges: {} };

function tableRows(table: string): Row[] {
  if (table === "cr_billing_sessions") return state.cr;
  if (table === "bcba_productivity_billing_rows") return state.legacy;
  if (table === "cr_import_batches") return state.crBatches;
  if (table === "bcba_productivity_upload_batches") return state.legacyBatches;
  return [];
}

function makeBuilder(table: string) {
  let rows = tableRows(table).slice();
  let headCount: boolean = false;
  const builder: any = {
    select(_cols: string, opts?: { count?: string; head?: boolean }) {
      if (opts?.head) headCount = true;
      return builder;
    },
    eq(col: string, val: unknown) {
      rows = rows.filter((r) => r[col] === val);
      return builder;
    },
    not(col: string, op: string, val: unknown) {
      if (op === "is") rows = rows.filter((r) => r[col] !== null && r[col] !== undefined);
      else if (op === "ilike") {
        const prefix = String(val).replace(/%/g, "");
        rows = rows.filter((r) => !String(r[col] ?? "").startsWith(prefix));
      }
      return builder;
    },
    order(col: string, opts?: { ascending?: boolean }) {
      const asc = opts?.ascending !== false;
      rows = rows.slice().sort((a, b) =>
        String(a[col] ?? "").localeCompare(String(b[col] ?? "")) * (asc ? 1 : -1));
      return builder;
    },
    limit(n: number) {
      rows = rows.slice(0, n);
      return builder;
    },
    range(from: number, to: number) {
      (state.ranges[table] ||= []).push([from, to]);
      rows = rows.slice(from, to + 1);
      return builder;
    },
    then(resolve: (v: any) => unknown) {
      const payload = headCount
        ? { data: null, error: null, count: rows.length }
        : { data: rows, error: null, count: rows.length };
      return Promise.resolve(payload).then(resolve);
    },
  };
  return builder;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (table: string) => makeBuilder(table) },
}));

const store = await import("@/lib/os/bcbaProductivityV3/adminUploadStore");

function crRow(over: Partial<Row> = {}): Row {
  return {
    id: Math.random().toString(36).slice(2),
    client_cr_id: "111",
    client_name: "Areeb Hasan",
    rendering_provider_name: "Brandy Roden",
    provider_contact_labels: "BCBA",
    procedure_code: "97155",
    hours: 1.5,
    date_of_service: "2026-03-21",
    state: "Georgia",
    payor: "Aetna",
    ...over,
  };
}

beforeEach(() => {
  state.cr = [];
  state.legacy = [];
  state.legacyBatches = [];
  state.crBatches = [];
  state.ranges = {};
  store.invalidateBcbaProductivitySharedCache();
});

describe("BCBA Productivity V3 → CentralReach Data Hub wiring", () => {
  it("maps cr_billing_sessions rows into BcbaSharedBillingRow exactly", () => {
    const direct = store.mapCrBillingSessionRow(crRow());
    expect(direct).toEqual({
      clientId: "111",
      clientName: "Areeb Hasan",
      rbt: "",
      renderingProvider: "Brandy Roden",
      providerLabels: "BCBA",
      code: "97155",
      hours: 1.5,
      date: "2026-03-21",
      state: "GA",
      payor: "Aetna",
    });
    const rbt = store.mapCrBillingSessionRow(
      crRow({ procedure_code: "97153", rendering_provider_name: "Tech One" }),
    );
    expect(rbt.rbt).toBe("Tech One");
  });

  it("prefers Data Hub rows over legacy BCBA upload rows", async () => {
    state.cr = [crRow({ client_name: "From Data Hub" })];
    state.legacy = [{
      id: "l1", active: true, procedure_code: "97155", service_date: "2026-01-01",
      normalized: { clientId: "9", clientName: "From Legacy", rbt: "", renderingProvider: "X", providerLabels: "", code: "97155", hours: 1, date: "2026-01-01", state: "GA", payor: "" },
    }];
    const rows = await store.getBcbaProductivitySharedRows();
    expect(rows.map((r) => r.clientName)).toEqual(["From Data Hub"]);

    const status = await store.getBcbaProductivityDatasetStatus();
    expect(status.source).toBe("centralreach_data_hub");
    expect(status.sourceLabel).toBe("CentralReach Data Hub billing");
    expect(status.activeRowCount).toBe(1);
    expect(status.earliestServiceDate).toBe("2026-03-21");

    const ctx = await store.getBcbaProductivityOwnershipContextRows();
    expect(ctx.map((r) => r.clientName)).toEqual(["From Data Hub"]);
  });

  it("falls back to legacy rows when Data Hub billing is empty", async () => {
    state.legacy = [{
      id: "l1", active: true, procedure_code: "97155", service_date: "2026-01-01",
      normalized: { clientId: "9", clientName: "From Legacy", rbt: "", renderingProvider: "X", providerLabels: "", code: "97155", hours: 1, date: "2026-01-01", state: "GA", payor: "" },
    }];
    state.legacyBatches = [{ id: "b1", created_at: "2026-01-02T00:00:00Z", status: "active", uploaded_by_email: "a@b.c", service_date_min: "2026-01-01", service_date_max: "2026-01-01" }];
    const rows = await store.getBcbaProductivitySharedRows();
    expect(rows.map((r) => r.clientName)).toEqual(["From Legacy"]);
    const status = await store.getBcbaProductivityDatasetStatus();
    expect(status.source).toBe("legacy_upload");
  });

  it("paginates beyond 20,000 rows (56,936+)", async () => {
    const total = 56936;
    state.cr = Array.from({ length: total }, (_, i) =>
      crRow({ client_cr_id: String(i), date_of_service: "2026-05-01" }));
    const rows = await store.getBcbaProductivitySharedRows();
    expect(rows).toHaveLength(total);
    const ranges = state.ranges["cr_billing_sessions"];
    expect(ranges.length).toBe(Math.ceil(total / 5000));
    expect(ranges[0]).toEqual([0, 4999]);
  }, 30000);
});

describe("Areeb Hasan ownership from Data Hub rows", () => {
  const mk = (date: string, bcba: string, code: string): InferBillingRow =>
    store.mapCrBillingSessionRow(crRow({ date_of_service: date, rendering_provider_name: bcba, procedure_code: code }));

  const rows: InferBillingRow[] = [
    mk("2026-01-05", "Zestine Roberts", "97155"),
    mk("2026-02-27", "Zestine Roberts", "97155"),
    mk("2026-03-21", "Brandy Roden", "97155"),
    mk("2026-03-30", "Brandy Roden", "97151"),
    mk("2026-04-01", "Brandy Roden", "97151"),
    mk("2026-04-03", "Brandy Roden", "97151"),
    mk("2026-04-10", "Zestine Roberts", "97155"),
    mk("2026-04-29", "Zestine Roberts", "97155"),
  ];
  const { assignments } = inferAssignmentHistory(rows);
  const ownerOn = (iso: string) =>
    assignments
      .filter((a) => a.clientName === "Areeb Hasan" && a.startDate <= iso && (a.endDate === null || a.endDate >= iso))
      .map((a) => a.bcbaName);

  it("March 2026 → Brandy Roden only", () => {
    for (const d of ["2026-03-01", "2026-03-21", "2026-03-31"]) expect(ownerOn(d)).toEqual(["Brandy Roden"]);
  });
  it("April 1-9 → Brandy Roden only", () => {
    for (const d of ["2026-04-01", "2026-04-05", "2026-04-09"]) expect(ownerOn(d)).toEqual(["Brandy Roden"]);
  });
  it("April 10-30 → Zestine Roberts only", () => {
    for (const d of ["2026-04-10", "2026-04-20", "2026-04-29"]) expect(ownerOn(d)).toEqual(["Zestine Roberts"]);
  });
  it("ownership context maps ProviderContactLabels, never ClientContactLabels", () => {
    const mapped = store.mapCrBillingSessionRow(
      crRow({ provider_contact_labels: "BCBA, Supervisor" }),
    );
    expect(mapped.providerLabels).toBe("BCBA, Supervisor");
  });
});
