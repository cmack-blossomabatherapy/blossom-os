import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  LeadSourceEvent,
  LeadSourceEventStatus,
} from "@/lib/leads/leadSourceEvents";
import {
  buildInsertRow,
  mapRowToEvent,
  type MarketingSourceEventRow,
} from "@/lib/marketing/sourceEventMapper";

/**
 * Live-subscribing hook over `marketing_source_events`. This is the single
 * production data source for Marketing's Lead Source Inbox — the old
 * in-memory `leadSourceEventsStore` is no longer consulted by production
 * pages.
 */
export interface UseMarketingSourceEventsResult {
  events: LeadSourceEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  insertEvent: (input: Parameters<typeof buildInsertRow>[0]) => Promise<void>;
  updateStatus: (
    id: string,
    status: LeadSourceEventStatus,
    patch?: { lead_id?: string | null; campaign_id?: string | null; source_id?: string | null },
  ) => Promise<void>;
  linkLead: (id: string, leadId: string, status: LeadSourceEventStatus) => Promise<void>;
  ignoreEvent: (id: string) => Promise<void>;
  markReview: (id: string) => Promise<void>;
  updateFields: (
    id: string,
    patch: {
      campaign_id?: string | null;
      source_id?: string | null;
      caller_name?: string | null;
      caller_phone?: string | null;
      caller_email?: string | null;
      state?: string | null;
      payload_summary?: string | null;
      assigned_to?: string | null;
      assigned_at?: string | null;
    },
  ) => Promise<void>;
  assignOwner: (id: string, userId: string | null) => Promise<void>;
}

export function useMarketingSourceEvents(
  { limit = 500 }: { limit?: number } = {},
): UseMarketingSourceEventsResult {
  const [events, setEvents] = useState<LeadSourceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("marketing_source_events")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(limit);
    if (err) setError(err.message);
    setEvents(((data ?? []) as MarketingSourceEventRow[]).map(mapRowToEvent));
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("marketing-source-events-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "marketing_source_events" },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const updateStatus = useCallback<UseMarketingSourceEventsResult["updateStatus"]>(
    async (id, status, patch = {}) => {
      const { data: userRes } = await supabase.auth.getUser();
      const nowIso = new Date().toISOString();
      const update: Record<string, unknown> = {
        status,
        reviewed_by: userRes?.user?.id ?? null,
        reviewed_at: nowIso,
      };
      if ("lead_id" in patch) update.lead_id = patch.lead_id ?? null;
      if ("campaign_id" in patch) update.campaign_id = patch.campaign_id ?? null;
      if ("source_id" in patch) update.source_id = patch.source_id ?? null;
      const { error: err } = await supabase
        .from("marketing_source_events")
        .update(update as never)
        .eq("id", id);
      if (err) throw err;
      await load();
    },
    [load],
  );

  const linkLead = useCallback<UseMarketingSourceEventsResult["linkLead"]>(
    (id, leadId, status) => updateStatus(id, status, { lead_id: leadId }),
    [updateStatus],
  );
  const ignoreEvent = useCallback<UseMarketingSourceEventsResult["ignoreEvent"]>(
    (id) => updateStatus(id, "ignored"),
    [updateStatus],
  );
  const markReview = useCallback<UseMarketingSourceEventsResult["markReview"]>(
    (id) => updateStatus(id, "needs_review"),
    [updateStatus],
  );

  const updateFields = useCallback<UseMarketingSourceEventsResult["updateFields"]>(
    async (id, patch) => {
      const { error: err } = await supabase
        .from("marketing_source_events")
        .update(patch as never)
        .eq("id", id);
      if (err) throw err;
      await load();
    },
    [load],
  );

  const assignOwner = useCallback<UseMarketingSourceEventsResult["assignOwner"]>(
    async (id, userId) => {
      const { error: err } = await supabase
        .from("marketing_source_events")
        .update({
          assigned_to: userId,
          assigned_at: userId ? new Date().toISOString() : null,
        } as never)
        .eq("id", id);
      if (err) throw err;
      await load();
    },
    [load],
  );

  const insertEvent = useCallback<UseMarketingSourceEventsResult["insertEvent"]>(
    async (input) => {
      const { data: userRes } = await supabase.auth.getUser();
      const row = buildInsertRow({ ...input, reviewedBy: userRes?.user?.id ?? null });
      const { error: err } = await supabase
        .from("marketing_source_events")
        .insert([row] as never);
      if (err) throw err;
      await load();
    },
    [load],
  );

  return {
    events,
    loading,
    error,
    refetch: load,
    insertEvent,
    updateStatus,
    linkLead,
    ignoreEvent,
    markReview,
    updateFields,
    assignOwner,
  };
}