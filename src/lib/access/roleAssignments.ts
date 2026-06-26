/**
 * Multi-hat access model — shared types, presets, mapping, and Supabase helpers.
 *
 * Keep this file the *single source of truth* for:
 *   - department/state vocabularies
 *   - grouped role selector
 *   - growth-stage presets
 *   - role_key → OSRole mapping (consumed by OSRoleContext)
 *   - CRUD helpers for the employee_role_assignments table
 */
import { supabase } from "@/integrations/supabase/client";
import type { OSRole } from "@/lib/os/permissions";

export const STATE_CODES = ["GA", "NC", "VA", "TN", "MD", "NJ"] as const;
export type StateCode = (typeof STATE_CODES)[number];

export const DEPARTMENT_KEYS = [
  "state_operations",
  "intake",
  "recruiting",
  "staffing",
  "scheduling",
  "authorizations",
  "qa",
  "credentialing",
  "hr",
  "marketing",
  "business_development",
  "clinical",
  "billing",
  "payroll",
  "rcm",
  "finance",
  "training",
  "systems",
] as const;
export type DepartmentKey = (typeof DEPARTMENT_KEYS)[number];

export const DEPARTMENT_LABELS: Record<DepartmentKey, string> = {
  state_operations: "State Operations",
  intake: "Intake",
  recruiting: "Recruiting",
  staffing: "Staffing",
  scheduling: "Scheduling",
  authorizations: "Authorizations",
  qa: "QA / Compliance",
  credentialing: "Credentialing",
  hr: "HR / People",
  marketing: "Marketing",
  business_development: "Business Development",
  clinical: "Clinical",
  billing: "Billing",
  payroll: "Payroll",
  rcm: "RCM",
  finance: "Finance",
  training: "Training",
  systems: "Systems",
};

export const SCOPE_OPTIONS = ["company", "state", "department", "assigned"] as const;
export type AssignmentScope = (typeof SCOPE_OPTIONS)[number];

export const SCOPE_LABELS: Record<AssignmentScope, string> = {
  company: "Company-wide",
  state: "State scope",
  department: "Department scope",
  assigned: "Assigned records only",
};

/** A single role assignment row. Mirrors public.employee_role_assignments. */
export interface RoleAssignment {
  id: string;
  employee_id: string | null;
  user_id: string;
  role_key: string;
  os_role_key: string | null;
  state_code: StateCode | null;
  department_key: DepartmentKey | null;
  scope: AssignmentScope;
  is_primary: boolean;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  title_override: string | null;
  responsibility_notes: string | null;
  assigned_by: string | null;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/* Role catalog (grouped selector)                                    */
/* ------------------------------------------------------------------ */

export interface RoleOption {
  key: string;
  label: string;
}

export interface RoleGroup {
  label: string;
  roles: RoleOption[];
}

export const ROLE_GROUPS: RoleGroup[] = [
  {
    label: "Executive / Leadership",
    roles: [
      { key: "super_admin", label: "Super Admin" },
      { key: "systems_admin", label: "Systems Admin" },
      { key: "executive", label: "Executive" },
      { key: "coo", label: "COO" },
      { key: "director_of_operations", label: "Director of Operations" },
      { key: "operations_manager", label: "Operations Manager" },
    ],
  },
  {
    label: "State Operations",
    roles: [
      { key: "state_director", label: "State Director" },
      { key: "assistant_state_director", label: "Assistant State Director" },
    ],
  },
  {
    label: "Growth & Marketing",
    roles: [
      { key: "marketing_growth_lead", label: "Marketing & Growth Lead" },
      { key: "marketing_team", label: "Marketing Team" },
      { key: "business_development", label: "Business Development" },
    ],
  },
  {
    label: "Intake & Admissions",
    roles: [
      { key: "intake_lead", label: "Intake Lead" },
      { key: "intake_coordinator", label: "Intake Coordinator" },
    ],
  },
  {
    label: "Recruiting",
    roles: [
      { key: "recruiting_lead", label: "Recruiting Lead" },
      { key: "recruiting_coordinator", label: "Recruiting Coordinator" },
    ],
  },
  {
    label: "Staffing",
    roles: [
      { key: "staffing_lead", label: "Staffing Lead" },
      { key: "staffing_coordinator", label: "Staffing Coordinator" },
    ],
  },
  {
    label: "Scheduling",
    roles: [
      { key: "scheduling_lead", label: "Scheduling Lead" },
      { key: "scheduling_coordinator", label: "Scheduling Coordinator" },
    ],
  },
  {
    label: "Authorizations",
    roles: [
      { key: "authorization_manager", label: "Authorization Manager" },
      { key: "authorization_coordinator", label: "Authorization Coordinator" },
    ],
  },
  {
    label: "QA",
    roles: [
      { key: "qa_director", label: "QA Director" },
      { key: "qa_specialist", label: "QA Specialist" },
    ],
  },
  {
    label: "Credentialing / RCM",
    roles: [
      { key: "credentialing_lead", label: "Credentialing Lead" },
      { key: "credentialing_team", label: "Credentialing Team" },
      { key: "rcm_team", label: "RCM Team" },
    ],
  },
  {
    label: "HR / People",
    roles: [
      { key: "hr_lead", label: "HR Lead" },
      { key: "hr_team", label: "HR Team" },
      { key: "payroll_lead", label: "Payroll Lead" },
      { key: "payroll_admin", label: "Payroll Coordinator" },
    ],
  },
  {
    label: "Clinical",
    roles: [
      { key: "clinical_lead", label: "Clinical Lead" },
      { key: "bcba", label: "BCBA" },
      { key: "rbt", label: "RBT" },
      { key: "behavioral_support", label: "Behavioral Support" },
    ],
  },
  {
    label: "Finance",
    roles: [
      { key: "finance_benefits_lead", label: "Finance / Benefits Lead" },
      { key: "finance_benefits_team", label: "Finance / Benefits Team" },
      { key: "billing_lead", label: "Billing Lead" },
    ],
  },
  {
    label: "Training",
    roles: [{ key: "training_admin", label: "Training Admin" }],
  },
  {
    label: "Systems",
    roles: [
      { key: "admin", label: "Super Admin (legacy)" },
    ],
  },
];

export function findRoleLabel(roleKey: string): string {
  for (const group of ROLE_GROUPS) {
    const hit = group.roles.find((r) => r.key === roleKey);
    if (hit) return hit.label;
  }
  return roleKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ------------------------------------------------------------------ */
/* Role key → OS role mapping (single source of truth)                */
/* ------------------------------------------------------------------ */

const ROLE_KEY_TO_OS: Record<string, OSRole> = {
  admin: "super_admin",
  super_admin: "super_admin",
  systems_admin: "systems_admin",
  executive: "executive_leadership",
  exec: "executive_leadership",
  coo: "executive_leadership",
  director_of_operations: "operations_leadership",
  operations_manager: "operations_leadership",
  ops_manager: "operations_leadership",
  state_director: "state_director",
  assistant_state_director: "assistant_state_director",
  intake_lead: "intake_lead",
  intake_coordinator: "intake_coordinator",
  intake: "intake_coordinator",
  recruiting_lead: "recruiting_lead",
  recruiting_coordinator: "recruiting_coordinator",
  recruiting_assistant: "recruiting_team",
  staffing_lead: "staffing_lead",
  staffing_coordinator: "staffing_coordinator",
  staffing: "staffing_team",
  scheduling_lead: "scheduling_lead",
  scheduling_coordinator: "scheduling_coordinator",
  scheduling: "scheduling_team",
  authorization_manager: "authorization_manager",
  authorization_coordinator: "authorization_coordinator",
  auth_team: "authorization_coordinator",
  qa_director: "qa_director",
  qa_specialist: "qa_specialist",
  qa: "qa_team",
  credentialing_lead: "credentialing_lead",
  credentialing_team: "credentialing_team",
  credentialing: "credentialing_team",
  hr_lead: "hr_lead",
  hr_admin: "hr_lead",
  hr_manager: "hr_lead",
  hr: "hr_team",
  hr_team: "hr_team",
  payroll_lead: "payroll_coordinator",
  payroll_admin: "payroll_coordinator",
  payroll_coordinator: "payroll_coordinator",
  finance_benefits_lead: "finance_benefits_lead",
  finance_benefits_team: "finance_benefits_team",
  finance: "billing_finance",
  billing_lead: "billing_lead",
  rcm_team: "rcm_team",
  clinical_lead: "clinical_director",
  bcba: "bcba",
  rbt: "rbt",
  behavioral_support: "behavioral_support",
  marketing_growth_lead: "marketing_growth_lead",
  marketing_team: "marketing_team",
  marketing: "marketing_team",
  business_development: "business_development",
  training_admin: "hr_team",
};

export function mapRoleKeyToOSRole(roleKey: string): OSRole {
  return ROLE_KEY_TO_OS[roleKey] ?? "viewer";
}

/* ------------------------------------------------------------------ */
/* Growth-stage presets                                               */
/* ------------------------------------------------------------------ */

export type DraftAssignment = Pick<
  RoleAssignment,
  "role_key" | "state_code" | "department_key" | "scope" | "is_primary"
>;

export type PresetKey = "new_state" | "growing_state" | "mature_state";

export interface GrowthStagePreset {
  key: PresetKey;
  label: string;
  description: string;
  build: (state: StateCode) => DraftAssignment[];
}

export const GROWTH_STAGE_PRESETS: GrowthStagePreset[] = [
  {
    key: "new_state",
    label: "New / Small State",
    description:
      "Assistant State Director covers Intake, Recruiting, Staffing, and Scheduling personally.",
    build: (state) => [
      { role_key: "assistant_state_director", state_code: state, department_key: "state_operations", scope: "state", is_primary: true },
      { role_key: "intake_coordinator", state_code: state, department_key: "intake", scope: "department", is_primary: false },
      { role_key: "recruiting_coordinator", state_code: state, department_key: "recruiting", scope: "department", is_primary: false },
      { role_key: "staffing_coordinator", state_code: state, department_key: "staffing", scope: "department", is_primary: false },
      { role_key: "scheduling_coordinator", state_code: state, department_key: "scheduling", scope: "department", is_primary: false },
    ],
  },
  {
    key: "growing_state",
    label: "Growing State",
    description:
      "Assistant State Director keeps the macro hat. A Virtual Assistant owns Intake + Recruiting day-to-day.",
    build: (state) => [
      { role_key: "assistant_state_director", state_code: state, department_key: "state_operations", scope: "state", is_primary: true },
      { role_key: "intake_coordinator", state_code: state, department_key: "intake", scope: "department", is_primary: false },
      { role_key: "recruiting_coordinator", state_code: state, department_key: "recruiting", scope: "department", is_primary: false },
    ],
  },
  {
    key: "mature_state",
    label: "Mature State",
    description:
      "Dedicated coordinators per department. ASD/SD stay macro and only step in for escalations.",
    build: (state) => [
      { role_key: "assistant_state_director", state_code: state, department_key: "state_operations", scope: "state", is_primary: true },
      { role_key: "intake_coordinator", state_code: state, department_key: "intake", scope: "department", is_primary: false },
      { role_key: "recruiting_coordinator", state_code: state, department_key: "recruiting", scope: "department", is_primary: false },
      { role_key: "staffing_coordinator", state_code: state, department_key: "staffing", scope: "department", is_primary: false },
      { role_key: "scheduling_coordinator", state_code: state, department_key: "scheduling", scope: "department", is_primary: false },
      { role_key: "authorization_coordinator", state_code: state, department_key: "authorizations", scope: "department", is_primary: false },
      { role_key: "qa_specialist", state_code: state, department_key: "qa", scope: "department", is_primary: false },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Data access                                                         */
/* ------------------------------------------------------------------ */

export async function loadAssignmentsForUser(userId: string): Promise<RoleAssignment[]> {
  const { data, error } = await supabase
    .from("employee_role_assignments")
    .select("*")
    .eq("user_id", userId)
    .order("is_primary", { ascending: false })
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("loadAssignmentsForUser failed", error);
    return [];
  }
  return (data ?? []) as RoleAssignment[];
}

export async function loadAssignmentsForEmployee(employeeId: string): Promise<RoleAssignment[]> {
  const { data, error } = await supabase
    .from("employee_role_assignments")
    .select("*")
    .eq("employee_id", employeeId)
    .order("is_primary", { ascending: false })
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("loadAssignmentsForEmployee failed", error);
    return [];
  }
  return (data ?? []) as RoleAssignment[];
}

export interface UpsertAssignmentInput {
  id?: string;
  user_id: string;
  employee_id?: string | null;
  role_key: string;
  state_code?: StateCode | null;
  department_key?: DepartmentKey | null;
  scope: AssignmentScope;
  is_primary?: boolean;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  title_override?: string | null;
  responsibility_notes?: string | null;
}

export async function upsertAssignment(input: UpsertAssignmentInput) {
  const payload = {
    ...input,
    os_role_key: mapRoleKeyToOSRole(input.role_key),
  };
  if (input.id) {
    return supabase.from("employee_role_assignments").update(payload).eq("id", input.id);
  }
  return supabase.from("employee_role_assignments").insert(payload);
}

export async function deactivateAssignment(id: string) {
  return supabase
    .from("employee_role_assignments")
    .update({ is_active: false, is_primary: false })
    .eq("id", id);
}

export async function activateAssignment(id: string) {
  return supabase
    .from("employee_role_assignments")
    .update({ is_active: true })
    .eq("id", id);
}

export async function deleteAssignment(id: string) {
  return supabase.from("employee_role_assignments").delete().eq("id", id);
}

/** Atomically make one assignment primary (clears others first). */
export async function setPrimary(userId: string, assignmentId: string) {
  await supabase
    .from("employee_role_assignments")
    .update({ is_primary: false })
    .eq("user_id", userId);
  return supabase
    .from("employee_role_assignments")
    .update({ is_primary: true, is_active: true })
    .eq("id", assignmentId);
}

export async function applyPreset(
  userId: string,
  employeeId: string | null,
  preset: GrowthStagePreset,
  state: StateCode,
) {
  const drafts = preset.build(state).map((d) => ({
    ...d,
    user_id: userId,
    employee_id: employeeId,
    os_role_key: mapRoleKeyToOSRole(d.role_key),
    is_active: true,
  }));
  return supabase
    .from("employee_role_assignments")
    .upsert(drafts, { onConflict: "user_id,role_key,state_code,department_key", ignoreDuplicates: false });
}

/* ------------------------------------------------------------------ */
/* Pure helpers (testable, no Supabase)                                */
/* ------------------------------------------------------------------ */

export function deriveAllowedStates(assignments: RoleAssignment[]): StateCode[] {
  const set = new Set<StateCode>();
  for (const a of assignments) {
    if (a.is_active && a.state_code) set.add(a.state_code);
  }
  return Array.from(set);
}

export function deriveAllowedDepartmentsByState(
  assignments: RoleAssignment[],
): Record<string, DepartmentKey[]> {
  const map: Record<string, Set<DepartmentKey>> = {};
  for (const a of assignments) {
    if (!a.is_active || !a.department_key) continue;
    const stateKey = a.state_code ?? "__company__";
    if (!map[stateKey]) map[stateKey] = new Set<DepartmentKey>();
    map[stateKey].add(a.department_key);
  }
  const out: Record<string, DepartmentKey[]> = {};
  for (const [k, v] of Object.entries(map)) out[k] = Array.from(v);
  return out;
}

export interface HasHatOptions {
  state?: StateCode | null;
  department?: DepartmentKey | null;
}

export function hasHat(
  assignments: RoleAssignment[],
  roleKey: string,
  opts: HasHatOptions = {},
): boolean {
  return assignments.some(
    (a) =>
      a.is_active &&
      a.role_key === roleKey &&
      (opts.state == null || a.state_code == null || a.state_code === opts.state) &&
      (opts.department == null || a.department_key == null || a.department_key === opts.department),
  );
}

export function canAccessStateDepartment(
  assignments: RoleAssignment[],
  state: StateCode,
  department: DepartmentKey,
  legacyRoles: string[] = [],
): boolean {
  if (
    legacyRoles.some((r) =>
      ["admin", "super_admin", "systems_admin", "executive", "exec", "coo", "director_of_operations", "operations_manager", "ops_manager"].includes(r),
    )
  ) {
    return true;
  }
  return assignments.some(
    (a) =>
      a.is_active &&
      (a.scope === "company" ||
        ((a.state_code == null || a.state_code === state) &&
          (a.department_key == null || a.department_key === department))),
  );
}

/** Active hat — what the OS shell renders for. */
export interface OSHat {
  id: string;
  roleKey: string;
  osRole: OSRole;
  label: string;
  stateCode: StateCode | null;
  departmentKey: DepartmentKey | null;
  scope: AssignmentScope;
  isPrimary: boolean;
}

export function buildHats(assignments: RoleAssignment[]): OSHat[] {
  return assignments
    .filter((a) => a.is_active)
    .map((a) => ({
      id: a.id,
      roleKey: a.role_key,
      osRole: mapRoleKeyToOSRole(a.role_key),
      label: findRoleLabel(a.role_key),
      stateCode: a.state_code,
      departmentKey: a.department_key,
      scope: a.scope,
      isPrimary: a.is_primary,
    }));
}