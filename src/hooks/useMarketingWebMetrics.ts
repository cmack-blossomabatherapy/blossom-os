import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MarketingWebMetric {
  id: string;
  metric_date: string;
  source_system: string;
  page_path: string | null;
  query: string | null;
  state: string | null;
  campaign_id: string | null;
  sessions: number | null;
  users: number | null;
  clicks: number | null;
  impressions: number | null;
  conversions: number | null;
  spend: number | null;
  raw_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UseMarketingWebMetricsOptions {
  limit?: number;
  sourceSystem?: string;
  dateFrom?: string;
  dateTo?: string;
  state?: string;
  campaignId?: string;
  pagePath?: string;
  query?: string;
  realtime?: boolean;
}

export function useMarketingWebMetrics(opts: UseMarketingWebMetricsOptions = {}) {
  const {
    limit = 500,
    sourceSystem,
    dateFrom,
    dateTo,
    state,
    campaignId,
    pagePath,
    query,
    realtime = false,
  } = opts;
  const [rows, setRows] = useState<MarketingWebMetric[]>([]);
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
      .from("marketing_web_metrics" as never)
      .select("*")
      .order("metric_date", { ascending: false })
      .limit(limit);
    if (sourceSystem) q = q.eq("source_system", sourceSystem);
    if (state) q = q.eq("state", state);
    if (campaignId) q = q.eq("campaign_id", campaignId);
    if (pagePath) q = q.eq("page_path", pagePath);
    if (query) q = q.eq("query", query);
    if (dateFrom) q = q.gte("metric_date", dateFrom);
    if (dateTo) q = q.lte("metric_date", dateTo);
    const { data, error: err } = await q;
    if (err) setError(err.message);
    setRows(((data as unknown) as MarketingWebMetric[]) ?? []);
    setLoading(false);
  }, [limit, sourceSystem, dateFrom, dateTo, state, campaignId, pagePath, query]);

  useEffect(() => {
    void load();
    if (!realtime) return;
    const ch = supabase
      .channel(`mwm-${sourceSystem ?? "all"}-${channelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "marketing_web_metrics" }, () => {
        void load();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [load, realtime, sourceSystem, channelId]);

  return { rows, loading, error, refetch: load, refresh: load };
}
