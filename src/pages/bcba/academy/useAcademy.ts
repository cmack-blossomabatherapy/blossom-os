import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMyAcademyProgress(userId?: string | null) {
  return useQuery({
    queryKey: ["bcba-academy", "mine", userId ?? "self"],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bcba_academy_progress").select("*").eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateAcademyProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { user_id: string; section_key: string; is_required: boolean; status: "not_started" | "in_progress" | "completed"; progress_pct: number }) => {
      const patch: any = {
        user_id: payload.user_id,
        section_key: payload.section_key,
        is_required: payload.is_required,
        status: payload.status,
        progress_pct: payload.progress_pct,
        last_viewed_at: new Date().toISOString(),
      };
      if (payload.status === "completed") patch.completed_at = new Date().toISOString();
      const { error } = await supabase
        .from("bcba_academy_progress")
        .upsert(patch, { onConflict: "user_id,section_key" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bcba-academy"] }),
  });
}