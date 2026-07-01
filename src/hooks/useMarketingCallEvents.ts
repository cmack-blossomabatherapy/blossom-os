import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type MarketingCallEventRow =
  Database["public"]["Tables"]["marketing_call_events"]["Row"];
export type MarketingCallEventInsert =
  Database["public"]["Tables"]["marketing_call_events"]["Insert"];
export type MarketingCallEventUpdate =
  Database["public"]["Tables"]["marketing_call_events"]["Update"];

export const CALL_CATEGORIES = [
  "intake",
  "recruiting",
  "referral",
  "existing_patient",
  "billing",
  "unknown",
] as const;
export type CallCategory = (typeof CALL_CATEGORIES)[number];

export const CALL_DISPOSITIONS = [
  "connected",
  "missed",
  "voicemail",
  "callback_needed",
  "converted_to_lead",
  "attached_to_lead",
  "not_qualified",
  "spam",
  "resolved",
] as const;
export type CallDisposition = (typeof CALL_DISPOSITIONS)[number];

export type CallDirection = "inbound" | "outbound" | "unknown";

export interface UseMarketingCallEventsResult {
  calls: MarketingCallEventRow[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateCallEvent: (id: string, patch: MarketingCallEventUpdate) => Promise<void>;
  setDisposition: (id: string, disposition: CallDisposition) => Promise<void>;
  setCategory: (id: string, category: CallCategory) => Promise<void>;
  setDirection: (id: string, direction: CallDirection) => Promise<void>;
  assignOwner: (id: string, ownerId: string | null) => Promise<void>;
  markReviewed: (id: string, reviewed?: boolean) => Promise<void>;
  linkLead: (id: string, leadId: string | null) => Promise<void>;
  createManualCallEvent: (row: MarketingCallEventInsert) => Promise<MarketingCallEventRow | null>;
  bulkImportCallEvents: (rows: MarketingCallEventInsert[]) => Promise<number>;
}

/**
 * Operating hook for `marketing_call_events`. Provides direct CRUD +
 * workflow helpers so Marketing can classify calls, assign owners,
 * link leads, and import bulk rows without leaving the page.
 */
export function useMarketingCallEvents(
  { limit = 500 }: { limit?: number } = {},
): UseMarketingCallEventsResult {
  const [calls, setCalls] = useState<MarketingCallEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelId = useMemo(
    () =>
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("marketing_call_events")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(limit);
    if (err) setError(err.message);
    setCalls((data ?? []) as MarketingCallEventRow[]);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    void load();
    const ch = supabase
      .channel(`marketing-call-events-live-${channelId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "marketing_call_events" },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [load, channelId]);

  const updateCallEvent = useCallback<UseMarketingCallEventsResult["updateCallEvent"]>(
    async (id, patch) => {
      const { error: err } = await supabase
        .from("marketing_call_events")
        .update(patch as never)
        .eq("id", id);
      if (err) {
        toast.error(err.message);
        throw err;
      }
      await load();
    },
    [load],
  );

  const setDisposition = useCallback<UseMarketingCallEventsResult["setDisposition"]>(
    (id, disposition) => updateCallEvent(id, { disposition }),
    [updateCallEvent],
  );
  const setCategory = useCallback<UseMarketingCallEventsResult["setCategory"]>(
    (id, category) => updateCallEvent(id, { call_category: category }),
    [updateCallEvent],
  );
  const setDirection = useCallback<UseMarketingCallEventsResult["setDirection"]>(
    (id, direction) => updateCallEvent(id, { direction }),
    [updateCallEvent],
  );
  const assignOwner = useCallback<UseMarketingCallEventsResult["assignOwner"]>(
    (id, ownerId) => updateCallEvent(id, { assigned_owner_id: ownerId }),
    [updateCallEvent],
  );
  const linkLead = useCallback<UseMarketingCallEventsResult["linkLead"]>(
    (id, leadId) => updateCallEvent(id, { lead_id: leadId }),
    [updateCallEvent],
  );

  const markReviewed = useCallback<UseMarketingCallEventsResult["markReviewed"]>(
    async (id, reviewed = true) => {
      const { data: userRes } = await supabase.auth.getUser();
      await updateCallEvent(id, {
        reviewed_at: reviewed ? new Date().toISOString() : null,
        reviewed_by: reviewed ? userRes?.user?.id ?? null : null,
      });
    },
    [updateCallEvent],
  );

  const createManualCallEvent = useCallback<
    UseMarketingCallEventsResult["createManualCallEvent"]
  >(
    async (row) => {
      const insertRow: MarketingCallEventInsert = {
        source_system: row.source_system ?? "manual",
        occurred_at: row.occurred_at ?? new Date().toISOString(),
        ...row,
      };
      const { data, error: err } = await supabase
        .from("marketing_call_events")
        .insert([insertRow as never])
        .select("*")
        .single();
      if (err) {
        toast.error(err.message);
        throw err;
      }
      await load();
      return (data as MarketingCallEventRow) ?? null;
    },
    [load],
  );

  const bulkImportCallEvents = useCallback<
    UseMarketingCallEventsResult["bulkImportCallEvents"]
  >(
    async (rows) => {
      if (!rows.length) return 0;
      let inserted = 0;
      const CHUNK = 250;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK);
        const { data, error: err } = await supabase
          .from("marketing_call_events")
          .insert(slice as never)
          .select("id");
        if (err) {
          toast.error(err.message);
          throw err;
        }
        inserted += (data ?? []).length;
      }
      await load();
      return inserted;
    },
    [load],
  );

  return {
    calls,
    loading,
    error,
    refetch: load,
    updateCallEvent,
    setDisposition,
    setCategory,
    setDirection,
    assignOwner,
    markReviewed,
    linkLead,
    createManualCallEvent,
    bulkImportCallEvents,
  };
}