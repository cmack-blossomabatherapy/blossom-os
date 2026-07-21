import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// Mock the supabase client. We track RPC and select invocations so we can
// assert self-provision-attempt-at-most-once behavior.
const rpcMock = vi.fn(async () => ({ data: null, error: null }));
const maybeSingleMock = vi.fn(async () => ({ data: null, error: null }));

vi.mock("@/integrations/supabase/client", () => {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
    neq: () => chain,
    insert: () => ({ select: async () => ({ data: [], error: null }) }),
    maybeSingle: () => maybeSingleMock(),
  };
  return {
    supabase: {
      from: () => chain,
      rpc: (...args: any[]) => rpcMock(...args),
    },
  };
});

import { useProgram } from "@/pages/rbt/app/training/useProgram";

describe("useProgram unlinked/self-provision behavior", () => {
  beforeEach(() => {
    rpcMock.mockClear();
    maybeSingleMock.mockClear();
  });

  it("settles loading=false with calm setup state when employeeId is absent", async () => {
    const { result } = renderHook(() => useProgram(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.needsRecruitingData).toBe(true);
    expect(result.current.pathway).toBeNull();
    expect(result.current.rows).toEqual([]);
    // Must not call the self-provision RPC when there is no employee at all.
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("attempts ensure_my_rbt_pathway_assignment at most once per employee across reloads", async () => {
    // First lookup returns no assignment; retry after RPC also returns none.
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useProgram("emp-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.needsRecruitingData).toBe(true);
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith("ensure_my_rbt_pathway_assignment");

    // Manual reload — must NOT retry the RPC for the same employee.
    await act(async () => { await result.current.reload(); });
    expect(rpcMock).toHaveBeenCalledTimes(1);

    await act(async () => { await result.current.reload(); });
    expect(rpcMock).toHaveBeenCalledTimes(1);
  });
});