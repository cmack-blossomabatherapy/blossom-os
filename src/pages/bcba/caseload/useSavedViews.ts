import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CaseloadFilters {
  search?: string;
  health?: string[];        // CaseHealthStatus codes
  serviceSetting?: string[];
  staffing?: string[];
  hasOpenConcerns?: boolean;
}

export interface SavedView {
  id: string;
  name: string;
  filters: CaseloadFilters;
  is_shared: boolean;
}

/**
 * BCBA Caseload saved views — scoped to the clinician subject (respects
 * admin preview by keying on `scopedAuthUserId`). Provides create/apply
 * (list) / rename / delete and returns an empty (reset) helper.
 * Preview mode blocks writes at the caller — mutations here fail cleanly
 * if unauthenticated.
 */
export function useSavedViews(scopedAuthUserId: string | null) {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["clinical-saved-views", scopedAuthUserId ?? "none"],
    enabled: !!scopedAuthUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_saved_views")
        .select("id,name,filters,is_shared")
        .eq("user_id", scopedAuthUserId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SavedView[];
    },
  });

  const save = useMutation({
    mutationFn: async ({ name, filters, is_shared = false }: { name: string; filters: CaseloadFilters; is_shared?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("clinical_saved_views").insert({
        name, filters: filters as any, is_shared, user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clinical-saved-views", scopedAuthUserId ?? "none"] }),
  });

  const rename = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Name is required");
      const { error } = await supabase.from("clinical_saved_views")
        .update({ name: trimmed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clinical-saved-views", scopedAuthUserId ?? "none"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clinical_saved_views").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clinical-saved-views", scopedAuthUserId ?? "none"] }),
  });

  const emptyFilters: CaseloadFilters = {};
  return { views: list.data ?? [], isLoading: list.isLoading, error: list.error, save, rename, remove, emptyFilters };
}