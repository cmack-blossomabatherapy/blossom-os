import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useOSRole } from "@/contexts/OSRoleContext";

/**
 * Guard for /phone/ai-calls (After-Hours AI). Intake owns this surface;
 * admins retain access for support. Everyone else is bounced.
 */
const ALLOWED = new Set<string>([
  "super_admin", "admin", "systems_admin",
  "exec", "executive", "executive_leadership", "ceo", "coo",
  "director_of_operations", "ops_manager", "operations_leadership",
  "intake", "intake_team", "intake_lead", "intake_admin", "intake_manager",
  "intake_specialist", "intake_coordinator",
]);

export function IntakeAiCallsRoute({
  children,
  redirectTo = "/dashboard",
}: { children: ReactNode; redirectTo?: string }) {
  const { role } = useOSRole();
  if (!role || !ALLOWED.has(String(role))) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
}