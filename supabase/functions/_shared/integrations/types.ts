// Shared adapter types for Blossom OS integrations (Pass 4).
// Every required provider implements `ProviderAdapter`. Honest statuses
// only — adapters must NEVER fake success.

export type ProviderStatus =
  | "connected"
  | "webhook_ready"
  | "configured"
  | "configured_pending_probe"
  | "configured_pending_probe_path"
  | "configured_pending_vendor_endpoint"
  | "vendor_docs_required"
  | "needs_credentials"
  | "manual_local_setup"
  | "not_configured"
  | "error";

export type NormalizedKind =
  | "lead"
  | "call"
  | "candidate"
  | "document"
  | "calendar_event"
  | "eligibility"
  | "email_activity"
  | "email_marketing"
  | "phone"
  | "automation_event"
  | "clinical_client"
  | "clinical_schedule"
  | "authorization"
  | "clinical_session"
  | "billing_session"
  | "automation"
  | "clinical"
  | "unknown";

export interface ProviderProbeResult {
  ok: boolean;
  status: ProviderStatus | string;
  message: string;
  accountLabel?: string | null;
  details?: Record<string, unknown>;
}

export interface ProviderSyncResult {
  ok: boolean;
  status: "success" | "partial" | "failed";
  message: string;
  received?: number;
  created?: number;
  updated?: number;
  failed?: number;
  details?: Record<string, unknown>;
}

export interface NormalizedRecordDraft {
  providerRecordId?: string | null;
  recordKind: NormalizedKind;
  recordStatus?: string | null;
  displayTitle?: string | null;
  occurredAt?: string | null;
  personEmail?: string | null;
  personPhone?: string | null;
  personName?: string | null;
  externalUrl?: string | null;
  sourceLabel?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ProviderWebhookNormalizeResult {
  eventType?: string | null;
  providerEventId?: string | null;
  title?: string | null;
  description?: string | null;
  normalizedKind?: NormalizedKind;
  metadata: Record<string, unknown>;
  record?: NormalizedRecordDraft | null;
}

export interface SyncOptions {
  mode?: string;
  since?: string;
  limit?: number;
  dryRun?: boolean;
}

export interface AdapterContext {
  supabase: any; // service-role client
  runId?: string | null;
  rawEventId?: string | null;
}

export interface ProviderAdapter {
  id: string;
  /** Human-friendly tag, e.g. "migration_bridge", "esignature_only", "emr". */
  classification?: string;
  /** Required process secrets (Deno.env names). */
  requiredSecrets: string[];
  /** Optional env var names that gate probe/sync paths. */
  optionalSecrets?: string[];
  /** Webhook-only providers skip probe/sync API calls. */
  webhookOnly?: boolean;
  /** Honest capabilities matrix — see integrations readiness manifest. */
  capabilities?: {
    probe?: boolean;
    pullSync?: boolean;
    webhook?: boolean;
    oauth?: boolean;
    /** True when the integration is a local desktop/client tool and
     * cannot be probed/synced from the cloud (e.g. Go Integrator Nava). */
    localOnly?: boolean;
    /** True when outbound actions/writes are intentionally disabled. */
    outboundDisabled?: boolean;
    /** Public vendor documentation URL. */
    documentationUrl?: string;
    /** Free-form operational state, e.g. "manual_local_setup",
     * "configured_pending_vendor_endpoint", "not_cloud_testable". */
    operationalState?: string;
  };
  /** Lightweight live probe. Must be honest. */
  probe(ctx: AdapterContext): Promise<ProviderProbeResult>;
  /** Pull/staging sync. Returns honest counts; never `not_implemented`. */
  sync(ctx: AdapterContext, options: SyncOptions): Promise<ProviderSyncResult>;
  /** Normalize an inbound (already signature-verified) webhook payload. */
  normalizeWebhook(payload: unknown, headers: Record<string, string>): ProviderWebhookNormalizeResult;
}