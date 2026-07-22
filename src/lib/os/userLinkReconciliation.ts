import { supabase } from "@/integrations/supabase/client";

/**
 * Phase 3 — Employee ↔ auth.users reconciliation client.
 *
 * All writes route through admin-gated SECURITY DEFINER RPCs. Automatic
 * writes are limited to unique exact-email matches; every other case lands
 * in `public.user_link_queue` for manual review.
 */

export type UserLinkAction =
  | "auto_link"
  | "already_linked"
  | "ambiguous"
  | "conflict"
  | "unmatched";

export interface UserLinkPreviewRow {
  employee_id: string;
  employee_email: string | null;
  first_name: string | null;
  last_name: string | null;
  action: UserLinkAction;
  candidate_user_id: string | null;
  candidate_email: string | null;
  match_method: "exact_email" | "no_auth_match" | string;
  ambiguity_reason: string | null;
}

export interface UserLinkApplySummary {
  auto_linked: number;
  already_linked: number;
  conflicts: number;
  ambiguous: number;
  unmatched: number;
  queue_rows: number;
}

export interface UserLinkQueueRow {
  employee_id: string;
  employee_email: string | null;
  candidate_user_id: string | null;
  candidate_email: string | null;
  match_method: string;
  status: "pending" | "auto_linked" | "manual_paired" | "rejected" | "conflict" | "ambiguous" | "unmatched";
  ambiguity_reason: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  notes: string | null;
  updated_at: string;
}

export async function previewEmployeeUserReconciliation(): Promise<UserLinkPreviewRow[]> {
  const { data, error } = await supabase.rpc("preview_employee_user_reconciliation" as any);
  if (error) throw error;
  return (data ?? []) as UserLinkPreviewRow[];
}

export async function applyEmployeeUserReconciliation(dryRun = false): Promise<UserLinkApplySummary> {
  const { data, error } = await supabase.rpc("apply_employee_user_reconciliation" as any, { _dry_run: dryRun });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    auto_linked: Number(row?.auto_linked ?? 0),
    already_linked: Number(row?.already_linked ?? 0),
    conflicts: Number(row?.conflicts ?? 0),
    ambiguous: Number(row?.ambiguous ?? 0),
    unmatched: Number(row?.unmatched ?? 0),
    queue_rows: Number(row?.queue_rows ?? 0),
  };
}

export async function confirmEmployeeUserLink(employeeId: string, userId: string, reason?: string) {
  const { error } = await supabase.rpc("confirm_employee_user_link" as any, {
    _employee_id: employeeId, _user_id: userId, _reason: reason ?? null,
  });
  if (error) throw error;
  return true;
}

export async function rejectEmployeeUserLink(employeeId: string, reason?: string) {
  const { error } = await supabase.rpc("reject_employee_user_link" as any, {
    _employee_id: employeeId, _reason: reason ?? null,
  });
  if (error) throw error;
  return true;
}

export async function unlinkEmployeeUser(employeeId: string, reason?: string) {
  const { error } = await supabase.rpc("unlink_employee_user" as any, {
    _employee_id: employeeId, _reason: reason ?? null,
  });
  if (error) throw error;
  return true;
}

export async function fetchUserLinkQueue(status?: UserLinkQueueRow["status"]): Promise<UserLinkQueueRow[]> {
  let q = supabase.from("user_link_queue" as any).select("*").order("updated_at", { ascending: false }).limit(1000);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as UserLinkQueueRow[];
}