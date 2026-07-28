import type { AdapterContext, NormalizedRecordDraft } from "./types.ts";

/**
 * Upsert a normalized record into `integration_normalized_records`.
 * Falls back to plain insert when `providerRecordId` is absent so the
 * partial unique index is respected.
 */
export async function upsertNormalizedRecord(
  ctx: AdapterContext,
  integrationId: string,
  draft: NormalizedRecordDraft,
): Promise<{ ok: boolean; id?: string; action?: "insert" | "update"; error?: string }> {
  const row = {
    integration_id: integrationId,
    provider_record_id: draft.providerRecordId ?? null,
    record_kind: draft.recordKind,
    record_status: draft.recordStatus ?? null,
    display_title: draft.displayTitle ?? null,
    occurred_at: draft.occurredAt ?? null,
    person_email: draft.personEmail ?? null,
    person_phone: draft.personPhone ?? null,
    person_name: draft.personName ?? null,
    external_url: draft.externalUrl ?? null,
    source_label: draft.sourceLabel ?? null,
    metadata: draft.metadata ?? {},
    raw_event_id: ctx.rawEventId ?? null,
    sync_run_id: ctx.runId ?? null,
    updated_at: new Date().toISOString(),
  };

  if (draft.providerRecordId) {
    // The natural key is enforced by a PARTIAL unique index
    // (WHERE provider_record_id IS NOT NULL), which PostgREST cannot target
    // with ON CONFLICT. Resolve the row explicitly instead.
    const { data: existing } = await ctx.supabase
      .from("integration_normalized_records")
      .select("id")
      .eq("integration_id", integrationId)
      .eq("provider_record_id", draft.providerRecordId)
      .eq("record_kind", draft.recordKind)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await ctx.supabase
        .from("integration_normalized_records")
        .update(row)
        .eq("id", existing.id);
      if (error) return { ok: false, error: error.message };
      return { ok: true, id: existing.id, action: "update" };
    }

    const { data, error } = await ctx.supabase
      .from("integration_normalized_records")
      .insert(row)
      .select("id")
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id, action: "insert" };
  }

  const { data, error } = await ctx.supabase
    .from("integration_normalized_records")
    .insert(row)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data?.id, action: "insert" };
}

export async function recordIntegrationEvent(
  ctx: AdapterContext,
  integrationId: string,
  args: {
    eventType: string;
    title?: string | null;
    description?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  await ctx.supabase.from("integration_events").insert({
    integration_id: integrationId,
    source_event_id: ctx.rawEventId ?? null,
    event_type: args.eventType,
    title: args.title ?? `${integrationId}: ${args.eventType}`,
    description: args.description ?? null,
    metadata: args.metadata ?? {},
  });
}