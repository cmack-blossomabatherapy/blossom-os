import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRoleSafe } from "@/contexts/OSRoleContext";
import {
  resolveClinicianIdentity,
  displayNameFor,
  type ClinicianIdentity,
} from "@/lib/os/clinicianIdentity";

export interface RbtIdentity extends ClinicianIdentity {
  loading: boolean;
  isPreviewing: boolean;
  /** Non-null when the current authed user IS the clinician (safe to write). */
  writableEmployeeId: string | null;
}

/**
 * Central identity for RBT pages. Reconciles the authed user → employee →
 * CentralReach provider. Respects super-admin preview subject (read-only).
 * All RBT tables scope on `employee_id`; use `writableEmployeeId` when
 * performing mutations so that admin preview mode cannot write on someone
 * else's behalf.
 */
export function useRbtIdentity(): RbtIdentity {
  const { user } = useAuth();
  const osRole = useOSRoleSafe();
  const previewSubjectId = osRole?.previewSubjectEmployeeId ?? null;
  const isPreviewing = Boolean(osRole?.isPreviewing);
  const [identity, setIdentity] = useState<ClinicianIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    resolveClinicianIdentity(user?.id ?? null, {
      forcedEmployeeId: isPreviewing ? previewSubjectId : null,
    })
      .then((r) => { if (!cancelled) setIdentity(r); })
      .catch(() => { if (!cancelled) setIdentity(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id, previewSubjectId, isPreviewing]);

  const resolved = identity ?? {
    authUserId: user?.id ?? null,
    employeeId: null,
    firstName: null,
    lastName: null,
    displayName: displayNameFor({ email: user?.email ?? null }),
    email: user?.email ?? null,
    credential: null,
    centralreachId: null,
    identitySource: "none" as const,
    needsVerification: true,
  };

  return {
    ...resolved,
    loading,
    isPreviewing,
    writableEmployeeId: isPreviewing ? null : resolved.employeeId,
  };
}