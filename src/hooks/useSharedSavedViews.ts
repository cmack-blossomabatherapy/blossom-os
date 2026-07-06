/**
 * useSharedSavedViews
 *
 * Persist per-user saved views/favorites for /reports and executive
 * dashboards to Supabase (executive_saved_views), with a localStorage
 * fallback used when the user is unauthenticated or Supabase is offline.
 *
 * On first load for a signed-in user, any legacy views cached under the
 * old localStorage key are imported into Supabase once and the local
 * copy is preserved as an offline fallback.
 *
 * scope   — logical bucket (e.g. "reports", "command_center")
 * scopeKey — sub-scope (e.g. report key or page id); optional
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SharedSavedView = {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  is_favorite: boolean;
  is_default: boolean;
  last_used_at: string | null;
  updated_at: string;
};

type Options = {
  scope: string;
  scopeKey?: string | null;
  /** localStorage key for legacy fallback data. */
  legacyKey?: string;
};

function readLegacy(legacyKey?: string): SharedSavedView[] {
  if (!legacyKey || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(legacyKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v: any, i: number) => ({
        id: v.id ?? `legacy-${i}`,
        name: v.name ?? `View ${i + 1}`,
        filters: v.filters ?? v.state ?? {},
        is_favorite: !!v.is_favorite,
        is_default: !!v.is_default,
        last_used_at: v.last_used_at ?? null,
        updated_at: v.updated_at ?? new Date().toISOString(),
      }))
      .filter((v) => v.name);
  } catch {
    return [];
  }
}

function writeLegacy(legacyKey: string | undefined, views: SharedSavedView[]) {
  if (!legacyKey || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(legacyKey, JSON.stringify(views));
  } catch {
    /* ignore */
  }
}

export function useSharedSavedViews({ scope, scopeKey, legacyKey }: Options) {
  const [views, setViews] = useState<SharedSavedView[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id ?? null;
    setUserId(uid);
    if (!uid) {
      setViews(readLegacy(legacyKey));
      setLoading(false);
      return;
    }
    let q = supabase
      .from("executive_saved_views")
      .select("id,name,filters,is_favorite,is_default,last_used_at,updated_at")
      .eq("user_id", uid)
      .eq("scope", scope)
      .order("is_favorite", { ascending: false })
      .order("updated_at", { ascending: false });
    if (scopeKey) q = q.eq("scope_key", scopeKey);
    const { data, error } = await q;
    if (error) {
      // Fall back to legacy cache on read error
      setViews(readLegacy(legacyKey));
    } else {
      const rows = (data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        filters: (r.filters as Record<string, unknown>) ?? {},
        is_favorite: !!r.is_favorite,
        is_default: !!r.is_default,
        last_used_at: r.last_used_at,
        updated_at: r.updated_at,
      })) as SharedSavedView[];

      // One-time legacy import if remote is empty and local has entries
      if (rows.length === 0 && legacyKey) {
        const legacy = readLegacy(legacyKey);
        if (legacy.length > 0) {
          const inserts = legacy.map((v) => ({
            user_id: uid,
            scope,
            scope_key: scopeKey ?? null,
            name: v.name,
            filters: v.filters,
            is_favorite: v.is_favorite,
            is_default: v.is_default,
          }));
          const { data: imported } = await supabase
            .from("executive_saved_views")
            .insert(inserts as never)
            .select("id,name,filters,is_favorite,is_default,last_used_at,updated_at");
          if (imported) {
            setViews(
              imported.map((r) => ({
                id: r.id,
                name: r.name,
                filters: (r.filters as Record<string, unknown>) ?? {},
                is_favorite: !!r.is_favorite,
                is_default: !!r.is_default,
                last_used_at: r.last_used_at,
                updated_at: r.updated_at,
              })) as SharedSavedView[],
            );
            setLoading(false);
            return;
          }
        }
      }

      setViews(rows);
      writeLegacy(legacyKey, rows);
    }
    setLoading(false);
  }, [scope, scopeKey, legacyKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveView = useCallback(
    async (name: string, filters: Record<string, unknown>, opts?: { favorite?: boolean }) => {
      if (!userId) {
        const next: SharedSavedView = {
          id: `local-${Date.now()}`,
          name,
          filters,
          is_favorite: !!opts?.favorite,
          is_default: false,
          last_used_at: null,
          updated_at: new Date().toISOString(),
        };
        const nextList = [next, ...views];
        setViews(nextList);
        writeLegacy(legacyKey, nextList);
        return next;
      }
      const { data, error } = await supabase
        .from("executive_saved_views")
        .insert({
          user_id: userId,
          scope,
          scope_key: scopeKey ?? null,
          name,
          filters,
          is_favorite: !!opts?.favorite,
        } as never)
        .select("id,name,filters,is_favorite,is_default,last_used_at,updated_at")
        .single();
      if (error) throw error;
      await refresh();
      return data as unknown as SharedSavedView;
    },
    [userId, views, scope, scopeKey, legacyKey, refresh],
  );

  const deleteView = useCallback(
    async (id: string) => {
      if (!userId || id.startsWith("local-") || id.startsWith("legacy-")) {
        const nextList = views.filter((v) => v.id !== id);
        setViews(nextList);
        writeLegacy(legacyKey, nextList);
        return;
      }
      await supabase.from("executive_saved_views").delete().eq("id", id);
      await refresh();
    },
    [userId, views, legacyKey, refresh],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const view = views.find((v) => v.id === id);
      if (!view) return;
      if (!userId || id.startsWith("local-") || id.startsWith("legacy-")) {
        const nextList = views.map((v) =>
          v.id === id ? { ...v, is_favorite: !v.is_favorite } : v,
        );
        setViews(nextList);
        writeLegacy(legacyKey, nextList);
        return;
      }
      await supabase
        .from("executive_saved_views")
        .update({ is_favorite: !view.is_favorite } as never)
        .eq("id", id);
      await refresh();
    },
    [views, userId, legacyKey, refresh],
  );

  return { views, loading, saveView, deleteView, toggleFavorite, refresh };
}

/**
 * Record a report as recently opened for the current user.
 * No-op for unauthenticated users.
 */
export async function markReportOpened(reportKey: string) {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (!uid) return;
  await supabase
    .from("shared_report_recents")
    .upsert(
      { user_id: uid, report_key: reportKey, opened_at: new Date().toISOString() } as never,
      { onConflict: "user_id,report_key" },
    );
}

export async function listRecentReports(limit = 10): Promise<string[]> {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (!uid) return [];
  const { data } = await supabase
    .from("shared_report_recents")
    .select("report_key,opened_at")
    .eq("user_id", uid)
    .order("opened_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => r.report_key);
}