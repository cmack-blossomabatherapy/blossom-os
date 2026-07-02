import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notifyApploiNotConnected } from "@/lib/recruiting/apploi";
import {
  resolveApploiIdentity,
  describeIdentitySource,
  type ApploiIdentitySource,
} from "@/lib/recruiting/apploiNormalizedIdentity";

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
        // Preview uses the same resolver as the importer so what ops
        // see is exactly what will be keyed on during ingestion.
        const identity = resolveApploiIdentity(r);
        return {
          external_id: identity.externalId ?? "",
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
    // Centralized durable-identity resolver — see
    // src/lib/recruiting/apploiNormalizedIdentity.ts for resolution order.
    const identity = resolveApploiIdentity(r as any);
    const externalId = identity.externalId;
    const externalIdSource: ApploiIdentitySource = identity.source;
    const normalizedRecordId = (r as any).id ? String((r as any).id) : null;
    // No provider id AND no normalized-record id — nothing durable to key on.
    // Skip and record a review event so ops can reconcile without duplicating.
    if (!externalId) {
      skipped++;
      try {
        await supabase.from("recruiting_activity_events").insert({
          entity_table: "recruiting_candidates",
          event_type: "apploi_import_skipped",
          to_value: String(email ?? ""),
          payload: {
            reason: "no_durable_external_id",
            reason_detail: describeIdentitySource(externalIdSource),
            normalized_record_id: normalizedRecordId,
            email,
            profile_url: p.profile_url ?? null,
          } as any,
        } as any);
      } catch { /* best effort */ }
      continue;
    }
    if (!p.first_name && !p.last_name && !email) { skipped++; continue; }
    const profileUrl = p.profile_url ?? (r as any).external_url ?? null;
    // Safe lookup by durable Apploi identity, then update-or-insert.
    // Never fall back to email/id-based upsert — email is not a durable
    // external identity and two Apploi people may share/lack email.
    let action: "insert" | "update" | "skip" = "insert";
    let existingId: string | null = null;
    {
      const q = supabase.from("recruiting_candidates").select("id,tags") as any;
      const { data: existing } = await q
        .eq("external_provider", "apploi")
        .eq("external_candidate_id", externalId)
        .maybeSingle();
      if ((existing as any)?.id) {
        existingId = (existing as any).id as string;
        action = "update";
      }
    }

    // Build safe profile-only update payload. For existing candidates we must
    // NOT reset pipeline_stage, stage_entered_at, recruiter, next_action, or
    // notes — otherwise a routine re-sync would clobber real recruiter work.
    const nowIso = new Date().toISOString();
    const safeProfilePatch: Record<string, unknown> = {
      first_name: p.first_name ?? "(unknown)",
      last_name: p.last_name ?? "(unknown)",
      email,
      phone: p.phone ?? (r as any).person_phone ?? null,
      role: p.role ?? "Other",
      state: p.state ?? "Other",
      city: p.city ?? null,
      source: "Apploi",
      external_provider: "apploi",
      external_candidate_id: externalId,
      external_profile_url: profileUrl,
      external_synced_at: nowIso,
      external_payload: p as any,
    };

    let err: unknown = null;
    let finalCandidateId: string | null = existingId;
    if (action === "update" && existingId) {
      // Merge tags rather than overwrite so the apploi:<id> marker persists
      // alongside any recruiter-added tags.
      const priorTagsRaw = ((await supabase
        .from("recruiting_candidates")
        .select("tags")
        .eq("id", existingId)
        .maybeSingle()).data as any)?.tags;
      const priorTags: string[] = Array.isArray(priorTagsRaw) ? priorTagsRaw : [];
      const marker = `apploi:${externalId}`;
      const mergedTags = priorTags.includes(marker) ? priorTags : [...priorTags, marker];
      const { data: updated, error } = await supabase
        .from("recruiting_candidates")
        .update({ ...safeProfilePatch, tags: mergedTags } as any)
        .eq("id", existingId)
        .select("id")
        .maybeSingle();
      err = error;
      finalCandidateId = (updated as any)?.id ?? existingId;
    } else {
      // New candidate: initial stage is allowed here (only on insert).
      const insertRow = {
        ...safeProfilePatch,
        applied_date: p.applied_date ?? nowIso,
        recruiter: p.recruiter ?? null,
        next_action: p.next_action ?? (
          externalIdSource === "normalized_record"
            ? "Apploi import review — no provider id"
            : externalIdSource === "metadata"
              ? `Apploi import — id resolved from metadata (${identity.metadataKey})`
              : null
        ),
        tags: [`apploi:${externalId}`],
        pipeline_stage: "New Applicant",
      };
      const { data: inserted, error } = await supabase
        .from("recruiting_candidates")
        .insert(insertRow as any)
        .select("id")
        .maybeSingle();
      err = error;
      finalCandidateId = (inserted as any)?.id ?? null;
      // Race-condition safety: if the unique index fires (concurrent import
      // just created the same external identity), fall back to update.
      if (err && !finalCandidateId) {
        const { data: raced } = await supabase
          .from("recruiting_candidates")
          .select("id")
          .eq("external_provider", "apploi")
          .eq("external_candidate_id", externalId)
          .maybeSingle();
        if ((raced as any)?.id) {
          const racedId = (raced as any).id as string;
          const { error: upErr } = await supabase
            .from("recruiting_candidates")
            .update(safeProfilePatch as any)
            .eq("id", racedId);
          if (!upErr) { err = null; finalCandidateId = racedId; action = "update"; }
        }
      }
    }
    if (err) { console.warn("apploi import failed", err); skipped++; }
    else {
      imported++;
      try {
        await supabase.from("recruiting_activity_events").insert({
          candidate_id: finalCandidateId,
          entity_table: "recruiting_candidates",
          entity_id: finalCandidateId,
          event_type: action === "update" ? "apploi_updated" : "apploi_imported",
          to_value: externalId,
          payload: {
            external_id: externalId,
            external_id_source: externalIdSource,
            external_id_source_label: describeIdentitySource(externalIdSource),
            metadata_key: identity.metadataKey ?? null,
            normalized_record_id: normalizedRecordId,
            profile_url: profileUrl,
            action,
          } as any,
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