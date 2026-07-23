/**
 * CTM (CallTrackingMetrics) adapter — Intake call attribution context.
 *
 * CTM is inbound attribution here (webhook + backfill sync), not an
 * outbound dialer. Readiness is derived from the live backend
 * `ctm_sync_runs` table via `integration-test-connection`, not a VITE
 * environment flag. The synchronous helper `isCTMConfigured()` is kept
 * for legacy call sites, but always returns `false` — the truthful check
 * is the async `checkCTMReadiness()`.
 */
import { supabase } from "@/integrations/supabase/client";
import type { LeadCommunicationContext } from "./communicationTypes";

export interface CTMReadiness {
  ready: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
  message: string;
}

export async function checkCTMReadiness(): Promise<CTMReadiness> {
  const { data, error } = await supabase
    .from("ctm_sync_runs")
    .select("status,finished_at,error")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    return { ready: false, lastSyncAt: null, lastError: error.message, message: "CTM status unavailable" };
  }
  if (!data) {
    return {
      ready: false,
      lastSyncAt: null,
      lastError: null,
      message: "No CTM sync has run yet — waiting on first ingestion.",
    };
  }
  const ready = data.status === "ok" || data.status === "partial";
  return {
    ready,
    lastSyncAt: (data.finished_at as string | null) ?? null,
    lastError: (data.error as string | null) ?? null,
    message: ready ? "CTM ingestion healthy" : `CTM last run status: ${data.status ?? "unknown"}`,
  };
}

/** @deprecated Kept for legacy sync callers; use checkCTMReadiness() instead. */
export function isCTMConfigured(): boolean {
  return false;
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
  const readiness = await checkCTMReadiness();
  if (!readiness.ready) {
    return { ok: false, message: readiness.message };
  }
  return {
    ok: true,
    trackingContext: { source: "intake", leadId: lead.leadId },
    message: "CTM tracking context attached.",
  };
}