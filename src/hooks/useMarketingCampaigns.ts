import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type MarketingCampaignRow = Database["public"]["Tables"]["marketing_campaigns"]["Row"];
export type MarketingCampaignInsert = Database["public"]["Tables"]["marketing_campaigns"]["Insert"];
export type MarketingCampaignUpdate = Database["public"]["Tables"]["marketing_campaigns"]["Update"];

export const CAMPAIGN_STATUSES = ["draft", "active", "paused", "completed", "archived"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export interface UseMarketingCampaignsResult {
  campaigns: MarketingCampaignRow[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createCampaign: (row: MarketingCampaignInsert) => Promise<MarketingCampaignRow | null>;
  updateCampaign: (id: string, patch: MarketingCampaignUpdate) => Promise<void>;
  setStatus: (id: string, status: CampaignStatus) => Promise<void>;
  archive: (id: string) => Promise<void>;
}

export function useMarketingCampaigns(): UseMarketingCampaignsResult {
  const [campaigns, setCampaigns] = useState<MarketingCampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    setCampaigns((data ?? []) as MarketingCampaignRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createCampaign = useCallback<UseMarketingCampaignsResult["createCampaign"]>(
    async (row) => {
      const { data, error: err } = await supabase
        .from("marketing_campaigns")
        .insert(row)
        .select()
        .single();
      if (err) { toast.error("Could not create campaign", { description: err.message }); return null; }
      toast.success(`Campaign "${row.name}" created`);
      await load();
      return data as MarketingCampaignRow;
    },
    [load],
  );

  const updateCampaign = useCallback<UseMarketingCampaignsResult["updateCampaign"]>(
    async (id, patch) => {
      const { error: err } = await supabase.from("marketing_campaigns").update(patch).eq("id", id);
      if (err) { toast.error("Could not update campaign", { description: err.message }); return; }
      toast.success("Campaign updated");
      await load();
    },
    [load],
  );

  const setStatus = useCallback<UseMarketingCampaignsResult["setStatus"]>(
    async (id, status) => {
      const { error: err } = await supabase
        .from("marketing_campaigns")
        .update({ status })
        .eq("id", id);
      if (err) { toast.error(err.message); return; }
      toast.success(`Campaign set to ${status}`);
      await load();
    },
    [load],
  );

  const archive = useCallback<UseMarketingCampaignsResult["archive"]>(
    (id) => setStatus(id, "archived"),
    [setStatus],
  );

  return { campaigns, loading, error, refetch: load, createCampaign, updateCampaign, setStatus, archive };
}