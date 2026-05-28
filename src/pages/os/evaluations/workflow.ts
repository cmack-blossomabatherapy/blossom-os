import { supabase } from "@/integrations/supabase/client";
import type { EvalStaff, Evaluation, EvalCycle, EvalEmailTemplate } from "./types";

/**
 * Render a template string by replacing {{tokens}} with values.
 */
export function renderTemplate(s: string, vars: Record<string, string | null | undefined>) {
  return s.replace(/\{\{(\w+)\}\}/g, (_m, k) => (vars[k] ?? "").toString());
}

export function templateVars(args: {
  staff: EvalStaff;
  reviewer?: { first_name: string; last_name: string } | null;
  cycle?: EvalCycle | null;
  evaluation: Evaluation;
  formLink?: string;
  meetingLink?: string;
}): Record<string, string> {
  const { staff, reviewer, cycle, evaluation, formLink, meetingLink } = args;
  return {
    employee_first_name: staff.first_name,
    employee_full_name: `${staff.first_name} ${staff.last_name}`,
    role: staff.role,
    state: staff.state ?? "",
    evaluation_type: evaluation.evaluation_type,
    cycle_name: cycle?.name ?? "Ad-hoc cycle",
    due_date: evaluation.next_review_date ?? cycle?.final_due_date ?? "TBD",
    form_link: formLink ?? "",
    reviewer_name: reviewer ? `${reviewer.first_name} ${reviewer.last_name}` : "",
    meeting_link: meetingLink ?? "",
    company_name: "Blossom ABA Therapy",
  };
}

export function buildFormUrl(tokenId: string): string {
  return `${window.location.origin}/evaluations/form/${tokenId}`;
}

/**
 * Generate a new secure form token for an evaluation + response type
 * and return both the token row and the URL.
 */
export async function createFormToken(opts: {
  evaluationId: string;
  responseType: "Self" | "Leadership";
  recipientEmail: string;
  formId?: string | null;
}): Promise<{ tokenId: string; url: string } | { error: string }> {
  const { data, error } = await supabase
    .from("evaluation_form_tokens")
    .insert({
      evaluation_id: opts.evaluationId,
      response_type: opts.responseType,
      recipient_email: opts.recipientEmail,
      form_id: opts.formId ?? null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { tokenId: data.id as string, url: buildFormUrl(data.id as string) };
}

/**
 * Queue an evaluation email using a template, with token substitution.
 */
export async function queueEvaluationEmail(opts: {
  template: EvalEmailTemplate;
  recipientEmail: string;
  evaluationId: string;
  staffId: string;
  cycleId: string | null;
  vars: Record<string, string>;
  scheduledFor?: string | null;
}): Promise<{ error?: string }> {
  const subject = renderTemplate(opts.template.subject, opts.vars);
  const body = renderTemplate(opts.template.body, opts.vars);
  const { error } = await supabase.from("evaluation_emails").insert({
    evaluation_id: opts.evaluationId,
    staff_id: opts.staffId,
    cycle_id: opts.cycleId,
    recipient_email: opts.recipientEmail,
    email_type: opts.template.email_type,
    subject,
    body,
    template_key: opts.template.template_key,
    scheduled_send_at: opts.scheduledFor ?? null,
    status: "Queued",
  });
  return { error: error?.message };
}