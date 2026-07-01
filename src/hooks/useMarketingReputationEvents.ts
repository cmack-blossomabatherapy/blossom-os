import { useCallback, useEffect, useState } from "react";
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

export function useMarketingReputationEvents(opts: { limit?: number } = {}) {
  const { limit = 200 } = opts;
  const [rows, setRows] = useState<MarketingReputationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("marketing_reputation_events" as never)
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(limit);
    if (err) setError(err.message);
    setRows(((data as unknown) as MarketingReputationEvent[]) ?? []);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return { rows, loading, error, refetch: load };
}