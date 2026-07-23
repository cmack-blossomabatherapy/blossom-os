/**
 * Code-side registry of the automated emails / SMS messages Blossom OS may
 * draft for families. The authoritative store is
 * `public.intake_communication_templates`; this array is a bootstrap seed and
 * an offline-safe fallback for the resolver. The Admin → Intake Templates
 * page reads/writes the database rows.
 */
import type { EmailTemplateKey, SmsTemplateKey } from "./communicationTypes";
import { supabase } from "@/integrations/supabase/client";

export type TemplateChannel = "email" | "sms";

export interface TemplateRegistryEntry {
  /** Stable key referenced by the send adapters. */
  key: EmailTemplateKey | SmsTemplateKey | string;
  channel: TemplateChannel;
  displayName: string;
  description: string;
  /** Where in the product this gets sent from. */
  usedIn: string;
  /** Default subject (email only). */
  subject?: string;
  /** Default body copy with {{handlebars}} variables. */
  body: string;
  provider: "Mailchimp Email" | "Mailchimp SMS";
}

const SIGNOFF = "{{intake_coordinator_name}}\nBlossom ABA Therapy";

function emailTemplate(
  partial: Omit<TemplateRegistryEntry, "channel" | "provider">,
): TemplateRegistryEntry {
  return { ...partial, channel: "email", provider: "Mailchimp Email" };
}
function smsTemplate(
  partial: Omit<TemplateRegistryEntry, "channel" | "provider" | "subject">,
): TemplateRegistryEntry {
  return { ...partial, channel: "sms", provider: "Mailchimp SMS" };
}

export const AUTOMATED_EMAIL_REGISTRY: TemplateRegistryEntry[] = [
  emailTemplate({
    key: "intake-packet",
    displayName: "Send Intake Packet",
    description: "First packet sent to a new family after qualification.",
    usedIn: "Lead drawer → Send Intake Packet",
    subject: "Your Blossom ABA intake packet for {{patient_first_name}}",
    body: `Hi {{parent_first_name}},

Thanks for reaching out about {{patient_first_name}} — we're excited to help. I've attached your intake packet below. When you have a moment, please fill it out and reply with anything you'd like us to know.

If you have any questions, just reply to this email — I'm happy to walk you through it.

Warmly,
${SIGNOFF}`,
  }),
  emailTemplate({
    key: "missing-info-reminder",
    displayName: "Missing Info Reminder",
    description: "Gentle nudge when an intake packet is missing fields or documents.",
    usedIn: "Intake → Packet Follow Up / Missing Info",
    subject: "Quick follow-up on {{patient_first_name}}'s intake",
    body: `Hi {{parent_first_name}},

Just checking back in on {{patient_first_name}}'s intake. There are a couple of items we still need to move forward — would you mind sending those over when you get a chance?

If anything is unclear, reply here and I'll walk you through it.

Thanks so much,
${SIGNOFF}`,
  }),
  emailTemplate({
    key: "vob-update",
    displayName: "Benefits Verification Update",
    description: "Share the result of benefits verification with the family.",
    usedIn: "Benefits Verification workspace",
    subject: "Benefits update for {{patient_first_name}}",
    body: `Hi {{parent_first_name}},

I wanted to share where we are with {{patient_first_name}}'s benefits verification. Here's what we've confirmed so far — let me know if you have any questions.

Thanks,
${SIGNOFF}`,
  }),
  emailTemplate({
    key: "general-follow-up",
    displayName: "General Follow-Up",
    description: "Open-ended check-in when no specific template fits.",
    usedIn: "Lead drawer → Send Email",
    subject: "Checking in on {{patient_first_name}}",
    body: `Hi {{parent_first_name}},

Just checking in to see how things are going on your end. Let me know if there's anything we can do to help move {{patient_first_name}}'s start forward.

Talk soon,
${SIGNOFF}`,
  }),
  emailTemplate({
    key: "document-request-insurance-card",
    displayName: "Request: Insurance Card",
    description: "Ask the family to send a photo or PDF of their insurance card.",
    usedIn: "Lead drawer → Documents → Request Insurance Card",
    subject: "Could you send {{patient_first_name}}'s insurance card?",
    body: `Hi {{parent_first_name}},

It was great connecting about {{patient_first_name}}. To keep the intake moving, could you send over a quick photo or PDF of the front and back of your insurance card when you get a moment? You can reply directly to this email with it attached.

Thanks so much — let me know if anything else comes up.
${SIGNOFF}`,
  }),
  emailTemplate({
    key: "document-request-diagnosis",
    displayName: "Request: Diagnosis Documentation",
    description: "Request the formal diagnosis paperwork from the family.",
    usedIn: "Lead drawer → Documents → Request Diagnosis",
    subject: "Diagnosis documentation for {{patient_first_name}}",
    body: `Hi {{parent_first_name}},

To get {{patient_first_name}} ready for services, we need a copy of the formal diagnosis report (usually from your pediatrician or evaluating clinician). Could you send that over when you have a chance? A PDF or clear photo works perfectly.

Thanks so much,
${SIGNOFF}`,
  }),
  emailTemplate({
    key: "document-request-consent-form",
    displayName: "Request: Consent Form",
    description: "Reminder to sign and return the consent form.",
    usedIn: "Lead drawer → Documents → Request Consent Form",
    subject: "Consent form for {{patient_first_name}}",
    body: `Hi {{parent_first_name}},

Just a quick reminder on the consent form for {{patient_first_name}}. Whenever you have a few minutes, please sign and send it back so we can move to the next step.

Reply if you'd like me to resend the link.

Thanks,
${SIGNOFF}`,
  }),
  emailTemplate({
    key: "document-request-intake-packet",
    displayName: "Request: Intake Packet",
    description: "Nudge to complete the intake packet that was already sent.",
    usedIn: "Lead drawer → Documents → Request Intake Packet",
    subject: "Following up on {{patient_first_name}}'s intake packet",
    body: `Hi {{parent_first_name}},

Following up on the intake packet I sent for {{patient_first_name}}. When you get a moment, could you finish it up and send it back? Happy to jump on a quick call if anything is confusing.

Thanks so much,
${SIGNOFF}`,
  }),
  emailTemplate({
    key: "document-request-generic",
    displayName: "Request: Document (Generic)",
    description: "Fallback request when the document type isn't one of the known ones.",
    usedIn: "Lead drawer → Documents → Request",
    subject: "Quick document request for {{patient_first_name}}",
    body: `Hi {{parent_first_name}},

We're missing one item to keep {{patient_first_name}}'s intake moving — could you send it over when you get a moment? A PDF or clear photo is perfect.

Thanks so much,
${SIGNOFF}`,
  }),
  smsTemplate({
    key: "missing-info-reminder",
    displayName: "Missing Info Reminder (SMS)",
    description: "Short text nudge for missing intake info.",
    usedIn: "Intake → Packet Follow Up / Missing Info",
    body: `Hi {{parent_first_name}} — Blossom ABA here. We're still missing a couple of items to move {{patient_first_name}}'s intake forward. Reply here when you can!`,
  }),
  smsTemplate({
    key: "appointment-confirmation",
    displayName: "Appointment Confirmation (SMS)",
    description: "Confirms an upcoming assessment or session.",
    usedIn: "Scheduling → Assessment confirmation",
    body: `Hi {{parent_first_name}} — confirming {{patient_first_name}}'s appointment on {{appointment_date}}. Reply YES to confirm or call us to reschedule.`,
  }),
  smsTemplate({
    key: "intake-packet-reminder",
    displayName: "Intake Packet Reminder (SMS)",
    description: "Nudge after intake packet has been sent.",
    usedIn: "Lead drawer → Quick reminder",
    body: `Hi {{parent_first_name}} — just a friendly reminder to finish {{patient_first_name}}'s intake packet when you get a sec. Let us know if you need help!`,
  }),
  smsTemplate({
    key: "general-follow-up",
    displayName: "General Follow-Up (SMS)",
    description: "Generic check-in text.",
    usedIn: "Lead drawer → Send Text",
    body: `Hi {{parent_first_name}} — checking in on {{patient_first_name}}. Let us know if we can help with anything!`,
  }),
];

export function findRegistryEntry(
  channel: TemplateChannel,
  key: string,
): TemplateRegistryEntry | undefined {
  return AUTOMATED_EMAIL_REGISTRY.find((t) => t.channel === channel && t.key === key);
}

export interface ResolvedTemplate {
  channel: TemplateChannel;
  key: string;
  displayName: string;
  subject: string | null;
  body: string;
  mergeFields: string[];
  isActive: boolean;
  /** True only when the caller may use this template for automated/approved sends. */
  approvedForAutomation: boolean;
  source: "db" | "registry";
}

/**
 * Load the active persisted template row by (channel, template_key). Falls
 * back to the code registry when the backend is unreachable. When a row
 * exists but is inactive, the returned copy is marked `approvedForAutomation:
 * false` so callers must not treat it as an approved automated send.
 */
export async function resolveTemplate(
  channel: TemplateChannel,
  key: string,
): Promise<ResolvedTemplate | null> {
  const registry = findRegistryEntry(channel, key);

  try {
    const { data, error } = await supabase
      .from("intake_communication_templates" as never)
      .select("template_key,channel,display_name,subject,body,merge_fields,is_active")
      .eq("channel", channel)
      .eq("template_key", key)
      .maybeSingle();
    if (!error && data) {
      const row = data as {
        template_key: string;
        channel: TemplateChannel;
        display_name: string;
        subject: string | null;
        body: string;
        merge_fields: unknown;
        is_active: boolean;
      };
      const mergeFields = Array.isArray(row.merge_fields)
        ? (row.merge_fields as string[])
        : [];
      return {
        channel: row.channel,
        key: row.template_key,
        displayName: row.display_name,
        subject: row.subject,
        body: row.body,
        mergeFields,
        isActive: row.is_active,
        approvedForAutomation: row.is_active === true,
        source: "db",
      };
    }
  } catch {
    // fall through to registry
  }

  if (!registry) return null;
  return {
    channel: registry.channel,
    key: String(registry.key),
    displayName: registry.displayName,
    subject: registry.subject ?? null,
    body: registry.body,
    mergeFields: extractMergeFields(
      `${registry.subject ?? ""}\n${registry.body}`,
    ),
    isActive: true,
    approvedForAutomation: true,
    source: "registry",
  };
}

function extractMergeFields(text: string): string[] {
  const out = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.add(m[1]);
  return [...out];
}