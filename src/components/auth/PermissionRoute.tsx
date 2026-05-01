import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ShieldAlert } from "lucide-react";
import type { AppRole } from "@/lib/roles";

interface Props {
  children: ReactNode;
  permission: string;
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

  if (!hasPerm(permission) || (allowedRoles && !allowedRoles.some((role) => roles.includes(role)))) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No access</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Your current roles don't include access to this area. If you need access,
            ask a Blossom admin to add the right role to your account.
          </p>
          <p className="text-[11px] text-muted-foreground/70 mt-3 font-mono">
            Required permission: {permission}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}