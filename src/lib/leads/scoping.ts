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
]);

/** Apply role/state-based scoping to the loaded leads list. */
export function scopeLeadsForUser(leads: Lead[], scope: LeadScope): Lead[] {
  const roles = (scope.roles ?? []).map(String);
  if (roles.some((r) => LEADERSHIP_ROLES.has(r))) return leads;

  // State Director — only their assigned state.
  if (roles.includes("state_director") && scope.state) {
    return leads.filter((l) => (l.state || "").toUpperCase() === scope.state!.toUpperCase());
  }

  // Intake Coordinator — only leads they own (best-effort match on first name).
  if (roles.includes("intake") || roles.includes("intake_coordinator")) {
    const name = (scope.displayName || "").toLowerCase().trim();
    if (!name) return leads;
    const first = name.split(/\s+/)[0];
    return leads.filter((l) => {
      const owner = (l.owner || "").toLowerCase();
      return owner.includes(first);
    });
  }

  return leads;
}