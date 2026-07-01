import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type MarketingCampaignMetricRow =
  Database["public"]["Tables"]["marketing_campaign_metrics"]["Row"];
export type MarketingCampaignMetricInsert =
  Database["public"]["Tables"]["marketing_campaign_metrics"]["Insert"];

export interface CampaignMetricRollup {
  campaign_id: string;
  spend_cents: number;
  impressions: number;
  clicks: number;
  conversions: number;
  leads: number;
  costPerLeadCents: number | null;
  lastMetricDate: string | null;
}

export interface UseMarketingCampaignMetricsResult {
  metrics: MarketingCampaignMetricRow[];
  rollups: Map<string, CampaignMetricRollup>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  insertMetrics: (rows: MarketingCampaignMetricInsert[]) => Promise<number>;
}

export function useMarketingCampaignMetrics(
  campaignIds?: string[],
): UseMarketingCampaignMetricsResult {
  const [metrics, setMetrics] = useState<MarketingCampaignMetricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let q = supabase
      .from("marketing_campaign_metrics")
      .select("*")
      .order("metric_date", { ascending: false })
      .limit(2000);
    if (campaignIds && campaignIds.length) q = q.in("campaign_id", campaignIds);
    const { data, error: err } = await q;
    if (err) setError(err.message);
    setMetrics((data ?? []) as MarketingCampaignMetricRow[]);
    setLoading(false);
  }, [campaignIds?.join(",")]);

  useEffect(() => { void load(); }, [load]);

  const rollups = new Map<string, CampaignMetricRollup>();
  for (const m of metrics) {
    const r = rollups.get(m.campaign_id) ?? {
      campaign_id: m.campaign_id,
      spend_cents: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      leads: 0,
      costPerLeadCents: null,
      lastMetricDate: null,
    };
    r.spend_cents += m.spend_cents ?? 0;
    r.impressions += m.impressions ?? 0;
    r.clicks += m.clicks ?? 0;
    r.conversions += m.conversions ?? 0;
    r.leads += m.leads ?? 0;
    if (!r.lastMetricDate || m.metric_date > r.lastMetricDate) r.lastMetricDate = m.metric_date;
    rollups.set(m.campaign_id, r);
  }
  for (const r of rollups.values()) {
    r.costPerLeadCents = r.leads > 0 ? Math.round(r.spend_cents / r.leads) : null;
  }

  const insertMetrics = useCallback<UseMarketingCampaignMetricsResult["insertMetrics"]>(
    async (rows) => {
      if (!rows.length) return 0;
      const { error: err, data } = await supabase
        .from("marketing_campaign_metrics")
        .insert(rows)
        .select("id");
      if (err) throw err;
      await load();
      return (data ?? []).length;
    },
    [load],
  );

  return { metrics, rollups, loading, error, refetch: load, insertMetrics };
}