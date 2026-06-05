/**
 * Blossom OS RBAC (Pass 1)
 *
 * Source-of-truth model for department-based access. Maps existing AppRoles
 * into departments, layers, role levels, and scopes — without removing any
 * existing role. Navigation/route gating helpers continue to live in
 * `navigationAccess.ts`; this module provides the structured access profile
 * those gates can consult going forward.
 *
 * See docs/department-access-model.md for the full architecture.
 */

import type { AppRole } from "@/lib/roles";

// ---------------------------------------------------------------------------
// Layers (department groups)
// ---------------------------------------------------------------------------

export type DepartmentLayer =
  | "company_control"
  | "client_acquisition"
  | "client_care_lifecycle"
  | "people_operations"
  | "geographic_operations"
  | "business_systems";

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

export type Department =
  // Company Control
  | "executive_leadership"
  | "operations_leadership"
  | "reports_analytics"
  | "super_admin"
  // Client Acquisition
  | "marketing"
  | "intake_leads"
  | "benefits_vob"
  | "payment_plans"
  // Client Care Lifecycle
  | "clients_case_management"
  | "authorizations"
  | "progress_reports_reauth"
  | "scheduling"
  | "staffing"
  | "clinical"
  | "qa_compliance"
  // People Operations
  | "hr"
  | "recruiting"
  | "training_clinical_support"
  | "payroll"
  // Geographic Operations
  | "state_leadership"
  | "state_operations"
  | "georgia_clinic_operations"
  // Business / Systems
  | "finance"
  | "billing_revenue_cycle"
  | "systems_it"
  | "integrations_external"
  | "compliance_legal_credentialing";

export const DEPARTMENTS_BY_LAYER: Record<DepartmentLayer, Department[]> = {
  company_control: ["executive_leadership", "operations_leadership", "reports_analytics", "super_admin"],
  client_acquisition: ["marketing", "intake_leads", "benefits_vob", "payment_plans"],
  client_care_lifecycle: [
    "clients_case_management",
    "authorizations",
    "progress_reports_reauth",
    "scheduling",
    "staffing",
    "clinical",
    "qa_compliance",
  ],
  people_operations: ["hr", "recruiting", "training_clinical_support", "payroll"],
  geographic_operations: ["state_leadership", "state_operations", "georgia_clinic_operations"],
  business_systems: [
    "finance",
    "billing_revenue_cycle",
    "systems_it",
    "integrations_external",
    "compliance_legal_credentialing",
  ],
};

export function layerForDepartment(dept: Department): DepartmentLayer {
  for (const layer of Object.keys(DEPARTMENTS_BY_LAYER) as DepartmentLayer[]) {
    if (DEPARTMENTS_BY_LAYER[layer].includes(dept)) return layer;
  }
  throw new Error(`No layer for department ${dept}`);
}

// ---------------------------------------------------------------------------
// Role levels & scopes
// ---------------------------------------------------------------------------

export type RoleLevel = "staff" | "lead" | "manager" | "director" | "executive" | "super_admin";

export type AccessScope = "self" | "team" | "department" | "state" | "company";

const ROLE_LEVEL_RANK: Record<RoleLevel, number> = {
  staff: 1,
  lead: 2,
  manager: 3,
  director: 4,
  executive: 5,
  super_admin: 6,
};

const SCOPE_RANK: Record<AccessScope, number> = {
  self: 1,
  team: 2,
  department: 3,
  state: 4,
  company: 5,
};

// ---------------------------------------------------------------------------
// Permission categories
// ---------------------------------------------------------------------------

/**
 * Coarse permission keys used by RBAC helpers. Existing per-feature permission
 * strings (e.g. "clients.view") still flow through `useAuth().hasPerm`; these
 * are intentionally broader and capability-shaped so dept managers can grant
 * a consistent bundle without listing every per-route key.
 */
export type RbacPermission =
  | "view_department_workspace"
  | "view_department_reports"
  | "manage_department_team"
  | "view_team_pipeline"
  | "view_team_tasks"
  | "view_state_dashboards"
  | "manage_state_operations"
  | "view_company_reports"
  | "manage_company_settings"
  | "manage_permissions"
  | "manage_integrations"
  | "view_payroll"
  | "manage_payroll"
  | "view_phi"
  | "manage_workflows"
  | "manage_automations";

// ---------------------------------------------------------------------------
// AppRole → RBAC mapping
// ---------------------------------------------------------------------------

export interface RoleRbacMapping {
  /** Primary department for this role. */
  department: Department;
  /** Additional departments this role can also see (read-only or workspace access). */
  additionalDepartments?: Department[];
  level: RoleLevel;
  scope: AccessScope;
  /** Department-level permissions granted directly by this role. */
  permissions: RbacPermission[];
}

/**
 * Pass 1 mapping. Conservative — mirrors current behavior in
 * navigationAccess.ts while attaching department/layer/level metadata.
 * Some roles (admin/exec/ops_manager) keep company scope so existing
 * "full navigation" checks continue to pass.
 */
export const ROLE_RBAC: Partial<Record<AppRole, RoleRbacMapping>> = {
  admin: {
    department: "super_admin",
    level: "super_admin",
    scope: "company",
    permissions: [
      "view_department_workspace",
      "view_department_reports",
      "manage_department_team",
      "view_team_pipeline",
      "view_team_tasks",
      "view_state_dashboards",
      "manage_state_operations",
      "view_company_reports",
      "manage_company_settings",
      "manage_permissions",
      "manage_integrations",
      "view_payroll",
      "manage_payroll",
      "view_phi",
      "manage_workflows",
      "manage_automations",
    ],
  },
  exec: {
    department: "executive_leadership",
    level: "executive",
    scope: "company",
    permissions: [
      "view_department_workspace",
      "view_department_reports",
      "view_team_pipeline",
      "view_team_tasks",
      "view_state_dashboards",
      "view_company_reports",
    ],
  },
  ops_manager: {
    department: "operations_leadership",
    level: "director",
    scope: "company",
    permissions: [
      "view_department_workspace",
      "view_department_reports",
      "manage_department_team",
      "view_team_pipeline",
      "view_team_tasks",
      "view_state_dashboards",
      "manage_state_operations",
      "view_company_reports",
      "manage_workflows",
      "manage_automations",
    ],
  },
  state_director: {
    department: "state_leadership",
    additionalDepartments: [
      "state_operations",
      "intake_leads",
      "authorizations",
      "scheduling",
      "staffing",
      "clients_case_management",
      "recruiting",
    ],
    level: "director",
    scope: "state",
    permissions: [
      "view_department_workspace",
      "view_department_reports",
      "view_team_pipeline",
      "view_team_tasks",
      "view_state_dashboards",
      "manage_state_operations",
    ],
  },
  clinic_director: {
    department: "georgia_clinic_operations",
    level: "director",
    scope: "team",
    permissions: [
      "view_department_workspace",
      "view_department_reports",
      "manage_department_team",
      "view_team_pipeline",
      "view_team_tasks",
    ],
  },
  dept_manager: {
    department: "operations_leadership",
    level: "manager",
    scope: "department",
    permissions: [
      "view_department_workspace",
      "view_department_reports",
      "view_team_pipeline",
      "view_team_tasks",
    ],
  },
  intake: {
    department: "intake_leads",
    level: "staff",
    scope: "department",
    permissions: ["view_department_workspace"],
  },
  auth_team: {
    department: "authorizations",
    level: "staff",
    scope: "department",
    permissions: ["view_department_workspace"],
  },
  qa: {
    department: "qa_compliance",
    level: "staff",
    scope: "department",
    permissions: ["view_department_workspace"],
  },
  scheduling: {
    department: "scheduling",
    additionalDepartments: ["staffing"],
    level: "staff",
    scope: "department",
    permissions: ["view_department_workspace"],
  },
  staffing: {
    department: "staffing",
    additionalDepartments: ["scheduling"],
    level: "staff",
    scope: "department",
    permissions: ["view_department_workspace"],
  },
  clinic: {
    department: "georgia_clinic_operations",
    level: "staff",
    scope: "team",
    permissions: ["view_department_workspace"],
  },
  finance: {
    department: "finance",
    additionalDepartments: ["benefits_vob", "payment_plans", "billing_revenue_cycle"],
    level: "manager",
    scope: "department",
    permissions: ["view_department_workspace", "view_department_reports"],
  },
  payroll_admin: {
    department: "payroll",
    level: "manager",
    scope: "department",
    permissions: ["view_department_workspace", "view_payroll", "manage_payroll"],
  },
  hr: {
    department: "hr",
    additionalDepartments: ["recruiting", "training_clinical_support"],
    level: "staff",
    scope: "department",
    permissions: ["view_department_workspace"],
  },
  hr_admin: {
    department: "hr",
    additionalDepartments: ["recruiting", "training_clinical_support"],
    level: "director",
    scope: "department",
    permissions: [
      "view_department_workspace",
      "view_department_reports",
      "manage_department_team",
      "view_team_pipeline",
      "view_team_tasks",
    ],
  },
  hr_manager: {
    department: "hr",
    additionalDepartments: ["recruiting", "training_clinical_support"],
    level: "manager",
    scope: "department",
    permissions: [
      "view_department_workspace",
      "view_department_reports",
      "manage_department_team",
      "view_team_pipeline",
      "view_team_tasks",
    ],
  },
  hr_admin_assistant: {
    department: "hr",
    level: "staff",
    scope: "self",
    permissions: [],
  },
  recruiting_assistant: {
    department: "recruiting",
    level: "staff",
    scope: "department",
    permissions: ["view_department_workspace"],
  },
  training_admin: {
    department: "training_clinical_support",
    level: "manager",
    scope: "department",
    permissions: ["view_department_workspace", "view_department_reports"],
  },
  marketing: {
    department: "marketing",
    level: "staff",
    scope: "department",
    permissions: ["view_department_workspace"],
  },
  phone_support: {
    department: "intake_leads",
    level: "staff",
    scope: "team",
    permissions: ["view_department_workspace"],
  },
  bcba: {
    department: "clinical",
    additionalDepartments: ["training_clinical_support"],
    level: "lead",
    scope: "team",
    permissions: ["view_department_workspace"],
  },
  rbt: {
    department: "clinical",
    level: "staff",
    scope: "self",
    permissions: [],
  },
  behavioral_support: {
    department: "clinical",
    additionalDepartments: ["training_clinical_support"],
    level: "lead",
    scope: "team",
    permissions: ["view_department_workspace"],
  },
  staff: {
    department: "hr",
    level: "staff",
    scope: "self",
    permissions: [],
  },
  viewer: {
    department: "reports_analytics",
    level: "staff",
    scope: "self",
    permissions: [],
  },
};

// ---------------------------------------------------------------------------
// Access profile
// ---------------------------------------------------------------------------

export interface UserAccessProfile {
  roles: AppRole[];
  departments: Set<Department>;
  layers: Set<DepartmentLayer>;
  level: RoleLevel;
  scope: AccessScope;
  permissions: Set<RbacPermission>;
  /** Assigned state (when scope === 'state'). null otherwise / unknown. */
  state: string | null;
}

export interface AccessProfileInput {
  roles: AppRole[];
  state?: string | null;
}

export function getUserAccessProfile(input: AccessProfileInput | AppRole[]): UserAccessProfile {
  const roles = Array.isArray(input) ? input : input.roles;
  const state = Array.isArray(input) ? null : input.state ?? null;

  const departments = new Set<Department>();
  const layers = new Set<DepartmentLayer>();
  const permissions = new Set<RbacPermission>();
  let level: RoleLevel = "staff";
  let scope: AccessScope = "self";

  for (const role of roles) {
    const m = ROLE_RBAC[role];
    if (!m) continue;
    departments.add(m.department);
    (m.additionalDepartments ?? []).forEach((d) => departments.add(d));
    layers.add(layerForDepartment(m.department));
    (m.additionalDepartments ?? []).forEach((d) => layers.add(layerForDepartment(d)));
    m.permissions.forEach((p) => permissions.add(p));
    if (ROLE_LEVEL_RANK[m.level] > ROLE_LEVEL_RANK[level]) level = m.level;
    if (SCOPE_RANK[m.scope] > SCOPE_RANK[scope]) scope = m.scope;
  }

  // Manager inheritance: managers/directors get team/department visibility
  // bundled, even if the literal mapping forgot to list them.
  if (ROLE_LEVEL_RANK[level] >= ROLE_LEVEL_RANK.manager) {
    permissions.add("view_department_workspace");
    permissions.add("view_department_reports");
    permissions.add("view_team_pipeline");
    permissions.add("view_team_tasks");
    permissions.add("manage_department_team");
  }
  if (ROLE_LEVEL_RANK[level] >= ROLE_LEVEL_RANK.executive) {
    permissions.add("view_company_reports");
    permissions.add("view_state_dashboards");
  }

  return { roles, departments, layers, level, scope, permissions, state };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function hasDepartmentAccess(profile: UserAccessProfile, dept: Department): boolean {
  if (profile.level === "super_admin" || profile.scope === "company") return true;
  return profile.departments.has(dept);
}

export function hasDepartmentGroupAccess(profile: UserAccessProfile, layer: DepartmentLayer): boolean {
  if (profile.level === "super_admin" || profile.scope === "company") return true;
  return profile.layers.has(layer);
}

export function hasPermission(profile: UserAccessProfile, perm: RbacPermission): boolean {
  if (profile.level === "super_admin") return true;
  return profile.permissions.has(perm);
}

export function hasManagerAccess(profile: UserAccessProfile): boolean {
  return ROLE_LEVEL_RANK[profile.level] >= ROLE_LEVEL_RANK.manager;
}

export function hasStateScope(profile: UserAccessProfile, state: string): boolean {
  if (profile.level === "super_admin" || profile.scope === "company") return true;
  if (profile.scope !== "state") return false;
  if (!profile.state) return false;
  return profile.state.toLowerCase() === state.toLowerCase();
}

/**
 * Lightweight department lookup for a path. Used by canAccessRoute as a hint
 * — actual route gating still goes through navigationAccess for backward
 * compatibility. Returns null if the path is not department-specific.
 */
const PATH_TO_DEPARTMENT: Array<[string, Department]> = [
  ["/admin", "super_admin"],
  ["/permissions", "super_admin"],
  ["/integrations", "systems_it"],
  ["/intake", "intake_leads"],
  ["/leads", "intake_leads"],
  ["/vob-decision-center", "benefits_vob"],
  ["/authorizations", "authorizations"],
  ["/scheduling", "scheduling"],
  ["/staffing", "staffing"],
  ["/clients", "clients_case_management"],
  ["/qa", "qa_compliance"],
  ["/qa-workspace", "qa_compliance"],
  ["/recruiting", "recruiting"],
  ["/payroll", "payroll"],
  ["/hr/payroll", "payroll"],
  ["/hr", "hr"],
  ["/billing-finance", "billing_revenue_cycle"],
  ["/billing", "billing_revenue_cycle"],
  ["/finance", "finance"],
  ["/reports", "reports_analytics"],
];

export function departmentForPath(pathname: string): Department | null {
  const path = pathname.split("?")[0];
  for (const [prefix, dept] of PATH_TO_DEPARTMENT) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return dept;
  }
  return null;
}

/**
 * RBAC-only route check. Returns:
 *  - true if access is granted by the department model
 *  - false if the route maps to a known department this profile cannot see
 *  - true ("unknown") if the path isn't department-mapped (caller should
 *    fall back to navigationAccess.canAccessRouteForRoles)
 */
export function canAccessRoute(profile: UserAccessProfile, pathname: string): boolean {
  if (profile.level === "super_admin" || profile.scope === "company") return true;
  const dept = departmentForPath(pathname);
  if (!dept) return true;
  // Admin-only departments
  if (dept === "super_admin") return false;
  if (dept === "systems_it") return false;
  if (dept === "payroll" && !hasPermission(profile, "view_payroll")) return false;
  return hasDepartmentAccess(profile, dept);
}