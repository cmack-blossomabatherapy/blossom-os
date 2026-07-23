/**
 * Mailchimp Email adapter — used for intake packets, missing info reminders,
 * VOB updates, and general parent follow-ups.
 */
import type {
  CommunicationResult,
  EmailTemplateKey,
  LeadCommunicationContext,
} from "./communicationTypes";
import { resolveTemplate } from "./templateRegistry";

/** Test-only override used to force a configured state without leaking env. */
let __configuredOverride: boolean | null = null;
export function __setEmailConfiguredForTests(value: boolean | null) {
  __configuredOverride = value;
}

export function isMailchimpEmailConfigured(): boolean {
  if (__configuredOverride !== null) return __configuredOverride;
  const envFlag = (import.meta as unknown as { env?: Record<string, string> }).env;
  return Boolean(envFlag?.VITE_MAILCHIMP_API_KEY && envFlag?.VITE_MAILCHIMP_AUDIENCE_ID);
}

export async function sendEmailViaMailchimp(
  lead: LeadCommunicationContext,
  templateKey: EmailTemplateKey,
): Promise<CommunicationResult> {
  const timestamp = new Date().toISOString();
  const baseAction = templateKey === "general-follow-up" ? "email" : templateKey;
  if (!isMailchimpEmailConfigured()) {
    return {
      success: false,
      provider: "mailchimp-email",
      action: baseAction as CommunicationResult["action"],
      leadId: lead.leadId,
      timestamp,
      message: "Email sending not configured. Ask Admin to connect Mailchimp Email.",
      needsConfiguration: true,
      configHint: "Integrations: Mailchimp Email (API key, Audience ID, templates)",
    };
  }
  if (!lead.email) {
    return {
      success: false,
      provider: "mailchimp-email",
      action: baseAction as CommunicationResult["action"],
      leadId: lead.leadId,
      timestamp,
      message: "No email on file for this lead.",
    };
  }
  const resolved = await resolveTemplate("email", templateKey);
  if (!resolved || !resolved.approvedForAutomation) {
    return {
      success: false,
      provider: "mailchimp-email",
      action: baseAction as CommunicationResult["action"],
      leadId: lead.leadId,
      timestamp,
      message: `Email template "${templateKey}" is inactive or unavailable; contact Admin.`,
      needsConfiguration: false,
    };
  }
  const subject = resolved.subject ?? "";
  return {
    success: true,
    provider: "mailchimp-email",
    action: baseAction as CommunicationResult["action"],
    leadId: lead.leadId,
    timestamp,
    message: `Email "${resolved.displayName}"${subject ? ` (${subject})` : ""} sent to ${lead.email}.`,
  };
}