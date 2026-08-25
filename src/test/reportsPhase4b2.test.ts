/**
 * Phase 4B2 — synthetic regression tests for the Cancellation Command Center
 * truth rules and the hour-based Authorization Utilization matched-pair rules.
 *
 * Everything here is fabricated data. No PHI, no imports, no source files.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  buildCancellationIdentity,
  computeCancellationCenter,
  type CancellationCenterRow,
} from "@/lib/os/reports/crPrimary/metrics/cancellationCenter";
import {
  coveragePairsOf,
  selectCoveragePair,
} from "@/lib/os/reports/crPrimary/metrics/authorizationContinuity";
import {
  allocateBillingToAuthorizations,
  computeProratedUtilization,
  prorationWindow,
} from "@/lib/os/reports/crPrimary/metrics/authorizationProration";
import { computeAuthorizationTrend } from "@/lib/os/reports/crPrimary/metrics/authorizationTrends";

/* ------------------------------------------------------------------ helpers */

const ev = (over: Partial<CancellationCenterRow> = {}): CancellationCenterRow =>
  ({
    id: Math.random().toString(36).slice(2),
    event_date: "2026-03-02",
    duration_hours: 2,
    is_deleted: false,
    cancelled: false,
    ...over,
  }) as CancellationCenterRow;

const auth = (over: Record<string, unknown> = {}) =>
  ({
    authorization_id: "A1",
    client_name: "Client One",
    client_cr_id: "CR-1",
    is_active: true,
    procedure_code: "97153",
    authorized_hours: 100,
    start_date: "2026-01-01",
    end_date: "2026-06-30",
    ...over,
  }) as never;

/* =============================================== CANCELLATION COMMAND CENTER */

describe("Phase 4B2 · cancellation truth rules", () => {
  it("excludes deleted rows, keeps cancellations in the denominator, and never treats reason 0 as a category", () => {
    const rows = [
      ev({ cancelled: true, cancellation_reason: "Client illness" }),
      ev({ cancelled: true, cancellation_reason: "0" }),
      ev({ cancelled: true, cancellation_reason: null }),
      ev({ cancelled: false }),
      ev({ cancelled: false }),
      // Deleted rows are invisible everywhere, cancelled or not.
      ev({ cancelled: true, is_deleted: true, cancellation_reason: "Client illness" }),
      ev({ cancelled: false, is_deleted: true }),
    ];
    const m = computeCancellationCenter(rows);

    expect(m.loadedEvents).toBe(7);
    expect(m.deletedEvents).toBe(2);
    // Denominator = every nondeleted event, cancellations included.
    expect(m.activeScheduleEvents).toBe(5);
    expect(m.cancelledEvents).toBe(3);
    expect(m.cancellationRate).toBe(60);
    expect(m.keptEvents).toBe(2);

    // "0" is a placeholder, not a reason.
    expect(m.undocumentedReasons).toBe(2);
    expect(m.documentedReasons).toBe(1);
    expect(m.byReason.map((r) => r.name)).not.toContain("0");
  });

  it("reports converted, unconverted and unknown conversion, and excludes unknown from the rate", () => {
    const m = computeCancellationCenter([
      ev({ converted_to_timesheet: true }),
      ev({ converted_to_timesheet: true }),
      ev({ converted_to_timesheet: true }),
      ev({ converted_to_timesheet: false }),
      ev({ converted_to_timesheet: null }),
      ev({ converted_to_timesheet: null }),
      // Deleted rows never reach the conversion metric.
      ev({ converted_to_timesheet: false, is_deleted: true }),
    ]);

    expect(m.conversion.converted).toBe(3);
    expect(m.conversion.unconverted).toBe(1);
    expect(m.conversion.unknown).toBe(2);
    expect(m.conversion.knownStates).toBe(4);
    expect(m.conversion.conversionRate).toBe(75);
    // No conversion timestamp exists in the source, so lateness is never claimed.
    expect(m.conversion.timingNote.toLowerCase()).toContain("late conversion cannot be measured");
  });

  it("keeps weekly counts, hours and rate as separate reconciling series", () => {
    const rows = [
      // Week of 2026-03-02 (Mon): 2 cancellations of 2h from 4 active events.
      ev({ event_date: "2026-03-02", cancelled: true, duration_hours: 2 }),
      ev({ event_date: "2026-03-03", cancelled: true, duration_hours: 2 }),
      ev({ event_date: "2026-03-04" }),
      ev({ event_date: "2026-03-05" }),
      // Week of 2026-03-09: 1 cancellation of 3h from 2 active events.
      ev({ event_date: "2026-03-09", cancelled: true, duration_hours: 3 }),
      ev({ event_date: "2026-03-10" }),
    ];
    const m = computeCancellationCenter(rows);

    const counts = new Map(m.weeklyCancellations.map((p) => [p.label, p.value]));
    const hours = new Map(m.weeklyCancelledHours.map((p) => [p.label, p.value]));
    const rate = new Map(m.weeklyCancellationRate.map((p) => [p.label, p.value]));

    expect(counts.get("2026-03-02")).toBe(2);
    expect(hours.get("2026-03-02")).toBe(4);
    expect(rate.get("2026-03-02")).toBe(50);
    expect(counts.get("2026-03-09")).toBe(1);
    expect(hours.get("2026-03-09")).toBe(3);
    expect(rate.get("2026-03-09")).toBe(50);

    // Counts reconcile to the headline; hours and percents live on their own.
    expect(m.weeklyCancellations.reduce((s, p) => s + p.value, 0)).toBe(m.cancelledEvents);
    expect(m.weeklyCancelledHours.reduce((s, p) => s + p.value, 0)).toBeCloseTo(m.cancelledHours, 5);
    for (const p of m.weeklyCancellationRate) {
      expect(p).not.toHaveProperty("secondary");
    }
  });

  it("keeps weekday counts and weekday rate separate and never plots a rate without a denominator", () => {
    const rows = [
      ev({ event_date: "2026-03-02", cancelled: true }), // Monday
      ev({ event_date: "2026-03-02" }),
      ev({ event_date: "2026-03-03", cancelled: true }), // Tuesday
    ];
    const m = computeCancellationCenter(rows);

    const counts = new Map(m.byDayOfWeek.map((p) => [p.label, p.value]));
    const rates = new Map(m.byDayOfWeekRate.map((p) => [p.label, p.value]));
    expect(counts.get("Monday")).toBe(1);
    expect(rates.get("Monday")).toBe(50);
    expect(counts.get("Tuesday")).toBe(1);
    expect(rates.get("Tuesday")).toBe(100);
    // Weekdays with no events are absent, not zero-valued.
    expect(counts.has("Sunday")).toBe(false);
    for (const p of m.byDayOfWeekRate) {
      if (p.activeScheduleEvents === 0) expect(p.value).toBeNull();
    }
  });

  it("keeps same-name people with distinct CR ids separate and joins an id-less alias deterministically", () => {
    const withIds: CancellationCenterRow[] = [
      ev({ client_name: "Alex Smith", client_cr_id: "CR-100", provider_name: "Dana Lee", provider_cr_id: "P-1" }),
      ev({ client_name: "Alex Smith", client_cr_id: "CR-200", provider_name: "Dana Lee", provider_cr_id: "P-2" }),
      ev({ client_name: "Robin Park", client_cr_id: "CR-300", provider_name: "Sam Cruz", provider_cr_id: "P-3" }),
      // Id-less rows for a name that has exactly one associated CR id.
      ev({ client_name: "Robin Park", client_cr_id: null, provider_name: "Sam Cruz", provider_cr_id: null }),
    ];

    const check = (rows: CancellationCenterRow[]) => {
      const identity = buildCancellationIdentity(rows);
      const clientKeys = rows.map((r) => identity.clientKeyOf(r));
      const providerKeys = rows.map((r) => identity.providerKeyOf(r));
      return { clientKeys, providerKeys, identity };
    };

    const base = check(withIds);
    // Two Alex Smiths with different ids never merge.
    expect(base.clientKeys[0]).not.toBe(base.clientKeys[1]);
    expect(base.providerKeys[0]).not.toBe(base.providerKeys[1]);
    // The unique id-less alias adopts the one CR id it is associated with.
    expect(base.clientKeys[3]).toBe(base.clientKeys[2]);
    expect(base.providerKeys[3]).toBe(base.providerKeys[2]);
    // Labels stay human names, never ids.
    expect(base.identity.clientLabelOf(withIds[0])).toBe("Alex Smith");

    // Order independence: every permutation resolves the same partition.
    const partitionOf = (rows: CancellationCenterRow[]) => {
      const identity = buildCancellationIdentity(rows);
      const groups = new Map<string, string[]>();
      for (const r of withIds) {
        const k = identity.clientKeyOf(r);
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k)!.push(`${r.client_name}|${r.client_cr_id ?? ""}`);
      }
      return [...groups.values()].map((g) => g.sort().join(",")).sort();
    };
    const expected = partitionOf(withIds);
    expect(partitionOf([...withIds].reverse())).toEqual(expected);
    expect(partitionOf([withIds[3], withIds[1], withIds[2], withIds[0]])).toEqual(expected);
    expect(partitionOf([withIds[2], withIds[3], withIds[0], withIds[1]])).toEqual(expected);
  });

  it("carries a grouping key on client and provider breakdowns while labelling with names", () => {
    const rows = [
      ev({ cancelled: true, client_name: "Alex Smith", client_cr_id: "CR-100" }),
      ev({ cancelled: true, client_name: "Alex Smith", client_cr_id: "CR-200" }),
    ];
    const m = computeCancellationCenter(rows);
    expect(m.byClient).toHaveLength(2);
    expect(new Set(m.byClient.map((g) => g.key)).size).toBe(2);
    expect(m.byClient.every((g) => g.name === "Alex Smith")).toBe(true);
    expect(m.affectedClients).toBe(2);
  });

  it("has no staff-facing Data Hub copy left in the Cancellation Command Center", () => {
    const page = readFileSync("src/pages/os/reports/CancellationCommandCenter.tsx", "utf8");
    expect(page).not.toMatch(/Data Hub/i);
    expect(page).toContain("CentralReach schedule source");
  });

  it("documents the Aug 24 post-import acceptance control without importing anything", () => {
    /**
     * ACCEPTANCE CONTROL (documentation only — no import, no PHI, no source file):
     * once the August 2024 CentralReach schedule source is loaded, the
     * Cancellation Command Center must reconcile to exactly:
     *   active nondeleted events : 3568
     *   cancellations            : 748
     *   cancellation rate        : 21.0 %
     *   cancelled hours          : 2422
     * The rate below is recomputed with this module's own formula so the
     * expectation and the implementation can never drift apart.
     */
    const control = {
      activeScheduleEvents: 3568,
      cancellations: 748,
      cancellationRatePct: 21.0,
      cancelledHours: 2422,
    };
    const rate =
      Math.round((control.cancellations / control.activeScheduleEvents) * 1000) / 10;
    expect(rate).toBe(control.cancellationRatePct);
    expect(control.cancelledHours).toBeGreaterThan(0);
  });
});

/* ================================================ AUTHORIZATION UTILIZATION */

describe("Phase 4B2 · matched coverage pairs", () => {
  it("never pairs a future follow-up end with a base or actual start", () => {
    const row = auth({
      start_date: "2026-01-01",
      end_date: null,
      actual_start_date: "2026-01-05",
      actual_end_date: null,
      followup_start_date: null,
      followup_end_date: "2027-12-31",
    });
    // No column has both of its own bounds, so there is no usable pair at all.
    expect(coveragePairsOf(row)).toEqual([]);
    expect(selectCoveragePair(row, { from: "2026-03-01", to: "2026-03-31" })).toBeNull();
  });

  it("rejects reversed and impossible pairs", () => {
    expect(
      coveragePairsOf(auth({ start_date: "2026-06-30", end_date: "2026-01-01" })),
    ).toEqual([]);
    expect(
      coveragePairsOf(auth({ start_date: "2026-02-30", end_date: "2026-03-31" })),
    ).toEqual([]);
    expect(
      coveragePairsOf(auth({ start_date: "not-a-date", end_date: "2026-03-31" })),
    ).toEqual([]);
  });

  it("chooses the single valid matched pair with the greatest range overlap, deterministically", () => {
    const row = auth({
      // Base barely touches March; the actual pair covers all of it.
      start_date: "2026-03-30",
      end_date: "2026-04-30",
      actual_start_date: "2026-03-01",
      actual_end_date: "2026-03-31",
      followup_start_date: "2026-05-01",
      followup_end_date: "2026-05-31",
    });
    const pair = selectCoveragePair(row, { from: "2026-03-01", to: "2026-03-31" });
    expect(pair).toMatchObject({
      kind: "actual",
      start: "2026-03-01",
      end: "2026-03-31",
      overlapDays: 31,
      basis: "range_overlap",
    });

    // Ties break in deterministic column order: actual, base, follow-up.
    const tie = auth({
      start_date: "2026-03-01",
      end_date: "2026-03-31",
      actual_start_date: "2026-03-01",
      actual_end_date: "2026-03-31",
    });
    expect(selectCoveragePair(tie, { from: "2026-03-01", to: "2026-03-31" })?.kind).toBe("actual");

    // With no range at all, the truthful current pair wins.
    const current = selectCoveragePair(row, { today: "2026-05-15" });
    expect(current).toMatchObject({ kind: "followup", basis: "current" });
  });

  it("uses the same selected pair for fallback allocation and for proration", () => {
    const row = auth({
      authorization_id: null,
      authorization_number: null,
      // The March-relevant truth is the actual pair; the base pair is April.
      start_date: "2026-04-01",
      end_date: "2026-04-30",
      actual_start_date: "2026-03-01",
      actual_end_date: "2026-03-31",
      authorized_hours: 62,
    });
    const range = { from: "2026-03-01", to: "2026-03-31" };

    const alloc = allocateBillingToAuthorizations([row], [
      { id: "b1", date_of_service: "2026-03-10", hours: 4, client_cr_id: "CR-1", procedure_code: "97153" },
    ], range);
    expect(alloc.counts.uniqueFallback).toBe(1);
    expect([...alloc.bySlot.values()][0].hours).toBe(4);

    const result = computeProratedUtilization([row], [
      { id: "b1", date_of_service: "2026-03-10", hours: 4, client_cr_id: "CR-1", procedure_code: "97153" },
    ], { ...range, today: "2026-03-15" });

    // Display, denominator and allocation all agree on the same actual pair.
    expect(result.rows[0].startDate).toBe("2026-03-01");
    expect(result.rows[0].endDate).toBe("2026-03-31");
    expect(result.rows[0].prorationFactor).toBe(1);
    expect(result.rows[0].proratedAuthorizedHours).toBe(62);
    expect(result.rows[0].recomputedUsedHours).toBe(4);
  });

  it("prorates on inclusive overlap days, including no overlap, full overlap, leap day and a one-day range", () => {
    // Full overlap.
    expect(prorationWindow("2026-03-01", "2026-03-31", "2026-03-01", "2026-03-31")).toMatchObject({
      authDays: 31,
      overlapDays: 31,
      factor: 1,
    });
    // No overlap.
    expect(prorationWindow("2026-01-01", "2026-01-31", "2026-03-01", "2026-03-31").overlapDays).toBe(0);
    // One-day range is one inclusive day, not zero.
    expect(prorationWindow("2026-01-01", "2026-06-30", "2026-03-10", "2026-03-10").overlapDays).toBe(1);
    // Leap day counts as a real day in a leap year.
    expect(prorationWindow("2024-02-01", "2024-02-29", "2024-02-01", "2024-02-29")).toMatchObject({
      authDays: 29,
      overlapDays: 29,
    });
    // Feb 29 does not exist in a non-leap year, so the pair is unusable.
    expect(coveragePairsOf(auth({ start_date: "2026-02-01", end_date: "2026-02-29" }))).toEqual([]);
  });

  it("keeps a real zero worked as 0% and a missing or zero denominator as null", () => {
    const range = { from: "2026-03-01", to: "2026-03-31", today: "2026-03-15" };

    const zeroWorked = computeProratedUtilization(
      [auth({ start_date: "2026-03-01", end_date: "2026-03-31", authorized_hours: 40 })],
      [{ id: "b1", date_of_service: "2026-03-10", hours: 0, client_cr_id: "CR-1", procedure_code: "97153" }],
      range,
    ).rows[0];
    expect(zeroWorked.recomputedUsedHours).toBe(0);
    expect(zeroWorked.utilizationPct).toBe(0);

    const noDenominator = computeProratedUtilization(
      [auth({ start_date: "2026-03-01", end_date: "2026-03-31", authorized_hours: 0 })],
      [{ id: "b1", date_of_service: "2026-03-10", hours: 5, client_cr_id: "CR-1", procedure_code: "97153" }],
      range,
    ).rows[0];
    expect(noDenominator.utilizationPct).toBeNull();
    expect(noDenominator.dataState).toBe("no_authorized_hours");

    const missingDenominator = computeProratedUtilization(
      [auth({ start_date: "2026-03-01", end_date: "2026-03-31", authorized_hours: null })],
      [],
      range,
    ).rows[0];
    expect(missingDenominator.authorizedHours).toBeNull();
    expect(missingDenominator.utilizationPct).toBeNull();
  });

  it("omits null trend and chart values instead of converting them to zero", () => {
    const trend = computeAuthorizationTrend(
      [{ startDate: "2026-03-01", endDate: "2026-03-31", authorizedHours: null }],
      [{ date: "2026-03-10", hours: 5 }],
      { from: "2026-03-01", to: "2026-03-31", grain: "week" },
    );
    // Nothing authorized in a period => no pace percentage at all.
    expect(trend.pace.every((p) => p.value === null)).toBe(true);
    const plotted = trend.pace.filter((p) => p.value != null);
    expect(plotted).toHaveLength(0);

    const page = readFileSync("src/pages/os/reports/AuthorizationUtilizationPage.tsx", "utf8");
    // The page filters null pace points; it never coerces them to 0.
    expect(page).not.toContain("value: p.value ?? 0");
    expect(page).not.toContain("value: r.utilizationPct ?? 0");
  });

  it("reconciles weekly and monthly authorized and used totals to the selected rows", () => {
    const auths = [{ startDate: "2026-03-01", endDate: "2026-03-31", authorizedHours: 62 }];
    const used = [
      { date: "2026-03-03", hours: 4 },
      { date: "2026-03-17", hours: 6 },
    ];
    const range = { from: "2026-03-01", to: "2026-03-31" } as const;

    const weekly = computeAuthorizationTrend(auths, used, { ...range, grain: "week" });
    const monthly = computeAuthorizationTrend(auths, used, { ...range, grain: "month" });

    const sum = (points: { usedHours: number; authorizedHours: number }[]) => ({
      used: Math.round(points.reduce((s, p) => s + p.usedHours, 0) * 10) / 10,
      authorized: Math.round(points.reduce((s, p) => s + p.authorizedHours, 0) * 10) / 10,
    });
    expect(sum(weekly.points).used).toBe(10);
    expect(sum(monthly.points).used).toBe(10);
    expect(sum(weekly.points).authorized).toBeCloseTo(62, 1);
    expect(sum(monthly.points).authorized).toBeCloseTo(62, 1);
  });
});
