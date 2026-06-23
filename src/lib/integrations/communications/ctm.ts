/**
 * CTM (CallTrackingMetrics) adapter — Intake call attribution context.
 * Real implementation will read account ID / API key from admin integration
 * config. For now this is a stub that reports configuration state honestly.
 */
import type { LeadCommunicationContext } from "./communicationTypes";

export function isCTMConfigured(): boolean {
  // Wired via admin integration UI later; check env / window flag.
  const envFlag = (import.meta as unknown as { env?: Record<string, string> }).env;
  return Boolean(envFlag?.VITE_CTM_ACCOUNT_ID);
}

export interface CTMTrackingContext {
  source: "intake";
  leadId: string;
  trackingNumber?: string;
  trackingSession?: string;
}

export async function trackCallViaCTM(lead: LeadCommunicationContext): Promise<{
  ok: boolean;
  trackingContext?: CTMTrackingContext;
  message: string;
}> {
  if (!isCTMConfigured()) {
    return { ok: false, message: "CTM not configured. Admin can set Account ID + API key in Integrations." };
  }
  return {
    ok: true,
    trackingContext: { source: "intake", leadId: lead.leadId },
    message: "CTM tracking context attached.",
  };
}