/**
 * Report date filters must work across every CentralReach date shape:
 * ISO dates, timestamps, and US-formatted raw CSV text.
 */
import { describe, expect, it } from "vitest";
import { toDayKey, inDayRange } from "@/lib/os/reports/dateKey";
import { matchesFilters } from "@/lib/os/reports/crPrimary/filters";
import { EMPTY_FILTERS } from "@/lib/os/reports/crPrimary/types";

describe("toDayKey", () => {
  it("normalizes every shape CentralReach produces", () => {
    expect(toDayKey("2026-03-02")).toBe("2026-03-02");
    expect(toDayKey("2026-03-02T18:30:00+00:00")).toBe("2026-03-02");
    expect(toDayKey("3/2/2026")).toBe("2026-03-02");
    expect(toDayKey("03-02-2026")).toBe("2026-03-02");
    expect(toDayKey("2026/03/02")).toBe("2026-03-02");
    expect(toDayKey("")).toBe("");
    expect(toDayKey(null)).toBe("");
    expect(toDayKey("not a date")).toBe("");
  });
});

describe("inDayRange", () => {
  it("is inclusive on both bounds", () => {
    expect(inDayRange("2026-03-01", "2026-03-01", "2026-03-31")).toBe(true);
    expect(inDayRange("2026-03-31", "2026-03-01", "2026-03-31")).toBe(true);
    expect(inDayRange("2026-04-01", "2026-03-01", "2026-03-31")).toBe(false);
  });

  it("passes everything when no bound is set and rejects undated rows in a range", () => {
    expect(inDayRange("", "", "")).toBe(true);
    expect(inDayRange("", "2026-03-01", "")).toBe(false);
  });

  it("filters US-formatted dates correctly (previously kept/dropped wrongly)", () => {
    expect(inDayRange("3/2/2026", "2026-03-01", "2026-03-31")).toBe(true);
    expect(inDayRange("12/31/2025", "2026-03-01", "2026-03-31")).toBe(false);
  });
});

describe("primary report matchesFilters date range", () => {
  it("uses day keys, not raw string compare", () => {
    const f = { ...EMPTY_FILTERS, from: "2026-03-01", to: "2026-03-31" };
    expect(matchesFilters({ date: "2026-03-15T09:00:00Z" }, f)).toBe(true);
    expect(matchesFilters({ date: "3/15/2026" }, f)).toBe(true);
    expect(matchesFilters({ date: "2026-02-28" }, f)).toBe(false);
  });
});
