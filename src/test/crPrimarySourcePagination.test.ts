import { describe, it, expect, vi, beforeEach } from "vitest";

const state: { pages: any[][]; error: string | null; calls: number[][] } = {
  pages: [],
  error: null,
  calls: [],
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        range: (from: number, to: number) => {
          state.calls.push([from, to]);
          const size = to - from + 1;
          const all = state.pages.flat();
          return Promise.resolve({
            data: state.error ? null : all.slice(from, from + size),
            error: state.error ? { message: state.error } : null,
          });
        },
      }),
    }),
  },
}));

const mod = await import("@/lib/os/reports/crPrimary/source");
const { readTable, CR_PAGE_SIZE } = mod;

function makeRows(n: number, offset = 0) {
  return Array.from({ length: n }, (_, i) => ({ id: offset + i }));
}

describe("crPrimary source pagination", () => {
  beforeEach(() => {
    state.pages = [];
    state.error = null;
    state.calls = [];
  });

  it("fetches three full pages plus a partial page (beyond 20,000 rows)", async () => {
    const total = CR_PAGE_SIZE * 3 + 17;
    state.pages = [makeRows(total)];
    const res = await readTable<{ id: number }>("cr_billing_sessions", "id");
    expect(res.error).toBeNull();
    expect(res.rows).toHaveLength(total);
    expect(res.rows[total - 1].id).toBe(total - 1);
    expect(state.calls.length).toBe(4);
    expect(state.calls[0]).toEqual([0, CR_PAGE_SIZE - 1]);
  });

  it("supports more than the old 20,000 row limit", async () => {
    state.pages = [makeRows(56936)];
    const res = await readTable<{ id: number }>("cr_billing_sessions", "id");
    expect(res.rows).toHaveLength(56936);
  });

  it("stops when a page is short and returns no error", async () => {
    state.pages = [makeRows(10)];
    const res = await readTable("cr_schedule_events", "id");
    expect(state.calls.length).toBe(1);
    expect(res.error).toBeNull();
  });

  it("returns the error message and never throws", async () => {
    state.error = "permission denied";
    const res = await readTable("cr_authorizations", "id");
    expect(res.rows).toEqual([]);
    expect(res.error).toBe("permission denied");
  });
});
