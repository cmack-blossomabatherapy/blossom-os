import { supabase } from "@/integrations/supabase/client";

/**
 * Durable HR audit/timeline helpers.
 *
 * These write to `hr_activity_events` (audit/timeline) and `hr_messages`
 * (durable message queue). Never use these to fake provider sends — see
 * `queueHrMessage` which explicitly records blocked/queued route status.
 */

export interface HrEventInput {
  eventType: string;
  title: string;
  description?: string | null;
  employeeId?: string | null;
  onboardingId?: string | null;
  caseId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logHrEvent(input: HrEventInput) {
  const { data: userRes } = await supabase.auth.getUser();
  const payload = {
    event_type: input.eventType,
    title: input.title,
    description: input.description ?? null,
    employee_id: input.employeeId ?? null,
    onboarding_id: input.onboardingId ?? null,
    case_id: input.caseId ?? null,
    metadata: (input.metadata ?? {}) as Record<string, unknown>,
    created_by: userRes?.user?.id ?? null,
  };
  return (supabase.from("hr_activity_events" as never) as any).insert(payload);
}

export type HrMessageChannel = "in_app" | "viventium" | "stellar_checks" | "centralreach" | "email" | "sms";

export interface QueueMessageInput {
  body: string;
  subject?: string | null;
  employeeId?: string | null;
  caseId?: string | null;
  channels: HrMessageChannel[];
  /**
   * Map of channel -> whether it is currently routable (provider connected
   * AND employee row synced). Non-routable channels are recorded as blocked.
   */
  routable?: Partial<Record<HrMessageChannel, boolean>>;
  scheduledFor?: string | null;
  metadata?: Record<string, unknown>;
}

export interface QueueMessageResult {
  id: string | null;
  status: "queued" | "sent" | "blocked" | "failed";
  routed: HrMessageChannel[];
  blocked: HrMessageChannel[];
}

/**
 * Persist a durable HR message. In-app is always considered delivered
 * (queued in Blossom OS). Provider channels are only marked "queued" when
 * the caller explicitly says the provider route is available. Otherwise
 * they are recorded as blocked with a `not_configured` reason.
 */
export async function queueHrMessage(input: QueueMessageInput): Promise<QueueMessageResult> {
  const { data: userRes } = await supabase.auth.getUser();
  const routable = input.routable ?? {};
  const routed: HrMessageChannel[] = [];
  const blocked: HrMessageChannel[] = [];
  const route_status: Record<string, { status: string; reason?: string }> = {};
  for (const ch of input.channels) {
    if (ch === "in_app") {
      route_status[ch] = { status: "queued" };
      routed.push(ch);
      continue;
    }
    if (routable[ch]) {
      route_status[ch] = { status: "queued" };
      routed.push(ch);
    } else {
      route_status[ch] = { status: "blocked", reason: "provider_not_configured_or_not_synced" };
      blocked.push(ch);
    }
  }
  const overall: QueueMessageResult["status"] = routed.length > 0 ? "queued" : "blocked";
  const payload = {
    employee_id: input.employeeId ?? null,
    case_id: input.caseId ?? null,
    subject: input.subject ?? null,
    body: input.body,
    channels: input.channels,
    route_status,
    status: overall,
    scheduled_for: input.scheduledFor ?? null,
    metadata: (input.metadata ?? {}) as Record<string, unknown>,
    created_by: userRes?.user?.id ?? null,
  };
  const { data, error } = await (supabase.from("hr_messages" as never) as any)
    .insert(payload)
    .select("id")
    .maybeSingle();
  if (error) {
    return { id: null, status: "failed", routed: [], blocked: input.channels };
  }
  // Best-effort audit event alongside the message.
  await logHrEvent({
    eventType: "hr_message_queued",
    title: input.subject ?? "HR message queued",
    description: input.body.slice(0, 240),
    employeeId: input.employeeId ?? null,
    caseId: input.caseId ?? null,
    metadata: { channels: input.channels, routed, blocked },
  });
  return { id: (data as any)?.id ?? null, status: overall, routed, blocked };
}