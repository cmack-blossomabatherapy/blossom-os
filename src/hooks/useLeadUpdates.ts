import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LeadUpdate {
  id: string;
  author: string | null;
  posted_at: string | null;
  body: string | null;
}

/**
 * Fetch Monday comments/updates for a given lead by name.
 * The Monday export of updates carries `parent_item_name`, not Item ID,
 * so we join by exact name match against `monday_updates_raw`.
 */
export function useLeadUpdates(leadName: string | null | undefined) {
  const [updates, setUpdates] = useState<LeadUpdate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!leadName) {
      setUpdates([]);
      return;
    }
    setLoading(true);
    supabase
      .from("monday_updates_raw")
      .select("id, author, posted_at, body")
      .eq("parent_board", "leads")
      .eq("parent_item_name", leadName)
      .order("posted_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (cancelled) return;
        setUpdates((data ?? []) as LeadUpdate[]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [leadName]);

  return { updates, loading };
}