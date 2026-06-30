import { supabase } from "@/integrations/supabase/client";
import type {
  StaffingMatchRow,
  StaffingMatchStatus,
  FamilyStaffingPreferenceRow,
  FamilyPreferenceType,
  FamilyPreferenceImportance,
  FamilyPreferenceStatus,
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

const PREFS_TABLE = "family_staffing_preferences" as never; // table not yet in generated types

export async function listFamilyPreferences(): Promise<FamilyStaffingPreferenceRow[]> {
  const { data, error } = await supabase
    .from(PREFS_TABLE)
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
    ? supabase.from(PREFS_TABLE).update(payload as never).eq("id", input.id).select().single()
    : supabase.from(PREFS_TABLE).insert(payload as never).select().single();
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as FamilyStaffingPreferenceRow;
}

export async function deleteFamilyPreference(id: string): Promise<void> {
  const { error } = await supabase.from(PREFS_TABLE).delete().eq("id", id);
  if (error) throw error;
}