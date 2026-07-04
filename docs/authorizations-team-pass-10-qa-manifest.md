# Authorizations Team — Pass 10 QA Manifest

## Summary

Focused completion/hardening pass for the Authorizations team. No feature rebuild.
Removed the last stale `/ops/authorizations` alias from the State Director and
Assistant State Director live-path sets, wired `/ai/assistant` into the
Authorizations Coordinator and Manager live-path sets so the in-page Ask Blossom
CTA in `/auth-workspace` resolves to a live page for those roles, and updated
the three stale role/menu tests that still asserted the legacy Authorizations
route model. Added Pass 10 test coverage to lock these guarantees in.

## Files touched

- `src/pages/os/OSShell.tsx` — role live-path sets (see below).
- `src/test/authorizationsPass7.test.ts` — Ask Blossom CTA assertion now uses canonical `/ai/assistant?context=authorizations`.
- `src/test/authorizationRoleMenuSprint16.test.ts` — replaced `/ops/approved-authorizations` and `/ops/denials` with canonical `/authorizations?stage=approved` / `/authorizations?stage=denied`; legacy `/ops` routes asserted as `<Navigate>` redirects rather than `PermissionRoute`s.
- `src/test/stateDirectorFunctionalityPass1.test.ts` — dropped `/ops/authorizations` from the State Director live-path expectation.
- `src/test/authorizationsPass10.test.ts` — new coverage.
- `docs/authorizations-team-pass-10-qa-manifest.md` — this file.

## OSShell live-path changes

- `state_director`: removed `/ops/authorizations`. Canonical `/authorizations` remains.
- `assistant_state_director`: removed `/ops/authorizations`. Canonical `/authorizations` remains.
- `authorization_coordinator`: added `/ai/assistant` (live-path only; not a menu item).
- `authorization_manager`: added `/ai/assistant` (live-path only; not a menu item).

Ask Blossom remains an **in-page operational CTA** inside `/auth-workspace`. It
is intentionally NOT a visible Authorizations menu item.

## Legacy compatibility

`src/App.tsx` retains, unchanged, the compatibility redirects:

```
<Route path="/ops/authorizations" element={<Navigate to="/authorizations" replace />} />
<Route path="/ops/approved-authorizations" element={<Navigate to="/authorizations?stage=approved" replace />} />
<Route path="/ops/denials" element={<Navigate to="/authorizations?stage=denied" replace />} />
```

No visible menu or live-path set treats these as first-class routes anymore.

## Test commands run

```
pnpm exec vitest run \
  src/test/authorizationsPass3.test.ts \
  src/test/authorizationsPass4.test.ts \
  src/test/authorizationsPass5.test.ts \
  src/test/authorizationsPass6.test.ts \
  src/test/authorizationsPass7.test.ts \
  src/test/authorizationsPass8.test.ts \
  src/test/authorizationsPass9.test.ts \
  src/test/authorizationsPass10.test.ts

pnpm exec vitest run \
  src/test/authorizationRoleMenuSprint16.test.ts \
  src/test/stateDirectorFunctionalityPass1.test.ts \
  src/test/canonicalNavLinks.test.ts \
  src/test/placeholderRoutes.test.ts
```

## Build command run

```
pnpm run build
```

## Honest remaining gaps

- **CentralReach is not connected.** The Authorizations workspace continues to
  surface auth data from local/seeded sources and honestly describes the
  integration as readiness-only ("Connect CentralReach or import authorization
  data" empty state). No CR API calls have been added in this pass.
- **Ask Blossom is a CTA, not a menu item.** Authorizations users reach it from
  the workspace surface. Menu-level AI navigation remains intentionally hidden
  for Authorizations per the Phase 0 unification.
- **Reports stays unified.** No role-specific Authorizations reports route was
  added; all Authorizations reports live under `/reports`.