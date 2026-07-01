import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { expandSourceSlugAliases } from "@/lib/marketing/sourceEventMapper";

export interface SourceStats {
  last7: number;
  last30: number;
  newCount: number;
  converted: number;
  loading: boolean;
}

/**
 * Aggregate KPIs for a set of marketing source systems, sourced entirely from
 * marketing_source_events. Returns zeros while the connector has no data —
 * pages render honest empty states.
 */
export function useSourceStats(sourceSystems: string[]): SourceStats {
  const [stats, setStats] = useState<SourceStats>({
    last7: 0,
    last30: 0,
    newCount: 0,
    converted: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const expanded = expandSourceSlugAliases(sourceSystems);
      const { data } = await supabase
        .from("marketing_source_events")
        .select("id, occurred_at, status, lead_id")
        .in("source_system", expanded)
        .limit(5000);
      if (cancelled) return;
      const rows = (data ?? []) as Array<{ occurred_at: string; status: string; lead_id: string | null }>;
      const now = Date.now();
      const within = (d: string, days: number) =>
        now - new Date(d).getTime() <= days * 86_400_000;
      setStats({
        last7: rows.filter((r) => within(r.occurred_at, 7)).length,
        last30: rows.filter((r) => within(r.occurred_at, 30)).length,
        newCount: rows.filter((r) => r.status === "new").length,
        converted: rows.filter((r) => !!r.lead_id).length,
        loading: false,
      });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceSystems.join("|")]);

  return stats;
}