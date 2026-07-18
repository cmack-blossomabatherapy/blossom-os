import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Employee-facing "CentralReach data last updated…" indicator.
 *
 * Order of truth (post-consolidation):
 *   1. cr_sync_freshness() — unified CR Sync engine (source of truth going forward)
 *   2. rbt_data_sync_status — legacy per-source ad-hoc table (kept as fallback for one release)
 */
export function useCrSync(source = "centralreach") {
  const [row, setRow] = useState<any | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.rpc("cr_sync_freshness");
        const arr = (data as any[]) ?? [];
        if (arr.length > 0) {
          const relevant = arr.find((r) => r.type_key === source) ?? arr[0];
          if (!cancelled) {
            setRow({
              last_success_at: relevant?.last_success_at ?? null,
              last_attempt_at: relevant?.last_success_at ?? null,
              status: relevant?.level ?? null,
              message: null,
              stale_after_hours: null,
            });
            return;
          }
        }
      } catch { /* fall through to legacy */ }
      const { data } = await supabase.from("rbt_data_sync_status" as any)
        .select("last_success_at,last_attempt_at,status,message,stale_after_hours")
        .eq("source", source)
        .maybeSingle();
      if (!cancelled) setRow(data ?? null);
    })();
    return () => { cancelled = true; };
  }, [source]);
  return row;
}