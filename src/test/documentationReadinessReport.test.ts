import { describe, expect, it } from "vitest";
import {
  DOCUMENTATION_READINESS_NOTE,
  summarizeDocumentationReadiness,
} from "@/lib/os/reports/crPrimary/metrics/documentationReadiness";
import type { CrTimesheetDocSummaryRow } from "@/lib/os/reports/crPrimary/types";

const row = (over: Partial<CrTimesheetDocSummaryRow> = {}): CrTimesheetDocSummaryRow => ({
  provider_key: "p1",
  provider_name: "Provider One",
  provider_cr_id: "cr-1",
  rows_total: 10,
  locked_rows: 8,
  unlocked_rows: 2,
  missing_provider_signature: 1,
  incomplete_tasks: 0,
  latest_date_of_service: "2026-05-01",
  latest_seen_at: "2026-05-05",
  ...over,
});

describe("documentationReadiness metrics", () => {
  it("aggregates providers and sorts by largest actionable backlog first", () => {
    const summary = summarizeDocumentationReadiness([
      row({ provider_key: "a", provider_name: "A", unlocked_rows: 1, missing_provider_signature: 0, incomplete_tasks: 0 }),
      row({ provider_key: "b", provider_name: "B", unlocked_rows: 5, missing_provider_signature: 2, incomplete_tasks: 1 }),
      row({ provider_key: "c", provider_name: "C", unlocked_rows: 0, missing_provider_signature: 0, incomplete_tasks: 0 }),
    ]);

    expect(summary.providers.map((p) => p.provider)).toEqual(["B", "A", "C"]);
  });

  it("computes the locked rate as locked / rows total", () => {
    const summary = summarizeDocumentationReadiness([
      row({ rows_total: 10, locked_rows: 8 }),
    ]);
    expect(summary.providers[0].lockedRatePercent).toBeCloseTo(80, 1);
    expect(summary.lockedRatePercent).toBeCloseTo(80, 1);
  });

  it("never derives a subtraction-based 'ready' count and states the overlap plainly", () => {
    const summary = summarizeDocumentationReadiness([
      row({ rows_total: 10, locked_rows: 5, unlocked_rows: 5, missing_provider_signature: 5, incomplete_tasks: 5 }),
    ]);
    // The summary carries independent overlapping counts, never a computed "ready" field.
    expect(summary).not.toHaveProperty("ready");
    expect(summary).not.toHaveProperty("readyRows");
    expect(summary.overlappingIssueCounts).toBe(true);
    expect(DOCUMENTATION_READINESS_NOTE).toMatch(/overlap/i);
    // Issue counts overlap on the same rows and must not be netted against total.
    expect(summary.unlocked + summary.missingProviderSignature + summary.incompleteTasks).toBeGreaterThan(
      summary.rowsTotal,
    );
  });

  it("treats null/missing source values as not documented rather than zero", () => {
    const summary = summarizeDocumentationReadiness([
      row({
        provider_key: "n",
        provider_name: "Null Provider",
        rows_total: null,
        locked_rows: null,
        unlocked_rows: null,
        missing_provider_signature: null,
        incomplete_tasks: null,
      }),
    ]);
    const provider = summary.providers[0];
    expect(provider.rowsTotal).toBeNull();
    expect(provider.locked).toBeNull();
    expect(provider.unlocked).toBeNull();
    expect(provider.missingProviderSignature).toBeNull();
    expect(provider.incompleteTasks).toBeNull();
    expect(provider.lockedRatePercent).toBeNull();
    // Aggregate totals still sum as 0 (no rows contributed), not undefined/NaN.
    expect(summary.rowsTotal).toBe(0);
    expect(summary.locked).toBe(0);
    // A provider with all-null issue counts does not need action.
    expect(provider.needsAction).toBe(false);
  });

  it("selects providers needing action from any overlapping issue", () => {
    const summary = summarizeDocumentationReadiness([
      row({ provider_key: "clean", provider_name: "Clean", unlocked_rows: 0, missing_provider_signature: 0, incomplete_tasks: 0 }),
      row({ provider_key: "unlocked-only", provider_name: "UnlockedOnly", unlocked_rows: 1, missing_provider_signature: 0, incomplete_tasks: 0 }),
      row({ provider_key: "sig-only", provider_name: "SigOnly", unlocked_rows: 0, missing_provider_signature: 1, incomplete_tasks: 0 }),
      row({ provider_key: "tasks-only", provider_name: "TasksOnly", unlocked_rows: 0, missing_provider_signature: 0, incomplete_tasks: 1 }),
    ]);
    expect(summary.providersNeedingAction).toBe(3);
    const clean = summary.providers.find((p) => p.provider === "Clean");
    expect(clean?.needsAction).toBe(false);
  });
});
