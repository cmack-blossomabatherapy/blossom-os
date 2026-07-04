# Authorizations Team — Pass 11 QA Manifest

## Summary
Final stale-route cleanup. Removed the last two active code paths that still sent users through the deprecated `/ops/authorizations` URL before landing on the canonical `/authorizations` page.

## Files touched
- `src/routes/legacyRoutes.tsx` — `/os/authorizations` now redirects directly to `/authorizations` (previously redirected via `/ops/authorizations`).
- `src/pages/os/intake/IntakeDashboard.tsx` — in-page "→ Authorizations" link now points directly to `/authorizations`.
- `src/test/authorizationsPass11.test.ts` — new regression coverage.
- `docs/authorizations-team-pass-11-qa-manifest.md` — this manifest.

## Tests run
```
pnpm exec vitest run \
  src/test/authorizationsPass3.test.ts \
  src/test/authorizationsPass4.test.ts \
  src/test/authorizationsPass5.test.ts \
  src/test/authorizationsPass6.test.ts \
  src/test/authorizationsPass7.test.ts \
  src/test/authorizationsPass8.test.ts \
  src/test/authorizationsPass9.test.ts \
  src/test/authorizationsPass10.test.ts \
  src/test/authorizationsPass11.test.ts

pnpm exec vitest run \
  src/test/authorizationRoleMenuSprint16.test.ts \
  src/test/stateDirectorFunctionalityPass1.test.ts \
  src/test/canonicalNavLinks.test.ts \
  src/test/placeholderRoutes.test.ts
```

## Build
```
pnpm run build
```

## Honest remaining gaps
- CentralReach is **not** connected — Authorizations remains readiness/integration-ready only.
- The `/ops/authorizations`, `/ops/approved-authorizations`, and `/ops/denials` compatibility redirects in `src/App.tsx` remain **intentionally** to preserve legacy bookmarks.
- No new report pages were created; reports stay unified under `/reports`.