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