import { supabase } from "@/integrations/supabase/client";

/** How long an MFA verification is valid before re-challenge is required. */
export const MFA_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const STAMP_PREFIX = "blossom.mfa.verifiedAt:";

const stampKey = (userId: string) => `${STAMP_PREFIX}${userId}`;

export function markMfaVerified(userId: string) {
  try {
    localStorage.setItem(stampKey(userId), String(Date.now()));
  } catch {
    /* no-op */
  }
}

export function clearMfaVerified(userId?: string) {
  try {
    if (userId) localStorage.removeItem(stampKey(userId));
    else {
      // Sweep all stamps
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STAMP_PREFIX)) localStorage.removeItem(k);
      }
    }
  } catch {
    /* no-op */
  }
}

export function getMfaVerifiedAt(userId: string): number | null {
  try {
    const raw = localStorage.getItem(stampKey(userId));
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function isMfaStampValid(userId: string): boolean {
  const t = getMfaVerifiedAt(userId);
  if (!t) return false;
  return Date.now() - t < MFA_MAX_AGE_MS;
}

export type MfaStatus =
  | { state: "loading" }
  | { state: "no_session" }
  | { state: "needs_enroll" }         // signed in, no verified TOTP factor
  | { state: "needs_challenge" }      // signed in, factor exists but AAL1
  | { state: "needs_refresh" }        // AAL2 but >30 days since last verify
  | { state: "ok" };

export async function resolveMfaStatus(userId: string | undefined): Promise<MfaStatus> {
  if (!userId) return { state: "no_session" };

  const { data: aalData, error: aalErr } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalErr) return { state: "needs_challenge" };

  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const verifiedTotp = (factorsData?.totp ?? []).filter(
    (f) => f.status === "verified",
  );

  if (verifiedTotp.length === 0) return { state: "needs_enroll" };

  if (aalData?.currentLevel !== "aal2") return { state: "needs_challenge" };

  if (!isMfaStampValid(userId)) return { state: "needs_refresh" };

  return { state: "ok" };
}

/** Unenroll every TOTP factor (verified or pending). */
export async function unenrollAllTotp() {
  const { data } = await supabase.auth.mfa.listFactors();
  const all = data?.totp ?? [];
  await Promise.all(
    all.map((f) => supabase.auth.mfa.unenroll({ factorId: f.id })),
  );
}