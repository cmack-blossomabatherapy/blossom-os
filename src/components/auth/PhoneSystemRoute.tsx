import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useOSRole } from "@/contexts/OSRoleContext";

/**
 * Hard route guard for the full Phone System dashboards. Only the roles
 * listed below can reach these pages by direct URL. Everyone else is
 * bounced to the safe fallback (default: their home / intake ai-calls).
 *
 * Product rule (State Director Assistant Pass 6):
 *   - Full Phone System = super_admin / admin / systems_admin, executive
 *     leadership (exec/CEO/COO/DOO/Ops leadership), HR roles, and
 *     Marketing roles.
 *   - State Director is intentionally allowed by prior product decision
 *     for cross-department coordination.
 *   - Assistant State Director is intentionally NOT allowed the full
 *     Phone System, and is NOT granted After-Hours AI Calls either
 *     unless separately added to IntakeAiCallsRoute's allow-list.
 *
 * Intake's limited /phone/ai-calls surface is NOT wrapped by this guard.
 */
const ALLOWED = new Set<string>([
  "super_admin", "admin", "systems_admin",
  // Executive leadership
  "exec", "executive", "executive_leadership", "ceo", "coo",
  "director_of_operations", "operations_manager", "ops_manager",
  "operations_leadership",
  // State leadership — State Director only. Assistant State Director is
  // intentionally excluded from the full Phone System.
  "state_director",
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