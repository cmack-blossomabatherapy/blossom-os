/**
 * Shared Intake communication audit trail.
 *
 * Every outbound action taken from the Intake Communications workspace (or any
 * other intake surface) routes through here so that:
 *  1. an `intake_communications` record is always written (audit trail),
 *  2. the lead's contact context (last contacted / attempt count) stays fresh,
 *  3. the lead's most recent open intake task gets an activity line so the
 *     follow-up owner sees the outreach in task context.
 *
 * Never throws — callers get a deterministic result they can surface via toast.
 */
import { supabase } from "@/integrations/supabase/client";
import type { CommunicationResult } from "@/lib/integrations/communications/communicationTypes";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type IntakeCommKind = "call" | "sms" | "email" | "note";

export type LogIntakeCommunicationInput = {
  leadId: string | null | undefined;
  kind: IntakeCommKind;
  preview: string;
  subject?: string | null;
  direction?: "inbound" | "outbound";
  loggedByName?: string | null;
  /** Optional template id (e.g. parent-communication template) for traceability. */
  templateId?: string | null;
};

export type LogIntakeCommunicationResult = {
  logged: boolean;
  reason?: string;
  commId?: string;
  leadContextUpdated: boolean;
  taskContextUpdated: boolean;
};

export function isPersistableLeadId(leadId: string | null | undefined): boolean {
  return !!leadId && UUID_RE.test(leadId);
}

/** Build the audit preview text for a communication record. */
export function buildCommPreview(input: {
  templateId?: string | null;
  channelLabel: string;
  body: string;
  outcomeMessage?: string | null;
}): string {
  const parts = [
    input.templateId ? `[${input.templateId}]` : null,
    input.channelLabel,
    input.body?.trim() ? `— ${input.body.trim().slice(0, 400)}` : null,
    input.outcomeMessage ? `(${input.outcomeMessage})` : null,
  ].filter(Boolean);
  return parts.join(" ");
}

export async function logIntakeCommunication(
  input: LogIntakeCommunicationInput,
): Promise<LogIntakeCommunicationResult> {
  if (!isPersistableLeadId(input.leadId)) {
    return {
      logged: false,
      reason: "Select a lead that is synced to the database to record this outreach.",
      leadContextUpdated: false,
      taskContextUpdated: false,
    };
  }
  const leadId = input.leadId as string;
  let actorName = input.loggedByName ?? null;
  let actorId: string | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    actorId = data.user?.id ?? null;
    actorName = actorName ?? data.user?.email ?? "Intake";
  } catch {
    actorName = actorName ?? "Intake";
  }

  const preview = input.templateId && !input.preview.includes(input.templateId)
    ? `[${input.templateId}] ${input.preview}`
    : input.preview;

  const { data: inserted, error } = await supabase
    .from("intake_communications")
    .insert({
      lead_id: leadId,
      communication_type: input.kind,
      direction: input.direction ?? "outbound",
      subject: input.subject ?? null,
      preview: preview.slice(0, 2000) || "Outreach logged",
      logged_by: actorId,
      logged_by_name: actorName,
    } as never)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      logged: false,
      reason: error.message,
      leadContextUpdated: false,
      taskContextUpdated: false,
    };
  }

  const nowIso = new Date().toISOString();
  let leadContextUpdated = false;
  let taskContextUpdated = false;

  // 2) Lead contact context.
  try {
    const { data: lead } = await supabase
      .from("intake_leads")
      .select("contact_attempts_count")
      .eq("id", leadId)
      .maybeSingle();
    const attempts = Number((lead as { contact_attempts_count?: number } | null)?.contact_attempts_count ?? 0);
    const { error: leadErr } = await supabase
      .from("intake_leads")
      .update({
        last_contacted_at: nowIso,
        last_contact_date: nowIso.slice(0, 10),
        contact_attempts_count: attempts + 1,
      } as never)
      .eq("id", leadId);
    leadContextUpdated = !leadErr;
  } catch {
    leadContextUpdated = false;
  }

  // 3) Task context — annotate the most recent open follow-up for this lead.
  try {
    const { data: task } = await supabase
      .from("intake_tasks")
      .select("id, notes")
      .eq("lead_id", leadId)
      .neq("status", "Completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const row = task as { id?: string; notes?: string | null } | null;
    if (row?.id) {
      const line = `${nowIso} · ${input.kind.toUpperCase()} sent by ${actorName}${input.templateId ? ` (${input.templateId})` : ""}`;
      const { error: taskErr } = await supabase
        .from("intake_tasks")
        .update({
          notes: row.notes ? `${row.notes}\n${line}` : line,
        } as never)
        .eq("id", row.id);
      taskContextUpdated = !taskErr;
    }
  } catch {
    taskContextUpdated = false;
  }

  return {
    logged: true,
    commId: (inserted as { id?: string } | null)?.id,
    leadContextUpdated,
    taskContextUpdated,
  };
}

/**
 * Log the audit trail for an adapter-driven outbound action. Blocked /
 * preview-only results are still recorded as notes so the audit trail shows
 * every attempt, including ones the operating mode short-circuited.
 */
export async function logCommunicationResult(
  result: CommunicationResult,
  extra: {
    leadId?: string | null;
    templateId?: string | null;
    subject?: string | null;
    body?: string;
    channelLabel?: string;
  } = {},
): Promise<LogIntakeCommunicationResult> {
  const kind: IntakeCommKind = result.previewOnly || !result.success
    ? "note"
    : result.action === "call"
      ? "call"
      : result.action === "sms" || result.action === "missing-info-reminder"
        ? "sms"
        : "email";
  return logIntakeCommunication({
    leadId: extra.leadId ?? result.leadId,
    kind,
    subject: extra.subject ?? null,
    templateId: extra.templateId ?? null,
    preview: buildCommPreview({
      templateId: extra.templateId,
      channelLabel: extra.channelLabel ?? result.action,
      body: extra.body ?? "",
      outcomeMessage: result.message,
    }),
  });
}
