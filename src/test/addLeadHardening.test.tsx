import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";

/* ----------------------------- Supabase mock ------------------------------ */

// LeadsProvider calls useAuth() to stamp lead ownership. Stub AuthContext so
// these unit tests don't require a full <AuthProvider> wrapper.
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ displayName: "Test User", user: { email: "test@example.com", user_metadata: { full_name: "Test User" } } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

type Mode = {
  intakeLeadsFails?: boolean;
  intakeTasksFails?: boolean;
  intakeCommsFails?: boolean;
};
const mode: Mode = {};

const invokeSpy = vi.fn();

vi.mock("@/integrations/supabase/client", () => {
  const insertedRowFor = (payload: Record<string, unknown>) => ({
    id: "11111111-1111-1111-1111-111111111111",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stage_entered_at: new Date().toISOString(),
    monday_item_id: null,
    monday_group: null,
    ...payload,
  });

  const fromImpl = (table: string) => {
    if (table === "intake_leads") {
      return {
        insert(payload: Record<string, unknown>) {
          return {
            select: () => ({
              single: async () =>
                mode.intakeLeadsFails
                  ? { data: null, error: { message: "raw db error: rls violation on intake_leads" } }
                  : { data: insertedRowFor(payload), error: null },
            }),
          };
        },
        select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
      };
    }
    if (table === "intake_tasks") {
      return {
        insert: () =>
          mode.intakeTasksFails
            ? Promise.reject(new Error("tasks insert exploded"))
            : Promise.resolve({ data: null, error: null }),
      };
    }
    if (table === "intake_communications") {
      return {
        insert: () =>
          mode.intakeCommsFails
            ? Promise.reject(new Error("comms insert exploded"))
            : Promise.resolve({ data: null, error: null }),
      };
    }
    return {
      select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
      insert: () => Promise.resolve({ data: null, error: null }),
    };
  };

  return {
    supabase: {
      from: fromImpl,
      functions: { invoke: (...args: unknown[]) => { invokeSpy(...args); return Promise.resolve({ data: null, error: null }); } },
    },
  };
});

import { LeadsProvider, useLeads } from "@/contexts/LeadsContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <LeadsProvider>{children}</LeadsProvider>
    </QueryClientProvider>
  );
}

const baseInput = {
  childName: "Hardening Child",
  parentName: "Hardening Parent",
  phone: "555-000-0000",
  email: "hp@example.com",
  state: "GA",
  leadSource: "Website",
  pipelineStage: "Lead Captured",
  regularCallLog: "logged something",
};

describe("Add Lead — production hardening", () => {
  beforeEach(() => {
    mode.intakeLeadsFails = false;
    mode.intakeTasksFails = false;
    mode.intakeCommsFails = false;
    invokeSpy.mockClear();
  });

  it("createLead succeeds even when intake_tasks insert fails", async () => {
    mode.intakeTasksFails = true;
    const { result } = renderHook(() => useLeads(), { wrapper });
    let lead: any;
    await act(async () => { lead = await result.current.createLead(baseInput as never); });
    expect(lead?.childName).toBe("Hardening Child");
  });

  it("createLead succeeds even when intake_communications insert fails", async () => {
    mode.intakeCommsFails = true;
    const { result } = renderHook(() => useLeads(), { wrapper });
    let lead: any;
    await act(async () => { lead = await result.current.createLead(baseInput as never); });
    expect(lead?.childName).toBe("Hardening Child");
    await waitFor(() => expect(true).toBe(true));
  });

  it("createLead throws a user-safe error (no raw db message) when intake_leads insert fails", async () => {
    mode.intakeLeadsFails = true;
    const { result } = renderHook(() => useLeads(), { wrapper });
    let err: Error | null = null;
    await act(async () => {
      try { await result.current.createLead(baseInput as never); }
      catch (e) { err = e as Error; }
    });
    expect(err).toBeTruthy();
    expect(err!.message).toBe(
      "Could not save lead. Please check required fields and try again.",
    );
    expect(err!.message).not.toMatch(/rls|edge function|supabase/i);
  });

  it("createLead does not invoke any Edge Function", async () => {
    const { result } = renderHook(() => useLeads(), { wrapper });
    await act(async () => { await result.current.createLead(baseInput as never); });
    expect(invokeSpy).not.toHaveBeenCalled();
  });
});
