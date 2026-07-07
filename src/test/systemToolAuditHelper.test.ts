import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/integrations/supabase/client", () => {
  const insertMock = vi.fn();
  return {
    supabase: {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1", email: "a@b.co" } } }) },
      from: vi.fn().mockReturnValue({ insert: insertMock }),
      __insertMock: insertMock,
    },
  };
});

import { runWithSystemToolAudit } from "@/hooks/useSystemTools";
import { supabase } from "@/integrations/supabase/client";

const insertMock = (supabase as any).__insertMock as ReturnType<typeof vi.fn>;

describe("runWithSystemToolAudit", () => {
  beforeEach(() => insertMock.mockReset());

  it("returns mutation result and does not call onAuditFailure on success", async () => {
    insertMock.mockResolvedValue({ error: null });
    const onAuditFailure = vi.fn();
    const result = await runWithSystemToolAudit({
      mutation: async () => ({ ok: true, message: "ready" }),
      audit: (r) => ({ tool_area: "integrations", action: "test_connection", new_value: r }),
      onAuditFailure,
    });
    expect(result).toEqual({ ok: true, message: "ready" });
    expect(onAuditFailure).not.toHaveBeenCalled();
    expect(insertMock).toHaveBeenCalledTimes(1);
  });

  it("still returns mutation result but fires onAuditFailure when audit insert fails", async () => {
    insertMock.mockResolvedValue({ error: { message: "rls denied" } });
    const onAuditFailure = vi.fn();
    const result = await runWithSystemToolAudit({
      mutation: async () => ({ ok: true }),
      audit: () => ({ tool_area: "integrations", action: "run_sync" }),
      onAuditFailure,
    });
    expect(result).toEqual({ ok: true });
    expect(onAuditFailure).toHaveBeenCalledWith("rls denied");
  });

  it("still returns mutation result but fires onAuditFailure when audit insert throws", async () => {
    insertMock.mockImplementation(() => { throw new Error("network dead"); });
    const onAuditFailure = vi.fn();
    const result = await runWithSystemToolAudit({
      mutation: async () => 42,
      audit: () => ({ tool_area: "bcba_productivity_uploads", action: "append_upload" }),
      onAuditFailure,
    });
    expect(result).toBe(42);
    expect(onAuditFailure).toHaveBeenCalled();
  });

  it("does not swallow mutation errors", async () => {
    const onAuditFailure = vi.fn();
    await expect(
      runWithSystemToolAudit({
        mutation: async () => { throw new Error("boom"); },
        audit: () => ({ tool_area: "issue_tracker", action: "update" }),
        onAuditFailure,
      }),
    ).rejects.toThrow("boom");
    expect(insertMock).not.toHaveBeenCalled();
    expect(onAuditFailure).not.toHaveBeenCalled();
  });
});
