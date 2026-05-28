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
};

export function permissionsForRole(role: string): Permissions {
  switch (role) {
    case "super_admin":
      return {
        canManageStaff: true, canManageForms: true,
        canManageEmails: true, canManageSettings: true, canFinalize: true,
        canReopen: true, canDeleteCompleted: true, canViewAllStates: true,
        canViewReports: true, canImportStaff: true, canOverrideRules: true,
        scope: "all",
      };
    case "executive_leadership":
      return {
        canManageStaff: false, canManageForms: false,
        canManageEmails: false, canManageSettings: false, canFinalize: false,
        canReopen: false, canDeleteCompleted: false, canViewAllStates: true,
        canViewReports: true, canImportStaff: false, canOverrideRules: false,
        scope: "all",
      };
    case "hr_team":
      return {
        canManageStaff: true, canManageForms: true,
        canManageEmails: true, canManageSettings: true, canFinalize: true,
        canReopen: true, canDeleteCompleted: false, canViewAllStates: true,
        canViewReports: true, canImportStaff: true, canOverrideRules: true,
        scope: "all",
      };
    case "operations_leadership":
    case "qa_team":
    case "bcba":
      return {
        canManageStaff: false, canManageForms: false,
        canManageEmails: false, canManageSettings: false, canFinalize: false,
        canReopen: false, canDeleteCompleted: false, canViewAllStates: true,
        canViewReports: true, canImportStaff: false, canOverrideRules: false,
        scope: "assigned_staff",
      };
    case "state_director":
      return {
        canManageStaff: false, canManageForms: false,
        canManageEmails: false, canManageSettings: false, canFinalize: false,
        canReopen: false, canDeleteCompleted: false, canViewAllStates: false,
        canViewReports: true, canImportStaff: false, canOverrideRules: false,
        scope: "assigned_state",
      };
    default:
      return {
        canManageStaff: false, canManageForms: false,
        canManageEmails: false, canManageSettings: false, canFinalize: false,
        canReopen: false, canDeleteCompleted: false, canViewAllStates: false,
        canViewReports: false, canImportStaff: false, canOverrideRules: false,
        scope: "self",
      };
  }
}

export function filterStaffByScope(
  staff: EvalStaff[],
  perms: Permissions,
  activeState: string,
): EvalStaff[] {
  if (perms.scope === "all") return staff;
  if (perms.scope === "assigned_state") {
    return staff.filter((s) => (s.state ?? "").toLowerCase() === (activeState ?? "").toLowerCase());
  }
  // For now treat assigned_staff/self the same as no real auth user mapping yet
  return staff;
}

export function filterEvaluationsByScope(
  evaluations: Evaluation[],
  visibleStaff: EvalStaff[],
): Evaluation[] {
  const ids = new Set(visibleStaff.map((s) => s.id));
  return evaluations.filter((e) => ids.has(e.staff_id));
}