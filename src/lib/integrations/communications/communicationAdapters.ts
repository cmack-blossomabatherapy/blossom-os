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
import {
  fetchIntakeOperatingMode,
  INTAKE_ACTIONS_DISABLED_MESSAGE,
} from "@/lib/intake/operatingMode";
import { callViaJivetel, isJivetelConfigured } from "./jivetel";
import { isMailchimpEmailConfigured, sendEmailViaMailchimp } from "./mailchimpEmail";
import { isMailchimpSmsConfigured, sendSmsViaMailchimp } from "./mailchimpSms";
import type {
  CommunicationResult,
  EmailTemplateKey,
  LeadCommunicationContext,
  SmsTemplateKey,
} from "./communicationTypes";

/**
 * Server-authoritative Intake operating mode guard. Runs before every
 * outbound adapter call. When Intake is in INGEST_ONLY mode we short-circuit
 * and return a deterministic "preview only" CommunicationResult without
 * contacting any external provider — the database also blocks any resulting
 * intake_communications insert via a BEFORE INSERT trigger.
 */
async function previewOnlyIfDisabled(
  action: CommunicationResult["action"],
  provider: CommunicationResult["provider"],
  lead: LeadCommunicationContext,
): Promise<CommunicationResult | null> {
  try {
    const state = await fetchIntakeOperatingMode();
    if (state.mode === "FULL") return null;
  } catch {
    // Fail closed — if we cannot read the mode, block the action.
  }
  return {
    success: false,
    provider,
    action,
    leadId: lead.leadId,
    timestamp: new Date().toISOString(),
    message: INTAKE_ACTIONS_DISABLED_MESSAGE,
    needsConfiguration: false,
    configHint:
      "Intake is in INGEST_ONLY mode. Ingestion continues, but outbound actions are blocked until an admin enables Full mode.",
  };
}

export async function callParent(lead: LeadCommunicationContext): Promise<CommunicationResult> {
  const blocked = await previewOnlyIfDisabled("call", "jivetel", lead);
  if (blocked) return blocked;
  const ctm = isCTMConfigured() ? await trackCallViaCTM(lead) : null;
  return callViaJivetel(lead, ctm?.trackingContext);
}

export async function sendLeadSms(
  lead: LeadCommunicationContext,
  templateKey: SmsTemplateKey = "general-follow-up",
): Promise<CommunicationResult> {
  const blocked = await previewOnlyIfDisabled("sms", "mailchimp-sms", lead);
  if (blocked) return blocked;
  return sendSmsViaMailchimp(lead, templateKey);
}

export async function sendLeadEmail(
  lead: LeadCommunicationContext,
  templateKey: EmailTemplateKey = "general-follow-up",
): Promise<CommunicationResult> {
  const blocked = await previewOnlyIfDisabled("email", "mailchimp-email", lead);
  if (blocked) return blocked;
  return sendEmailViaMailchimp(lead, templateKey);
}

export async function sendIntakePacket(lead: LeadCommunicationContext): Promise<CommunicationResult> {
  const blocked = await previewOnlyIfDisabled("intake-packet", "mailchimp-email", lead);
  if (blocked) return blocked;
  return sendEmailViaMailchimp(lead, "intake-packet");
}

export async function sendMissingInfoReminder(lead: LeadCommunicationContext): Promise<CommunicationResult> {
  const blocked = await previewOnlyIfDisabled(
    "missing-info-reminder",
    isMailchimpSmsConfigured() ? "mailchimp-sms" : "mailchimp-email",
    lead,
  );
  if (blocked) return blocked;
  // Prefer SMS; fall back to email if SMS not configured.
  if (isMailchimpSmsConfigured()) {
    return sendSmsViaMailchimp(lead, "missing-info-reminder");
  }
  return sendEmailViaMailchimp(lead, "missing-info-reminder");
}

export async function sendVobUpdate(lead: LeadCommunicationContext): Promise<CommunicationResult> {
  const blocked = await previewOnlyIfDisabled("vob-update", "mailchimp-email", lead);
  if (blocked) return blocked;
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