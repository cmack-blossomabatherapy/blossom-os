/**
 * useReportFavorites
 *
 * Cross-device report favorites persisted in Supabase (executive_saved_views
 * with scope = "report_favorite"), with a localStorage fallback used only
 * when the user is unauthenticated or the network write fails.
 *
 * Note: the underlying table name is executive_saved_views for historical
 * reasons, but favorites are shared across every role — not Executive-only.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const LOCAL_KEY = "os.reportFavorites";
const SCOPE = "report_favorite";

function readLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocal(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function useReportFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => readLocal());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id ?? null;
    setUserId(uid);
    if (!uid) {
      setFavorites(readLocal());
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("executive_saved_views")
      .select("scope_key")
      .eq("user_id", uid)
      .eq("scope", SCOPE)
      .eq("is_favorite", true);
    if (error) {
      setFavorites(readLocal());
    } else {
      const ids = (data ?? [])
        .map((r: any) => r.scope_key)
        .filter((v: unknown): v is string => typeof v === "string" && v.length > 0);
      // One-time import of any local favorites the user hadn't yet synced.
      const local = readLocal();
      const missing = local.filter((id) => !ids.includes(id));
      if (missing.length > 0) {
        await supabase
          .from("executive_saved_views")
          .insert(
            missing.map((id) => ({
              user_id: uid,
              scope: SCOPE,
              scope_key: id,
              name: id,
              filters: {},
              is_favorite: true,
            })) as never,
          );
        ids.push(...missing);
      }
      setFavorites(ids);
      writeLocal(ids);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleFavorite = useCallback(
    async (id: string) => {
      const already = favorites.includes(id);
      const next = already ? favorites.filter((x) => x !== id) : [...favorites, id];
      setFavorites(next);
      writeLocal(next);
      if (!userId) return next;
      if (already) {
        await supabase
          .from("executive_saved_views")
          .delete()
          .eq("user_id", userId)
          .eq("scope", SCOPE)
          .eq("scope_key", id);
      } else {
        await supabase.from("executive_saved_views").insert({
          user_id: userId,
          scope: SCOPE,
          scope_key: id,
          name: id,
          filters: {},
          is_favorite: true,
        } as never);
      }
      return next;
    },
    [favorites, userId],
  );

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { favorites, toggleFavorite, isFavorite, loading, refresh };
}