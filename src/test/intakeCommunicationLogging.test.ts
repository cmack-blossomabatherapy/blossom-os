import { describe, it, expect, vi, beforeEach } from "vitest";

const state: { insertPayload: unknown; leadUpdate: unknown; taskUpdate: unknown } = {
  insertPayload: null, leadUpdate: null, taskUpdate: null,
};

vi.mock("@/integrations/supabase/client", () => {
  const builder = (table: string) => ({
    insert(payload: unknown) {
      state.insertPayload = payload;
      return { select: () => ({ maybeSingle: async () => ({ data: { id: "comm-1" }, error: null }) }) };
    },
    select() {
      const chain = {
        eq: () => chain,
        neq: () => chain,
        order: () => chain,
        limit: () => chain,
        maybeSingle: async () => ({
          data: table === "intake_leads" ? { contact_attempts_count: 2 } : { id: "task-1", notes: "prior" },
          error: null,
        }),
      };
      return chain;
    },
    update(payload: unknown) {
      if (table === "intake_leads") state.leadUpdate = payload;
      else state.taskUpdate = payload;
      return { eq: async () => ({ error: null }) };
    },
  });
  return {
    supabase: {
      from: (table: string) => builder(table),
      auth: { getUser: async () => ({ data: { user: { id: "u1", email: "intake@blossom.com" } } }) },
    },
  };
});

const { logIntakeCommunication, logCommunicationResult, isPersistableLeadId, buildCommPreview } =
  await import("@/lib/intake/communicationLogging");

const LEAD = "11111111-2222-3333-4444-555555555555";

describe("intake communication logging", () => {
  beforeEach(() => { state.insertPayload = null; state.leadUpdate = null; state.taskUpdate = null; });

  it("rejects non-persistable lead ids", async () => {
    expect(isPersistableLeadId("")).toBe(false);
    const res = await logIntakeCommunication({ leadId: "local-7", kind: "sms", preview: "hi" });
    expect(res.logged).toBe(false);
    expect(res.reason).toMatch(/synced/i);
  });

  it("writes an audit record and updates lead + task context", async () => {
    const res = await logIntakeCommunication({
      leadId: LEAD, kind: "email", preview: "Welcome", subject: "Welcome", templateId: "T12",
    });
    expect(res.logged).toBe(true);
    expect(res.leadContextUpdated).toBe(true);
    expect(res.taskContextUpdated).toBe(true);
    expect(state.insertPayload).toMatchObject({
      lead_id: LEAD, communication_type: "email", direction: "outbound", subject: "Welcome",
      logged_by: "u1", logged_by_name: "intake@blossom.com",
    });
    expect((state.insertPayload as { preview: string }).preview).toContain("[T12]");
    expect(state.leadUpdate).toMatchObject({ contact_attempts_count: 3 });
    expect((state.taskUpdate as { notes: string }).notes).toContain("prior");
    expect((state.taskUpdate as { notes: string }).notes).toContain("EMAIL sent by");
  });

  it("records blocked/preview-only attempts as notes", async () => {
    const res = await logCommunicationResult(
      {
        success: false, previewOnly: true, provider: "mailchimp-email", action: "intake-packet",
        leadId: LEAD, timestamp: new Date().toISOString(), message: "Intake actions disabled",
        needsConfiguration: false,
      } as never,
      { leadId: LEAD, templateId: "intake-packet", channelLabel: "Intake Packet" },
    );
    expect(res.logged).toBe(true);
    expect(state.insertPayload).toMatchObject({ communication_type: "note" });
    expect((state.insertPayload as { preview: string }).preview).toContain("Intake actions disabled");
  });

  it("builds readable previews", () => {
    expect(buildCommPreview({ templateId: "T1", channelLabel: "SMS", body: "Hello", outcomeMessage: "Sent" }))
      .toBe("[T1] SMS — Hello (Sent)");
  });
});
