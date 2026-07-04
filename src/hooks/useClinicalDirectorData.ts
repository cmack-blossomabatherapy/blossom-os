import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ClinicalPriority = "low" | "normal" | "high" | "urgent";
export type ClinicalStatus =
  | "open" | "in_review" | "reviewed" | "escalated" | "resolved" | "archived";
export type ClinicalSourceType =
  | "authorization" | "supervision" | "evaluation"
  | "bcba" | "client" | "centralreach" | "manual";

export interface ClinicalWorkItem {
  id: string;
  source_type: ClinicalSourceType;
  source_record_id: string | null;
  client_id: string | null;
  client_name: string | null;
  bcba_id: string | null;
  bcba_name: string | null;
  state: string | null;
  priority: ClinicalPriority;
  status: ClinicalStatus;
  title: string;
  notes: string | null;
  owner_user_id: string | null;
  owner_name: string | null;
  due_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClinicalActivityEvent {
  id: string;
  work_item_id: string | null;
  event_type: string;
  actor_user_id: string | null;
  actor_name: string | null;
  source_type: string | null;
  source_record_id: string | null;
  client_id: string | null;
  bcba_id: string | null;
  summary: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface ClinicalDirectorFilters {
  state?: string | null;
  bcbaId?: string | null;
  clientId?: string | null;
  priority?: ClinicalPriority | null;
  status?: ClinicalStatus | null;
  dueWithinDays?: number | null;
}

/**
 * Read layer for the Clinical Director workspace.
 *
 * Composes with (not replacing) `useLiveAuthorizations` and
 * `useCentralReachOps` — this hook only owns the durable
 * `clinical_work_items` + `clinical_activity_log` slice.
 */
export function useClinicalDirectorData(filters: ClinicalDirectorFilters = {}) {
  const [items, setItems] = useState<ClinicalWorkItem[]>([]);
  const [activity, setActivity] = useState<ClinicalActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from("clinical_work_items")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(500);
      if (filters.state) q = q.eq("state", filters.state);
      if (filters.bcbaId) q = q.eq("bcba_id", filters.bcbaId);
      if (filters.clientId) q = q.eq("client_id", filters.clientId);
      if (filters.priority) q = q.eq("priority", filters.priority);
      if (filters.status) q = q.eq("status", filters.status);
      if (filters.dueWithinDays != null) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + filters.dueWithinDays);
        q = q.lte("due_at", cutoff.toISOString());
      }
      const { data: rows, error: err1 } = await q;
      if (err1) throw err1;
      setItems((rows ?? []) as unknown as ClinicalWorkItem[]);

      const { data: act, error: err2 } = await supabase
        .from("clinical_activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (err2) throw err2;
      setActivity((act ?? []) as unknown as ClinicalActivityEvent[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [
    filters.state, filters.bcbaId, filters.clientId,
    filters.priority, filters.status, filters.dueWithinDays,
  ]);

  useEffect(() => { void reload(); }, [reload]);

  return { items, activity, loading, error, reload };
}
