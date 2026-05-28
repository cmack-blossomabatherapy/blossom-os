import { supabase } from "@/integrations/supabase/client";

export interface AuditEntry {
  id: string;
  evaluation_id: string | null;
  staff_id: string | null;
  action: string;
  actor: string | null;
  details_json: Record<string, unknown> | null;
  override_reason: string | null;
  created_at: string;
}

export async function logAudit(args: {
  evaluationId?: string | null;
  staffId?: string | null;
  action: string;
  actor?: string;
  details?: Record<string, unknown>;
  overrideReason?: string;
}) {
  await supabase.from("evaluation_audit_log").insert({
    evaluation_id: args.evaluationId ?? null,
    staff_id: args.staffId ?? null,
    action: args.action,
    actor: args.actor ?? "system",
    details_json: args.details ?? {},
    override_reason: args.overrideReason ?? null,
  });
}

export const AUDIT_LABELS: Record<string, string> = {
  evaluation_created: "Evaluation created",
  self_eval_sent: "Self evaluation sent",
  self_eval_submitted: "Self evaluation submitted",
  leadership_review_sent: "Leadership review sent",
  leadership_review_submitted: "Leadership review submitted",
  meeting_scheduled: "Meeting scheduled",
  meeting_completed: "Meeting completed",
  evaluation_finalized: "Evaluation finalized",
  evaluation_reopened: "Evaluation reopened",
  reminder_sent: "Reminder sent",
  email_failed: "Email failed",
  note_added: "Note added",
  status_changed: "Status changed",
  override_used: "Rule override used",
};