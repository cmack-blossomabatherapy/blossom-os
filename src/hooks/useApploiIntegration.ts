import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notifyApploiNotConnected } from "@/lib/recruiting/apploi";

/**
 * Honest Apploi integration readiness.
 *
 * We never put Apploi API secrets in the frontend. This hook reads the
 * platform integration tables (integration_catalog / integration_connections /
 * integration_sync_runs) to determine whether the "apploi" provider is wired
 * up. If it is not, callers must show the not-connected message.
 */
export type ApploiStatus = "connected" | "not_configured" | "loading";

export interface ApploiIntegrationState {
  status: ApploiStatus;
  lastSyncAt: string | null;
  refetch: () => Promise<void>;
}

export function useApploiIntegrationStatus(): ApploiIntegrationState {
  const [status, setStatus] = useState<ApploiStatus>("loading");
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const integrationId = await findApploiIntegrationId();
      if (!integrationId) { setStatus("not_configured"); setLastSyncAt(null); return; }
      const { data: conn } = await supabase
        .from("integration_connections")
        .select("id,status,enabled")
        .eq("integration_id", integrationId)
        .maybeSingle();
      const isConnected = !!conn && (conn as any).status === "connected" && (conn as any).enabled !== false;
      setStatus(isConnected ? "connected" : "not_configured");
      if (isConnected) {
        const { data: run } = await supabase
          .from("integration_sync_runs")
          .select("completed_at,started_at")
          .eq("connection_id", (conn as any).id)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setLastSyncAt((run as any)?.completed_at ?? (run as any)?.started_at ?? null);
      } else {
        setLastSyncAt(null);
      }
    } catch (e) {
      console.warn("apploi status check failed", e);
      setStatus("not_configured");
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { status, lastSyncAt, refetch };
}

export interface ApploiNormalizedCandidate {
  external_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  state: string | null;
  city: string | null;
  applied_date: string | null;
  external_status: string | null;
  recruiter: string | null;
  next_action: string | null;
  profile_url: string | null;
  raw: unknown;
}

export function useApploiNormalizedCandidates() {
  const [items, setItems] = useState<ApploiNormalizedCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const integrationId = await findApploiIntegrationId();
      if (!integrationId) { setItems([]); return; }
      const { data } = await supabase
        .from("integration_normalized_records")
        .select("*")
        .eq("integration_id", integrationId)
        .eq("record_kind", "candidate");
      const mapped = (data ?? []).map((r: any): ApploiNormalizedCandidate => {
        const p = (r.metadata ?? {}) as Record<string, unknown>;
        const s = (v: unknown) => (typeof v === "string" ? v : null);
        return {
          external_id: String(r.provider_record_id ?? p.id ?? ""),
          first_name: s(p.first_name),
          last_name: s(p.last_name),
          email: s(p.email) ?? s(r.person_email),
          phone: s(p.phone) ?? s(r.person_phone),
          role: s(p.role),
          state: s(p.state),
          city: s(p.city),
          applied_date: s(p.applied_date),
          external_status: s(p.external_status),
          recruiter: s(p.recruiter),
          next_action: s(p.next_action),
          profile_url: s(p.profile_url) ?? s(r.external_url),
          raw: r,
        };
      });
      setItems(mapped);
    } catch (e) {
      console.warn("apploi normalized records load failed", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { items, loading, refetch };
}

/**
 * Real Apploi import: maps normalized Apploi records into recruiting_candidates
 * via upsert. Honest empty/connection states. Never reaches any external API
 * directly from the browser.
 */
export async function importApploiNormalizedRecords(): Promise<{ imported: number; skipped: number } | null> {
  const integrationId = await findApploiIntegrationId();
  if (!integrationId) { notifyApploiNotConnected(); return null; }
  const { data: conn } = await supabase
    .from("integration_connections")
    .select("id,status,enabled")
    .eq("integration_id", integrationId)
    .maybeSingle();
  if (!conn || (conn as any).status !== "connected" || (conn as any).enabled === false) {
    notifyApploiNotConnected();
    return null;
  }
  const { data: records } = await supabase
    .from("integration_normalized_records")
    .select("*")
    .eq("integration_id", integrationId)
    .eq("record_kind", "candidate");
  if (!records || records.length === 0) {
    toast.info("No Apploi records available to import yet.");
    return { imported: 0, skipped: 0 };
  }
  let imported = 0; let skipped = 0;
  for (const r of records) {
    const p = ((r as any).metadata ?? {}) as Record<string, any>;
    const email = p.email ?? (r as any).person_email ?? null;
    const externalId = (r as any).provider_record_id ?? p.id ?? null;
    if (!p.first_name && !p.last_name && !email) { skipped++; continue; }
    const profileUrl = p.profile_url ?? (r as any).external_url ?? null;
    const row: Record<string, unknown> = {
      first_name: p.first_name ?? "(unknown)",
      last_name: p.last_name ?? "(unknown)",
      email,
      phone: p.phone ?? (r as any).person_phone ?? null,
      role: p.role ?? "Other",
      state: p.state ?? "Other",
      city: p.city ?? null,
      source: "Apploi",
      applied_date: p.applied_date ?? new Date().toISOString(),
      recruiter: p.recruiter ?? null,
      next_action: p.next_action ?? null,
      tags: externalId ? [`apploi:${externalId}`] : null,
      pipeline_stage: "New Applicant",
      external_provider: "apploi",
      external_candidate_id: externalId ? String(externalId) : null,
      external_profile_url: profileUrl,
      external_synced_at: new Date().toISOString(),
      external_payload: p as any,
    };
    // Safe lookup by durable Apploi identity, then update-or-insert.
    // Never fall back to email/id-based upsert — email is not a durable
    // external identity and two Apploi people may share/lack email.
    let action: "insert" | "update" | "skip" = "insert";
    let existingId: string | null = null;
    if (externalId) {
      const { data: existing } = await supabase
        .from("recruiting_candidates")
        .select("id")
        .eq("external_provider" as any, "apploi")
        .eq("external_candidate_id" as any, String(externalId))
        .maybeSingle();
      if ((existing as any)?.id) {
        existingId = (existing as any).id as string;
        action = "update";
      }
    } else {
      // No durable Apploi id — do NOT blindly merge by email. Insert as a
      // fresh candidate flagged for import review so ops can reconcile.
      (row as any).next_action = (row as any).next_action ?? "Apploi import review — no external id";
    }
    let err: unknown = null;
    if (action === "update" && existingId) {
      const { error } = await supabase
        .from("recruiting_candidates")
        .update(row as any)
        .eq("id", existingId);
      err = error;
    } else {
      const { error } = await supabase
        .from("recruiting_candidates")
        .insert(row as any);
      err = error;
    }
    if (err) { console.warn("apploi import failed", err); skipped++; }
    else {
      imported++;
      try {
        await supabase.from("recruiting_activity_events").insert({
          entity_table: "recruiting_candidates",
          event_type: action === "update" ? "apploi_updated" : "apploi_imported",
          to_value: String(externalId ?? email ?? ""),
        } as any);
      } catch { /* best effort */ }
    }
  }
  toast.success(`Apploi import: ${imported} imported, ${skipped} skipped`);
  return { imported, skipped };
}

// Deterministic Apploi lookup: integration_catalog seeds Apploi as id = 'apploi'.
// Avoid fuzzy display-name matching, which can return the wrong row.
async function findApploiIntegrationId(): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("integration_catalog")
      .select("id")
      .eq("id", "apploi")
      .maybeSingle();
    return (data as any)?.id ?? null;
  } catch {
    return null;
  }
}