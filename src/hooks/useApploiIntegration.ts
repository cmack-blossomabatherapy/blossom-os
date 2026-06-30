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
      const { data: conn } = await supabase
        .from("integration_connections")
        .select("id,status,provider")
        .eq("provider", "apploi")
        .maybeSingle();
      const isConnected = !!conn && (conn as any).status === "connected";
      setStatus(isConnected ? "connected" : "not_configured");
      if (isConnected) {
        const { data: run } = await supabase
          .from("integration_sync_runs")
          .select("finished_at,started_at")
          .eq("connection_id", (conn as any).id)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setLastSyncAt((run as any)?.finished_at ?? (run as any)?.started_at ?? null);
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
      const { data } = await supabase
        .from("integration_normalized_records")
        .select("*")
        .eq("provider", "apploi")
        .eq("entity_type", "candidate");
      const mapped = (data ?? []).map((r: any): ApploiNormalizedCandidate => {
        const p = (r.normalized_payload ?? {}) as Record<string, unknown>;
        const s = (v: unknown) => (typeof v === "string" ? v : null);
        return {
          external_id: String(r.external_id ?? p.id ?? ""),
          first_name: s(p.first_name),
          last_name: s(p.last_name),
          email: s(p.email),
          phone: s(p.phone),
          role: s(p.role),
          state: s(p.state),
          city: s(p.city),
          applied_date: s(p.applied_date),
          external_status: s(p.external_status),
          recruiter: s(p.recruiter),
          next_action: s(p.next_action),
          profile_url: s(p.profile_url),
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
  const { data: conn } = await supabase
    .from("integration_connections")
    .select("id,status,provider")
    .eq("provider", "apploi")
    .maybeSingle();
  if (!conn || (conn as any).status !== "connected") {
    notifyApploiNotConnected();
    return null;
  }
  const { data: records } = await supabase
    .from("integration_normalized_records")
    .select("*")
    .eq("provider", "apploi")
    .eq("entity_type", "candidate");
  if (!records || records.length === 0) {
    toast.info("No Apploi records available to import yet.");
    return { imported: 0, skipped: 0 };
  }
  let imported = 0; let skipped = 0;
  for (const r of records) {
    const p = ((r as any).normalized_payload ?? {}) as Record<string, any>;
    const email = p.email ?? null;
    const externalId = (r as any).external_id ?? p.id ?? null;
    if (!p.first_name && !p.last_name && !email) { skipped++; continue; }
    const row: Record<string, unknown> = {
      first_name: p.first_name ?? "(unknown)",
      last_name: p.last_name ?? "(unknown)",
      email,
      phone: p.phone ?? null,
      role: p.role ?? "Other",
      state: p.state ?? "Other",
      city: p.city ?? null,
      source: "Apploi",
      applied_date: p.applied_date ?? new Date().toISOString(),
      recruiter: p.recruiter ?? null,
      next_action: p.next_action ?? null,
      tags: externalId ? [`apploi:${externalId}`] : null,
      pipeline_stage: "New Applicant",
    };
    const { error } = await supabase
      .from("recruiting_candidates")
      .upsert(row as any, { onConflict: email ? "email" : "id" });
    if (error) { console.warn("apploi upsert failed", error); skipped++; }
    else {
      imported++;
      try {
        await supabase.from("recruiting_activity_events").insert({
          entity_table: "recruiting_candidates",
          event_type: "apploi_imported",
          to_value: String(externalId ?? email ?? ""),
        } as any);
      } catch { /* best effort */ }
    }
  }
  toast.success(`Apploi import: ${imported} imported, ${skipped} skipped`);
  return { imported, skipped };
}