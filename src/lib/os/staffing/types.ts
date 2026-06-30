/**
 * Canonical Staffing Team types for the OS workspace.
 * Backed by `public.staffing_matches` and `public.family_staffing_preferences`.
 */
export type StaffingMatchStatus = "Suggested" | "Pending" | "Assigned" | "Rejected";

export interface StaffingMatchRow {
  id: string;
  client_id: string;
  rbt_id: string;
  rbt_name: string;
  status: StaffingMatchStatus;
  match_score: number;
  distance_miles: number | null;
  availability_overlap: string[];
  capacity_remaining: number | null;
  notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type FamilyPreferenceType =
  | "schedule"
  | "language"
  | "gender"
  | "location"
  | "continuity"
  | "clinical_fit"
  | "family_request"
  | "other";

export type FamilyPreferenceImportance = "must_have" | "nice_to_have";
export type FamilyPreferenceStatus = "active" | "resolved" | "no_longer_applicable";

export interface FamilyStaffingPreferenceRow {
  id: string;
  client_id: string | null;
  client_name: string;
  state: string | null;
  preference_type: FamilyPreferenceType;
  preference_detail: string;
  importance: FamilyPreferenceImportance;
  status: FamilyPreferenceStatus;
  notes: string | null;
  linked_match_id: string | null;
  created_at: string;
  updated_at: string;
}

export const STAFFING_TABS = [
  "dashboard",
  "open-cases",
  "match-queue",
  "coverage",
  "preferences",
  "map",
  "apploi",
] as const;
export type StaffingTab = (typeof STAFFING_TABS)[number];