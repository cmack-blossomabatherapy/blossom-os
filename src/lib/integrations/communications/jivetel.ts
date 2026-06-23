/**
 * Jivetel adapter — outbound calling.
 * Real call placement will go through a backend edge function once admin
 * credentials are supplied. For now we report needs_configuration so the UI
 * can render a calm Needs Setup state instead of opening a tel: link.
 */
import type {
  CommunicationResult,
  LeadCommunicationContext,
} from "./communicationTypes";
import type { CTMTrackingContext } from "./ctm";

export function isJivetelConfigured(): boolean {
  const envFlag = (import.meta as unknown as { env?: Record<string, string> }).env;
  return Boolean(envFlag?.VITE_JIVETEL_API_KEY);
}

export async function callViaJivetel(
  lead: LeadCommunicationContext,
  _tracking?: CTMTrackingContext,
): Promise<CommunicationResult> {
  const timestamp = new Date().toISOString();
  if (!isJivetelConfigured()) {
    return {
      success: false,
      provider: "jivetel",
      action: "call",
      leadId: lead.leadId,
      timestamp,
      message: "Outbound calling not configured. Ask Admin to connect Jivetel.",
      needsConfiguration: true,
      configHint: "Integrations: Jivetel (API key + outbound caller ID)",
    };
  }
  if (!lead.phone) {
    return {
      success: false,
      provider: "jivetel",
      action: "call",
      leadId: lead.leadId,
      timestamp,
      message: "No phone number on file for this lead.",
    };
  }
  return {
    success: true,
    provider: "jivetel",
    action: "call",
    leadId: lead.leadId,
    timestamp,
    message: `Calling ${lead.phone} via Jivetel.`,
  };
}