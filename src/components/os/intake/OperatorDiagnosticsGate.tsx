import type { ReactNode } from "react";
import { useOSRole } from "@/contexts/OSRoleContext";

/**
 * Blossom OS — Operator Diagnostics Gate.
 *
 * Wraps any block that exposes technical diagnostics (provider health,
 * webhook delivery state, API credentials/scopes, raw sync payloads,
 * mapping diagnostics, ingestion counters, troubleshooting) and hides it
 * from every operator role — including Intake. Only Super Admin /
 * Systems Admin see the wrapped content.
 *
 * Operators should see human-readable readiness ("Call linked", "Import
 * pending") in the parent surface; the diagnostic detail lives here.
 */
const ADMIN_ROLES = new Set<string>([
  "super_admin",
  "systems_admin",
  "admin",
]);

export function OperatorDiagnosticsGate({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { role } = useOSRole();
  if (!role || !ADMIN_ROLES.has(String(role))) return <>{fallback}</>;
  return <>{children}</>;
}

/** Test helper: pure predicate mirroring the gate's decision. */
export function isOperatorDiagnosticsVisible(role: string | null | undefined): boolean {
  return !!role && ADMIN_ROLES.has(String(role));
}