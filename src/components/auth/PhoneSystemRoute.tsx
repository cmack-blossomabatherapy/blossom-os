import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useOSRole } from "@/contexts/OSRoleContext";

/**
 * Hard route guard for the full Phone System dashboards. Only the roles
 * listed below can reach these pages by direct URL. Everyone else is
 * bounced to the safe fallback (default: their home / intake ai-calls).
 *
 * State Director and Assistant State Director are intentionally NOT in
 * this allow list — those role menus do not surface /phone.
 *
 * Intake's limited /phone/ai-calls surface is NOT wrapped by this guard.
 */
const ALLOWED = new Set<string>([
  "super_admin", "admin", "systems_admin",
  // Executive leadership
  "exec", "executive", "executive_leadership", "ceo", "coo",
  "director_of_operations", "operations_manager", "ops_manager",
  "operations_leadership",
  // HR
  "hr", "hr_team", "hr_lead", "hr_admin", "hr_manager", "hr_admin_assistant",
  // Marketing
  "marketing", "marketing_team", "marketing_director", "marketing_manager",
  "marketing_admin", "marketing_growth_lead",
]);

export function PhoneSystemRoute({
  children,
  redirectTo = "/dashboard",
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const { role } = useOSRole();
  if (!role || !ALLOWED.has(String(role))) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
}