import type { User } from "@supabase/supabase-js";

/**
 * Emails explicitly allowed into the Admin Hub during the rollout phase.
 * Add new admins/HR here until the role system is fully wired up.
 */
export const ADMIN_HUB_EMAILS = [
  "testhr@blossomabatherapy.com",
  "cmack@blossomabatherapy.com",
];

export const ADMIN_HUB_ROLES = [
  "admin",
  "exec",
  "ops_manager",
  "training_admin",
  "hr",
  "hr_admin",
  "hr_manager",
];

export function canAccessAdminHub(user: User | null, roles: string[]): boolean {
  if (!user) return false;
  const email = (user.email ?? "").toLowerCase();
  if (ADMIN_HUB_EMAILS.includes(email)) return true;
  return roles.some((r) => ADMIN_HUB_ROLES.includes(r));
}