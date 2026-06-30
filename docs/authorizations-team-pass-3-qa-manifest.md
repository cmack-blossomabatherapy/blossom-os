# Authorizations Team — Pass 3 QA Manifest

This pass continues Pass 2 hardening and moves the Authorizations module from
prototype toward 100% functional, database-backed behavior. It does **not**
rebuild any working part of the system.

## Files changed this pass

- `src/hooks/useLiveAuthorizations.ts`
  - Merged source of truth: `monday_authorizations_raw` +
    `authorization_operational_records` + `authorization_requirements` +
    `authorization_tasks` + `authorization_activity`.
  - Overlay rows override Monday rows by `monday_item_id`.
  - Manual / CentralReach overlay rows surface even without a Monday row.
  - Exposes `mergeOverlayIntoAuth` and `attachChildren` helpers for tests.
- `src/hooks/useAuthorizationActions.ts`
  - All Supabase writes now check `{ error }` and throw on failure.
  - `submitAuth`, `sendToQA`, `resolveDocs`, `reviewDenial`, `markReviewed`,
    bulk assign and bulk status change update workflow stage/status and log
    activity consistently.
- `src/components/authorizations/AuthPromptDialog.tsx`
  - New shadcn-based replacement for `window.prompt` used throughout the
    Authorizations surfaces (notes, bulk assign, bulk status change).
- `src/components/authorizations/AuthorizationActionUI.tsx`
  - `NewAuthorizationDialog` now persists the initial note by writing an
    activity entry against the newly created overlay record.
- `src/pages/os/OSAuthWorkspace.tsx`
  - Removed the entire `FALLBACK_AUTHS` demo dataset.
  - Removed hardcoded staff names (`Dr. Nguyen`, `Dr. Cole`, `Rivky`,
    `Julianne`, `Shira / Rachel`) from Recent Activity and the drawer.
  - Notes section now shows an honest empty-state placeholder rather than
    fake notes.
- `src/pages/os/OSAuthorizations.tsx`
  - Replaced `window.prompt` "Add a note" flow with `AuthPromptDialog`.
  - Removed hardcoded `bcbaName` fallback list of fake doctors; falls back
    to `Unassigned BCBA` when no live BCBA is known.
  - Neutralized hardcoded State Director / outreach owner names in PR
    tracking timeline and the "Ask Blossom" answer builder.
- `src/test/authorizationsPass3.test.ts`
  - New test suite covering: no FALLBACK_AUTHS, no `window.prompt`, no
    hardcoded staff names, merge helpers behavior, and a single canonical
    `/reports` link in the authorization_coordinator menu.

## Migrations added this pass

None new in Pass 3. Pass 3 relies on the schema landed in Pass 1/Pass 2
(`authorization_operational_records`, `authorization_requirements`,
`authorization_tasks`, `authorization_activity`, `payer_requirements`,
`authorization_saved_views`, plus the `centralreach_*` overlay columns).

## Routes verified for `authorization_coordinator`

- `/authorizations`
- `/auth-workspace`
- `/ops/approved-authorizations` (redirects/filters into `/authorizations`)
- `/ops/denials` (redirects/filters into `/authorizations`)
- `/ops/expiring-authorizations`
- `/ops/missing-docs`
- `/ops/payer-requirements`
- `/reports` (single canonical Reports page; no role-specific Reports homes)
- `/academy`
- `/resource-library`

## Tests added / updated

- `src/test/authorizationsPass3.test.ts` (6 tests, all passing):
  - `FALLBACK_AUTHS` removed from `OSAuthWorkspace`.
  - No `window.prompt(` in `OSAuthWorkspace` or `OSAuthorizations`.
  - No hardcoded individual staff names in live auth surfaces.
  - `mergeOverlayIntoAuth` overrides Monday values with overlay values.
  - `attachChildren` wires requirements / tasks / activity to the right
    authorization.
  - `authorization_coordinator` menu contains exactly one Reports link and
    it points to `/reports`.

## Build / test results

- `bunx tsgo --noEmit` — clean.
- `bunx vitest run src/test/authorizationsPass3.test.ts` — 6/6 passing.

## Intentional limitations (not done in this pass)

- **CentralReach API delivery is not wired.** The overlay schema and UI
  expose `Ready / Not Ready / Queued / Synced / Error` states honestly;
  nothing in the UI claims a record was actually sent to CentralReach.
- **Outbound email / SMS / call** are still placeholders inside
  `LeadContactActions` and are not used by the Authorizations workflow.
- **Report drilldowns** for authorization tiles use existing `/authorizations`
  filter parameters. A dedicated authorization report detail page under
  `/reports/...` is still a future enhancement, not a regression.
- **New Authorization edit drawer** for arbitrary overlay fields is
  expandable; the current dialog covers the core fields and notes, with
  notes persisted to activity.