## Problem

After signing in, MFA is required every time even though the code already has a 30-day "remember this device" stamp (`markMfaVerified` / `MFA_MAX_AGE_MS`).

The bug is in `src/lib/mfa.ts` → `resolveMfaStatus`. It checks Supabase's AAL level before the local 30-day stamp:

```ts
if (verifiedTotp.length === 0) return { state: "needs_enroll" };
if (aalData?.currentLevel !== "aal2") return { state: "needs_challenge" }; // ← always true on fresh sign-in
if (!isMfaStampValid(userId)) return { state: "needs_refresh" };
return { state: "ok" };
```

A fresh email+password sign-in always starts at `aal1` (you only reach `aal2` by completing a TOTP challenge in that session). So the 30-day stamp is never consulted, and every sign-in forces `/mfa/verify`.

## Fix

Honor the 30-day local stamp as the device-trust signal, independent of session AAL.

In `src/lib/mfa.ts`, reorder `resolveMfaStatus`:

1. If no verified TOTP factor → `needs_enroll`.
2. If a valid 30-day stamp exists for this user → `ok` (skip challenge, regardless of AAL).
3. Else if AAL is already `aal2` → `ok` (and refresh the stamp so the 30 days slides forward).
4. Else → `needs_challenge`.

Also: in `src/pages/MfaVerify.tsx`, `markMfaVerified(user.id)` is already called on success — no change needed there. The existing `needs_refresh` path stays for the "stamp expired" force-relogin behavior triggered from `ProtectedRoute`, but is now only reachable when we explicitly want it (we won't return it from the new flow; the simpler model is: valid stamp = trusted device).

## Files

- `src/lib/mfa.ts` — reorder checks in `resolveMfaStatus`; keep `MFA_MAX_AGE_MS = 30 days`.

## Notes

- Stamp is per-user in `localStorage`, so it's scoped to that browser/device — exactly what we want for "trust this device for 30 days".
- This intentionally trades some strictness for dev ergonomics, as you noted. We can later require true `aal2` again by adding a server-side trusted-device table.
