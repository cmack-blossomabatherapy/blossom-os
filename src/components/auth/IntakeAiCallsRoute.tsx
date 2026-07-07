import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useOSRole } from "@/contexts/OSRoleContext";

/**
 * Guard for /phone/ai-calls (After-Hours AI). Intake owns this surface;
 * admins retain access for support. Everyone else is bounced.
 */
// AI After-Hours Calls is Intake-owned. Executive Leadership sees the full
// Phone System at /phone but must NOT see After-Hours AI as a normal tool.
// Admin/super_admin/systems_admin retain access for support.
const ALLOWED = new Set<string>([
  "super_admin", "admin", "systems_admin",
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