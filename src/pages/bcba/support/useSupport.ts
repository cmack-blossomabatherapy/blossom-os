import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { categoryFor, type SupportCategoryKey } from "./config";

export function useMySupportRequests(userId?: string | null) {
  return useQuery({
    queryKey: ["bcba-support", "mine", userId ?? "self"],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bcba_support_requests")
        .select("*")
        .eq("bcba_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSupportRequest(id?: string | null) {
  return useQuery({
    queryKey: ["bcba-support", "request", id],
    enabled: !!id,
    queryFn: async () => {
      const [reqRes, updRes, audRes] = await Promise.all([
        supabase.from("bcba_support_requests").select("*").eq("id", id!).maybeSingle(),
        supabase.from("bcba_support_request_updates").select("*").eq("request_id", id!).order("created_at", { ascending: true }),
        supabase.from("bcba_support_request_audit").select("*").eq("request_id", id!).order("created_at", { ascending: false }),
      ]);
      if (reqRes.error) throw reqRes.error;
      if (updRes.error) throw updRes.error;
      if (audRes.error) throw audRes.error;
      return { request: reqRes.data, updates: updRes.data ?? [], audit: audRes.data ?? [] };
    },
  });
}

export function useSupportContacts() {
  return useQuery({
    queryKey: ["bcba-support-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bcba_support_contacts").select("*").eq("active", true).order("team");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateSupportRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      bcba_id: string;
      bcba_name?: string;
      category: SupportCategoryKey;
      subject: string;
      detail?: string;
      urgency?: "low" | "normal" | "high" | "urgent";
      state?: string;
      clinic?: string;
      client_ref?: string;
      rbt_ref?: string;
      contains_client_details?: boolean;
    }) => {
      const cat = categoryFor(payload.category);
      const { data, error } = await supabase
        .from("bcba_support_requests")
        .insert({
          bcba_id: payload.bcba_id,
          bcba_name: payload.bcba_name ?? null,
          category: payload.category,
          subject: payload.subject,
          detail: payload.detail ?? null,
          urgency: payload.urgency ?? cat.defaultUrgency,
          state: payload.state ?? null,
          clinic: payload.clinic ?? null,
          client_ref: payload.client_ref ?? null,
          rbt_ref: payload.rbt_ref ?? null,
          owner_team: cat.defaultTeam,
          owner_name: cat.friendlyOwner,
          sla_hours: cat.defaultSlaHours,
          status: "open",
          contains_client_details: payload.contains_client_details ?? cat.containsClientDetailsDefault,
        } as any)
        .select("*")
        .single();
      if (error) throw error;

      await supabase.from("bcba_support_request_audit").insert({
        request_id: data.id,
        changed_by: payload.bcba_id,
        changed_field: "created",
        new_value: `category=${payload.category}, sla=${cat.defaultSlaHours}h`,
      } as any);

      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bcba-support"] }),
  });
}

export function useAddSupportUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { request_id: string; author_id: string; author_name?: string; body: string; update_type?: string }) => {
      const { error } = await supabase.from("bcba_support_request_updates").insert({
        request_id: payload.request_id,
        author_id: payload.author_id,
        author_name: payload.author_name ?? null,
        body: payload.body,
        update_type: payload.update_type ?? "comment",
      } as any);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["bcba-support", "request", v.request_id] }),
  });
}

export function useSetSupportStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; status: string; user_id: string; resolution?: string }) => {
      const patch: any = { status: payload.status };
      if (payload.status === "resolved" || payload.status === "closed") {
        patch.resolved_at = new Date().toISOString();
        if (payload.resolution) patch.resolution = payload.resolution;
      }
      const { error } = await supabase.from("bcba_support_requests").update(patch).eq("id", payload.id);
      if (error) throw error;
      await supabase.from("bcba_support_request_audit").insert({
        request_id: payload.id,
        changed_by: payload.user_id,
        changed_field: "status",
        new_value: payload.status,
      } as any);
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["bcba-support", "request", v.id] });
      qc.invalidateQueries({ queryKey: ["bcba-support", "mine"] });
    },
  });
}