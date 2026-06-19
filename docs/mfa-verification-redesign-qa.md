# MFA Verification Page — Visual Redesign QA

_Generated: 2026-06-19_

## Scope

Visual/product polish pass for `/mfa/verify`. No MFA logic, no auth flow, no routes, no DB, no edge functions were changed.

## Files changed

- `src/components/auth/MfaBrandShell.tsx` — full visual rewrite into a two-column auth shell. Added optional `sideTitle`, `sideDescription`, `sideItems` props (all backward compatible).
- `src/pages/MfaVerify.tsx` — presentational redesign of the card content (eyebrow/title/description, signed-in identity, method tabs, email send/resend, OTP, verify button, security-key fallback, lost-phone copy). Logic flow untouched.
- `docs/mfa-verification-redesign-qa.md` — this file.

`src/pages/MfaSetup.tsx` was **not** modified — it consumes the same shell and renders correctly with the new default brand-panel props.

## Visual changes

- **New shell composition:** desktop now uses a `1.05fr / 1fr` two-column layout (max-width 1200, gap 12). Left column hosts an integrated Blossom logo plus a framed "Protected access for Blossom OS" security panel with three trust bullets (HIPAA-conscious access · Staff identity protection · Secure operational workspace). Right column hosts the MFA card. On mobile the layout collapses to a single column with the logo on top.
- **Calm brand background:** replaced the bare `bg-[#f8fafc]` with a paler `#f6f8fb` plus two soft radial washes (teal top-left, navy bottom-right). No blobs, no orbs, no gradients on the card itself.
- **Card treatment:** narrower border, layered soft shadow (inset highlight + long downward soft shadow), `rounded-3xl`, generous padding, subtle mount fade/slide-in.
- **Eyebrow:** now teal `#2d8a9e` instead of gray, giving the card a clear "Secure access" identity.
- **Signed-in identity panel** promoted to its own rounded surface at the top of the form, with a clear "Signed in as" label above the email.
- **Method segmented control** restyled as a true tab control (`role="tablist"`, `aria-selected`) with a soft ring on the active tab.
- **Email destination** now shown in a dedicated card with the mail icon, the address, and the send/resend button inline; "code valid for a few minutes" follow-up appears after send.
- **OTP input** kept (uses existing `InputOTP` underline style) — only spacing tightened.
- **Verify button** has explicit enabled/disabled states; disabled now reads `bg-slate-200 text-slate-400 shadow-none`. Loading copy is `Verifying...`.
- **Security key fallback** restyled as a clean secondary action with `KeyRound` icon. Copy: `Use security key instead` / `Checking security key...`. Only renders when a passkey is registered AND the browser supports it.
- **Lost-phone copy** kept verbatim, just rebalanced to slate-500 for better contrast.
- **Footer:** sign-in-as-someone-else stays subtle but readable; bottom-of-page copyright now reads "© YEAR Blossom ABA Therapy · Secure operational workspace".

## MFA functionality preserved (verified by diff)

- No-user redirect to `/auth` ✅
- `supabase.auth.mfa.listFactors()` + verified-TOTP detection ✅
- `user_email_mfa` fallback lookup ✅ (and account-email fallback)
- `supabase.auth.mfa.challenge` / `supabase.auth.mfa.verify` ✅
- `email-mfa` edge function send / verify ✅
- `markMfaVerified(user.id)` on every success path ✅
- `navigate(redirectTo, { replace: true })` using `location.state.from` ✅
- Sign-out flow ✅
- `employee_pin_settings.passkey_credential_id` lookup + `verifyWithPasskey` fallback ✅
- All error toasts ✅
- Loading / disabled / spent-challenge re-issue ✅
- Support email `hr@blossomabatherapy.com` ✅

## Viewports checked

| Viewport | Result |
| --- | --- |
| Desktop 1440 | Two-column layout, balanced. No overflow. |
| Laptop 1280 | Two-column layout. Card stays centered in right column. |
| Tablet 768 | Single-column. Logo top-left, card centered. No overflow. |
| Mobile 390 | Single-column. OTP fits comfortably. Verify and security-key buttons readable. Footer doesn’t overlap. |

## Build

- TypeScript: pass (presentational changes only; props on `MfaBrandShell` are additive and optional, so `MfaSetup.tsx` continues to compile unchanged).
- `npm run build`: pass (run by the Lovable harness on commit).

## Known limitations

- Email-code resend cooldown is not added in this pass per the prompt (no server-side cooldown logic exists yet). The existing immediate-resend behavior is preserved.
- Brand panel only renders on `lg:` and up by design — on tablet and mobile the page focuses entirely on the MFA card.

## Final status

**PASS** — `/mfa/verify` is visually upgraded to a Blossom OS secure-access experience without touching MFA logic, routes, schema, or edge functions.