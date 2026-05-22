import type { Client } from "@/data/clients";

export interface ClientScope {
  displayName?: string | null;
  state?: string | null;
  roles: string[];
}

const LEADERSHIP = new Set([
  "admin", "exec", "ops_manager", "operations_leadership",
  "intake_leadership", "intake_manager", "super_admin",
]);

/** Apply role/state-based scoping to the clients list. */
export function scopeClientsForUser(clients: Client[], scope: ClientScope): Client[] {
  const roles = (scope.roles ?? []).map(String);
  if (roles.some((r) => LEADERSHIP.has(r))) return clients;

  // State Director — only their state.
  if (roles.includes("state_director") && scope.state) {
    const st = scope.state.toUpperCase();
    return clients.filter((c) => (c.state || "").toUpperCase() === st);
  }

  // BCBA — only their assigned caseload.
  if (roles.includes("bcba") && scope.displayName) {
    const first = scope.displayName.toLowerCase().split(/\s+/)[0];
    return clients.filter((c) => (c.bcba || "").toLowerCase().includes(first));
  }

  // Intake — limited to clients they own as intake person.
  if (roles.includes("intake") || roles.includes("intake_coordinator")) {
    const first = (scope.displayName || "").toLowerCase().split(/\s+/)[0];
    if (!first) return clients;
    return clients.filter((c) => (c.intakeOwner || "").toLowerCase().includes(first));
  }

  return clients;
}