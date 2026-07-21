import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProgressReportStatus, RiskLevel } from "./pipeline";

export interface ProgressReport {
  id: string;
  client_id: string | null;
  client_identifier: string;
  assigned_bcba_id: string | null;
  assigned_bcba_name: string | null;
  authorization_id: string | null;
  authorization_owner_id: string | null;
  authorization_owner_name: string | null;
  authorization_period_start: string | null;
  authorization_period_end: string | null;
  authorization_expiration: string;
  progress_report_due_date: string;
  payer: string | null;
  state: string | null;
  report_status: ProgressReportStatus;
  parent_input_status: "not_needed" | "requested" | "received";
  parent_signature_status: "not_needed" | "requested" | "received";
  qa_status: "not_started" | "in_review" | "changes_requested" | "approved";
  submission_status: "not_submitted" | "submitted" | "resubmitted" | "accepted" | "rejected";
  authorization_status: "pending" | "submitted" | "approved" | "denied" | "expired";
  current_risk: RiskLevel;
  centralreach_source_date: string | null;
  centralreach_url: string | null;
  last_update_note: string | null;
  last_update_at: string;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  name: string;
  days_before_expiration: number;
  payer: string | null;
  state: string | null;
  is_active: boolean;
  show_on_dashboard: boolean;
  notify_bcba: boolean;
  create_task: boolean;
  visible_to_authorization_team: boolean;
  visible_to_state_leadership: boolean;
  escalate_to_clinical_leadership: boolean;
  offer_support: boolean;
  risk_level: RiskLevel;
  employee_message: string;
  due_date_language: string;
  sort_order: number;
}

export interface SupportRequest {
  id: string;
  progress_report_id: string;
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
  progress_report_id: string;
  event_type: string;
  actor_id: string | null;
  actor_name: string | null;
  message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const KEY = ["bcba_progress_reports"] as const;

export function useProgressReports(opts?: { onlyMine?: boolean; scopedAuthUserId?: string | null }) {
  const scoped = opts?.scopedAuthUserId ?? null;
  return useQuery({
    queryKey: [...KEY, opts?.onlyMine ?? false, scoped ?? "self"],
    queryFn: async (): Promise<ProgressReport[]> => {
      let q = supabase
        .from("bcba_progress_reports")
        .select("*")
        .order("progress_report_due_date", { ascending: true });
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
      return (data ?? []) as ProgressReport[];
    },
  });
}

export function useProgressReport(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "detail", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const [r, s, a] = await Promise.all([
        supabase.from("bcba_progress_reports").select("*").eq("id", id).maybeSingle(),
        supabase.from("bcba_progress_report_support_requests").select("*").eq("progress_report_id", id).order("created_at", { ascending: false }),
        supabase.from("bcba_progress_report_activity").select("*").eq("progress_report_id", id).order("created_at", { ascending: false }).limit(100),
      ]);
      if (r.error) throw r.error;
      return {
        report: r.data as ProgressReport | null,
        supportRequests: (s.data ?? []) as SupportRequest[],
        activity: (a.data ?? []) as ActivityEvent[],
      };
    },
  });
}

export function useMilestones() {
  return useQuery({
    queryKey: [...KEY, "milestones"],
    queryFn: async (): Promise<Milestone[]> => {
      const { data, error } = await supabase
        .from("bcba_progress_report_milestones")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Milestone[];
    },
  });
}

export function useUpsertMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Milestone> & { id?: string }) => {
      if (input.id) {
        const { id, ...fields } = input;
        const { error } = await supabase
          .from("bcba_progress_report_milestones")
          .update(fields as never)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bcba_progress_report_milestones")
          .insert(input as never);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, "milestones"] }),
  });
}

export function useDeleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bcba_progress_report_milestones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, "milestones"] }),
  });
}

export function useCreateProgressReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ProgressReport> & {
      client_identifier: string;
      authorization_expiration: string;
      progress_report_due_date: string;
    }) => {
      const { data: u } = await supabase.auth.getUser();
      const payload = {
        ...input,
        created_by: u?.user?.id ?? null,
        assigned_bcba_id: input.assigned_bcba_id ?? u?.user?.id ?? null,
      };
      const { data, error } = await supabase.from("bcba_progress_reports").insert(payload).select().single();
      if (error) throw error;
      return data as ProgressReport;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateProgressReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<ProgressReport> & { id: string }) => {
      const { id, ...fields } = patch;
      const { error } = await supabase.from("bcba_progress_reports").update(fields).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, "detail", vars.id] });
    },
  });
}

export function useCreateSupportRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { progress_report_id: string; category: string; detail?: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const { data: report } = await supabase
        .from("bcba_progress_reports")
        .select("client_identifier, authorization_owner_id, assigned_bcba_id, progress_report_due_date")
        .eq("id", input.progress_report_id)
        .maybeSingle();

      const { data: sr, error } = await supabase
        .from("bcba_progress_report_support_requests")
        .insert({
          progress_report_id: input.progress_report_id,
          category: input.category,
          detail: input.detail ?? null,
          requested_by_id: u?.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      // Route as a task to the authorization owner (or the BCBA if no owner set)
      const assignee =
        report?.authorization_owner_id ??
        report?.assigned_bcba_id ??
        u?.user?.id ??
        null;
      if (assignee && u?.user?.id && report) {
        const { data: task } = await supabase
          .from("user_tasks")
          .insert({
            title: `Progress report support: ${input.category.replace(/_/g, " ")} — ${report.client_identifier}`,
            description: input.detail ?? null,
            assignee_id: assignee,
            assigned_by_id: u.user.id,
            priority: (input.category === "authorization_help" ? "high" : "medium") as never,
            due_at: report.progress_report_due_date
              ? new Date(report.progress_report_due_date).toISOString()
              : null,
            related_record_type: "bcba_progress_report",
            related_record_id: input.progress_report_id,
            related_record_label: report.client_identifier,
            related_url: `/bcba/progress-reports?id=${input.progress_report_id}`,
          } as never)
          .select("id")
          .maybeSingle();
        if (task?.id) {
          await supabase
            .from("bcba_progress_report_support_requests")
            .update({ task_id: task.id })
            .eq("id", sr.id);
        }
      }

      await supabase.from("bcba_progress_report_activity").insert({
        progress_report_id: input.progress_report_id,
        event_type: "support_request",
        actor_id: u?.user?.id ?? null,
        message: `Support requested: ${input.category.replace(/_/g, " ")}`,
      });

      return sr as SupportRequest;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, "detail", vars.progress_report_id] });
    },
  });
}

// Given a due date + configured milestones, determine which milestone (if any)
// currently applies. Milestones are evaluated with the smallest matching
// days_before_expiration, so the most urgent applicable rule wins.
export function matchMilestone(
  daysRemaining: number | null,
  milestones: Milestone[],
  payer?: string | null,
  state?: string | null,
): Milestone | null {
  if (daysRemaining === null) return null;
  const applicable = milestones
    .filter((m) => m.is_active)
    .filter((m) => !m.payer || m.payer === payer)
    .filter((m) => !m.state || m.state === state)
    .filter((m) => daysRemaining <= m.days_before_expiration)
    .sort((a, b) => a.days_before_expiration - b.days_before_expiration);
  return applicable[0] ?? null;
}