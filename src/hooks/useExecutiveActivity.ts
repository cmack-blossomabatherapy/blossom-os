import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listRecentExecutiveActivity } from "@/lib/os/executive/executiveService";

export type ExecutiveActivityRow = {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  summary: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

/**
 * Live subscription to executive_activity_log — powers the Leadership
 * Activity panel. Reads are gated by RLS (leadership-only), so this hook
 * safely returns an empty list for non-leadership viewers.
 */
export function useExecutiveActivity(limit = 12) {
  const [rows, setRows] = useState<ExecutiveActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await listRecentExecutiveActivity(limit);
      setRows((data as unknown as ExecutiveActivityRow[]) ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    let cancelled = false;
    void refresh().then(() => { if (cancelled) return; });
    const channel = supabase
      .channel("executive_activity_log_feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "executive_activity_log" },
        (payload) => {
          const row = payload.new as ExecutiveActivityRow;
          setRows((prev) => [row, ...prev].slice(0, limit));
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [limit, refresh]);

  return { rows, loading, error, refresh };
}