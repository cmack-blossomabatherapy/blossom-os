import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Phase 4A1 audit repair (2): partial rows must never become KPI totals.
 * Any failure mode returns zero rows plus the provenance error.
 */
type Mode = "ok" | "errorPage2" | "throwPage2" | "cap" | "noRange";

const state: { mode: Mode; total: number; calls: number } = {
  mode: "ok",
  total: 0,
  calls: 0,
};

function page(from: number, to: number) {
  const size = Math.min(to - from + 1, 1000);
  const rows: Array<{ id: number }> = [];
  for (let i = from; i < Math.min(from + size, state.total); i += 1) {
    rows.push({ id: i });
  }
  return rows;
}

function ranger() {
  return {
    range: (from: number, to: number) => {
      state.calls += 1;
      if (state.calls === 2 && state.mode === "errorPage2") {
        return Promise.resolve({ data: null, error: { message: "transport failed" } });
      }
      if (state.calls === 2 && state.mode === "throwPage2") {
        throw new Error("socket closed");
      }
      return Promise.resolve({ data: page(from, to), error: null });
    },
  };
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({ select: () => ({ order: () => ranger() }) }),
    rpc: () => (state.mode === "noRange" ? { then: undefined } : ranger()),
  },
}));

const {
  readTable,
  readRpcPaged,
  CR_PAGE_SIZE,
  CR_SAFETY_CAP,
  CR_SAFETY_CAP_ERROR,
  CR_RPC_PAGING_UNAVAILABLE_ERROR,
} = await import("@/lib/os/reports/crPrimary/source");

describe("Phase 4A1 all-or-nothing report reads", () => {
  beforeEach(() => {
    state.mode = "ok";
    state.total = 0;
    state.calls = 0;
  });

  it("discards page-1 rows when page 2 errors (table)", async () => {
    state.mode = "errorPage2";
    state.total = 2500;
    const res = await readTable<{ id: number }>("cr_billing_sessions", "id");
    expect(res.rows).toEqual([]);
    expect(res.error).toBe("transport failed");
  });

  it("discards page-1 rows when page 2 errors (RPC)", async () => {
    state.mode = "errorPage2";
    state.total = 2500;
    const res = await readRpcPaged<{ id: number }>("report_billing_facts", "billing facts");
    expect(res.rows).toEqual([]);
    expect(res.error).toBe("transport failed");
  });

  it("discards prior pages when a later page throws", async () => {
    state.mode = "throwPage2";
    state.total = 2500;
    const table = await readTable<{ id: number }>("cr_schedule_events", "id");
    expect(table.rows).toEqual([]);
    expect(table.error).toBe("socket closed");

    state.calls = 0;
    const rpc = await readRpcPaged<{ id: number }>("report_billing_facts", "billing facts");
    expect(rpc.rows).toEqual([]);
    expect(rpc.error).toBe("socket closed");
  });

  it("returns zero rows when the safety cap is exhausted", async () => {
    state.total = CR_SAFETY_CAP + CR_PAGE_SIZE;
    const rpc = await readRpcPaged<{ id: number }>("report_billing_facts", "billing facts");
    expect(rpc.rows).toEqual([]);
    expect(rpc.error).toBe(CR_SAFETY_CAP_ERROR);

    state.calls = 0;
    const table = await readTable<{ id: number }>("cr_billing_sessions", "id");
    expect(table.rows).toEqual([]);
    expect(table.error).toBe(CR_SAFETY_CAP_ERROR);
  });

  it("never falls back to a one-shot unpaged RPC read", async () => {
    state.mode = "noRange";
    state.total = 5000;
    const res = await readRpcPaged<{ id: number }>("report_billing_facts", "billing facts");
    expect(res.rows).toEqual([]);
    expect(res.error).toContain(CR_RPC_PAGING_UNAVAILABLE_ERROR);
    expect(state.calls).toBe(0);
  });

  it("still returns 2,501 successful rows completely and in order", async () => {
    state.total = 2501;
    const res = await readRpcPaged<{ id: number }>("report_billing_facts", "billing facts");
    expect(res.error).toBeNull();
    expect(res.rows.map((r) => r.id)).toEqual(
      Array.from({ length: 2501 }, (_, i) => i),
    );
  });
});
