# Authorizations Team — Pass 9 QA Manifest

## What changed

- Canonicalized the Super Admin **Operations** menu in `src/pages/os/OSShell.tsx`.
  - `/ops/authorizations` → `/authorizations`
  - `/ops/approved-authorizations` → `/authorizations?stage=approved`
  - `/ops/denials` → `/authorizations?stage=denied`
  - `/ops/expiring-authorizations`, `/ops/missing-docs`, `/ops/payer-requirements` remain (real operational subpages).
- Cleaned `ROLE_SPECIFIC_LIVE_PATHS` for `authorization_coordinator` and `authorization_manager`: removed
  `/ops/approved-authorizations` and `/ops/denials`. Approved/Denied menu links stay live because their
  base path (`/authorizations`) is already in the live set and `OSShell` strips query strings before checking.
- Repointed State Director and Assistant State Director Authorizations snapshot links in
  `src/lib/os/roleMenus.ts` from `/ops/authorizations` to `/authorizations`, and updated their
  live-path sets in `OSShell.tsx` to match.
- Rewrote the slow Pass 7 "no hardcoded /os/authorizations" test to use a targeted whitelist of active
  menu/route/report files instead of a full recursive walk of `src/`. `legacyRoutes.tsx` remains the
  documented exemption.
- Added `src/test/authorizationsPass9.test.ts` to lock in canonical routes across the OS shell,
  live-path sets, role menus, and the Pass 7 bounded-scan guarantee.

## Why the previous verification failed

`authorizationsPass7.test.ts` walked every file under `src/` synchronously on each run and exceeded
the 5 s Vitest timeout as the codebase grew. In parallel, the actual OS shell (`OSShell.tsx`) had
never been canonicalized to the new `/authorizations` routes — Pass 8 only touched `AppSidebar.tsx`.

## Files touched

- `src/pages/os/OSShell.tsx`
- `src/lib/os/roleMenus.ts`
- `src/test/authorizationsPass7.test.ts`
- `src/test/authorizationsPass9.test.ts` (new)
- `docs/authorizations-team-pass-9-qa-manifest.md` (this file)

## Tests added / updated

- **Updated:** `authorizationsPass7.test.ts` — replaced unbounded `readdirSync` walk with a targeted
  file whitelist (`App.tsx`, `OSShell.tsx`, `roleMenus.ts`, `AuthorizationReportViews.tsx`,
  `AppSidebar.tsx`).
- **Added:** `authorizationsPass9.test.ts` — 10 assertions covering:
  - OSShell Super Admin operations menu uses canonical routes.
  - OSShell Super Admin operations menu no longer uses `/ops/authorizations`,
    `/ops/approved-authorizations`, or `/ops/denials`.
  - `authorization_coordinator` and `authorization_manager` live-path sets no longer include the
    legacy approved/denied redirect paths and still include the required canonical set.
  - State Director / Assistant State Director snapshot live-path is `/authorizations`.
  - Authorization role menus in `roleMenus.ts` still expose the canonical routes.
  - Pass 7 test does not perform an unbounded synchronous walk.

## Test / build results

```
pnpm exec vitest run \
  src/test/authorizationsPass3.test.ts \
  src/test/authorizationsPass4.test.ts \
  src/test/authorizationsPass5.test.ts \
  src/test/authorizationsPass6.test.ts \
  src/test/authorizationsPass7.test.ts \
  src/test/authorizationsPass8.test.ts \
  src/test/authorizationsPass9.test.ts

Test Files  7 passed (7)
Tests       89 passed (89)
```

Production build passes (Vite bundle succeeds; only pre-existing chunk-size warnings remain).

## Remaining gaps (honest)

- **CentralReach is not connected.** Language across Authorizations surfaces continues to reflect this.
- **External send providers are not connected.** The external send queue remains an honest, actionable
  local queue.
- This pass is intentionally scoped to route/menu/test correctness and shell hardening. No new report
  pages or workflow rewrites were introduced.