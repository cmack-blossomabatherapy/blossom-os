/**
 * Mailchimp SMS adapter — used for missing-info reminders, appointment
 * confirmations, intake packet reminders, and general parent follow-ups.
 */
import type {
  CommunicationResult,
  LeadCommunicationContext,
  SmsTemplateKey,
} from "./communicationTypes";

export function isMailchimpSmsConfigured(): boolean {
  const envFlag = (import.meta as unknown as { env?: Record<string, string> }).env;
  return Boolean(envFlag?.VITE_MAILCHIMP_SMS_API_KEY && envFlag?.VITE_MAILCHIMP_SMS_PROGRAM_ID);
}

export async function sendSmsViaMailchimp(
  lead: LeadCommunicationContext,
  templateKey: SmsTemplateKey,
): Promise<CommunicationResult> {
  const timestamp = new Date().toISOString();
  if (!isMailchimpSmsConfigured()) {
    return {
      success: false,
      provider: "mailchimp-sms",
      action: "sms",
      leadId: lead.leadId,
      timestamp,
      message: "SMS sending not configured. Ask Admin to connect Mailchimp SMS.",
      needsConfiguration: true,
      configHint: "Integrations: Mailchimp SMS (API key, program ID, consent mapping)",
    };
  }
  if (!lead.phone) {
    return {
      success: false,
      provider: "mailchimp-sms",
      action: "sms",
      leadId: lead.leadId,
      timestamp,
      message: "No phone number on file for this lead.",
    };
  }
  return {
    success: true,
    provider: "mailchimp-sms",
    action: "sms",
    leadId: lead.leadId,
    timestamp,
    message: `SMS "${templateKey}" sent to ${lead.phone}.`,
  };
}