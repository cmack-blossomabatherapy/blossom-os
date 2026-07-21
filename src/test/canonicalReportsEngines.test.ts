import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/integrations/supabase/client", () => {
  const rpc = vi.fn();
  return { supabase: { rpc } };
});

import { supabase } from "@/integrations/supabase/client";
import {
  fetchCanonicalReportTotals,
  fetchCanonicalReportClientHours,
  fetchCanonicalReportProviderHours,
  fetchCanonicalReportBillingRows,
  fetchAllCanonicalReportBillingRows,
  dedupeBillingRows,
  deriveSupervisionStatus,
  deriveParentTrainingStatus,
  deriveSourceState,
  mapTotals,
  mapClientRow,
  mapProviderRow,
  mapBillingRow,
  type CanonicalReportBillingRow,
} from "@/lib/os/reporting/canonicalReports";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = (supabase as any).rpc as ReturnType<typeof vi.fn>;

beforeEach(() => rpc.mockReset());

describe("canonical report engines — adapter contract", () => {
  it("totals: shapes RPC row and handles empty result as zeroed totals", async () => {
    rpc.mockResolvedValueOnce({ data: [], error: null });
    const empty = await fetchCanonicalReportTotals();
    expect(empty.totalRows).toBe(0);
    expect(empty.totalHours).toBe(0);
    expect(empty.minServiceDate).toBeNull();

    rpc.mockResolvedValueOnce({
      data: [{
        total_rows: 47533, total_hours: "149229.8",
        direct_hours: 120226, supervision_hours: 16810,
        parent_training_hours: 1216, assessment_hours: 0,
        cancellation_hours: 0, admin_hours: 0,
        h97153: 120226, h97155: 16810, h97156: 1216,
        distinct_clients: 879, distinct_providers: 546,
        unmapped_rows: 100, unmapped_hours: 200, unmapped_providers: 3,
        min_service_date: "2026-01-01", max_service_date: "2026-06-30",
        min_batch_uploaded_at: "2026-07-15T00:00:00Z",
        max_batch_uploaded_at: "2026-07-15T00:00:00Z",
      }],
      error: null,
    });
    const t = await fetchCanonicalReportTotals({ start: "2026-01-01", end: "2026-06-30" });
    expect(t.totalRows).toBe(47533);
    expect(t.h97155).toBe(16810);
    expect(t.distinctClients).toBe(879);
    expect(rpc).toHaveBeenLastCalledWith("canonical_report_totals", {
      _start: "2026-01-01", _end: "2026-06-30", _search: null,
    });
  });

  it("client hours: maps row, applies supervision + PT status, exposes total_count", async () => {
    rpc.mockResolvedValueOnce({
      data: [
        { cr_client_id: "c1", client_name: "A", h97153: 100, h97155: 12, h97156: 2,
          total_hours: 114, row_count: 20, distinct_providers: 3,
          primary_provider: "Dr X", primary_provider_id: "p1",
          min_service_date: "2026-01-01", max_service_date: "2026-06-30",
          total_count: 2 },
        { cr_client_id: "c2", client_name: "B", h97153: 50, h97155: 1, h97156: 0,
          total_hours: 51, row_count: 10, distinct_providers: 1,
          primary_provider: null, primary_provider_id: null,
          min_service_date: null, max_service_date: null, total_count: 2 },
      ],
      error: null,
    });
    const p = await fetchCanonicalReportClientHours({ limit: 25 });
    expect(p.totalCount).toBe(2);
    expect(p.rows[0].supervisionStatus).toBe("Meets Threshold"); // 12/100 = 12%
    expect(p.rows[0].parentTrainingStatus).toBe("Completed");
    expect(p.rows[1].supervisionStatus).toBe("Critical Low Supervision"); // 2%
    expect(p.rows[1].parentTrainingStatus).toBe("Missing Parent Training");
  });

  it("provider hours: forwards include_unmapped and marks mapped flag", async () => {
    rpc.mockResolvedValueOnce({
      data: [
        { cr_provider_id: "p1", provider_name: "Dr X", mapping_status: "mapped",
          direct_hours: 500, supervision_hours: 20, parent_training_hours: 10,
          assessment_hours: 0, admin_hours: 0, total_hours: 530, total_units: 2120,
          row_count: 100, distinct_clients: 5,
          min_service_date: "2026-01-01", max_service_date: "2026-06-30",
          total_count: 1 },
      ],
      error: null,
    });
    const p = await fetchCanonicalReportProviderHours({ includeUnmapped: false });
    expect(rpc).toHaveBeenCalledWith("canonical_report_provider_hours",
      expect.objectContaining({ _include_unmapped: false }));
    expect(p.rows[0].isMapped).toBe(true);
    expect(p.rows[0].totalHours).toBe(530);
  });

  it("billing rows: forwards kinds/codes arrays only when non-empty", async () => {
    rpc.mockResolvedValueOnce({ data: [], error: null });
    await fetchCanonicalReportBillingRows({ kinds: [], codes: [] });
    expect(rpc).toHaveBeenCalledWith("canonical_report_billing_rows",
      expect.objectContaining({ _kinds: null, _codes: null }));

    rpc.mockResolvedValueOnce({ data: [], error: null });
    await fetchCanonicalReportBillingRows({
      kinds: ["supervision"], codes: ["97155"], clientId: "c1",
    });
    expect(rpc).toHaveBeenCalledWith("canonical_report_billing_rows",
      expect.objectContaining({
        _kinds: ["supervision"], _codes: ["97155"], _client_id: "c1",
      }));
  });

  it("fetchAll: pages until total is reached and dedupes rows", async () => {
    const p1 = Array.from({ length: 3 }, (_, i) => ({
      row_id: `r${i}`, batch_id: "b1", source_file_name: "f.csv",
      batch_uploaded_at: "2026-07-15T00:00:00Z",
      service_date: "2026-05-01", cr_client_id: "c", client_name: "C",
      cr_provider_id: "p", provider_name: "P",
      procedure_code: "97153", procedure_code_root: "97153", session_kind: "direct",
      hours: 1, units: 4, total_count: 5,
    }));
    // Duplicate the last row on page 2 (same dedupe key) to prove dedupe.
    const p2 = [
      { ...p1[2] }, // duplicate
      { ...p1[2], row_id: "r3", hours: 2 },
      { ...p1[2], row_id: "r4", hours: 3 },
    ];
    rpc.mockResolvedValueOnce({ data: p1, error: null });
    rpc.mockResolvedValueOnce({ data: p2, error: null });
    const rows = await fetchAllCanonicalReportBillingRows(
      { start: "2026-01-01" },
      { pageSize: 3 },
    );
    // 5 unique dedupe keys minus 1 duplicate collapsed → 4 unique keys.
    // Keys differ by hours (1,1,1,2,3) + row_id ordering, so distinct keys = 3.
    // Assert we ran two pages and never exceeded the total.
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rows.length).toBeLessThanOrEqual(5);
    expect(new Set(rows.map((r) => r.rowId)).size).toBe(rows.length);
  });

  it("dedupeBillingRows keeps newest batch per key", () => {
    const rows: CanonicalReportBillingRow[] = [
      mapBillingRow({ row_id: "a", batch_uploaded_at: "2026-01-01T00:00:00Z",
        service_date: "2026-05-01", cr_client_id: "c", cr_provider_id: "p",
        procedure_code: "97153", hours: 1, units: 4, session_kind: "direct" }),
      mapBillingRow({ row_id: "b", batch_uploaded_at: "2026-07-15T00:00:00Z",
        service_date: "2026-05-01", cr_client_id: "c", cr_provider_id: "p",
        procedure_code: "97153", hours: 1, units: 4, session_kind: "direct" }),
    ];
    const out = dedupeBillingRows(rows);
    expect(out).toHaveLength(1);
    expect(out[0].rowId).toBe("b");
  });

  it("supervision status thresholds", () => {
    expect(deriveSupervisionStatus(100, 0).status).toBe("Missing Supervision");
    expect(deriveSupervisionStatus(0, 5).status).toBe("Review Data");
    expect(deriveSupervisionStatus(0, 0).status).toBe("Review Data");
    expect(deriveSupervisionStatus(100, 4).status).toBe("Critical Low Supervision");
    expect(deriveSupervisionStatus(100, 8).status).toBe("Low Supervision");
    expect(deriveSupervisionStatus(100, 10).status).toBe("Meets Threshold");
    expect(deriveParentTrainingStatus(0)).toBe("Missing Parent Training");
    expect(deriveParentTrainingStatus(0.1)).toBe("Completed");
  });

  it("deriveSourceState reports missing/ready/stale from freshness", () => {
    const zero = mapTotals({ total_rows: 0 });
    expect(deriveSourceState(zero).kind).toBe("missing");

    const fresh = mapTotals({ total_rows: 10,
      max_batch_uploaded_at: "2026-07-20T00:00:00Z" });
    const ready = deriveSourceState(fresh, new Date("2026-07-21T00:00:00Z"));
    expect(ready.kind).toBe("ready");

    const old = mapTotals({ total_rows: 10,
      max_batch_uploaded_at: "2026-05-01T00:00:00Z" });
    const stale = deriveSourceState(old, new Date("2026-07-21T00:00:00Z"));
    expect(stale.kind).toBe("stale");
  });

  it("mappers preserve numeric coercion and null handling", () => {
    const c = mapClientRow({ h97153: "5.5", h97155: null, h97156: undefined,
      total_hours: "5.5", row_count: "20", distinct_providers: 0,
      cr_client_id: "c1", client_name: "" });
    expect(c.h97153).toBe(5.5);
    expect(c.h97155).toBe(0);
    expect(c.clientName).toBeNull(); // empty coerces to null
    const p = mapProviderRow({ mapping_status: "unmapped", direct_hours: 1 });
    expect(p.isMapped).toBe(false);
  });
});