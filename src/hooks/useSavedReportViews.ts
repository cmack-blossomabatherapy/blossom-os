/**
 * useSavedReportViews
 *
 * Lists every "Save view" entry the current user has captured on any
 * report detail page (scope = "report_view" in executive_saved_views).
 * Used on ReportsHome to surface saved department dashboard views
 * alongside the existing uploaded-report saves (BCBA Productivity V3,
 * Cancellation Command Center). Compatible with the existing
 * useSharedSavedViews + useReportFavorites plumbing.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SavedReportView = {
  id: string;
  reportId: string;
  name: string;
  path: string;
  savedAt: string;
  isFavorite: boolean;
};

function pickPath(filters: unknown, reportId: string): string {
  if (filters && typeof filters === "object" && filters !== null) {
    const p = (filters as Record<string, unknown>).path;
    if (typeof p === "string" && p.startsWith("/")) return p;
  }
  return `/reports/${reportId}`;
}

export function useSavedReportViews() {
  const [views, setViews] = useState<SavedReportView[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      setViews([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("executive_saved_views")
      .select("id, scope_key, name, filters, is_favorite, updated_at")
      .eq("user_id", uid)
      .eq("scope", "report_view")
      .order("updated_at", { ascending: false });
    if (error || !Array.isArray(data)) {
      setViews([]);
    } else {
      setViews(
        data
          .filter((r) => typeof r.scope_key === "string" && r.scope_key)
          .map((r) => ({
            id: r.id as string,
            reportId: r.scope_key as string,
            name: (r.name as string) || "Saved view",
            path: pickPath(r.filters, r.scope_key as string),
            savedAt: (r.updated_at as string) || new Date().toISOString(),
            isFavorite: !!r.is_favorite,
          })),
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const deleteView = useCallback(
    async (id: string) => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return;
      await supabase
        .from("executive_saved_views")
        .delete()
        .eq("id", id)
        .eq("user_id", uid)
        .eq("scope", "report_view");
      await refresh();
    },
    [refresh],
  );

  const toggleFavorite = useCallback(
    async (id: string, next: boolean) => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return;
      await supabase
        .from("executive_saved_views")
        .update({ is_favorite: next } as never)
        .eq("id", id)
        .eq("user_id", uid)
        .eq("scope", "report_view");
      await refresh();
    },
    [refresh],
  );

  return { views, loading, refresh, deleteView, toggleFavorite };
}