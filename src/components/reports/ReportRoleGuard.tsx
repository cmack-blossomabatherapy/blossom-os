import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useOSRoleSafe } from "@/contexts/OSRoleContext";
import { visibleReportsForRole, visibleDepartmentDashboardsForRole } from "@/lib/os/reportsCatalog";

interface Props {
  reportId: string;
  children: ReactNode;
}

/**
 * Business Development Completion Pass 5:
 * Role-aware guard for direct /reports/<id> detail routes. If the active OS
 * role cannot see this report according to the shared Reports catalog, we
 * redirect back to the single canonical /reports surface instead of exposing
 * an HR-only / QA-only / Finance-only / Credentialing-only dashboard by URL.
 */
export function ReportRoleGuard({ reportId, children }: Props) {
  const ctx = useOSRoleSafe();
  // Outside the OS shell (e.g. legacy AppLayout routes), fall through — the
  // outer PermissionRoute / route gates are the source of truth.
  if (!ctx) return <>{children}</>;
  const allowed =
    visibleReportsForRole(ctx.role).some((r) => r.id === reportId) ||
    visibleDepartmentDashboardsForRole(ctx.role).some((r) => r.id === reportId);
  if (!allowed) return <Navigate to="/reports" replace />;
  return <>{children}</>;
}

export default ReportRoleGuard;