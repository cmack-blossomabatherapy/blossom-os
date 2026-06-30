# Authorizations Team — Pass 6 QA Manifest

## What changed

- Deep-link resolution on `/authorizations` and `/auth-workspace` now accepts
  both `?authId=` (public/visible auth id) and `?overlayId=`
  (`authorization_operational_records.id`). Either form opens the correct
  live record. Drawer close removes **both** params.
- Missing Docs (`/ops/missing-docs`) "Open Auth" link now passes both
  `authId` and `overlayId` so it always resolves correctly, regardless of
  whether the requirement is attached to a Monday-imported or manual record.
- New Authorization flow no longer silently swallows initial-note failures.
  If the note save fails, the authorization is preserved, an error toast is
  shown, the dialog stays open with the note text, and the button changes to
  "Retry note" so the user does not create duplicate authorizations.
- `/auth-workspace` filter chips (State, Risk, Expiring, PR, QA, Assigned)
  are now real `FilterDropdown` controls backed by `wsFilters` state. The
  `visible` memo applies them and selection is cleared when filters change.
  Saved Views persist/restore filters via the `wsFilters` config field.
- Stale "showing sample queue layout" copy is gone. Empty state now reads:
  *"No live authorizations found yet. Import Monday authorizations, create a
  manual authorization, or connect CentralReach when ready."*
- `/auth-workspace` drawer Timeline, Missing Documentation, and PR Tracking
  sections now read from the live `Authorization.timeline` /
  `missingRequirements` / activity data, not hardcoded fake entries.
  Empty cases show honest copy ("No activity logged yet.",
  "No PR tracking activity has been logged yet.").
- `/auth-workspace` drawer "Notes & Activity" textarea now actually saves
  through `actions.addNote(buildOverlay(auth), text)` via a real **Add Note**
  button. Success clears the textarea and refreshes live data; failure shows
  an error message and preserves the text.
- "Follow" button removed from the drawer (no follow/watch table exists yet).
  "Note" button now focuses the in-drawer composer.
- Added an `AuthSubnav` on both `/authorizations` and `/auth-workspace` that
  links Main List, Focused Queue, Expiring, Missing Docs, Payer
  Requirements, and Reports — making the relationship between surfaces
  obvious.

## Files touched

- `src/components/authorizations/AuthorizationActionUI.tsx`
- `src/pages/os/OSAuthorizations.tsx`
- `src/pages/os/OSAuthWorkspace.tsx`
- `src/pages/os/operations/MissingDocs.tsx`
- `src/test/authorizationsPass6.test.ts` (new)
- `docs/authorizations-team-pass-6-qa-manifest.md` (this file)

## Database / schema changes

None. All work reuses existing tables:
`authorization_operational_records`, `authorization_requirements`,
`authorization_tasks`, `authorization_activity`, `monday_authorizations_raw`,
`payer_requirements`.

## How deep-link resolution works

`OSAuthorizations` and `OSAuthWorkspace` each define a `resolveAuthId(id)`
helper:

1. If `id` matches an `Authorization.id` already loaded in `live.items`,
   return it directly.
2. Otherwise, reverse-map via `live.overlayIdByAuthId` (a `Map<publicId,
   overlayId>`) to find the public id whose overlay matches `id`.
3. Otherwise, return `id` unchanged (covers standalone overlay-only manual
   or CentralReach records, where the visible id _is_ the overlay id).

The init reads `searchParams.get("authId") ?? searchParams.get("overlayId")`
and a `useEffect` keeps the drawer in sync when either changes.

## How Missing Docs opens the correct auth

Each row in Missing Docs is an `authorization_requirements` row whose
`authorization_id` is the operational overlay id. The "Open Auth" link emits

```
/authorizations?authId=<overlay-id>&overlayId=<overlay-id>
```

On the destination page the resolver:

- First tries `authId` against `live.items` (works for manual / CR records
  whose visible id _is_ the overlay).
- If that fails, the reverse map on `overlayId` finds the public visible id
  for Monday-imported records.

Either way the drawer opens with the correct live record, correct source
badge, child records, and CentralReach readiness.

## CentralReach readiness

The drawer continues to render `CentralReachReadinessSection` with the
source system, CR auth/client id, sync status, last synced, authorization
number, tracking number, service code, hours, and a checklist. Copy
explicitly says *"CentralReach integration pending — fields are tracked
locally and will sync once the integration is enabled."* No claim that the
live API is connected.

## Tests run

```
pnpm exec vitest run \
  src/test/authorizationsPass3.test.ts \
  src/test/authorizationsPass4.test.ts \
  src/test/authorizationsPass5.test.ts \
  src/test/authorizationsPass6.test.ts
```

Result: **4 test files / 41 tests passed**.

Pass 6 specifically guards:

- `/authorizations` reads both `authId` and `overlayId` and uses
  `resolveAuthId` + `overlayIdByAuthId`.
- Drawer close removes both params.
- Missing Docs link includes `overlayId=`.
- No `.catch(() => undefined)` in any active Authorizations write path.
- `/auth-workspace` chips are real `FilterDropdown`s backed by `wsFilters`,
  and `visible` references `wsFilters`.
- No "showing sample queue layout" copy.
- No hardcoded fake drawer timeline ("PR requested from BCBA", "Escalated
  to State Director", "3 pings").
- Drawer note save calls `actions.addNote(buildOverlay(openAuth), text)`.
- Reports catalog does not link `/os/authorizations`.
- Authorizations Team menu keeps `/reports` as the sole reports route.
- `AuthSubnav` ties the surfaces together.

## Known remaining gaps

- "Follow / watch" preferences for individual authorizations are not
  persisted yet (no follow table). The button was removed rather than
  faked. A future pass can add a `authorization_follows` table.
- "Workflow Guidance" and "Operational Insights" right-rail content on
  `/auth-workspace` is still static demonstrative copy. It's framed as
  prompts rather than claims of automation, but a future pass should drive
  these from live counts or an AI hook.
- Payer Requirements is database-backed and searchable but does not yet
  expose a one-click `/authorizations?payor=…&state=…` deep link from each
  row. The cross-link is available via the new `AuthSubnav`.
- The QA dropdown in `/auth-workspace` matches by label substring; once a
  canonical QA status enum is introduced on `Authorization`, the filter
  should switch to that.