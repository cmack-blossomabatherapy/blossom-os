/**
 * Phase 2B1 repair C — behavioral tests.
 *
 * These assert engine behavior on fixtures, not source text.
 */
import { describe, it, expect } from "vitest";
import {
  resolveTargetHours,
  resolveIncentiveFigures,
  selectApplicableTargets,
  type PerformanceTargetRow,
} from "@/lib/os/reports/crPrimary/metrics/bcbaPerformanceV2";
import type { ReportBcbaTargetRow } from "@/lib/os/reports/crPrimary/types";
import { computeProratedUtilization } from "@/lib/os/reports/crPrimary/metrics/authorizationProration";
import { resolveActiveScope } from "@/lib/os/reports/crPrimary/metrics/authorizationUtilizationScope";
import { computeSupervisionAnalysis } from "@/lib/os/reports/crPrimary/metrics/bcbaSupervisionV2";
import {
  computeParentTrainingAnalysis,
  isAuthTargetInScope,
} from "@/lib/os/reports/crPrimary/metrics/parentTrainingV2";

const WINDOW = { from: "2026-03-01", to: "2026-03-31" };

describe("A1/A2 — BCBA performance targets read the real RPC contract", () => {
  it("resolves a non-null target from mtd_target_hours", () => {
    // Typed exactly like the real RPC row so the contract can't drift.
    const rows: ReportBcbaTargetRow[] = [
      {
        bcba_name: "Jane Doe",
        state: "GA",
        period_start: "2026-03-01",
        period_end: "2026-03-31",
        mtd_target_hours: 120,
        mtd_actual_hours: 60,
        forecast_hours: 118,
        updated_at: "2026-03-15T00:00:00Z",
      },
    ];
    expect(resolveTargetHours(rows, "Jane Doe", WINDOW)).toBe(120);
  });

  it("uses only the latest snapshot per BCBA/state/period and ignores other periods", () => {
    const rows: PerformanceTargetRow[] = [
      {
        bcba_name: "Jane Doe",
        state: "GA",
        period_start: "2026-03-01",
        period_end: "2026-03-31",
        mtd_target_hours: 100,
        mtd_actual_hours: 40,
        forecast_hours: 90,
        updated_at: "2026-03-01T00:00:00Z",
      },
      {
        bcba_name: "Jane Doe",
        state: "GA",
        period_start: "2026-03-01",
        period_end: "2026-03-31",
        mtd_target_hours: 130,
        mtd_actual_hours: 70,
        forecast_hours: 125,
        updated_at: "2026-03-20T00:00:00Z",
      },
      {
        // Unrelated period — must never set this window's target or incentive.
        bcba_name: "Jane Doe",
        state: "GA",
        period_start: "2026-01-01",
        period_end: "2026-01-31",
        mtd_target_hours: 999,
        mtd_actual_hours: 999,
        forecast_hours: 999,
        updated_at: "2026-09-01T00:00:00Z",
      },
    ];
    expect(selectApplicableTargets(rows, WINDOW)).toHaveLength(1);
    expect(resolveTargetHours(rows, "Jane Doe", WINDOW)).toBe(130);
    expect(resolveIncentiveFigures(rows, "Jane Doe", WINDOW)).toEqual({
      targetHours: 130,
      actualHours: 70,
      forecastHours: 125,
    });
  });
});

describe("D — Authorization Utilization paired totals", () => {
  it("an incomplete row cannot inflate the overall percentage", () => {
    const result = computeProratedUtilization(
      [
        // Complete: 50 allocated used hours of 100 authorized -> 50%.
        {
          authorization_number: "A1",
          client_name: "Client A",
          state: "GA",
          start_date: "2026-03-01",
          end_date: "2026-03-31",
          authorized_hours: 100,
          is_active: true,
        },
        // Incomplete: allocated used hours but no authorized hours at all.
        {
          authorization_number: "A2",
          client_name: "Client B",
          state: "GA",
          start_date: "2026-03-01",
          end_date: "2026-03-31",
          authorized_hours: null,
          is_active: true,
        },
      ],
      [
        { id: "b1", date_of_service: "2026-03-05", hours: 50, client_name: "Client A" },
        { id: "b2", date_of_service: "2026-03-06", hours: 40, client_name: "Client B" },
      ],
      { ...WINDOW, today: "2026-03-15" },
    );
    expect(result.totals.comparableAuthorizations).toBe(1);
    expect(result.totals.comparableUsedHours).toBe(50);
    expect(result.totals.comparableAuthorizedHours).toBe(100);
    expect(result.totals.utilizationPct).toBe(50);
  });
});

describe("D4 — a past end date is inactive even when is_active is true", () => {
  it("treats a known past end date as inactive", () => {
    const scope = resolveActiveScope(
      { startDate: "2025-01-01", endDate: "2025-06-30", is_active: true },
      "2026-03-15",
    );
    expect(scope.active).toBe(false);
  });

  it("keeps the future-start and missing-bounds behaviors", () => {
    expect(
      resolveActiveScope({ startDate: "2026-05-01", endDate: "2026-09-30", is_active: true }, "2026-03-15")
        .active,
    ).toBe(false);
    const missing = resolveActiveScope({ is_active: true }, "2026-03-15");
    expect(missing.active).toBe(true);
    expect(missing.datesMissing).toBe(true);
  });
});


describe("C — BCBA Supervision RBT grouping truth", () => {
  const owner = () => "Jane Doe";
  const past = [
    { date: "2026-03-02", procedureCode: "97153", hours: 100, clientName: "Client A", providerName: "RBT One" },
    // Unlinked supervision: no supervisedProviderName recorded.
    { date: "2026-03-03", procedureCode: "97155", hours: 5, clientName: "Client A", providerName: "BCBA One" },
    // Explicitly linked supervision.
    {
      date: "2026-03-04",
      procedureCode: "97155",
      hours: 3,
      clientName: "Client A",
      providerName: "BCBA One",
      supervisedProviderName: "RBT One",
    },
  ];

  it("creates no pseudo RBT row for the supervising provider", () => {
    const rbt = computeSupervisionAnalysis({ past, projected: [], grouping: "rbt", resolveOwner: owner });
    expect(rbt.past.rows.map((r) => r.label)).not.toContain("BCBA One");
  });

  it("keeps overall direct/supervision totals invariant across groupings", () => {
    const byBcba = computeSupervisionAnalysis({ past, projected: [], grouping: "bcba", resolveOwner: owner });
    const byClient = computeSupervisionAnalysis({ past, projected: [], grouping: "client", resolveOwner: owner });
    const byRbt = computeSupervisionAnalysis({ past, projected: [], grouping: "rbt", resolveOwner: owner });
    for (const view of [byClient, byRbt]) {
      expect(view.past.directHours).toBe(byBcba.past.directHours);
      expect(view.past.supervisionHours).toBe(byBcba.past.supervisionHours);
      expect(view.past.ratioPct).toBe(byBcba.past.ratioPct);
    }
    // Missing RBT linkage never becomes a 0% aggregate.
    expect(byRbt.past.ratioPct).toBe(8);
  });

  it("counts only explicitly linked supervision toward an RBT ratio", () => {
    const byRbt = computeSupervisionAnalysis({ past, projected: [], grouping: "rbt", resolveOwner: owner });
    const row = byRbt.past.rows.find((r) => r.label === "RBT One");
    expect(row?.supervisionHours).toBe(3);
  });
});

describe("B — Parent Training target scope and client identity", () => {
  const scope = { from: "2026-03-01", to: "2026-03-31" };

  it("excludes expired, future, and explicitly inactive authorizations", () => {
    expect(
      isAuthTargetInScope({ startDate: "2025-01-01", endDate: "2025-12-31" }, scope, "2026-03-15"),
    ).toBe(false);
    expect(
      isAuthTargetInScope({ startDate: "2026-06-01", endDate: "2026-12-31" }, scope, "2026-03-15"),
    ).toBe(false);
    expect(
      isAuthTargetInScope(
        { startDate: "2026-01-01", endDate: "2026-12-31", isActive: false },
        scope,
        "2026-03-15",
      ),
    ).toBe(false);
    expect(
      isAuthTargetInScope({ startDate: "2026-01-01", endDate: "2026-12-31" }, scope, "2026-03-15"),
    ).toBe(true);
  });

  it("does not merge two different clients that share a name when CR IDs differ", () => {
    const analysis = computeParentTrainingAnalysis({
      billed: [
        {
          date: "2026-03-05",
          procedureCode: "97156",
          hours: 2,
          clientName: "Alex Smith",
          clientCrId: "111",
          providerName: "Jane Doe",
        },
        {
          date: "2026-03-06",
          procedureCode: "97156",
          hours: 2,
          clientName: "Alex Smith",
          clientCrId: "222",
          providerName: "Jane Doe",
        },
      ],
      scheduled: [],
      authorizations: [],
      activeClients: [],
      resolveOwner: () => "Jane Doe",
      window: scope,
      today: "2026-03-15",
    });
    expect(analysis.clientRows).toHaveLength(2);
  });
});
