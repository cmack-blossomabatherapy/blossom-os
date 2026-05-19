import { ReactNode } from "react";
import { useOSRole } from "@/contexts/OSRoleContext";
import type { OSAction, OSModule } from "@/lib/os/permissions";

interface Props {
  module: OSModule;
  action?: OSAction;
  fallback?: ReactNode;
  children: ReactNode;
}

/** Conditionally render UI based on the current OS role's permissions. */
export function PermissionGate({ module, action = "view", fallback = null, children }: Props) {
  const { can } = useOSRole();
  if (!can(module, action)) return <>{fallback}</>;
  return <>{children}</>;
}