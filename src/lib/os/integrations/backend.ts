/**
 * Blossom OS — Integrations backend client helpers.
 *
 * Thin, safe read helpers over the integration backend tables. The browser
 * NEVER sees raw API keys, OAuth tokens, or webhook secrets — only masked
 * metadata, status, and event/sync history surfaces.
 *
 * Mutations (test, sync, OAuth start/callback, webhook ingest) go through
 * Edge Functions; this module only exposes invoke helpers for them.
 */

import { supabase } from "@/integrations/supabase/client";

export interface IntegrationCatalogRow {
  id: string;
  display_name: string;
  category: string;
  owner_department: string | null;
  criticality: string;
  methods: string[];
  status: string;
  source_of_truth_for: string[];
  dependent_modules: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationConnectionRow {
  id: string;
  integration_id: string;
  connection_type: string;
  environment: string;
  status: string;
  enabled: boolean;
  credential_mode: string;
  secret_names: string[];
  masked_account: string | null;
  config: Record<string, unknown>;
  last_tested_at: string | null;
  last_success_at: string | null;
  last_error_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationSyncRunRow {
  id: string;
  integration_id: string;
  connection_id: string | null;
  run_type: string;
  direction: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  records_received: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
}

export interface IntegrationWebhookEventRow {
  id: string;
  integration_id: string;
  provider_event_id: string | null;
  event_type: string | null;
  verification_status: string;
  received_at: string;
  processed_at: string | null;
  processing_status: string;
  error_message: string | null;
}

export interface OAuthConnectionRow {
  id: string;
  integration_id: string;
  user_id: string;
  provider_email: string | null;
  display_name: string | null;
  scopes: string[];
  status: string;
  expires_at: string | null;
  last_connected_at: string | null;
  last_error: string | null;
}

// Tables created in the 2026-06-19 integrations backend foundation migration
// may not yet be present in the regenerated Database types. Cast through
// `any` here so callers stay strongly typed.
const db = supabase as unknown as ReturnType<typeof anyClient>;
function anyClient() {
  return supabase as any;
}

export async function listIntegrationCatalog(): Promise<IntegrationCatalogRow[]> {
  const { data, error } = await (db as any).from("integration_catalog").select("*").order("display_name");
  if (error) {
    console.warn("[integrations] catalog load failed", error.message);
    return [];
  }
  return (data ?? []) as IntegrationCatalogRow[];
}

export async function listIntegrationConnections(
  integrationId?: string,
): Promise<IntegrationConnectionRow[]> {
  let q = (db as any).from("integration_connections").select("*");
  if (integrationId) q = q.eq("integration_id", integrationId);
  const { data, error } = await q.order("updated_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as IntegrationConnectionRow[];
}

export async function listIntegrationSyncRuns(
  integrationId?: string,
  limit = 25,
): Promise<IntegrationSyncRunRow[]> {
  let q = (db as any).from("integration_sync_runs").select("*").order("started_at", { ascending: false }).limit(limit);
  if (integrationId) q = q.eq("integration_id", integrationId);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as IntegrationSyncRunRow[];
}

export async function listIntegrationWebhookEvents(
  integrationId?: string,
  limit = 25,
): Promise<IntegrationWebhookEventRow[]> {
  let q = (db as any).from("integration_webhook_events")
    .select("id, integration_id, provider_event_id, event_type, verification_status, received_at, processed_at, processing_status, error_message")
    .order("received_at", { ascending: false })
    .limit(limit);
  if (integrationId) q = q.eq("integration_id", integrationId);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as IntegrationWebhookEventRow[];
}

export async function listUserOAuthConnections(userId?: string): Promise<OAuthConnectionRow[]> {
  let q = (db as any).from("integration_oauth_connections").select(
    "id, integration_id, user_id, provider_email, display_name, scopes, status, expires_at, last_connected_at, last_error",
  );
  if (userId) q = q.eq("user_id", userId);
  const { data, error } = await q.order("last_connected_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as OAuthConnectionRow[];
}

export interface TestConnectionResult {
  ok: boolean;
  integrationId: string;
  status: string;
  message: string;
  details?: Record<string, unknown>;
}

export async function testIntegrationConnection(
  integrationId: string,
  connectionId?: string,
): Promise<TestConnectionResult> {
  const { data, error } = await (supabase as any).functions.invoke("integration-test-connection", {
    body: { integrationId, connectionId },
  });
  if (error) {
    return {
      ok: false,
      integrationId,
      status: "error",
      message: error.message ?? "Test failed",
    };
  }
  return data as TestConnectionResult;
}

export async function runIntegrationSync(
  integrationId: string,
  connectionId?: string,
): Promise<{ ok: boolean; runId?: string; message?: string }> {
  const { data, error } = await (supabase as any).functions.invoke("integration-run-sync", {
    body: { integrationId, connectionId },
  });
  if (error) return { ok: false, message: error.message };
  return data as { ok: boolean; runId?: string; message?: string };
}

export async function probeOutlookConnection(): Promise<{
  ok: boolean;
  status?: string;
  provider_email?: string;
  display_name?: string;
  scopes?: string[];
  expires_at?: string | null;
  error?: string;
}> {
  const { data, error } = await (supabase as any).functions.invoke("microsoft-graph-probe", { body: {} });
  if (error) return { ok: false, error: error.message };
  return data as any;
}

export async function startOutlookOAuth(): Promise<{ url?: string; error?: string }> {
  const { data, error } = await (supabase as any).functions.invoke("microsoft-oauth-start", { body: {} });
  if (error) return { error: error.message };
  return data as any;
}