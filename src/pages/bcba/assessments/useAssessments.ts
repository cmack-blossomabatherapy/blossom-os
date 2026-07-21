import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AssessmentStatus, TreatmentPlanStatus } from "./pipeline";

export interface Assessment {
  id: string;
  client_id: string | null;
  client_identifier: string;
  assigned_bcba_id: string | null;
  assigned_bcba_name: string | null;
  qa_reviewer_id: string | null;
  qa_reviewer_name: string | null;
  owner_id: string | null;
  owner_name: string | null;
  assessment_type: string;
  status: AssessmentStatus;
  status_entered_at: string;
  assessment_date: string | null;
  due_date: string | null;
  missing_item: string | null;
  next_action: string | null;
  authorization_id: string | null;
  authorization_dependency: string | null;
  centralreach_client_url: string | null;
  centralreach_assessment_url: string | null;
  notes: string | null;
  on_hold_reason: string | null;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface TreatmentPlan {
  id: string;
  assessment_id: string;
  status: TreatmentPlanStatus;
  status_entered_at: string;
  drafted_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  sent_to_auth_at: string | null;
  completed_at: string | null;
  centralreach_plan_url: string | null;
  parent_signature_url: string | null;
  next_action: string | null;
  owner_id: string | null;
  owner_name: string | null;
}

export interface QaFeedback {
  id: string;
  assessment_id: string;
  treatment_plan_id: string | null;
  correction_category: string;
  reviewer_id: string | null;
  reviewer_name: string | null;
  date_returned: string;
  due_date: string | null;
  comment: string;
  supporting_link: string | null;
  supporting_file_url: string | null;
  resubmission_date: string | null;
  resolution: string | null;
  resolution_status: "open" | "in_progress" | "resolved" | "waived";
  is_repeat_issue: boolean;
  task_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityEvent {
  id: string;
  assessment_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  actor_id: string | null;
  actor_name: string | null;
  message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const KEY = ["bcba_assessments"] as const;

export function useAssessments(opts?: { onlyMine?: boolean; scopedAuthUserId?: string | null }) {
  const scoped = opts?.scopedAuthUserId ?? null;
  return useQuery({
    queryKey: [...KEY, opts?.onlyMine ?? false, scoped ?? "self"],
    queryFn: async (): Promise<Assessment[]> => {
      let q = supabase.from("bcba_assessments").select("*").order("updated_at", { ascending: false });
      if (opts?.onlyMine) {
        let uid = scoped;
        if (!uid) {
          const { data: userData } = await supabase.auth.getUser();
          uid = userData?.user?.id ?? null;
        }
        if (uid) q = q.eq("assigned_bcba_id", uid);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Assessment[];
    },
  });
}

export function useAssessment(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "detail", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const [a, tp, qa, act] = await Promise.all([
        supabase.from("bcba_assessments").select("*").eq("id", id).maybeSingle(),
        supabase.from("bcba_treatment_plans").select("*").eq("assessment_id", id).order("created_at", { ascending: false }),
        supabase.from("bcba_assessment_qa_feedback").select("*").eq("assessment_id", id).order("date_returned", { ascending: false }),
        supabase.from("bcba_assessment_activity").select("*").eq("assessment_id", id).order("created_at", { ascending: false }).limit(100),
      ]);
      if (a.error) throw a.error;
      return {
        assessment: a.data as Assessment | null,
        plans: (tp.data ?? []) as TreatmentPlan[],
        feedback: (qa.data ?? []) as QaFeedback[],
        activity: (act.data ?? []) as ActivityEvent[],
      };
    },
  });
}

export function useUpdateAssessmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AssessmentStatus }) => {
      const { error } = await supabase.from("bcba_assessments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Assessment> & { id: string }) => {
      const { id, ...fields } = patch;
      const { error } = await supabase.from("bcba_assessments").update(fields).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCreateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Assessment> & { client_identifier: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        ...input,
        created_by: userData?.user?.id ?? null,
        assigned_bcba_id: input.assigned_bcba_id ?? userData?.user?.id ?? null,
      };
      const { data, error } = await supabase.from("bcba_assessments").insert(payload).select().single();
      if (error) throw error;
      return data as Assessment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAddQaFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<QaFeedback> & { assessment_id: string; correction_category: string; comment: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        ...input,
        reviewer_id: input.reviewer_id ?? userData?.user?.id ?? null,
      };
      const { data, error } = await supabase.from("bcba_assessment_qa_feedback").insert(payload).select().single();
      if (error) throw error;

      // Create an actionable task for the assigned BCBA
      const { data: a } = await supabase
        .from("bcba_assessments")
        .select("assigned_bcba_id, client_identifier")
        .eq("id", input.assessment_id)
        .maybeSingle();
      if (a?.assigned_bcba_id && userData?.user?.id) {
        const { data: task } = await supabase
          .from("user_tasks")
          .insert({
            title: `QA correction: ${input.correction_category} — ${a.client_identifier}`,
            description: input.comment,
            assignee_id: a.assigned_bcba_id,
            assigned_by_id: userData.user.id,
            priority: "high",
            due_at: input.due_date ? new Date(input.due_date).toISOString() : null,
            related_record_type: "bcba_assessment",
            related_record_id: input.assessment_id,
            related_record_label: a.client_identifier,
            related_url: `/bcba/assessments?id=${input.assessment_id}`,
          })
          .select("id")
          .maybeSingle();
        if (task?.id) {
          await supabase.from("bcba_assessment_qa_feedback").update({ task_id: task.id }).eq("id", data.id);
        }
      }
      // Move assessment into qa_changes_requested if it isn't already
      await supabase.from("bcba_assessments")
        .update({ status: "qa_changes_requested" })
        .eq("id", input.assessment_id);

      return data as QaFeedback;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, "detail", vars.assessment_id] });
    },
  });
}

export function useResolveQaFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resolution, resolution_status }: { id: string; resolution: string; resolution_status: QaFeedback["resolution_status"] }) => {
      const { error } = await supabase
        .from("bcba_assessment_qa_feedback")
        .update({ resolution, resolution_status, resubmission_date: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpsertTreatmentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<TreatmentPlan> & { assessment_id: string }) => {
      const { data: existing } = await supabase
        .from("bcba_treatment_plans")
        .select("id")
        .eq("assessment_id", input.assessment_id)
        .maybeSingle();
      if (existing?.id) {
        const { error } = await supabase.from("bcba_treatment_plans").update(input).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bcba_treatment_plans").insert(input);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, "detail", vars.assessment_id] });
    },
  });
}