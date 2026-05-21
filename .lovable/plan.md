# Add Required TOTP 2FA

Use Lovable Cloud's built‑in TOTP MFA (authenticator app: Google Authenticator, Authy, 1Password, etc.). MFA will be **required for every user** — anyone without a verified TOTP factor is forced to enroll on next login, and anyone with one must pass a 6‑digit challenge before reaching the OS.

## User Experience

1. **Sign in** with email + password as today.
2. After the password step:
  - **If the user already has a verified TOTP factor** → redirected to `/mfa/verify` to enter a 6‑digit code from their authenticator app.
  - **If the user does not yet have a verified factor** → redirected to `/mfa/setup` to scan a QR code (or copy the secret), enter a verification code, and finish enrollment. They then continue into the app.
3. Once verified the session reaches **AAL2** and the rest of the OS unlocks normally. Until then, every protected route bounces them back to `/mfa/verify` or `/mfa/setup`.
4. From **Profile → Security**, a user can:
  - View their enrolled authenticator (name + enrolled date).
  - Re-enroll (admin only, in case they lose their device — for now this is a self‑serve "reset 2FA" that revokes the existing factor and forces re-enrollment on next login).

## Screens / Components

- `src/pages/MfaSetup.tsx` — QR code (rendered from the `otpauth://` URI Supabase returns), the secret string for manual entry, a 6‑digit input, "Verify & finish" button. Shown to anyone signed in without a verified factor.
- `src/pages/MfaVerify.tsx` — 6‑digit input + "Verify" + "Sign out". Shown to anyone signed in whose current session has AAL1 but who has a verified factor.
- `src/components/profile/SecurityMfaCard.tsx` — added to the existing `Profile` page: shows factor status and a "Reset authenticator" action.
- Existing `src/pages/Auth.tsx` (login) stays the same — the routing layer drives the next step.

## Routing & Enforcement (technical)

- New routes in `src/App.tsx`: `/mfa/setup` and `/mfa/verify`, both wrapped in a lightweight `<RequireSession>` (signed in, no AAL2 gate).
- Update `src/components/auth/ProtectedRoute.tsx`:
  - After confirming `user`, call `supabase.auth.mfa.getAuthenticatorAssuranceLevel()`.
  - If `currentLevel === 'aal1' && nextLevel === 'aal2'` → `Navigate` to `/mfa/verify`.
  - If `currentLevel === 'aal1' && nextLevel === 'aal1'` (no factor enrolled yet) → `Navigate` to `/mfa/setup`.
  - Only `aal2` reaches the wrapped children.
- `AuthContext` gets a small addition: `aalLevel` state + `refreshAal()` so screens can react after a successful challenge without a full reload.

## TOTP Flow (Supabase APIs used)

- Enroll: `supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Blossom OS' })` → returns `id`, `totp.qr_code` (SVG), `totp.secret`, `totp.uri`.
- Verify enrollment: `supabase.auth.mfa.challenge({ factorId })` → `challengeId`, then `supabase.auth.mfa.verify({ factorId, challengeId, code })`. On success, session becomes AAL2.
- Login challenge: `supabase.auth.mfa.challenge({ factorId })` + `verify(...)` after password sign-in.
- Reset (Profile): `supabase.auth.mfa.unenroll({ factorId })` — next login forces re-enrollment.

## Out of Scope (for this change)

- SMS/email OTP, hardware keys, WebAuthn.
- Admin "force unenroll another user" UI (would need an edge function with the service role). Current "reset" is self-serve only — call out so we can add the admin override next.
- Recovery / backup codes (Supabase does not issue these natively; we can layer that later if needed).

## Files Touched

- **New**: `src/pages/MfaSetup.tsx`, `src/pages/MfaVerify.tsx`, `src/components/profile/SecurityMfaCard.tsx`, `src/lib/mfa.ts` (thin helpers + AAL types).
- **Edited**: `src/contexts/AuthContext.tsx` (track AAL + factor presence), `src/components/auth/ProtectedRoute.tsx` (AAL2 gate), `src/App.tsx` (two new routes), `src/pages/Profile.tsx` (mount Security card).

No database migrations or new secrets required — TOTP MFA is built into Lovable Cloud auth.

I want the screens for this to be branded and beautiful like our site! Do it right the first time! Also make sure every login in going forward has to set up mfa. Make sure an authentication is good for 30 days only then they have to reauthenticate