import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: vi.fn(), from: vi.fn() },
}));

import { supabase } from "@/integrations/supabase/client";
import {
  deriveHoursSnapshotFromCanonical,
  derivePerformanceTotalsFromCanonical,
  deriveRbtSupervisionCoverage,
} from "@/lib/os/reporting/canonicalRoleBridge";

const rpc = supabase.rpc as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => rpc.mockReset());

describe("Hours canonical fallback", () => {
  it("returns null when unmapped", async () => {
    expect(await deriveHoursSnapshotFromCanonical({})).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });
  it("returns null when no canonical rows", async () => {
    rpc.mockResolvedValueOnce({ data: [], error: null });
    expect(await deriveHoursSnapshotFromCanonical({ employeeId: "e1" })).toBeNull();
  });
  it("groups DOS + separates completed/cancelled + marks scheduled null", async () => {
    rpc.mockResolvedValueOnce({
      data: [
        { row_id: "1", service_date: "2026-07-01", cr_client_id: "C1", session_kind: "direct", hours: 2, units: 8, batch_uploaded_at: "2026-07-02T00:00:00Z" },
        { row_id: "2", service_date: "2026-07-01", cr_client_id: "C1", session_kind: "supervision", hours: 1, units: 4, batch_uploaded_at: "2026-07-02T00:00:00Z" },
        { row_id: "3", service_date: "2026-07-02", cr_client_id: "C2", session_kind: "cancellation", hours: 1.5, units: 6, batch_uploaded_at: "2026-07-03T00:00:00Z" },
      ],
      error: null,
    });
    const snap = await deriveHoursSnapshotFromCanonical({ employeeId: "e1" });
    expect(snap).not.toBeNull();
    expect(snap!.scheduledHours).toBeNull();
    expect(snap!.completedHours).toBeCloseTo(3, 2);
    expect(snap!.cancelledHours).toBeCloseTo(1.5, 2);
    expect(snap!.distinctClients).toBe(2);
    expect(snap!.unavailableFromCanonical).toContain("scheduled_hours");
    expect(snap!.windowLabel).toBe("month_to_date");
    expect(snap!.byDate["2026-07-01"].direct).toBeCloseTo(2, 2);
  });
});

describe("Performance canonical totals", () => {
  it("returns null when unmapped", async () => {
    expect(await derivePerformanceTotalsFromCanonical({})).toBeNull();
  });
  it("marks attendance/productivity target unavailable", async () => {
    rpc.mockResolvedValueOnce({
      data: [{ session_kind: "direct", hours: 10, units: 40, row_count: 5, distinct_clients: 2, min_service_date: "2026-07-01", max_service_date: "2026-07-10" }],
      error: null,
    });
    const t = await derivePerformanceTotalsFromCanonical({ employeeId: "e1" });
    expect(t).not.toBeNull();
    expect(t!.directHours).toBe(10);
    expect(t!.unavailableFromCanonical).toContain("attendance_denominator");
    expect(t!.unavailableFromCanonical).toContain("productivity_target");
  });
});

describe("RBT supervision coverage", () => {
  it("labels rows client_level_coverage; never one-to-one", async () => {
    rpc.mockResolvedValueOnce({
      data: [
        { cr_client_id: "C1", client_name: "A", session_kind: "supervision", hours: 3, units: 12, row_count: 2, min_service_date: "2026-07-01", max_service_date: "2026-07-08" },
        { cr_client_id: "C2", client_name: "B", session_kind: "direct",      hours: 20, units: 80, row_count: 10, min_service_date: "2026-07-01", max_service_date: "2026-07-10" },
      ],
      error: null,
    });
    const c = await deriveRbtSupervisionCoverage({ employeeId: "e1" });
    expect(c.length).toBe(1);
    expect(c[0].attribution).toBe("client_level_coverage");
    expect(c[0].supervisionHoursOnClient).toBe(3);
  });
});
