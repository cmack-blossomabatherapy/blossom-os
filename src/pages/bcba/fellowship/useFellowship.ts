import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFellowshipStages() {
  return useQuery({
    queryKey: ["fellowship-stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bcba_fellowship_stages")
        .select("*")
        .eq("active", true)
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyFellows(uid: string | null) {
  return useQuery({
    enabled: !!uid,
    queryKey: ["my-fellows", uid],
    queryFn: async () => {
      // Fellows the current user is assigned to (RLS enforces this, but scope by assignment for the list view).
      const { data: asg, error: aerr } = await supabase
        .from("bcba_fellowship_assignments")
        .select("fellow_id, role, is_primary")
        .eq("bcba_id", uid!)
        .eq("active", true);
      if (aerr) throw aerr;
      const ids = Array.from(new Set((asg ?? []).map((a) => a.fellow_id)));
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("bcba_fellowship_fellows")
        .select("*")
        .in("id", ids)
        .order("full_name");
      if (error) throw error;
      const roleByFellow = new Map<string, string[]>();
      for (const a of asg ?? []) {
        const arr = roleByFellow.get(a.fellow_id) ?? [];
        arr.push(a.role);
        roleByFellow.set(a.fellow_id, arr);
      }
      return (data ?? []).map((f: any) => ({ ...f, my_roles: roleByFellow.get(f.id) ?? [] }));
    },
  });
}

export function useFellowAssignments(fellowId: string | null) {
  return useQuery({
    enabled: !!fellowId,
    queryKey: ["fellow-assignments", fellowId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bcba_fellowship_assignments")
        .select("*")
        .eq("fellow_id", fellowId!)
        .eq("active", true);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useFellowReviews(fellowId: string | null) {
  return useQuery({
    enabled: !!fellowId,
    queryKey: ["fellow-reviews", fellowId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bcba_fellowship_reviews")
        .select("*")
        .eq("fellow_id", fellowId!)
        .order("scheduled_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useFellowAudit(fellowId: string | null) {
  return useQuery({
    enabled: !!fellowId,
    queryKey: ["fellow-audit", fellowId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bcba_fellowship_audit")
        .select("*")
        .eq("fellow_id", fellowId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateReview(fellowId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      reviewer_id: string;
      reviewer_name?: string | null;
      review_type: string;
      scheduled_at?: string | null;
      status?: string;
      outcome_summary?: string | null;
      next_steps?: string | null;
      follow_up_date?: string | null;
    }) => {
      if (!fellowId) throw new Error("Fellow required");
      const { data, error } = await supabase
        .from("bcba_fellowship_reviews")
        .insert({ fellow_id: fellowId, ...payload })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fellow-reviews", fellowId] });
      qc.invalidateQueries({ queryKey: ["fellow-audit", fellowId] });
    },
  });
}

export function useUpdateReviewStatus(fellowId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, outcome_summary }: { id: string; status: string; outcome_summary?: string }) => {
      const patch: Record<string, any> = { status };
      if (status === "completed") patch.completed_at = new Date().toISOString();
      if (outcome_summary !== undefined) patch.outcome_summary = outcome_summary;
      const { error } = await supabase.from("bcba_fellowship_reviews").update(patch as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fellow-reviews", fellowId] });
      qc.invalidateQueries({ queryKey: ["fellow-audit", fellowId] });
    },
  });
}

export function useProgramContent() {
  return useQuery({
    queryKey: ["fellowship-program-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bcba_fellowship_program_content")
        .select("*")
        .order("section_key");
      if (error) throw error;
      return data ?? [];
    },
  });
}