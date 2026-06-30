# Authorizations Team — Pass 4 QA Manifest

## Scope

Runtime hardening of the Authorizations operational surface. No new
Authorizations features were introduced; this pass corrects data-contract
mismatches, silent failures, duplicate overlay risks, hardcoded sample data,
and report routing so the existing Pass 1–3 work is reliable day-to-day.

## What changed

### Action correctness — `src/hooks/useAuthorizationActions.ts`

- `ensureOverlay` now accepts a direct `overlay_id` fast-path so callers that
  already know the operational row id skip the source-lookup + insert path
  entirely. Prevents duplicate manual overlays when an initial note is logged
  immediately after `createManualAuth`.
- Manual overlays inserted without an external system key are now stamped with
  `source_id = <new overlay id>` so subsequent lookups by `source_id` find the
  same row.
- `resolveDocs` writes the **exact** value `"Received"` (matches the
  `authorization_requirements.status` check constraint), uses
  `.neq("status", "Received")`, returns the actual affected-row count, throws
  on database errors, and only emits a success toast when the update truly
  succeeded. If no open requirements exist, the activity log records
  "Documentation reviewed — no open requirements to resolve."
- `markReviewed` now fetches existing `metadata`, merges the review fields
  into it, and writes back the merged object — no more blind overwrite.
- The duplicate `sendToQAImpl` definition was removed. A single `sendToQA`
  remains; it updates `workflow_stage` + `status` to `"In QA Review"`, logs
  activity with `newValue`, and throws on failure.

### Manual-create + initial note — `src/components/authorizations/AuthorizationActionUI.tsx`

- The follow-up `addNote` call after `createManualAuth` now passes
  `overlay_id: id` so it writes against the inserted row instead of creating
  a second manual overlay.

### Source-system correctness — `src/pages/os/OSAuthorizations.tsx`

- `buildOverlayFromAuth` now takes the real `source` ("monday" | "manual" |
  "centralreach"), the known `overlayId`, and the live BCBA so action
  payloads no longer treat every row as Monday.
- `AuthRow` and `AuthRecords` accept and propagate the per-row source so
  `<SourceBadge source=… />` reflects the actual origin.
- `applyView` no longer defaults the current user to `"Priya K."`; it uses
  the authenticated user's `displayName` from `AuthContext` (and returns an
  empty list for the "Assigned to me" view when no name is available).
- Coordinator UUIDs are no longer rendered as if they were names. A
  `safeNameLabel` helper falls back to `"Assigned coordinator"` for raw
  UUID values.
- `NewAuthorizationDialog` is wired with `onCreated={() => { void live.refresh(); }}`.
- `AuthDrawer` receives the real source + overlay id and forwards them into
  action payloads.

### Workspace cleanup — `src/pages/os/OSAuthWorkspace.tsx`

- The right-rail Operational Summary is now computed from live `AuthCard`s
  (worked today / overdue / ready to submit / PR escalations).
- Recent Activity in the right rail is now driven by a live
  `authorization_activity` query (`activity_type`, `title`, `body`,
  `created_at`) instead of hardcoded "Sample" entries. Shows an empty state
  when there is no live activity.
- The QA reviewer KV in the detail drawer no longer hardcodes "Rachel" — it
  shows `auth.bcba || "Unassigned"`.
- `NewAuthorizationDialog` is wired with `onCreated={() => { void refresh(); }}`.
- Added `relTimeShort` and `prettyActivityType` helpers for the rail.

### Reports routing — `src/lib/os/permissions.ts`, `src/lib/os/reportsCatalog.ts`

- `MODULE_ROUTES.marketing_reports` now points at `/reports?category=marketing`
  instead of `/marketing/reports`. The legacy `/marketing/reports` route in
  `App.tsx` continues to redirect to the canonical Reports page.
- The three Authorizations reports (`auth-expiration-risk`,
  `auth-workflow-bottleneck`, `auth-operational-performance`) declare a
  `drilldownPath` so report cards open useful Authorizations views.

### Tests

- New: `src/test/authorizationsPass4.test.ts` (14 tests) — guardrails for the
  fixes above.
- Updated previously: `src/test/authorizationsPass3.test.ts` to require
  `requirement_name` instead of `title`.

## Files changed this pass

- `src/hooks/useAuthorizationActions.ts`
- `src/components/authorizations/AuthorizationActionUI.tsx`
- `src/pages/os/OSAuthorizations.tsx`
- `src/pages/os/OSAuthWorkspace.tsx`
- `src/lib/os/permissions.ts`
- `src/lib/os/reportsCatalog.ts`
- `src/test/authorizationsPass4.test.ts` (new)
- `docs/authorizations-team-pass-4-qa-manifest.md` (this file)

## Supabase tables touched

No schema changes. Reads/writes only against existing tables:
- `authorization_operational_records` (read + write — overlay create,
  `source_id` self-stamp, metadata merge, workflow stage updates).
- `authorization_requirements` (write `"Received"` + `received_at`).
- `authorization_activity` (read for rail, write for action logs).

## RLS / policy notes

- No policy changes. `markReviewed` now requires `SELECT` visibility on the
  target overlay row in order to fetch existing metadata before merging —
  this is already covered by the existing authenticated-user policies for
  `authorization_operational_records`.

## Known limitations

- Coordinator UUIDs are replaced with the label "Assigned coordinator" when a
  display name cannot be resolved. A future pass should join
  `assigned_auth_coordinator` against `profiles.display_name` to render the
  real name everywhere.
- CentralReach send/queue is still a placeholder. No fake API success path
  exists; readiness fields surface where present.
- Authorizations report `kpiPreviews` still show `"-"` placeholders; the
  drilldown takes the user to a real Authorizations view, but live KPI math
  is a separate follow-up.

## Validation

- `bunx tsgo --noEmit` — clean.
- `bunx vitest run src/test/authorizationsPass3.test.ts src/test/authorizationsPass4.test.ts`
  → **20 / 20 passing**.

## Manual QA checklist

1. Sign in as Super Admin, switch hat → Authorizations Team.
2. Open every Authorizations Team menu item — confirm no page drops into a
   legacy shell.
3. In the Authorizations workspace, confirm Monday-imported rows show the
   Monday source badge and manually created rows show the Manual badge.
4. Create a manual authorization with an initial note. Confirm:
   - The new row appears immediately (no browser reload).
   - Only one operational row is created (no duplicate overlays).
5. From the detail drawer: add a note, submit, send to QA, resolve docs —
   each action persists, refreshes, and shows in activity. No false success
   toasts when a write fails.
6. Open Reports from the Authorizations role — `/reports` opens; BCBA
   Productivity Report is still visible; the three Authorizations cards
   click into useful Authorizations views via their `drilldownPath`.