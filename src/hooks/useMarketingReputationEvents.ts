import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MarketingReputationEvent {
  id: string;
  source_system: string;
  occurred_at: string;
  state: string | null;
  rating: number | null;
  reviewer_name: string | null;
  review_text: string | null;
  sentiment: string | null;
  response_status: string | null;
  linked_lead_id: string | null;
  raw_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UseMarketingReputationEventsOptions {
  limit?: number;
  sourceSystem?: string;
  dateFrom?: string;
  dateTo?: string;
  state?: string;
  rating?: number;
  sentiment?: string;
  responseStatus?: string;
  realtime?: boolean;
}

export function useMarketingReputationEvents(opts: UseMarketingReputationEventsOptions = {}) {
  const {
    limit = 200,
    sourceSystem,
    dateFrom,
    dateTo,
    state,
    rating,
    sentiment,
    responseStatus,
    realtime = false,
  } = opts;
  const [rows, setRows] = useState<MarketingReputationEvent[]>([]);
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
    let q = supabase
      .from("marketing_reputation_events" as never)
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(limit);
    if (sourceSystem) q = q.eq("source_system", sourceSystem);
    if (state) q = q.eq("state", state);
    if (rating != null) q = q.eq("rating", rating);
    if (sentiment) q = q.eq("sentiment", sentiment);
    if (responseStatus) q = q.eq("response_status", responseStatus);
    if (dateFrom) q = q.gte("occurred_at", dateFrom);
    if (dateTo) q = q.lte("occurred_at", dateTo);
    const { data, error: err } = await q;
    if (err) setError(err.message);
    setRows(((data as unknown) as MarketingReputationEvent[]) ?? []);
    setLoading(false);
  }, [limit, sourceSystem, dateFrom, dateTo, state, rating, sentiment, responseStatus]);

  useEffect(() => {
    void load();
    if (!realtime) return;
    const ch = supabase
      .channel(`mre-${sourceSystem ?? "all"}-${channelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "marketing_reputation_events" }, () => {
        void load();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [load, realtime, sourceSystem, channelId]);

  return { rows, loading, error, refetch: load, refresh: load };
}
