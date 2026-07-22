import { supabase } from "@/integrations/supabase/client";

/**
 * Clinician identity — resolves an authenticated user to their employee row and,
 * when available, the CentralReach provider_id used across imported billing rows.
 *
 * Reconciliation strategy (in order):
 *   1. Stable ID: employees.centralreach_id (set by admin via reconcile RPC)
 *   2. Documented fallback: normalized full name matches a unique provider_name
 *      from bcba_productivity_billing_rows (mirrors the SQL view).
 *
 * Fallback matches are marked so the UI can surface freshness / ambiguity.
 */

export type IdentitySource = "centralreach_id" | "name_fallback" | "none";

export interface ClinicianIdentity {
  authUserId: string | null;
  employeeId: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  email: string | null;
  credential: string | null;
  centralreachId: string | null;
  identitySource: IdentitySource;
  /** True when identity came from name fallback and admin should verify. */
  needsVerification: boolean;
}

export function normalizePersonName(name: string | null | undefined): string {
  return (name ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function displayNameFor(row: {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}): string {
  const first = (row.first_name ?? "").trim();
  const last = (row.last_name ?? "").trim();
  const full = [first, last].filter(Boolean).join(" ");
  if (full) return full;
  const email = (row.email ?? "").trim();
  if (!email) return "Team member";
  // Never render a bare email as a display name — use the local part title-cased.
  const local = email.split("@")[0] ?? email;
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ") || "Team member";
}

export async function resolveClinicianIdentity(
  authUserId: string | null | undefined,
  opts?: { forcedEmployeeId?: string | null },
): Promise<ClinicianIdentity> {
  if (opts?.forcedEmployeeId) {
    const { data: e } = await supabase
      .from("employees")
      .select("id,user_id,first_name,last_name,email,credential,centralreach_id")
      .eq("id", opts.forcedEmployeeId)
      .maybeSingle();
    return toIdentity(e ?? null, authUserId ?? null);
  }
  if (!authUserId) return emptyIdentity();
  const { data: e } = await supabase
    .from("employees")
    .select("id,user_id,first_name,last_name,email,credential,centralreach_id")
    .eq("user_id", authUserId)
    .maybeSingle();
  if (e) return toIdentity(e, authUserId);
  // As a documented fallback, try email match to an employee record.
  const { data: userRow } = await supabase.auth.getUser();
  const email = userRow.user?.email ?? null;
  if (email) {
    const { data: byEmail } = await supabase
      .from("employees")
      .select("id,user_id,first_name,last_name,email,credential,centralreach_id")
      .eq("email", email)
      .maybeSingle();
    if (byEmail) return toIdentity(byEmail, authUserId);
  }
  return { ...emptyIdentity(), authUserId };
}

function toIdentity(e: any | null, authUserId: string | null): ClinicianIdentity {
  if (!e) return { ...emptyIdentity(), authUserId };
  return {
    authUserId,
    employeeId: e.id ?? null,
    firstName: e.first_name ?? null,
    lastName: e.last_name ?? null,
    displayName: displayNameFor(e),
    email: e.email ?? null,
    credential: e.credential ?? null,
    centralreachId: e.centralreach_id ?? null,
    identitySource: e.centralreach_id ? "centralreach_id" : e.id ? "name_fallback" : "none",
    needsVerification: !e.centralreach_id,
  };
}

function emptyIdentity(): ClinicianIdentity {
  return {
    authUserId: null,
    employeeId: null,
    firstName: null,
    lastName: null,
    displayName: "Team member",
    email: null,
    credential: null,
    centralreachId: null,
    identitySource: "none",
    needsVerification: true,
  };
}

export interface CrMappingDiagnosticRow {
  employee_id: string;
  auth_user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  credential: string | null;
  centralreach_id: string | null;
  mapping_status: "linked" | "ambiguous" | "candidate" | "unmatched";
  candidate_provider_id: string | null;
  candidate_provider_name: string | null;
}

export async function fetchCrMappingDiagnostics(): Promise<CrMappingDiagnosticRow[]> {
  const { data, error } = await supabase
    .from("v_clinician_cr_mapping" as any)
    .select("*")
    .order("mapping_status", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as CrMappingDiagnosticRow[];
}

export async function reconcileEmployeeCentralreachIds(): Promise<{
  linked: number; ambiguous: number; unmatched: number; total_employees: number;
}> {
  const { data, error } = await supabase.rpc("reconcile_employee_centralreach_ids" as any);
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    linked: Number(row?.linked ?? 0),
    ambiguous: Number(row?.ambiguous ?? 0),
    unmatched: Number(row?.unmatched ?? 0),
    total_employees: Number(row?.total_employees ?? 0),
  };
}

// =========================================================
// Phase 2 — Admin reconciliation APIs
// =========================================================
export interface CrReconcilePreviewRow {
  provider_id: string;
  provider_name: string | null;
  provider_name_key: string | null;
  suggested_employee_id: string | null;
  mapping_method: string;
  mapping_status: string;
  ambiguity_reason: string | null;
  currently_linked_employee_id: string | null;
  action: "auto_link" | "already_linked" | "already_linked_other" | "conflict" | "ambiguous" | "unmatched";
}

export interface CrReconcileSummary {
  auto_linked: number;
  already_linked: number;
  conflicts: number;
  ambiguous: number;
  unmatched: number;
  queue_rows: number;
}

export async function previewCrReconciliation(): Promise<CrReconcilePreviewRow[]> {
  const { data, error } = await supabase.rpc("preview_cr_employee_reconciliation" as any);
  if (error) throw error;
  return (data ?? []) as CrReconcilePreviewRow[];
}

export async function applyCrReconciliation(dryRun = false): Promise<CrReconcileSummary> {
  const { data, error } = await supabase.rpc("apply_cr_employee_reconciliation" as any, { _dry_run: dryRun });
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

export async function confirmCrProviderMapping(providerId: string, employeeId: string, reason?: string) {
  const { error } = await supabase.rpc("confirm_cr_provider_mapping" as any, {
    _provider_id: providerId, _employee_id: employeeId, _reason: reason ?? null,
  });
  if (error) throw error;
  return true;
}

export async function rejectCrProviderMapping(providerId: string, reason?: string) {
  const { error } = await supabase.rpc("reject_cr_provider_mapping" as any, {
    _provider_id: providerId, _reason: reason ?? null,
  });
  if (error) throw error;
  return true;
}

export async function unlinkCrProviderMapping(employeeId: string, reason?: string) {
  const { error } = await supabase.rpc("unlink_cr_provider_mapping" as any, {
    _employee_id: employeeId, _reason: reason ?? null,
  });
  if (error) throw error;
  return true;
}

export interface CrIdentityQueueRow {
  provider_id: string;
  provider_name: string | null;
  provider_name_key: string | null;
  suggested_employee_id: string | null;
  mapping_method: string;
  mapping_status: "pending" | "confirmed" | "rejected" | "manual_paired" | "auto_linked" | "conflict";
  ambiguity_reason: string | null;
  resolved_employee_id: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  notes: string | null;
  updated_at: string;
}

export async function fetchCrIdentityQueue(status?: CrIdentityQueueRow["mapping_status"]): Promise<CrIdentityQueueRow[]> {
  let q = supabase.from("cr_identity_mapping_queue" as any).select("*").order("updated_at", { ascending: false }).limit(1000);
  if (status) q = q.eq("mapping_status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as CrIdentityQueueRow[];
}