import type { Client } from "@/data/clients";

export interface ClientScope {
  displayName?: string | null;
  state?: string | null;
  roles: string[];
}

const LEADERSHIP = new Set([
  "admin", "exec", "ops_manager", "operations_leadership",
  "intake_leadership", "intake_manager", "super_admin",
  // Intake is centralized — coordinators see all clients org-wide for handoff visibility.
  "intake", "intake_coordinator",
]);

/** Apply role/state-based scoping to the clients list. */
export function scopeClientsForUser(clients: Client[], scope: ClientScope): Client[] {
  const roles = (scope.roles ?? []).map(String);
  if (roles.some((r) => LEADERSHIP.has(r))) return clients;

  // State Director / Assistant State Director — only their state.
  if ((roles.includes("state_director") || roles.includes("assistant_state_director")) && scope.state) {
    const st = scope.state.toUpperCase();
    return clients.filter((c) => (c.state || "").toUpperCase() === st);
  }

  // BCBA — only their assigned caseload.
  if (roles.includes("bcba") && scope.displayName) {
    const first = scope.displayName.toLowerCase().split(/\s+/)[0];
    return clients.filter((c) => (c.bcba || "").toLowerCase().includes(first));
  }

  return clients;
}