import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRoleSafe } from "@/contexts/OSRoleContext";
import { supabase } from "@/integrations/supabase/client";
import {
  resolveClinicianIdentity,
  displayNameFor,
  type ClinicianIdentity,
} from "@/lib/os/clinicianIdentity";

export interface BcbaIdentity extends ClinicianIdentity {
  loading: boolean;
  /** Identity has finished resolving (loading complete). */
  identityReady: boolean;
  /** True when a super-admin is previewing another BCBA. */
  isPreviewing: boolean;
  /** True whenever writes must be blocked (preview or unresolved identity). */
  readOnly: boolean;
  /**
   * `auth.uid()` value that BCBA-scoped tables (which key by auth uid, e.g.
   * bcba_action_tasks.assigned_bcba) should be filtered against for the current
   * subject. In preview mode this is the subject employee's own user_id.
   */
  scopedAuthUserId: string | null;
  /** Auth uid safe to write on behalf of — null while previewing. */
  writableAuthUserId: string | null;
  /** Employee id safe to write on behalf of — null while previewing. */
  writableEmployeeId: string | null;
  /** True when we could not resolve an employee row for the subject. */
  mappingMissing: boolean;
}

/**
 * Central identity for BCBA pages. Reconciles the signed-in user (or the
 * previewed employee, when a super-admin is viewing-as) into an employee row
 * and its `auth.users.id`, so every hook can scope by a single subject.
 *
 * Every BCBA query MUST scope on `scopedAuthUserId` (or `employeeId`) so
 * super-admins previewing another BCBA never see data mixed across subjects,
 * and unauthenticated sessions never fall through to unfiltered fetches.
 *
 * Writes must gate on `writableAuthUserId` / `writableEmployeeId`; both are
 * `null` in preview mode so admin view-as sessions cannot mutate real data.
 */
export function useBcbaIdentity(): BcbaIdentity {
  const { user } = useAuth();
  const osRole = useOSRoleSafe();
  const previewSubjectId = osRole?.previewSubjectEmployeeId ?? null;
  const isPreviewing = Boolean(osRole?.isPreviewing && previewSubjectId);
  const [identity, setIdentity] = useState<ClinicianIdentity | null>(null);
  const [scopedAuthUserId, setScopedAuthUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setIdentity(null);
    setScopedAuthUserId(null);

    (async () => {
      const resolved = await resolveClinicianIdentity(user?.id ?? null, {
        forcedEmployeeId: isPreviewing ? previewSubjectId : null,
      });
      if (cancelled) return;
      setIdentity(resolved);

      if (isPreviewing && resolved.employeeId) {
        // Look up the preview subject's real auth uid so that queries scoped
        // by auth.users.id still resolve to the correct BCBA.
        const { data: emp } = await supabase
          .from("employees").select("user_id").eq("id", resolved.employeeId).maybeSingle();
        if (!cancelled) setScopedAuthUserId(emp?.user_id ?? null);
      } else {
        setScopedAuthUserId(user?.id ?? null);
      }
    })().catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [user?.id, previewSubjectId, isPreviewing]);

  const resolved: ClinicianIdentity = identity ?? {
    authUserId: user?.id ?? null,
    employeeId: null,
    firstName: null,
    lastName: null,
    displayName: displayNameFor({ email: user?.email ?? null }),
    email: user?.email ?? null,
    credential: null,
    centralreachId: null,
    identitySource: "none",
    needsVerification: true,
  };

  const identityReady = !loading;
  const mappingMissing = identityReady && !resolved.employeeId;

  return {
    ...resolved,
    loading,
    identityReady,
    isPreviewing,
    readOnly: isPreviewing || mappingMissing,
    scopedAuthUserId,
    writableAuthUserId: isPreviewing ? null : (user?.id ?? null),
    writableEmployeeId: isPreviewing ? null : resolved.employeeId,
    mappingMissing,
  };
}

/**
 * Pure selector — decide whether an identity resolution warrants surfacing the
 * clinician-mapping diagnostic banner. Exported for tests.
 */
export function shouldShowMappingDiagnostic(id: {
  identityReady: boolean;
  mappingMissing: boolean;
  needsVerification: boolean;
  identitySource: ClinicianIdentity["identitySource"];
}): "missing" | "unverified" | null {
  if (!id.identityReady) return null;
  if (id.mappingMissing) return "missing";
  if (id.identitySource === "name_fallback" && id.needsVerification) return "unverified";
  return null;
}