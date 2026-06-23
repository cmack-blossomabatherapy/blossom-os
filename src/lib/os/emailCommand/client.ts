import { supabase } from "@/integrations/supabase/client";
import { classifyEmail, type RoutingResult } from "./routingRules";

const db = supabase as any;

export interface EmailCommandItem {
  id: string;
  user_id: string;
  external_message_id: string;
  conversation_id: string | null;
  provider: string;
  sender_name: string | null;
  sender_email: string | null;
  subject: string | null;
  received_at: string | null;
  is_unread: boolean;
  importance: string | null;
  category: string | null;
  status: string;
  workflow_tag: string | null;
  suggested_owner: string | null;
  urgency: string | null;
  risk_level: string | null;
  web_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailRecommendation {
  id: string;
  email_command_item_id: string;
  user_id: string;
  ai_summary: string | null;
  recommended_action: string | null;
  recommended_channel: string | null;
  suggested_owner: string | null;
  confidence: number | null;
  reason: string | null;
  workflow_tag: string | null;
  draft_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailActionQueueRow {
  id: string;
  email_command_item_id: string;
  recommendation_id: string | null;
  user_id: string;
  action_type: string;
  action_payload: Record<string, any>;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailAuditRow {
  id: string;
  email_command_item_id: string | null;
  action_queue_id: string | null;
  actor_user_id: string;
  action_type: string;
  provider: string | null;
  status: string;
  payload_summary: string | null;
  error_message: string | null;
  created_at: string;
}

export async function listItems(userId: string): Promise<EmailCommandItem[]> {
  const { data, error } = await db
    .from("email_command_items")
    .select("*")
    .eq("user_id", userId)
    .order("received_at", { ascending: false })
    .limit(100);
  if (error) return [];
  return data ?? [];
}

export async function listRecommendations(userId: string): Promise<EmailRecommendation[]> {
  const { data, error } = await db
    .from("email_recommendations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return [];
  return data ?? [];
}

export async function listQueue(userId: string): Promise<EmailActionQueueRow[]> {
  const { data, error } = await db
    .from("email_action_queue")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return [];
  return data ?? [];
}

export async function listAudit(userId: string): Promise<EmailAuditRow[]> {
  const { data, error } = await db
    .from("email_action_audit")
    .select("*")
    .eq("actor_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return [];
  return data ?? [];
}

export async function deleteItem(id: string) {
  await db.from("email_command_items").delete().eq("id", id);
}

/** Trigger a fresh Outlook metadata sync, then analyze new items locally. */
export async function syncAndAnalyze(): Promise<{ ok: boolean; received?: number; analyzed?: number; error?: string }> {
  const { data, error } = await db.functions.invoke("mail-analyze", { body: {} });
  if (error) return { ok: false, error: error.message };
  return data;
}

/** On-demand: fetch a single email body via the edge function. Never persisted. */
export async function fetchEmailBody(externalMessageId: string): Promise<{ ok: boolean; body?: string; bodyType?: string; error?: string }> {
  const { data, error } = await db.functions.invoke("mail-detail", {
    body: { messageId: externalMessageId },
  });
  if (error) return { ok: false, error: error.message };
  return data;
}

/** Approve and execute an action queue item. */
export async function approveAction(
  queueId: string,
  edits?: Record<string, any>,
): Promise<{ ok: boolean; error?: string; status?: string }> {
  const { data, error } = await db.functions.invoke("mail-action", {
    body: { queueId, edits },
  });
  if (error) return { ok: false, error: error.message };
  return data;
}

/** Create a pending action queue row (no external send until approved). */
export async function queueAction(args: {
  itemId: string;
  recommendationId?: string | null;
  userId: string;
  actionType: string;
  payload: Record<string, any>;
}): Promise<EmailActionQueueRow | null> {
  const { data, error } = await db
    .from("email_action_queue")
    .insert({
      email_command_item_id: args.itemId,
      recommendation_id: args.recommendationId ?? null,
      user_id: args.userId,
      action_type: args.actionType,
      action_payload: args.payload,
      status: "pending_approval",
    })
    .select()
    .single();
  if (error) return null;
  return data as EmailActionQueueRow;
}

export async function updateQueueStatus(queueId: string, patch: Partial<EmailActionQueueRow>) {
  await db.from("email_action_queue").update(patch).eq("id", queueId);
}

/** Convenience: reclassify a single item locally (no AI call). */
export function classifyItemLocally(item: EmailCommandItem): RoutingResult {
  return classifyEmail({
    subject: item.subject,
    sender_email: item.sender_email,
    sender_name: item.sender_name,
  });
}
