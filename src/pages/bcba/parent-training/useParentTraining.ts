import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  ParentTrainingStatus,
  UtilizationTrend,
  UtilizationRisk,
  CancellationPattern,
} from "./pipeline";

export interface ParentTrainingRecord {
  id: string;
  client_id: string | null;
  client_identifier: string;
  assigned_bcba_id: string | null;
  assigned_bcba_name: string | null;
  payer: string | null;
  state: string | null;
  required_frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "custom";
  required_per_month: number;
  scheduled_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  reschedule_needed: boolean;
  documentation_pending: boolean;
  last_completed_date: string | null;
  next_scheduled_date: string | null;
  barrier: string | null;
  status: ParentTrainingStatus;
  centralreach_url: string | null;
  centralreach_source_date: string | null;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportRequest {
  id: string;
  record_id: string;
  category: string;
  detail: string | null;
  requested_by_id: string | null;
  requested_by_name: string | null;
  status: "open" | "in_progress" | "resolved" | "cancelled";
  task_id: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityEvent {
  id: string;
  record_id: string;
  event_type: string;
  actor_id: string | null;
  actor_name: string | null;
  message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface UtilizationRecord {
  id: string;
  client_id: string | null;
  client_identifier: string;
  assigned_bcba_id: string | null;
  assigned_bcba_name: string | null;
  payer: string | null;
  state: string | null;
  period_start: string;
  period_end: string;
  authorized_hours: number;
  scheduled_hours: number;
  delivered_hours: number;
  cancelled_hours: number;
  remaining_hours: number;
  utilization_trend: UtilizationTrend;
  underutilization_risk: UtilizationRisk;
  staffing_gap_hours: number;
  family_cancellation_pattern: CancellationPattern;
  provider_cancellation_pattern: CancellationPattern;
  contributing_factors: string[] | null;
  centralreach_source_date: string | null;
  centralreach_url: string | null;
  data_freshness_note: string | null;
  created_at: string;
  updated_at: string;
}

const KEY = ["bcba_parent_training"] as const;
const UTIL_KEY = ["bcba_service_utilization"] as const;

export function useParentTrainingRecords(opts?: { onlyMine?: boolean; scopedAuthUserId?: string | null }) {
  const scoped = opts?.scopedAuthUserId ?? null;
  return useQuery({
    queryKey: [...KEY, opts?.onlyMine ?? false, scoped ?? "self"],
    queryFn: async (): Promise<ParentTrainingRecord[]> => {
      let q = supabase
        .from("bcba_parent_training_records")
        .select("*")
        .order("next_scheduled_date", { ascending: true, nullsFirst: false });
      if (opts?.onlyMine) {
        let uid = scoped;
        if (!uid) {
          const { data: u } = await supabase.auth.getUser();
          uid = u?.user?.id ?? null;
        }
        if (uid) q = q.eq("assigned_bcba_id", uid);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ParentTrainingRecord[];
    },
  });
}

export function useParentTrainingRecord(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "detail", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const [r, s, a] = await Promise.all([
        supabase.from("bcba_parent_training_records").select("*").eq("id", id).maybeSingle(),
        supabase.from("bcba_parent_training_support_requests").select("*").eq("record_id", id).order("created_at", { ascending: false }),
        supabase.from("bcba_parent_training_activity").select("*").eq("record_id", id).order("created_at", { ascending: false }).limit(100),
      ]);
      if (r.error) throw r.error;
      return {
        record: r.data as ParentTrainingRecord | null,
        supportRequests: (s.data ?? []) as SupportRequest[],
        activity: (a.data ?? []) as ActivityEvent[],
      };
    },
  });
}

export function useCreateParentTrainingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ParentTrainingRecord> & { client_identifier: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const payload = {
        ...input,
        created_by: u?.user?.id ?? null,
        assigned_bcba_id: input.assigned_bcba_id ?? u?.user?.id ?? null,
      };
      const { data, error } = await supabase
        .from("bcba_parent_training_records")
        .insert(payload as never)
        .select()
        .single();
      if (error) throw error;
      return data as ParentTrainingRecord;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateParentTrainingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<ParentTrainingRecord> & { id: string }) => {
      const { id, ...fields } = patch;
      const { error } = await supabase
        .from("bcba_parent_training_records")
        .update(fields as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, "detail", vars.id] });
    },
  });
}

export function useCreateParentTrainingSupport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { record_id: string; category: string; detail?: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const { data: rec } = await supabase
        .from("bcba_parent_training_records")
        .select("client_identifier, assigned_bcba_id, next_scheduled_date")
        .eq("id", input.record_id)
        .maybeSingle();

      const { data: sr, error } = await supabase
        .from("bcba_parent_training_support_requests")
        .insert({
          record_id: input.record_id,
          category: input.category,
          detail: input.detail ?? null,
          requested_by_id: u?.user?.id ?? null,
        } as never)
        .select()
        .single();
      if (error) throw error;

      // Scheduling-related quick actions route to the assigned BCBA by default;
      // ops leadership can reassign later. We never auto-blame — the task
      // simply captures the operational ask.
      const assignee = rec?.assigned_bcba_id ?? u?.user?.id ?? null;
      if (assignee && u?.user?.id && rec && input.category !== "operational_note" && input.category !== "centralreach_link") {
        const priority = input.category === "family_barrier" || input.category === "scheduling_support"
          ? "high"
          : "medium";
        const { data: task } = await supabase
          .from("user_tasks")
          .insert({
            title: `Parent training: ${input.category.replace(/_/g, " ")} — ${rec.client_identifier}`,
            description: input.detail ?? null,
            assignee_id: assignee,
            assigned_by_id: u.user.id,
            priority: priority as never,
            due_at: rec.next_scheduled_date
              ? new Date(rec.next_scheduled_date).toISOString()
              : null,
            related_record_type: "bcba_parent_training",
            related_record_id: input.record_id,
            related_record_label: rec.client_identifier,
            related_url: `/bcba/parent-training?id=${input.record_id}`,
          } as never)
          .select("id")
          .maybeSingle();
        if (task?.id) {
          await supabase
            .from("bcba_parent_training_support_requests")
            .update({ task_id: task.id } as never)
            .eq("id", sr.id);
        }
      }

      await supabase.from("bcba_parent_training_activity").insert({
        record_id: input.record_id,
        event_type: "support_request",
        actor_id: u?.user?.id ?? null,
        message: `Quick action: ${input.category.replace(/_/g, " ")}${input.detail ? ` — ${input.detail}` : ""}`,
      } as never);

      return sr as SupportRequest;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, "detail", vars.record_id] });
    },
  });
}

// ---- Service utilization ----

export function useServiceUtilization(opts?: { onlyMine?: boolean; scopedAuthUserId?: string | null }) {
  const scoped = opts?.scopedAuthUserId ?? null;
  return useQuery({
    queryKey: [...UTIL_KEY, opts?.onlyMine ?? false, scoped ?? "self"],
    queryFn: async (): Promise<UtilizationRecord[]> => {
      let q = supabase
        .from("bcba_service_utilization")
        .select("*")
        .order("period_end", { ascending: false });
      if (opts?.onlyMine) {
        let uid = scoped;
        if (!uid) {
          const { data: u } = await supabase.auth.getUser();
          uid = u?.user?.id ?? null;
        }
        if (uid) q = q.eq("assigned_bcba_id", uid);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        ...r,
        contributing_factors: Array.isArray(r.contributing_factors) ? r.contributing_factors : [],
      })) as UtilizationRecord[];
    },
  });
}