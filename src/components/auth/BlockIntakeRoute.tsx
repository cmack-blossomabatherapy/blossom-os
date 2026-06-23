import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useOSRole } from "@/contexts/OSRoleContext";

/**
 * Hard route guard for surfaces Intake should not access directly:
 * the full Phone System dashboard and Patient Lifetime Journey.
 *
 * Intake keeps its own scoped phone surface at /phone/ai-calls — that
 * route is NOT wrapped by this component.
 */
export function BlockIntakeRoute({
  children,
  redirectTo = "/intake/dashboard",
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const { role } = useOSRole();
  if (role === "intake_coordinator") {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
}