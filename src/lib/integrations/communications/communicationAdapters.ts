/**
 * Intake communications service — high-level functions used by Intake UI
 * (lead detail, lead drawer, intake dashboard) instead of direct
 * tel: / sms: / mailto: links.
 *
 * Every function returns a CommunicationResult and never throws on missing
 * integration config — callers should surface result.message via toast.
 */
import { toast } from "sonner";
import { isCTMConfigured, trackCallViaCTM } from "./ctm";
import { callViaJivetel, isJivetelConfigured } from "./jivetel";
import { isMailchimpEmailConfigured, sendEmailViaMailchimp } from "./mailchimpEmail";
import { isMailchimpSmsConfigured, sendSmsViaMailchimp } from "./mailchimpSms";
import type {
  CommunicationResult,
  EmailTemplateKey,
  LeadCommunicationContext,
  SmsTemplateKey,
} from "./communicationTypes";

export async function callParent(lead: LeadCommunicationContext): Promise<CommunicationResult> {
  const ctm = isCTMConfigured() ? await trackCallViaCTM(lead) : null;
  return callViaJivetel(lead, ctm?.trackingContext);
}

export async function sendLeadSms(
  lead: LeadCommunicationContext,
  templateKey: SmsTemplateKey = "general-follow-up",
): Promise<CommunicationResult> {
  return sendSmsViaMailchimp(lead, templateKey);
}

export async function sendLeadEmail(
  lead: LeadCommunicationContext,
  templateKey: EmailTemplateKey = "general-follow-up",
): Promise<CommunicationResult> {
  return sendEmailViaMailchimp(lead, templateKey);
}

export async function sendIntakePacket(lead: LeadCommunicationContext): Promise<CommunicationResult> {
  return sendEmailViaMailchimp(lead, "intake-packet");
}

export async function sendMissingInfoReminder(lead: LeadCommunicationContext): Promise<CommunicationResult> {
  // Prefer SMS; fall back to email if SMS not configured.
  if (isMailchimpSmsConfigured()) {
    return sendSmsViaMailchimp(lead, "missing-info-reminder");
  }
  return sendEmailViaMailchimp(lead, "missing-info-reminder");
}

export async function sendVobUpdate(lead: LeadCommunicationContext): Promise<CommunicationResult> {
  return sendEmailViaMailchimp(lead, "vob-update");
}

/** Shared UI helper: surface a CommunicationResult to the user. */
export function notifyCommunicationResult(result: CommunicationResult): void {
  if (result.success) {
    toast.success(result.message);
    return;
  }
  if (result.needsConfiguration) {
    toast.warning(result.message, {
      description: result.configHint
        ? `Setup: ${result.configHint}`
        : "Admin can finish setup in Integrations.",
    });
    return;
  }
  toast.error(result.message);
}

export const communicationsConfigStatus = {
  ctm: () => isCTMConfigured(),
  jivetel: () => isJivetelConfigured(),
  mailchimpEmail: () => isMailchimpEmailConfigured(),
  mailchimpSms: () => isMailchimpSmsConfigured(),
};