import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const MARKETING_WORK_TYPES = [
  "seo_content",
  "web_analytics",
  "reputation",
  "community_outreach",
  "recruiting_marketing",
  "state_growth",
  "attribution",
  "campaign",
  "source_ops",
] as const;
export type MarketingWorkType = (typeof MARKETING_WORK_TYPES)[number];

export const MARKETING_WORK_STATUSES = ["open", "in_progress", "blocked", "done", "archived"] as const;
export type MarketingWorkStatus = (typeof MARKETING_WORK_STATUSES)[number];

export const MARKETING_WORK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type MarketingWorkPriority = (typeof MARKETING_WORK_PRIORITIES)[number];

export interface MarketingWorkItem {
  id: string;
  work_type: MarketingWorkType | string;
  title: string;
  description: string | null;
  state: string | null;
  source_system: string | null;
  campaign_id: string | null;
  lead_id: string | null;
  referral_contact_id: string | null;
  referral_company_id: string | null;
  priority: MarketingWorkPriority | string;
  status: MarketingWorkStatus | string;
  owner_id: string | null;
  due_date: string | null;
  evidence: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UseMarketingWorkItemsOptions {
  workType?: MarketingWorkType | string;
  sourceSystem?: string;
  state?: string;
  includeArchived?: boolean;
  limit?: number;
}

export function useMarketingWorkItems(opts: UseMarketingWorkItemsOptions = {}) {
  const { workType, sourceSystem, state, includeArchived = false, limit = 200 } = opts;
  const [items, setItems] = useState<MarketingWorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let q = supabase
      .from("marketing_work_items" as never)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (workType) q = q.eq("work_type", workType);
    if (sourceSystem) q = q.eq("source_system", sourceSystem);
    if (state) q = q.eq("state", state);
    if (!includeArchived) q = q.neq("status", "archived");
    const { data, error: err } = await q;
    if (err) setError(err.message);
    setItems(((data as unknown) as MarketingWorkItem[]) ?? []);
    setLoading(false);
  }, [workType, sourceSystem, state, includeArchived, limit]);

  useEffect(() => {
    void load();
    const ch = supabase
      .channel(`mwi-${workType ?? "all"}-${state ?? "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "marketing_work_items" },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [load, workType, state]);

  const createItem = useCallback(
    async (row: Partial<MarketingWorkItem> & Pick<MarketingWorkItem, "work_type" | "title">) => {
      const { data: userRes } = await supabase.auth.getUser();
      const insertRow = {
        work_type: row.work_type,
        title: row.title,
        description: row.description ?? null,
        state: row.state ?? null,
        source_system: row.source_system ?? null,
        campaign_id: row.campaign_id ?? null,
        lead_id: row.lead_id ?? null,
        referral_contact_id: row.referral_contact_id ?? null,
        referral_company_id: row.referral_company_id ?? null,
        priority: row.priority ?? "medium",
        status: row.status ?? "open",
        owner_id: row.owner_id ?? null,
        due_date: row.due_date ?? null,
        evidence: row.evidence ?? {},
        created_by: userRes?.user?.id ?? null,
      };
      const { data, error: err } = await supabase
        .from("marketing_work_items" as never)
        .insert([insertRow as never])
        .select("*")
        .single();
      if (err) {
        toast.error(err.message);
        throw err;
      }
      await load();
      return data as unknown as MarketingWorkItem;
    },
    [load],
  );

  const updateItem = useCallback(
    async (id: string, patch: Partial<MarketingWorkItem>) => {
      const { error: err } = await supabase
        .from("marketing_work_items" as never)
        .update(patch as never)
        .eq("id", id);
      if (err) {
        toast.error(err.message);
        throw err;
      }
      await load();
    },
    [load],
  );

  const setStatus = useCallback(
    (id: string, status: MarketingWorkStatus) => updateItem(id, { status }),
    [updateItem],
  );
  const setPriority = useCallback(
    (id: string, priority: MarketingWorkPriority) => updateItem(id, { priority }),
    [updateItem],
  );
  const setOwner = useCallback(
    (id: string, owner_id: string | null) => updateItem(id, { owner_id }),
    [updateItem],
  );
  const setDueDate = useCallback(
    (id: string, due_date: string | null) => updateItem(id, { due_date }),
    [updateItem],
  );
  const archive = useCallback(
    (id: string) => updateItem(id, { status: "archived" }),
    [updateItem],
  );

  return {
    items,
    loading,
    error,
    refetch: load,
    createItem,
    updateItem,
    setStatus,
    setPriority,
    setOwner,
    setDueDate,
    archive,
  };
}