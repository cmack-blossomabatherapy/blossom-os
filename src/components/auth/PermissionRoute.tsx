import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import type { AppRole } from "@/lib/roles";
import { Unauthorized } from "./Unauthorized";

interface Props {
  children: ReactNode;
  permission?: string;
  allowedRoles?: AppRole[];
}

export function PermissionRoute({ children, permission, allowedRoles }: Props) {
  const { user, loading, hasPerm, roles } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const permOk = !permission || hasPerm(permission);
  const roleOk = !allowedRoles || allowedRoles.some((role) => roles.includes(role));
  if (!permOk || !roleOk) {
    return <Unauthorized permission={permission} />;
  }

  return <>{children}</>;
}