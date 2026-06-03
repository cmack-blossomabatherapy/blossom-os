import type { EvalStaff, Evaluation } from "./types";

export type Permissions = {
  canManageStaff: boolean;
  canManageForms: boolean;
  canManageEmails: boolean;
  canManageSettings: boolean;
  canFinalize: boolean;
  canReopen: boolean;
  canDeleteCompleted: boolean;
  canViewAllStates: boolean;
  canViewReports: boolean;
  canImportStaff: boolean;
  canOverrideRules: boolean;
  scope: "all" | "assigned_state" | "assigned_staff" | "self";
  /** Restrict visible staff to these roles. null = no role restriction. */
  roleScope: Array<"BCBA" | "RBT" | "Office"> | null;
};

export function permissionsForRole(role: string): Permissions {
  switch (role) {
    case "super_admin":
      return {
        canManageStaff: true, canManageForms: true,
        canManageEmails: true, canManageSettings: true, canFinalize: true,
        canReopen: true, canDeleteCompleted: true, canViewAllStates: true,
        canViewReports: true, canImportStaff: true, canOverrideRules: true,
        scope: "all", roleScope: null,
      };
    case "executive_leadership":
      return {
        canManageStaff: true, canManageForms: true,
        canManageEmails: true, canManageSettings: true, canFinalize: true,
        canReopen: true, canDeleteCompleted: false, canViewAllStates: true,
        canViewReports: true, canImportStaff: true, canOverrideRules: true,
        scope: "all", roleScope: null,
      };
    case "hr_team":
      return {
        canManageStaff: true, canManageForms: true,
        canManageEmails: true, canManageSettings: true, canFinalize: true,
        canReopen: true, canDeleteCompleted: false, canViewAllStates: true,
        canViewReports: true, canImportStaff: true, canOverrideRules: true,
        scope: "all", roleScope: null,
      };
    case "qa_team":
      return {
        canManageStaff: false, canManageForms: false,
        canManageEmails: false, canManageSettings: false, canFinalize: false,
        canReopen: false, canDeleteCompleted: false, canViewAllStates: true,
        canViewReports: true, canImportStaff: false, canOverrideRules: false,
        scope: "all", roleScope: ["BCBA", "RBT"],
      };
    case "operations_leadership":
      return {
        canManageStaff: true, canManageForms: true,
        canManageEmails: true, canManageSettings: true, canFinalize: true,
        canReopen: true, canDeleteCompleted: false, canViewAllStates: true,
        canViewReports: true, canImportStaff: true, canOverrideRules: true,
        scope: "all", roleScope: null,
      };
    case "case_manager":
      return {
        canManageStaff: false, canManageForms: false,
        canManageEmails: false, canManageSettings: false, canFinalize: false,
        canReopen: false, canDeleteCompleted: false, canViewAllStates: true,
        canViewReports: true, canImportStaff: false, canOverrideRules: false,
        scope: "all", roleScope: ["BCBA", "RBT"],
      };
    case "bcba":
      return {
        canManageStaff: false, canManageForms: false,
        canManageEmails: false, canManageSettings: false, canFinalize: false,
        canReopen: false, canDeleteCompleted: false, canViewAllStates: true,
        canViewReports: true, canImportStaff: false, canOverrideRules: false,
        scope: "assigned_staff", roleScope: null,
      };
    case "state_director":
      return {
        canManageStaff: false, canManageForms: false,
        canManageEmails: false, canManageSettings: false, canFinalize: false,
        canReopen: false, canDeleteCompleted: false, canViewAllStates: false,
        canViewReports: true, canImportStaff: false, canOverrideRules: false,
        scope: "assigned_state", roleScope: null,
      };
    default:
      return {
        canManageStaff: false, canManageForms: false,
        canManageEmails: false, canManageSettings: false, canFinalize: false,
        canReopen: false, canDeleteCompleted: false, canViewAllStates: false,
        canViewReports: false, canImportStaff: false, canOverrideRules: false,
        scope: "self", roleScope: null,
      };
  }
}

export function filterStaffByScope(
  staff: EvalStaff[],
  perms: Permissions,
  activeState: string,
): EvalStaff[] {
  let out = staff;
  if (perms.scope === "assigned_state") {
    out = out.filter((s) => (s.state ?? "").toLowerCase() === (activeState ?? "").toLowerCase());
  }
  if (perms.roleScope && perms.roleScope.length > 0) {
    const allowed = new Set(perms.roleScope);
    out = out.filter((s) => allowed.has(s.role as "BCBA" | "RBT" | "Office"));
  }
  return out;
}

export function filterEvaluationsByScope(
  evaluations: Evaluation[],
  visibleStaff: EvalStaff[],
): Evaluation[] {
  const ids = new Set(visibleStaff.map((s) => s.id));
  return evaluations.filter((e) => ids.has(e.staff_id));
}