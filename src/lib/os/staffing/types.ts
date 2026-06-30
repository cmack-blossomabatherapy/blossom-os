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

export type FamilyPreferenceImportance = "must_have" | "nice_to_have" | "avoid";
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

/* ---------------------- case activity & handoffs ----------------------- */

export type StaffingActivityType =
  | "note"
  | "escalation"
  | "blocked"
  | "task"
  | "handoff"
  | "status_change";

export type StaffingActivityStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "watching"
  | "cancelled";

export interface StaffingCaseActivityRow {
  id: string;
  client_id: string | null;
  client_name: string;
  activity_type: StaffingActivityType;
  title: string;
  detail: string | null;
  owner: string | null;
  due_date: string | null;
  status: StaffingActivityStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type IntegrationHandoffStatus =
  | "ready_for_staffing"
  | "added_to_pool"
  | "hold"
  | "returned_to_recruiting";

export interface StaffingIntegrationHandoffRow {
  id: string;
  integration_record_id: string | null;
  provider: string | null;
  candidate_name: string;
  candidate_role: string | null;
  state: string | null;
  status: IntegrationHandoffStatus;
  hold_reason: string | null;
  notes: string | null;
  assigned_owner: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}