import { describe, it, expect } from "vitest";
import {
  resolveCanonicalFallback,
  CANONICAL_UNAVAILABLE_FIELDS,
} from "@/lib/os/reporting/canonicalFallback";

// Stub out the RPC-backed fetcher via module mock.
import * as consumer from "@/lib/os/reporting/canonicalConsumer";
import { vi } from "vitest";

describe("canonical fallback precedence", () => {
  it("returns source=role and skips canonical when role has rows", async () => {
    const spy = vi.spyOn(consumer, "fetchCanonicalProviderSummary");
    const r = await resolveCanonicalFallback({
      roleRowCount: 5,
      scope: { authUserId: "u1" },
    });
    expect(r.source).toBe("role");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("returns source=missing/unmapped_provider when subject is unmapped and requireScope=true", async () => {
    const spy = vi.spyOn(consumer, "fetchCanonicalProviderSummary");
    const r = await resolveCanonicalFallback({
      roleRowCount: 0,
      scope: {},
      requireScope: true,
    });
    expect(r.source).toBe("missing");
    expect(r.reason).toBe("unmapped_provider");
    expect(r.unmappedProvider).toBe(true);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("falls back to canonical totals when role is empty and canonical returns rows", async () => {
    const spy = vi
      .spyOn(consumer, "fetchCanonicalProviderSummary")
      .mockResolvedValue([
        {
          sessionKind: "direct",
          hours: 120,
          units: 480,
          rowCount: 40,
          distinctClients: 3,
          minServiceDate: "2026-01-01",
          maxServiceDate: "2026-06-30",
        },
        {
          sessionKind: "supervision",
          hours: 10,
          units: 40,
          rowCount: 5,
          distinctClients: 3,
          minServiceDate: "2026-01-05",
          maxServiceDate: "2026-06-30",
        },
      ]);
    const r = await resolveCanonicalFallback({
      roleRowCount: 0,
      scope: { authUserId: "u1" },
    });
    expect(r.source).toBe("canonical");
    expect(r.totals?.directHours).toBe(120);
    expect(r.totals?.supervisionHours).toBe(10);
    expect(r.freshness.maxServiceDate).toBe("2026-06-30");
    spy.mockRestore();
  });

  it("returns source=missing/no_data when canonical also returns nothing", async () => {
    const spy = vi
      .spyOn(consumer, "fetchCanonicalProviderSummary")
      .mockResolvedValue([]);
    const r = await resolveCanonicalFallback({
      roleRowCount: 0,
      scope: { authUserId: "u1" },
    });
    expect(r.source).toBe("missing");
    expect(r.reason).toBe("no_data");
    spy.mockRestore();
  });

  it("swallows canonical RPC errors as missing (never fabricates)", async () => {
    const spy = vi
      .spyOn(consumer, "fetchCanonicalProviderSummary")
      .mockRejectedValue(new Error("rpc offline"));
    const r = await resolveCanonicalFallback({
      roleRowCount: 0,
      scope: { authUserId: "u1" },
    });
    expect(r.source).toBe("missing");
    expect(r.totals).toBeNull();
    spy.mockRestore();
  });

  it("always advertises which fields are unavailable from the canonical billing export", async () => {
    const r = await resolveCanonicalFallback({
      roleRowCount: 1,
      scope: { authUserId: "u1" },
    });
    expect(r.unavailableFromCanonical).toEqual(CANONICAL_UNAVAILABLE_FIELDS);
    expect(r.unavailableFromCanonical).toContain("scheduled_start_time");
    expect(r.unavailableFromCanonical).toContain("location");
  });
});