import type { Lead } from "@/data/leads";
import type { AppRole } from "@/lib/roles";

export interface LeadScope {
  displayName?: string | null;
  state?: string | null;
  roles: AppRole[] | string[];
}

const LEADERSHIP_ROLES = new Set<string>([
  "admin",
  "exec",
  "ops_manager",
  "operations_leadership",
  "intake_leadership",
  "intake_manager",
  // Intake is a centralized department — coordinators see all leads org-wide.
  "intake",
  "intake_coordinator",
]);

/** Apply role/state-based scoping to the loaded leads list. */
export function scopeLeadsForUser(leads: Lead[], scope: LeadScope): Lead[] {
  const roles = (scope.roles ?? []).map(String);
  if (roles.some((r) => LEADERSHIP_ROLES.has(r))) return leads;

  // State Director — only their assigned state.
  if (roles.includes("state_director") && scope.state) {
    return leads.filter((l) => (l.state || "").toUpperCase() === scope.state!.toUpperCase());
  }

  return leads;
}