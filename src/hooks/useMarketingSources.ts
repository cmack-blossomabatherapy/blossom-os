import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type MarketingSourceRow = Database["public"]["Tables"]["marketing_sources"]["Row"];
export type MarketingSourceInsert = Database["public"]["Tables"]["marketing_sources"]["Insert"];
export type MarketingSourceUpdate = Database["public"]["Tables"]["marketing_sources"]["Update"];

export const SOURCE_SYSTEM_OPTIONS = [
  { value: "ctm", label: "CallTrackingMetrics (CTM)" },
  { value: "jivetel", label: "Jive / Jivetel" },
  { value: "retellai", label: "RetellAI" },
  { value: "leadtrap", label: "LeadTrap" },
  { value: "google_ads", label: "Google Ads" },
  { value: "meta_ads", label: "Meta / Facebook Ads" },
  { value: "facebook_ads", label: "Facebook Ads (legacy)" },
  { value: "mailchimp", label: "Mailchimp" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "centralreach", label: "CentralReach" },
  { value: "manual", label: "Manual entry" },
  { value: "other", label: "Other" },
] as const;

export const CHANNEL_OPTIONS = [
  "phone", "paid", "organic", "referral", "email", "community", "recruiting", "website", "other",
] as const;

export interface UseMarketingSourcesResult {
  sources: MarketingSourceRow[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createSource: (row: MarketingSourceInsert) => Promise<MarketingSourceRow | null>;
  updateSource: (id: string, patch: MarketingSourceUpdate) => Promise<void>;
  setActive: (id: string, isActive: boolean) => Promise<void>;
}

export function useMarketingSources(): UseMarketingSourcesResult {
  const [sources, setSources] = useState<MarketingSourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("marketing_sources")
      .select("*")
      .order("name", { ascending: true });
    if (err) setError(err.message);
    setSources((data ?? []) as MarketingSourceRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createSource = useCallback<UseMarketingSourcesResult["createSource"]>(
    async (row) => {
      const { data, error: err } = await supabase
        .from("marketing_sources")
        .insert(row)
        .select()
        .single();
      if (err) { toast.error("Could not create source", { description: err.message }); return null; }
      toast.success(`Source "${row.name}" created`);
      await load();
      return data as MarketingSourceRow;
    },
    [load],
  );

  const updateSource = useCallback<UseMarketingSourcesResult["updateSource"]>(
    async (id, patch) => {
      const { error: err } = await supabase.from("marketing_sources").update(patch).eq("id", id);
      if (err) { toast.error("Could not update source", { description: err.message }); return; }
      toast.success("Source updated");
      await load();
    },
    [load],
  );

  const setActive = useCallback<UseMarketingSourcesResult["setActive"]>(
    async (id, isActive) => {
      const { error: err } = await supabase
        .from("marketing_sources")
        .update({ is_active: isActive })
        .eq("id", id);
      if (err) { toast.error(err.message); return; }
      toast.success(isActive ? "Source activated" : "Source deactivated");
      await load();
    },
    [load],
  );

  return { sources, loading, error, refetch: load, createSource, updateSource, setActive };
}