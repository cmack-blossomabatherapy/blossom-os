import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ClinicalFilters } from "./types";

export type SavedView = {
  id: string;
  name: string;
  filters: ClinicalFilters;
  is_favorite: boolean;
};

const SCOPE = "clinical_leadership";

export function useSavedViews(scopeKey: string) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("executive_saved_views")
      .select("id, name, filters, is_favorite")
      .eq("scope", SCOPE)
      .eq("scope_key", scopeKey)
      .order("is_favorite", { ascending: false })
      .order("name");
    setViews(
      (data || []).map((v: any) => ({
        id: v.id,
        name: v.name,
        filters: (v.filters || {}) as ClinicalFilters,
        is_favorite: !!v.is_favorite,
      })),
    );
    setLoading(false);
  }, [scopeKey]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(
    async (name: string, filters: ClinicalFilters) => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return;
      await supabase.from("executive_saved_views").insert({
        user_id: uid,
        scope: SCOPE,
        scope_key: scopeKey,
        name,
        filters: filters as any,
      });
      await load();
    },
    [scopeKey, load],
  );

  const remove = useCallback(
    async (id: string) => {
      await supabase.from("executive_saved_views").delete().eq("id", id);
      await load();
    },
    [load],
  );

  return { views, loading, save, remove, refresh: load };
}