import { supabase } from "@/integrations/supabase/client";
import type {
  StaffingMatchRow,
  StaffingMatchStatus,
  FamilyStaffingPreferenceRow,
  FamilyPreferenceType,
  FamilyPreferenceImportance,
  FamilyPreferenceStatus,
  StaffingCaseActivityRow,
  StaffingActivityType,
  StaffingActivityStatus,
  StaffingIntegrationHandoffRow,
  IntegrationHandoffStatus,
} from "./types";

/* ------------------------------- matches -------------------------------- */

export async function listStaffingMatches(): Promise<StaffingMatchRow[]> {
  const { data, error } = await supabase
    .from("staffing_matches")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as StaffingMatchRow[]) ?? [];
}

export interface ProposeMatchInput {
  client_id: string;
  rbt_id: string;
  rbt_name: string;
  match_score?: number;
  distance_miles?: number | null;
  availability_overlap?: string[];
  capacity_remaining?: number | null;
  notes?: string;
}

export async function proposeMatch(input: ProposeMatchInput): Promise<StaffingMatchRow> {
  const payload = {
    client_id: input.client_id,
    rbt_id: input.rbt_id,
    rbt_name: input.rbt_name,
    status: "Pending" as StaffingMatchStatus,
    match_score: input.match_score ?? 0,
    distance_miles: input.distance_miles ?? null,
    availability_overlap: input.availability_overlap ?? [],
    capacity_remaining: input.capacity_remaining ?? null,
    notes: input.notes ?? "Proposed via Staffing workspace",
  };
  const { data, error } = await supabase
    .from("staffing_matches")
    .insert(payload as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as StaffingMatchRow;
}

export async function updateMatchStatus(
  id: string,
  status: StaffingMatchStatus,
  extra?: { rejection_reason?: string; notes?: string },
): Promise<StaffingMatchRow> {
  const { data, error } = await supabase
    .from("staffing_matches")
    .update({ status, ...(extra ?? {}) } as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as StaffingMatchRow;
}

/* --------------------------- family preferences -------------------------- */

export async function listFamilyPreferences(): Promise<FamilyStaffingPreferenceRow[]> {
  const { data, error } = await supabase
    .from("family_staffing_preferences")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as FamilyStaffingPreferenceRow[]) ?? [];
}

export interface UpsertFamilyPreferenceInput {
  id?: string;
  client_id?: string | null;
  client_name: string;
  state?: string | null;
  preference_type: FamilyPreferenceType;
  preference_detail: string;
  importance: FamilyPreferenceImportance;
  status?: FamilyPreferenceStatus;
  notes?: string | null;
}

export async function upsertFamilyPreference(
  input: UpsertFamilyPreferenceInput,
): Promise<FamilyStaffingPreferenceRow> {
  const payload = {
    client_id: input.client_id ?? null,
    client_name: input.client_name,
    state: input.state ?? null,
    preference_type: input.preference_type,
    preference_detail: input.preference_detail,
    importance: input.importance,
    status: input.status ?? "active",
    notes: input.notes ?? null,
  };
  const query = input.id
    ? supabase.from("family_staffing_preferences").update(payload).eq("id", input.id).select().single()
    : supabase.from("family_staffing_preferences").insert(payload).select().single();
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as FamilyStaffingPreferenceRow;
}

export async function deleteFamilyPreference(id: string): Promise<void> {
  const { error } = await supabase.from("family_staffing_preferences").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------------- staffing case activity -------------------------- */

export async function listCaseActivity(clientId?: string): Promise<StaffingCaseActivityRow[]> {
  let q = supabase.from("staffing_case_activity").select("*").order("created_at", { ascending: false });
  if (clientId) q = q.eq("client_id", clientId);
  const { data, error } = await q;
  if (error) throw error;
  return (data as unknown as StaffingCaseActivityRow[]) ?? [];
}

export interface UpsertCaseActivityInput {
  id?: string;
  client_id?: string | null;
  client_name: string;
  activity_type: StaffingActivityType;
  title: string;
  detail?: string | null;
  owner?: string | null;
  due_date?: string | null;
  status?: StaffingActivityStatus;
}

export async function upsertCaseActivity(input: UpsertCaseActivityInput): Promise<StaffingCaseActivityRow> {
  const payload = {
    client_id: input.client_id ?? null,
    client_name: input.client_name,
    activity_type: input.activity_type,
    title: input.title,
    detail: input.detail ?? null,
    owner: input.owner ?? null,
    due_date: input.due_date ?? null,
    status: input.status ?? "open",
  };
  const query = input.id
    ? supabase.from("staffing_case_activity").update(payload).eq("id", input.id).select().single()
    : supabase.from("staffing_case_activity").insert(payload).select().single();
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as StaffingCaseActivityRow;
}

export async function deleteCaseActivity(id: string): Promise<void> {
  const { error } = await supabase.from("staffing_case_activity").delete().eq("id", id);
  if (error) throw error;
}

/* --------------------- integration handoffs (Apploi) -------------------- */

export async function listIntegrationHandoffs(): Promise<StaffingIntegrationHandoffRow[]> {
  const { data, error } = await supabase
    .from("staffing_integration_handoffs")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as StaffingIntegrationHandoffRow[]) ?? [];
}

export interface UpsertIntegrationHandoffInput {
  id?: string;
  integration_record_id?: string | null;
  provider?: string | null;
  candidate_name: string;
  candidate_role?: string | null;
  state?: string | null;
  status: IntegrationHandoffStatus;
  hold_reason?: string | null;
  notes?: string | null;
  assigned_owner?: string | null;
}

export async function upsertIntegrationHandoff(
  input: UpsertIntegrationHandoffInput,
): Promise<StaffingIntegrationHandoffRow> {
  const payload = {
    integration_record_id: input.integration_record_id ?? null,
    provider: input.provider ?? null,
    candidate_name: input.candidate_name,
    candidate_role: input.candidate_role ?? null,
    state: input.state ?? null,
    status: input.status,
    hold_reason: input.hold_reason ?? null,
    notes: input.notes ?? null,
    assigned_owner: input.assigned_owner ?? null,
  };
  const query = input.id
    ? supabase.from("staffing_integration_handoffs").update(payload).eq("id", input.id).select().single()
    : supabase.from("staffing_integration_handoffs").insert(payload).select().single();
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as StaffingIntegrationHandoffRow;
}