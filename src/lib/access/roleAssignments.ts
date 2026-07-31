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
    label: "Platform",
    roles: [
      { key: "super_admin", label: "Super Admin" },
      { key: "systems_admin", label: "Systems Admin" },
    ],
  },
  {
    label: "Executive / Leadership",
    roles: [
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
      { key: "regional_state_director", label: "Regional State Director" },
      { key: "state_va", label: "State VA" },
    ],
  },
  {
    label: "Growth & Marketing",
    roles: [
      { key: "director_of_marketing", label: "Director of Marketing" },
      { key: "marketing_team", label: "Marketing Team" },
      { key: "business_development", label: "Business Development" },
    ],
  },
  {
    label: "Intake & Admissions",
    roles: [
      { key: "director_of_intake", label: "Director of Intake" },
      { key: "intake_coordinator", label: "Intake Coordinator" },
    ],
  },
  {
    label: "Recruiting",
    roles: [
      { key: "director_of_recruiting", label: "Director of Recruiting" },
      { key: "recruiting_coordinator", label: "Recruiting Coordinator" },
    ],
  },
  {
    label: "Staffing",
    roles: [
      { key: "director_of_staffing", label: "Director of Staffing" },
      { key: "staffing_lead", label: "Staffing Lead" },
      { key: "staffing_coordinator", label: "Staffing Coordinator" },
    ],
  },
  {
    label: "Scheduling",
    roles: [
      { key: "director_of_scheduling", label: "Director of Scheduling" },
      { key: "scheduling_lead", label: "Scheduling Lead" },
      { key: "scheduling_coordinator", label: "Scheduling Coordinator" },
    ],
  },
  {
    label: "Authorizations",
    roles: [
      { key: "director_of_authorizations", label: "Director of Authorizations" },
      { key: "authorization_manager", label: "Authorization Manager" },
      { key: "authorization_coordinator", label: "Authorization Coordinator" },
    ],
  },
  {
    label: "QA / Compliance",
    roles: [
      { key: "qa_director", label: "QA Director" },
      { key: "qa_specialist", label: "QA Specialist" },
      { key: "qa_team", label: "QA / Compliance Team" },
    ],
  },
  {
    label: "Credentialing / RCM",
    roles: [
      { key: "credentialing_lead", label: "Credentialing Lead" },
      { key: "credentialing_coordinator", label: "Credentialing Coordinator" },
      { key: "rcm_team", label: "RCM Team" },
    ],
  },
  {
    label: "HR / People",
    roles: [
      { key: "hr_lead", label: "HR Lead" },
      { key: "hr_team", label: "HR Team" },
      { key: "payroll_lead", label: "Payroll Lead" },
      { key: "payroll_coordinator", label: "Payroll Coordinator" },
      { key: "office_manager", label: "Office Manager / HR Assistant" },
    ],
  },
  {
    label: "Clinical",
    roles: [
      { key: "clinic_growth", label: "Clinic Growth-to-Launch / Director of Clinics" },
      { key: "clinical_director", label: "Clinical Director" },
      { key: "clinical_lead", label: "Clinical Lead" },
      { key: "bcba", label: "BCBA" },
      { key: "rbt", label: "RBT" },
      { key: "behavioral_support", label: "Behavioral Support" },
      { key: "case_manager", label: "Case Manager" },
    ],
  },
  {
    label: "Finance / Billing",
    roles: [
      { key: "cfo", label: "CFO" },
      { key: "controller", label: "Controller" },
      { key: "finance_benefits_lead", label: "Finance / Benefits Lead" },
      { key: "finance_benefits_coordinator", label: "Finance / Benefits Coordinator" },
      { key: "billing_lead", label: "Billing Lead" },
      { key: "billing_coordinator", label: "Billing Coordinator" },
    ],
  },
  {
    label: "Training",
    roles: [{ key: "training_manager", label: "Training Manager / Enablement" }],
  },
];

/**
 * Retired / legacy role keys. These are NEVER assignable in User Management,
 * but they must remain readable so existing records render a human label and
 * still map to an OS role for backwards compatibility.
 */
export const LEGACY_ROLE_LABELS: Record<string, string> = {
  admin: "Super Admin (legacy)",
  exec: "Executive (legacy)",
  executive: "Executive (legacy)",
  executive_leadership: "Executive Leadership (legacy)",
  operations_leadership: "Operations Leadership (legacy)",
  ops_manager: "Operations Leadership (legacy)",
  intake: "Intake Team (legacy)",
  intake_lead: "Director of Intake (legacy key)",
  auth_team: "Authorization Team (legacy)",
  recruiting_lead: "Director of Recruiting (legacy key)",
  recruiting_team: "Recruiting Team (legacy)",
  recruiting_assistant: "Recruiting Team (legacy)",
  staffing: "Staffing Team (legacy)",
  staffing_team: "Staffing Team (legacy)",
  scheduling: "Scheduling Team (legacy)",
  scheduling_team: "Scheduling Team (legacy)",
  qa: "QA / Compliance (legacy)",
  credentialing: "Credentialing (legacy)",
  credentialing_team: "Credentialing Team (legacy)",
  hr: "HR (legacy)",
  finance: "Finance (legacy)",
  billing_finance: "Billing / Finance (legacy)",
  finance_benefits_team: "Finance / Benefits Team (legacy)",
  marketing: "Marketing (legacy)",
  marketing_growth_lead: "Marketing & Growth Lead (legacy key)",
  payroll_admin: "Payroll Coordinator (legacy)",
  training_admin: "Training Admin (legacy)",
  viewer: "Viewer (legacy)",
};

/** Flat list of assignable role keys (User Management dropdowns). */
export const ASSIGNABLE_ROLE_KEYS: string[] = ROLE_GROUPS.flatMap((g) =>
  g.roles.map((r) => r.key),
);

export function isAssignableRoleKey(roleKey: string): boolean {
  return ASSIGNABLE_ROLE_KEYS.includes(roleKey);
}

export function findRoleLabel(roleKey: string): string {
  for (const group of ROLE_GROUPS) {
    const hit = group.roles.find((r) => r.key === roleKey);
    if (hit) return hit.label;
  }
  if (LEGACY_ROLE_LABELS[roleKey]) return LEGACY_ROLE_LABELS[roleKey];
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
  regional_state_director: "regional_state_director",
  state_va: "state_va",
  director_of_intake: "intake_lead",
  intake_lead: "intake_lead",
  intake_coordinator: "intake_coordinator",
  intake: "intake_coordinator",
  director_of_recruiting: "recruiting_lead",
  recruiting_lead: "recruiting_lead",
  recruiting_coordinator: "recruiting_coordinator",
  recruiting_assistant: "recruiting_team",
  director_of_staffing: "staffing_lead",
  staffing_lead: "staffing_lead",
  staffing_coordinator: "staffing_coordinator",
  staffing: "staffing_team",
  director_of_scheduling: "scheduling_lead",
  scheduling_lead: "scheduling_lead",
  scheduling_coordinator: "scheduling_coordinator",
  scheduling: "scheduling_team",
  director_of_authorizations: "authorization_manager",
  authorization_manager: "authorization_manager",
  authorization_coordinator: "authorization_coordinator",
  auth_team: "authorization_coordinator",
  qa_director: "qa_director",
  qa_specialist: "qa_specialist",
  qa_team: "qa_team",
  qa: "qa_team",
  credentialing_lead: "credentialing_lead",
  credentialing_team: "credentialing_team",
  credentialing: "credentialing_team",
  credentialing_coordinator: "credentialing_team",
  hr_lead: "hr_lead",
  hr_admin: "hr_lead",
  hr_manager: "hr_lead",
  hr: "hr_team",
  hr_team: "hr_team",
  payroll_lead: "payroll_coordinator",
  payroll_admin: "payroll_coordinator",
  payroll_coordinator: "payroll_coordinator",
  office_manager: "office_manager",
  cfo: "billing_finance",
  controller: "billing_finance",
  finance_benefits_lead: "finance_benefits_lead",
  finance_benefits_team: "finance_benefits_team",
  finance_benefits_coordinator: "finance_benefits_team",
  finance: "billing_finance",
  billing_lead: "billing_lead",
  billing_coordinator: "billing_finance",
  billing_finance: "billing_finance",
  rcm_team: "rcm_team",
  clinic_growth: "clinic_growth",
  clinical_director: "clinical_director",
  clinical_lead: "clinical_director",
  bcba: "bcba",
  rbt: "rbt",
  behavioral_support: "behavioral_support",
  case_manager: "case_manager",
  director_of_marketing: "marketing_growth_lead",
  marketing_growth_lead: "marketing_growth_lead",
  marketing_team: "marketing_team",
  marketing: "marketing_team",
  business_development: "business_development",
  training_manager: "training_manager",
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
    return supabase
      .from("employee_role_assignments")
      .update(payload)
      .eq("id", input.id)
      .select()
      .maybeSingle();
  }
  return supabase
    .from("employee_role_assignments")
    .insert(payload)
    .select()
    .maybeSingle();
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
  // The unique index on (user_id, role_key, COALESCE(state_code,''), COALESCE(department_key,''))
  // is on expressions, which PostgREST cannot target via `onConflict`. Do a manual
  // load → update existing / insert missing pass so presets persist reliably.
  const drafts = preset.build(state);
  const existing = await loadAssignmentsForUser(userId);
  const sameKey = (a: { role_key: string; state_code: string | null; department_key: string | null }, b: typeof a) =>
    a.role_key === b.role_key &&
    (a.state_code ?? null) === (b.state_code ?? null) &&
    (a.department_key ?? null) === (b.department_key ?? null);

  for (const d of drafts) {
    const match = existing.find((e) =>
      sameKey(
        { role_key: e.role_key, state_code: e.state_code, department_key: e.department_key },
        { role_key: d.role_key, state_code: d.state_code, department_key: d.department_key },
      ),
    );
    if (match) {
      const { error } = await supabase
        .from("employee_role_assignments")
        .update({
          scope: d.scope,
          is_primary: d.is_primary,
          is_active: true,
          os_role_key: mapRoleKeyToOSRole(d.role_key),
        })
        .eq("id", match.id);
      if (error) return { error };
      if (d.is_primary) await setPrimary(userId, match.id);
    } else {
      const { data, error } = await supabase
        .from("employee_role_assignments")
        .insert({
          user_id: userId,
          employee_id: employeeId,
          role_key: d.role_key,
          state_code: d.state_code,
          department_key: d.department_key,
          scope: d.scope,
          is_primary: d.is_primary,
          is_active: true,
          os_role_key: mapRoleKeyToOSRole(d.role_key),
        })
        .select()
        .maybeSingle();
      if (error) return { error };
      if (d.is_primary && data?.id) await setPrimary(userId, data.id);
    }
  }
  return { error: null as null };
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