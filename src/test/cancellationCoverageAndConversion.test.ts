import { describe, expect, it } from "vitest";
import {
  computeCancellationCenter,
  coverageOutsideRangeWarning,
  isElapsedScheduleEvent,
  type CancellationCenterRow,
} from "@/lib/os/reports/crPrimary/metrics/cancellationCenter";
import { stalePaymentsCoverageWarning } from "@/lib/os/reports/crPrimary/metrics/paymentReconciliation";

const TODAY = "2026-09-10";

const baseRow = (overrides: Partial<CancellationCenterRow>): CancellationCenterRow => ({
  event_date: "2026-09-01",
  deleted: false,
  cancelled: false,
  scheduled_hours: 1,
  client_name: "Client A",
  client_cr_id: "c1",
  provider_name: "Provider A",
  provider_cr_id: "p1",
  ...overrides,
});

describe("isElapsedScheduleEvent", () => {
  it("excludes a future-dated event", () => {
    expect(isElapsedScheduleEvent({ event_date: "2026-09-11" }, TODAY)).toBe(false);
  });

  it("includes an event dated strictly before today", () => {
    expect(isElapsedScheduleEvent({ event_date: "2026-09-09" }, TODAY)).toBe(true);
  });

  it("excludes an event dated exactly today (boundary)", () => {
    expect(isElapsedScheduleEvent({ event_date: TODAY }, TODAY)).toBe(false);
  });
});

describe("computeCancellationCenter conversion — elapsed sessions only", () => {
  it("excludes a future-dated unconverted session from conversion metrics", () => {
    const rows = [
      baseRow({ id: "future", event_date: "2026-09-15", converted_to_timesheet: false }),
    ];
    const metrics = computeCancellationCenter(rows, { today: TODAY });
    expect(metrics.conversion.unconverted).toBe(0);
    expect(metrics.conversion.knownStates).toBe(0);
  });

  it("includes an elapsed unconverted session in conversion metrics", () => {
    const rows = [
      baseRow({ id: "past", event_date: "2026-09-05", converted_to_timesheet: false }),
    ];
    const metrics = computeCancellationCenter(rows, { today: TODAY });
    expect(metrics.conversion.unconverted).toBe(1);
    expect(metrics.conversion.knownStates).toBe(1);
  });

  it("excludes a session dated exactly today (boundary)", () => {
    const rows = [
      baseRow({ id: "today", event_date: TODAY, converted_to_timesheet: false }),
    ];
    const metrics = computeCancellationCenter(rows, { today: TODAY });
    expect(metrics.conversion.unconverted).toBe(0);
    expect(metrics.conversion.knownStates).toBe(0);
  });

  it("still counts elapsed converted sessions toward the conversion rate", () => {
    const rows = [
      baseRow({ id: "past-converted", event_date: "2026-09-05", converted_to_timesheet: true }),
      baseRow({ id: "future-unconverted", event_date: "2026-09-20", converted_to_timesheet: false }),
    ];
    const metrics = computeCancellationCenter(rows, { today: TODAY });
    expect(metrics.conversion.converted).toBe(1);
    expect(metrics.conversion.unconverted).toBe(0);
    expect(metrics.conversion.conversionRate).toBe(100);
  });
});

describe("coverageOutsideRangeWarning", () => {
  it("fires when the filter range extends outside coverage", () => {
    const warning = coverageOutsideRangeWarning({
      filterFrom: "2026-09-01",
      filterTo: "2026-09-30",
      coverageStart: "2026-09-07",
      coverageEnd: "2026-09-13",
    });
    expect(warning).not.toBeNull();
    expect(warning).toContain("2026-09-07");
    expect(warning).toContain("2026-09-13");
  });

  it("stays silent when the filter range sits inside coverage", () => {
    const warning = coverageOutsideRangeWarning({
      filterFrom: "2026-09-08",
      filterTo: "2026-09-10",
      coverageStart: "2026-09-07",
      coverageEnd: "2026-09-13",
    });
    expect(warning).toBeNull();
  });

  it("stays silent when coverage is unknown", () => {
    const warning = coverageOutsideRangeWarning({
      filterFrom: "2026-09-01",
      filterTo: "2026-09-30",
      coverageStart: null,
      coverageEnd: null,
    });
    expect(warning).toBeNull();
  });
});

describe("stalePaymentsCoverageWarning", () => {
  it("fires when coverage end is materially before today", () => {
    const warning = stalePaymentsCoverageWarning("2026-06-04", "2026-09-10");
    expect(warning).not.toBeNull();
    expect(warning).toContain("2026-06-04");
  });

  it("stays silent when coverage is current", () => {
    const warning = stalePaymentsCoverageWarning("2026-09-09", "2026-09-10");
    expect(warning).toBeNull();
  });

  it("names the real coverage end date in the message", () => {
    const warning = stalePaymentsCoverageWarning("2026-06-04", "2026-09-10");
    expect(warning).toEqual(expect.stringContaining("2026-06-04"));
  });
});
