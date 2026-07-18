import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SupervisionBrief {
  rbtEmployeeId: string;
  rbtName: string;
  assignments: Array<{ client_name: string | null; status: string | null; start_date: string | null }>;
  recentSchedule: Array<{ session_date: string; client_name: string | null; start_time: string | null; end_time: string | null; session_status: string | null }>;
  priorFeedback: Array<{ occurred_at: string; feedback: string | null; followup_action: string | null }>;
  openTraining: Array<{ course_id: string | null; status: string | null; assigned_at: string | null }>;
  submittedQuestions: Array<{ id: string; body: string | null; created_at: string; status: string | null }>;
  familyConcerns: Array<{ created_at: string; concern: string | null; status: string | null }>;
  first90Responses: Array<{ id: string; checkpoint_key: string | null; response: string | null; created_at: string }>;
  documentationConcerns: Array<{ id: string; label: string | null; missing: string[] }>;
  recentRecognition: Array<{ created_at: string; note: string | null }>;
  recommendedDiscussion: string[];
}

/**
 * Assembles the Supervision Preparation Brief. Every source read is
 * best-effort — missing data returns an empty section, not an error.
 */
export function useSupervisionBrief(rbtEmployeeId: string | null, rbtName: string) {
  return useQuery({
    queryKey: ["bcba-supervision-brief", rbtEmployeeId],
    enabled: !!rbtEmployeeId,
    queryFn: async (): Promise<SupervisionBrief> => {
      const id = rbtEmployeeId!;
      const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10);

      const [assignR, schedR, feedbackR, trainR, questionsR, familyR, first90R, recogR] = await Promise.all([
        supabase.from("rbt_client_assignments")
          .select("client_name,status,start_date")
          .eq("rbt_employee_id", id).neq("status", "ended"),
        supabase.from("rbt_sessions")
          .select("session_date,client_name,start_time,end_time,session_status")
          .eq("rbt_employee_id", id)
          .gte("session_date", fourteenDaysAgo)
          .order("session_date", { ascending: false }).limit(20),
        supabase.from("bcba_supervision_logs")
          .select("occurred_at,feedback,followup_action")
          .eq("provider_id", id)
          .order("occurred_at", { ascending: false }).limit(3),
        supabase.from("training_assignments")
          .select("course_id,status,assigned_at")
          .eq("assignee_id", id).neq("status", "completed")
          .order("assigned_at", { ascending: false }).limit(10),
        supabase.from("rbt_help_requests")
          .select("id,body,created_at,status")
          .eq("rbt_employee_id", id)
          .in("status", ["open", "in_progress", "awaiting"])
          .order("created_at", { ascending: false }).limit(10),
        supabase.from("case_manager_service_issues")
          .select("created_at,description,status")
          .eq("rbt_employee_id", id)
          .order("created_at", { ascending: false }).limit(5),
        supabase.from("rbt_journey_responses")
          .select("id,checkpoint_key,response,created_at")
          .eq("rbt_employee_id", id)
          .order("created_at", { ascending: false }).limit(5),
        supabase.from("rbt_performance_notes")
          .select("created_at,note,category")
          .eq("rbt_employee_id", id)
          .order("created_at", { ascending: false }).limit(5),
      ]);

      const recommended: string[] = [];
      if ((assignR.data ?? []).some(a => !a.status || a.status === "new")) recommended.push("Review new case assignments");
      if ((questionsR.data ?? []).length) recommended.push(`Answer ${(questionsR.data ?? []).length} RBT question(s)`);
      if ((familyR.data ?? []).length) recommended.push("Address open family/case concerns");
      if ((first90R.data ?? []).length) recommended.push("Follow up on First-90-day responses");
      if ((trainR.data ?? []).length) recommended.push("Confirm training progress");
      if ((feedbackR.data ?? []).length === 0) recommended.push("Set expectations — no prior feedback on record");

      return {
        rbtEmployeeId: id,
        rbtName,
        assignments:          (assignR.data   ?? []) as any,
        recentSchedule:       (schedR.data    ?? []) as any,
        priorFeedback:        (feedbackR.data ?? []) as any,
        openTraining:         (trainR.data    ?? []) as any,
        submittedQuestions:   ((questionsR.data ?? []) as any[]).map(q => ({ id: q.id, body: q.body ?? q.description ?? null, created_at: q.created_at, status: q.status })),
        familyConcerns:       ((familyR.data  ?? []) as any[]).map(r => ({ created_at: r.created_at, concern: r.description, status: r.status })),
        first90Responses:     (first90R.data  ?? []) as any,
        documentationConcerns: [],
        recentRecognition:    ((recogR.data   ?? []) as any[])
          .filter(n => (n.category ?? "").toLowerCase().includes("recogn") || (n.note ?? "").toLowerCase().includes("great") || (n.note ?? "").toLowerCase().includes("recognition"))
          .map(n => ({ created_at: n.created_at, note: n.note })),
        recommendedDiscussion: recommended,
      };
    },
  });
}