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

const insertSpies = {
  intake_leads: vi.fn(),
  intake_tasks: vi.fn(),
  intake_communications: vi.fn(),
};

vi.mock("@/integrations/supabase/client", () => {
  const insertedRowFor = (payload: Record<string, unknown>) => ({
    id: "lead-test-1",
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
          insertSpies.intake_leads(payload);
          return {
            select: () => ({
              single: async () => ({ data: insertedRowFor(payload), error: null }),
            }),
          };
        },
        select: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      };
    }
    if (table === "intake_tasks") {
      return {
        insert(payload: Record<string, unknown>) {
          insertSpies.intake_tasks(payload);
          return Promise.resolve({ data: null, error: null });
        },
      };
    }
    if (table === "intake_communications") {
      return {
        insert(payload: Record<string, unknown>) {
          insertSpies.intake_communications(payload);
          return Promise.resolve({ data: null, error: null });
        },
      };
    }
    // Default fallback for monday_leads_raw and friends.
    return {
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
    };
  };

  return { supabase: { from: fromImpl } };
});

/* ------------------------------ Imports SUT ------------------------------- */

import { LeadsProvider, useLeads } from "@/contexts/LeadsContext";

function wrapper({ children }: { children: React.ReactNode }) {
  return <LeadsProvider>{children}</LeadsProvider>;
}

/* --------------------------------- Tests ---------------------------------- */

describe("Phase D — createLead persists to Supabase", () => {
  beforeEach(() => {
    insertSpies.intake_leads.mockClear();
    insertSpies.intake_tasks.mockClear();
    insertSpies.intake_communications.mockClear();
  });

  it("inserts the lead with all required fields and creates a first task", async () => {
    const { result } = renderHook(() => useLeads(), { wrapper });

    await act(async () => {
      await result.current.createLead({
        childName: "Test Child",
        parentName: "Test Parent",
        phone: "555-555-5555",
        email: "parent@example.com",
        state: "NC",
        leadSource: "Website",
        pipelineStage: "New Lead",
        assignedIntakeCoordinator: "Coordinator A",
        leadType: "Self Referral",
        regularCallLog: "Left voicemail",
      });
    });

    await waitFor(() => expect(insertSpies.intake_leads).toHaveBeenCalledTimes(1));

    const payload = insertSpies.intake_leads.mock.calls[0][0];
    expect(payload).toMatchObject({
      child_name: "Test Child",
      parent_name: "Test Parent",
      phone: "555-555-5555",
      email: "parent@example.com",
      state: "NC",
      lead_source: "Website",
      pipeline_stage: "New Lead",
      lead_type: "Self Referral",
      assigned_intake_coordinator: "Coordinator A",
    });
    expect(payload.tags).toEqual(["Blossom OS"]);
    expect(payload.source_metadata).toEqual({});

    await waitFor(() => expect(insertSpies.intake_tasks).toHaveBeenCalledTimes(1));
    expect(insertSpies.intake_tasks.mock.calls[0][0]).toMatchObject({
      lead_id: "lead-test-1",
      title: "Contact Lead",
      workflow_step: "New Lead",
    });

    await waitFor(() => expect(insertSpies.intake_communications).toHaveBeenCalledTimes(1));
    expect(insertSpies.intake_communications.mock.calls[0][0]).toMatchObject({
      lead_id: "lead-test-1",
      communication_type: "call",
      direction: "outbound",
      preview: "Left voicemail",
    });

    expect(result.current.leads[0]?.childName).toBe("Test Child");
  });
});