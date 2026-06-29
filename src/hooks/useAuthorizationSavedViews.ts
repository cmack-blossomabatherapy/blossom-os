import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SavedViewScope = "authorizations" | "auth_workspace";

export interface SavedView {
  id: string;
  user_id: string;
  name: string;
  scope: SavedViewScope;
  config: Record<string, unknown>;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export function useAuthorizationSavedViews(scope: SavedViewScope) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase
      .from("authorization_saved_views")
      .select("*")
      .eq("scope", scope)
      .order("updated_at", { ascending: false });
    if (e) {
      setError(e.message);
    } else {
      setViews((data ?? []) as unknown as SavedView[]);
    }
    setLoading(false);
  }, [scope]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (name: string, config: Record<string, unknown>, isShared = false) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        toast.error("Sign in to save views");
        return null;
      }
      const { data, error: e } = await supabase
        .from("authorization_saved_views")
        .insert({ user_id: u.user.id, name, scope, config, is_shared: isShared })
        .select("*")
        .single();
      if (e) {
        toast.error(`Save view failed: ${e.message}`);
        return null;
      }
      toast.success(`Saved view "${name}"`);
      await refresh();
      return data as unknown as SavedView;
    },
    [scope, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error: e } = await supabase
        .from("authorization_saved_views")
        .delete()
        .eq("id", id);
      if (e) {
        toast.error(`Delete view failed: ${e.message}`);
        return;
      }
      toast.success("Saved view removed");
      await refresh();
    },
    [refresh],
  );

  return { views, loading, error, save, remove, refresh };
}