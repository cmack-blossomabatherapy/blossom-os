import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/integrations/supabase/client", () => {
  const maybeSingle = vi.fn();
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return {
    supabase: { from },
    __mocks: { from, select, eq, maybeSingle },
  };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { __mocks } = await import("@/integrations/supabase/client") as any;
const { from, select, eq, maybeSingle } = __mocks;

import {
  isUuid,
  resolveClientRef,
  resolveClientByCentralReachId,
} from "@/lib/os/reporting/canonicalClientResolver";

beforeEach(() => {
  from.mockClear();
  select.mockClear();
  eq.mockClear();
  maybeSingle.mockReset();
});

describe("canonicalClientResolver", () => {
  it("isUuid recognizes v4 uuids and rejects CR ids and empties", () => {
    expect(isUuid("11111111-2222-3333-4444-555555555555")).toBe(true);
    expect(isUuid("cr_12345")).toBe(false);
    expect(isUuid("")).toBe(false);
    expect(isUuid(null)).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });

  it("resolveClientByCentralReachId returns null for empty input without querying", async () => {
    const uuid = await resolveClientByCentralReachId("  ");
    expect(uuid).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it("resolveClientByCentralReachId returns the client uuid on hit", async () => {
    maybeSingle.mockResolvedValueOnce({
      data: { id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" },
      error: null,
    });
    const uuid = await resolveClientByCentralReachId("cr_42");
    expect(uuid).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    expect(from).toHaveBeenCalledWith("clients");
    expect(eq).toHaveBeenCalledWith("centralreach_id", "cr_42");
  });

  it("resolveClientByCentralReachId returns null on miss and on error", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    expect(await resolveClientByCentralReachId("cr_missing")).toBeNull();
    maybeSingle.mockResolvedValueOnce({ data: null, error: { message: "rls" } });
    expect(await resolveClientByCentralReachId("cr_denied")).toBeNull();
  });

  it("resolveClientRef passes UUIDs straight through without a round trip", async () => {
    const uuid = "11111111-2222-3333-4444-555555555555";
    expect(await resolveClientRef(uuid)).toBe(uuid);
    expect(from).not.toHaveBeenCalled();
  });

  it("resolveClientRef falls back to a CR-id lookup for non-uuid input", async () => {
    maybeSingle.mockResolvedValueOnce({
      data: { id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" },
      error: null,
    });
    expect(await resolveClientRef("cr_42")).toBe(
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    );
  });
});