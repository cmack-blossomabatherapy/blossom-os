import { useCallback, useEffect, useState } from "react";
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

export function useMarketingWebMetrics(opts: { limit?: number; sourceSystem?: string } = {}) {
  const { limit = 500, sourceSystem } = opts;
  const [rows, setRows] = useState<MarketingWebMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let q = supabase
      .from("marketing_web_metrics" as never)
      .select("*")
      .order("metric_date", { ascending: false })
      .limit(limit);
    if (sourceSystem) q = q.eq("source_system", sourceSystem);
    const { data, error: err } = await q;
    if (err) setError(err.message);
    setRows(((data as unknown) as MarketingWebMetric[]) ?? []);
    setLoading(false);
  }, [limit, sourceSystem]);

  useEffect(() => {
    void load();
  }, [load]);

  return { rows, loading, error, refetch: load };
}