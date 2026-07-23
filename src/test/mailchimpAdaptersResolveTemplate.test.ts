import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/integrations/supabase/client", () => {
  const maybeSingle = vi.fn();
  const eq2 = vi.fn(() => ({ maybeSingle }));
  const eq1 = vi.fn(() => ({ eq: eq2 }));
  const select = vi.fn(() => ({ eq: eq1 }));
  const from = vi.fn(() => ({ select }));
  return {
    supabase: { from },
    __mocks: { from, select, eq1, eq2, maybeSingle },
  };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { __mocks } = (await import("@/integrations/supabase/client")) as any;
const { from, maybeSingle } = __mocks;

import * as EmailMod from "@/lib/integrations/communications/mailchimpEmail";
import * as SmsMod from "@/lib/integrations/communications/mailchimpSms";
const { sendEmailViaMailchimp } = EmailMod;
const { sendSmsViaMailchimp } = SmsMod;

vi.spyOn(EmailMod, "isMailchimpEmailConfigured").mockReturnValue(true);
vi.spyOn(SmsMod, "isMailchimpSmsConfigured").mockReturnValue(true);

const lead = {
  leadId: "lead-1",
  email: "parent@example.com",
  phone: "+15551230000",
};

beforeEach(() => {
  from.mockClear();
  maybeSingle.mockReset();
});

describe("mailchimp adapters call resolveTemplate before succeeding", () => {
  it("email adapter queries intake_communication_templates and uses persisted subject", async () => {
    maybeSingle.mockResolvedValueOnce({
      data: {
        template_key: "intake-packet",
        channel: "email",
        display_name: "Send Intake Packet",
        subject: "Persisted subject line",
        body: "Persisted body",
        merge_fields: ["parent_first_name"],
        is_active: true,
      },
      error: null,
    });
    const res = await sendEmailViaMailchimp(lead, "intake-packet");
    expect(from).toHaveBeenCalledWith("intake_communication_templates");
    expect(res.success).toBe(true);
    expect(res.provider).toBe("mailchimp-email");
    expect(res.message).toMatch(/Persisted subject line/);
  });

  it("email adapter blocks when the persisted row is inactive — no registry fallback", async () => {
    maybeSingle.mockResolvedValueOnce({
      data: {
        template_key: "intake-packet",
        channel: "email",
        display_name: "Send Intake Packet",
        subject: "s",
        body: "b",
        merge_fields: [],
        is_active: false,
      },
      error: null,
    });
    const res = await sendEmailViaMailchimp(lead, "intake-packet");
    expect(res.success).toBe(false);
    expect(res.needsConfiguration).toBe(false);
    expect(res.message).toMatch(/inactive or unavailable; contact Admin/i);
  });

  it("email adapter falls back to the registry when the backend errors", async () => {
    maybeSingle.mockRejectedValueOnce(new Error("backend unreachable"));
    const res = await sendEmailViaMailchimp(lead, "intake-packet");
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/Send Intake Packet/);
  });

  it("sms adapter queries intake_communication_templates and succeeds on an active row", async () => {
    maybeSingle.mockResolvedValueOnce({
      data: {
        template_key: "missing-info-reminder",
        channel: "sms",
        display_name: "Missing Info Reminder (SMS)",
        subject: null,
        body: "Body",
        merge_fields: [],
        is_active: true,
      },
      error: null,
    });
    const res = await sendSmsViaMailchimp(lead, "missing-info-reminder");
    expect(from).toHaveBeenCalledWith("intake_communication_templates");
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/Missing Info Reminder \(SMS\)/);
  });

  it("sms adapter blocks an inactive persisted row without falling back to registry", async () => {
    maybeSingle.mockResolvedValueOnce({
      data: {
        template_key: "missing-info-reminder",
        channel: "sms",
        display_name: "Missing Info Reminder (SMS)",
        subject: null,
        body: "Body",
        merge_fields: [],
        is_active: false,
      },
      error: null,
    });
    const res = await sendSmsViaMailchimp(lead, "missing-info-reminder");
    expect(res.success).toBe(false);
    expect(res.needsConfiguration).toBe(false);
    expect(res.message).toMatch(/inactive or unavailable; contact Admin/i);
  });

  it("sms adapter falls back to the registry when the backend errors", async () => {
    maybeSingle.mockRejectedValueOnce(new Error("backend unreachable"));
    const res = await sendSmsViaMailchimp(lead, "general-follow-up");
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/General Follow-Up \(SMS\)/);
  });
});