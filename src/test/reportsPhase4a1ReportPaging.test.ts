import { describe, it, expect, vi, beforeEach } from "vitest";

const state: {
  total: number;
  error: string | null;
  calls: Array<[number, number]>;
  rpcNames: string[];
  orderCalls: Array<[string, unknown]>;
} = { total: 0, error: null, calls: [], rpcNames: [], orderCalls: [] };

function page(from: number, to: number) {
  const size = Math.min(to - from + 1, 1000);
  const rows = [];
  for (let i = from; i < Math.min(from + size, state.total); i += 1) {
    rows.push({ id: i });
  }
  return rows;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: (column: string, opts: unknown) => {
          state.orderCalls.push([column, opts]);
          return {
            range: (from: number, to: number) => {
              state.calls.push([from, to]);
              return Promise.resolve({
                data: state.error ? null : page(from, to),
                error: state.error ? { message: state.error } : null,
              });
            },
          };
        },
      }),
    }),
    rpc: (name: string) => {
      state.rpcNames.push(name);
      return {
        range: (from: number, to: number) => {
          state.calls.push([from, to]);
          return Promise.resolve({
            data: state.error ? null : page(from, to),
            error: state.error ? { message: state.error } : null,
          });
        },
      };
    },
  },
}));

const {
  readTable,
  readRpcPaged,
  fetchReportAuthorizationEvents,
  CR_PAGE_SIZE,
  CR_SAFETY_CAP,
  CR_SAFETY_CAP_ERROR,
} = await import("@/lib/os/reports/crPrimary/source");

describe("Phase 4A1 complete report paging", () => {
  beforeEach(() => {
    state.total = 0;
    state.error = null;
    state.calls = [];
    state.rpcNames = [];
    state.orderCalls = [];
  });

  it("returns all 2,501 synthetic RPC rows in order instead of the first 1,000", async () => {
    state.total = 2501;
    const res = await readRpcPaged<{ id: number }>("report_billing_facts", "billing facts");
    expect(res.error).toBeNull();
    expect(res.rows).toHaveLength(2501);
    expect(res.rows.map((r) => r.id)).toEqual(
      Array.from({ length: 2501 }, (_, i) => i),
    );
    expect(state.calls.length).toBe(3);
  });

  it("stops on a final short page", async () => {
    state.total = 1500;
    const res = await readRpcPaged<{ id: number }>("report_authorization_actions", "actions");
    expect(res.rows).toHaveLength(1500);
    expect(state.calls.length).toBe(2);
    expect(state.calls[1]).toEqual([CR_PAGE_SIZE, CR_PAGE_SIZE * 2 - 1]);
  });

  it("pages the authorization lifecycle events RPC", async () => {
    state.total = 3916;
    const res = await fetchReportAuthorizationEvents();
    expect(res.rows).toHaveLength(3916);
    expect(state.rpcNames).toContain("report_authorization_events");
  });

  it("orders table reads by a stable unique column before ranging", async () => {
    state.total = 10;
    await readTable("cr_billing_sessions", "id");
    expect(state.orderCalls[0][0]).toBe("id");
  });

  it("retains provenance when an RPC or table read errors", async () => {
    state.error = "permission denied for function report_billing_facts";
    const rpc = await readRpcPaged("report_billing_facts", "billing facts");
    expect(rpc.error).toBe("permission denied for function report_billing_facts");
    expect(rpc.rows).toEqual([]);

    const table = await readTable("cr_schedule_events", "id");
    expect(table.error).toBe("permission denied for function report_billing_facts");
    expect(table.rows).toEqual([]);
  });

  it("turns the safety cap into an explicit visible error", async () => {
    state.total = CR_SAFETY_CAP + 5000;
    const res = await readRpcPaged("report_billing_facts", "billing facts");
    expect(res.error).toBe(CR_SAFETY_CAP_ERROR);
    expect(res.rows).toHaveLength(CR_SAFETY_CAP);
  });
});
