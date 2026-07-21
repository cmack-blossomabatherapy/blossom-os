import { describe, it, expect } from "vitest";
import { _normalizeCoverageRow } from "@/lib/os/reporting/canonicalSource";

describe("canonical report source coverage — normalizer", () => {
  it("marks a fresh CentralReach productivity source as ready with counts", () => {
    const row = _normalizeCoverageRow({
      report_key: "bcba-productivity",
      source: "bcba_productivity_billing_rows",
      source_file_name: "cr-billing.csv",
      source_system: "centralreach",
      uploaded_at: new Date().toISOString(),
      service_date_min: "2026-01-01",
      service_date_max: "2026-06-30",
      row_count: 47533,
      direct_rows: 31755,
      supervision_rows: 7885,
      parent_training_rows: 1614,
      cancellation_rows: 270,
      distinct_clients: 879,
      distinct_providers: 546,
      unmapped_providers: 417,
      status: "ready",
    });
    expect(row.status).toBe("ready");
    expect(row.rowCount).toBe(47533);
    expect(row.unmappedProviders).toBe(417);
    expect(row.ageDays).toBeGreaterThanOrEqual(0);
  });

  it("flags a source older than 14 days as stale", () => {
    const old = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const row = _normalizeCoverageRow({
      report_key: "cancellation-scheduling",
      source: "shared_report_datasets",
      source_file_name: "cancellations.csv",
      uploaded_at: old,
      status: "ready",
    });
    expect(row.status).toBe("stale");
    expect(row.ageDays).toBeGreaterThan(14);
  });

  it("passes through explicit missing status", () => {
    const row = _normalizeCoverageRow({
      report_key: "authorization",
      source: "shared_report_datasets",
      source_file_name: null,
      uploaded_at: null,
      status: "missing",
    });
    expect(row.status).toBe("missing");
    expect(row.ageDays).toBeNull();
    expect(row.sourceFileName).toBeNull();
  });

  it("coerces numeric-like strings and defaults to null", () => {
    const row = _normalizeCoverageRow({
      report_key: "bcba-supervision",
      source: "bcba_productivity_billing_rows",
      row_count: "12345",
      unmapped_providers: null,
      status: "ready",
      uploaded_at: new Date().toISOString(),
    });
    expect(row.rowCount).toBe(12345);
    expect(row.unmappedProviders).toBeNull();
  });
});