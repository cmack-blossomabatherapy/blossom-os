import { describe, it, expect, vi, beforeEach } from "vitest";

const rpc = vi.fn();
const from = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: any[]) => rpc(...args),
    from: (...args: any[]) => from(...args),
  },
}));

import {
  previewCrReconciliation,
  applyCrReconciliation,
  confirmCrProviderMapping,
  rejectCrProviderMapping,
  unlinkCrProviderMapping,
  fetchCrIdentityQueue,
} from "@/lib/os/clinicianIdentity";

beforeEach(() => {
  rpc.mockReset();
  from.mockReset();
});

describe("CR identity reconciliation client", () => {
  it("previewCrReconciliation returns classified rows", async () => {
    rpc.mockResolvedValueOnce({
      data: [{ provider_id: "p1", action: "auto_link", mapping_method: "unique_name", mapping_status: "mapped" }],
      error: null,
    });
    const rows = await previewCrReconciliation();
    expect(rpc).toHaveBeenCalledWith("preview_cr_employee_reconciliation");
    expect(rows[0].action).toBe("auto_link");
  });

  it("applyCrReconciliation coerces counts and passes dry-run flag", async () => {
    rpc.mockResolvedValueOnce({
      data: [{ auto_linked: 128, already_linked: 0, conflicts: 0, ambiguous: 0, unmatched: 418, queue_rows: 418 }],
      error: null,
    });
    const s = await applyCrReconciliation(true);
    expect(rpc).toHaveBeenCalledWith("apply_cr_employee_reconciliation", { _dry_run: true });
    expect(s.auto_linked).toBe(128);
    expect(s.unmatched).toBe(418);
  });

  it("confirm/reject/unlink pass args and surface RPC errors", async () => {
    rpc.mockResolvedValueOnce({ data: true, error: null });
    await confirmCrProviderMapping("p1", "e1", "why");
    expect(rpc).toHaveBeenCalledWith("confirm_cr_provider_mapping", { _provider_id: "p1", _employee_id: "e1", _reason: "why" });

    rpc.mockResolvedValueOnce({ data: true, error: null });
    await rejectCrProviderMapping("p2");
    expect(rpc).toHaveBeenCalledWith("reject_cr_provider_mapping", { _provider_id: "p2", _reason: null });

    rpc.mockResolvedValueOnce({ data: true, error: null });
    await unlinkCrProviderMapping("e2", "correction");
    expect(rpc).toHaveBeenCalledWith("unlink_cr_provider_mapping", { _employee_id: "e2", _reason: "correction" });

    rpc.mockResolvedValueOnce({ data: null, error: { message: "denied" } });
    await expect(confirmCrProviderMapping("p", "e")).rejects.toMatchObject({ message: "denied" });
  });

  it("fetchCrIdentityQueue filters by mapping_status", async () => {
    const eq = vi.fn().mockResolvedValue({ data: [{ provider_id: "p" }], error: null });
    const limit = vi.fn().mockReturnValue({ eq });
    const order = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ order });
    from.mockReturnValue({ select });
    const rows = await fetchCrIdentityQueue("pending");
    expect(from).toHaveBeenCalledWith("cr_identity_mapping_queue");
    expect(eq).toHaveBeenCalledWith("mapping_status", "pending");
    expect(rows).toHaveLength(1);
  });
});