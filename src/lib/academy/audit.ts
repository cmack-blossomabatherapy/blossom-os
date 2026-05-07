import { supabase } from "@/integrations/supabase/client";

export type AcademyAuditEvent =
  | "gate_check"           // AcademyGate evaluated completion
  | "gate_blocked"         // user hit a locked Blossom Training route
  | "gate_unlocked"        // user passed the gate
  | "completion_check"     // useAcademyComplete computed status
  | "rls_denied"           // a Supabase query failed with RLS / 403 / 42501
  | "enrollment_missing"   // user has no enrollment yet
  | "employee_missing"     // signed-in user has no linked employee record
  | "curriculum_missing";  // curriculum not seeded

export interface AcademyAuditPayload {
  event_type: AcademyAuditEvent;
  employee_id?: string | null;
  enrollment_id?: string | null;
  route?: string | null;
  complete?: boolean | null;
  bypass?: boolean | null;
  details?: Record<string, unknown>;
}

/**
 * Fire-and-forget audit logger for Operations Academy gating events.
 * Failures are swallowed — logging must never break the user flow.
 */
export async function logAcademyEvent(payload: AcademyAuditPayload): Promise<void> {
  try {
    const { data: u } = await supabase.auth.getUser();
    const user = u.user ?? null;
    await supabase.from("academy_audit_log").insert([{
      event_type: payload.event_type,
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      employee_id: payload.employee_id ?? null,
      enrollment_id: payload.enrollment_id ?? null,
      route: payload.route ?? (typeof window !== "undefined" ? window.location.pathname : null),
      complete: payload.complete ?? null,
      bypass: payload.bypass ?? null,
      details: payload.details ?? {},
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    }] as never);
  } catch {
    // intentionally silent
  }
}

/** Detect Postgres / Supabase RLS-style errors so we can audit them centrally. */
export function isRlsDenial(err: { code?: string; message?: string; status?: number } | null | undefined): boolean {
  if (!err) return false;
  if (err.code === "42501" || err.code === "PGRST301") return true;
  if (err.status === 401 || err.status === 403) return true;
  const msg = (err.message ?? "").toLowerCase();
  return msg.includes("row-level security") || msg.includes("permission denied") || msg.includes("rls");
}