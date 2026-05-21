# Fix "factor with the friendly name … already exists" on /mfa/setup

## Root cause

`src/pages/MfaSetup.tsx` enrolls a new TOTP factor inside a `useEffect`. Two things combine to trigger the 422:

1. **Collisions on `friendly_name`.** It's generated as `` `Blossom OS · ${new Date().toLocaleDateString()}` ``, so every enroll the same day uses the exact same string. Supabase rejects a second enroll with that name (HTTP 422 — what you're seeing).
2. **The "clean up pending factors first" step races.** The effect does `listFactors → unenroll pending → enroll`, but:
   - In dev (StrictMode / HMR / Fast Refresh) the effect can fire twice; the cleanup `return` only flips a `cancelled` flag — it does **not** unenroll the factor the first run just created. The second run can list+unenroll before the first run's enroll response lands, then the first run's enroll resolves and lingers as an unverified factor.
   - If the user navigates away and back (or the component re-mounts for any other reason), the same race re-creates the same-named factor.

Network log confirms it: first `POST /factors` succeeded at 04:53:23 with `friendly_name "Blossom OS · 5/21/2026"`. 26s later a second `POST /factors` with the identical name returned 422.

## Plan

Edit only `src/pages/MfaSetup.tsx`.

1. **Reuse an existing unverified factor instead of re-enrolling.**
   In the boot effect, after `listFactors()`:
   - If exactly one unverified TOTP factor already exists, we cannot recover its QR/secret (Supabase only returns those at enroll time), so unenroll it and then enroll fresh.
   - But do the unenroll **sequentially** and **await** it before calling `enroll`, so the next enroll can't race against a not-yet-deleted same-named factor.

2. **Use a collision-proof `friendly_name`.**
   Replace `toLocaleDateString()` with a full ISO timestamp plus a short random suffix, e.g.:
   ```
   `Blossom OS · ${new Date().toISOString().replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 6)}`
   ```
   This removes the friendly-name collision entirely, so even if a stray unverified factor survives a cleanup race, the next enroll still succeeds.

3. **Guard against StrictMode double-invoke.**
   Add a module-scoped `let enrollInFlight: Promise<…> | null = null` (or a `useRef`) so concurrent mounts await the same enroll promise instead of each firing their own `POST /factors`. Clear it in the cleanup once it resolves.

4. **Handle the 422 defensively.**
   If `enroll` still returns "already exists", run another `listFactors → unenroll all unverified` pass and retry once. After the retry, surface a friendlier error to `bootError` ("Couldn't reset your previous setup — sign out and try again") instead of the raw Supabase string.

5. **Don't change `unenrollAllTotp` semantics or the rest of the verify flow.** The existing `handleSignOut` already calls `unenrollAllTotp()` when bailing out — leave it alone.

## Verification

- Open `/mfa/setup`, refresh several times, navigate away and back. No 422 in network; a single fresh QR renders each time.
- Trigger React StrictMode double-mount in dev: still only one successful `POST /factors` (or two with distinct friendly names, both succeeding).
- Sign out mid-setup via the footer button → `unenrollAllTotp` clears the pending factor; next `/mfa/setup` boots cleanly.

## Out of scope

- No changes to `MfaVerify`, `MfaBrandShell`, `Auth.tsx`, or auth context.
- No DB migrations; this is purely client-side.
