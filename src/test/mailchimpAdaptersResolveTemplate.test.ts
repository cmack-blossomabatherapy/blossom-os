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

const originalEnv = { ...(import.meta as unknown as { env: Record<string, string> }).env };
function setEnv(patch: Record<string, string | undefined>) {
  const env = (import.meta as unknown as { env: Record<string, string> }).env;
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) delete env[k];
    else env[k] = v;
  }
}

import { sendEmailViaMailchimp } from "@/lib/integrations/communications/mailchimpEmail";
import { sendSmsViaMailchimp } from "@/lib/integrations/communications/mailchimpSms";

const lead = {
  leadId: "lead-1",
  email: "parent@example.com",
  phone: "+15551230000",
};

beforeEach(() => {
  from.mockClear();
  maybeSingle.mockReset();
  setEnv({
    VITE_MAILCHIMP_API_KEY: "k",
    VITE_MAILCHIMP_AUDIENCE_ID: "a",
    VITE_MAILCHIMP_SMS_API_KEY: "k",
    VITE_MAILCHIMP_SMS_PROGRAM_ID: "p",
  });
});

afterAll(() => {
  const env = (import.meta as unknown as { env: Record<string, string> }).env;
  for (const k of Object.keys(env)) if (!(k in originalEnv)) delete env[k];
  Object.assign(env, originalEnv);
});

import { afterAll } from "vitest";

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