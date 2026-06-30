# Authorizations Team — Pass 5 QA Manifest

## Summary
Pass 5 hardens the Authorizations role so source-system identity is correct in
every active view, write actions visibly refresh the UI, report drilldowns and
KPIs are truthful, and coordinators can edit the full operational record. A
CentralReach readiness section now surfaces on both detail drawers without
pretending the integration is live.

## Changes
- **Auth Workspace source correctness** – `OSAuthWorkspace.liveAuthToCard` now
  accepts `{ source, overlayId, bcba, meta }` from `useLiveAuthorizations` and
  preserves Monday / manual / CentralReach identity per row. `buildOverlay`
  forwards `overlay_id` and the matching per-source identifier.
- **Refresh after writes** – Added `runActionAndRefresh` in `OSAuthWorkspace`
  and `runRefresh` in the `OSAuthorizations` drawer. Every row, drawer, prompt,
  and bulk action awaits the hook and then calls `live.refresh()`. No active
  Authorizations write handler still ends with `.catch(() => undefined)`.
- **Report drilldown fix** – `auth-workflow-bottleneck.drilldownPath` now
  points to `/authorizations?view=qa` (valid ViewId).
- **Live report KPIs** – New `useAuthorizationReportMetrics` hook computes
  expiration risk (<14 / <30), workflow bottleneck count + avg age, and
  operational performance (approval rate + turnaround). `ReportsHome` overlays
  these into the matching report cards. Empty datasets show `Setup`, never `-`.
- **Full create/edit flow** – `useAuthorizationActions.updateAuthorizationRecord`
  whitelists writable columns, updates `authorization_operational_records`, and
  logs an activity entry describing the changed fields. The new
  `EditAuthorizationDialog` exposes client/payer/owners/dates/auth #/tracking #/
  service code/hours/priority/denial reason/next action. The drawer Edit
  button opens it and refreshes on save.
- **CentralReach readiness section** – Reusable
  `CentralReachReadinessSection` shows source, sync status, last synced, auth
  number, tracking number, service code, hours, and a 6-point readiness
  checklist. Rendered in both `/authorizations` and `/auth-workspace`
  drawers. Footer explicitly states integration is pending — no fake success.
- **Live metadata channel** – `useLiveAuthorizations` now exposes `metaById`
  carrying CentralReach + operational fields enriched from the overlay row,
  consumed by both drawers and the Edit dialog.
- **Missing Docs linkage** – `MissingDocs` rows render an "Open Auth" link
  to `/authorizations?authId=<id>` whenever `authorization_id` is present.
  Marking Received/Waived flows through the existing `update` action and is
  reflected in the drawer after refresh.

## Files Changed
- `src/pages/os/OSAuthWorkspace.tsx`
- `src/pages/os/OSAuthorizations.tsx`
- `src/components/authorizations/AuthorizationActionUI.tsx`
- `src/hooks/useAuthorizationActions.ts`
- `src/hooks/useLiveAuthorizations.ts`
- `src/hooks/useAuthorizationReportMetrics.ts` (new)
- `src/lib/os/reportsCatalog.ts`
- `src/pages/os/reports/ReportsHome.tsx`
- `src/pages/os/operations/MissingDocs.tsx`
- `src/test/authorizationsPass5.test.ts` (new)
- `docs/authorizations-team-pass-5-qa-manifest.md` (this file)

## RLS / Security
- No schema changes. `updateAuthorizationRecord` whitelists columns before the
  UPDATE, and all writes go through `authorization_operational_records` which
  already has scoped RLS from prior passes.
- No service-role keys used client-side.
- No new `SECURITY DEFINER` functions.
- Activity entries reuse the existing `logActivity` helper and policies.

## Known Limitations
- CentralReach integration remains pending. Readiness section is honest about
  this; no API call is made and no "synced" toast is shown unless real sync
  data is set externally.
- Outbound Message BCBA still queues an activity entry (external send
  integration pending), as labeled in the UI.
- Operational report KPI averages are derived from currently-loaded live
  authorizations; date-bounded historical analytics are out of scope here.

## Verification
- `bunx tsgo --noEmit` → 0 errors.
- `bunx vitest run src/test/authorizationsPass3.test.ts src/test/authorizationsPass4.test.ts src/test/authorizationsPass5.test.ts` → 30/30 pass.

## Manual QA Checklist
1. Sign in as Super Admin, view as Authorizations Team.
2. Open every Authorizations menu item — all live, no placeholders.
3. `/authorizations` → create manual auth → confirm "Manual" badge appears.
4. Open the same record in `/auth-workspace` → still shows "Manual".
5. Add a note, submit, send to QA, resolve docs → UI refreshes without reload.
6. Open drawer → Edit → change auth number / hours / next action → save →
   confirm fields persist and an activity entry is logged.
7. `/reports` → confirm the three Authorizations cards show numeric values
   (or `Setup` when empty), not bare `-`. Click "Authorization Workflow
   Bottlenecks" → lands on `/authorizations?view=qa`.
8. `/ops/missing-docs` → for a row with `authorization_id`, click Open Auth →
   confirm the linked authorization opens in its drawer.
9. Confirm both drawers show CentralReach Readiness with truthful labels.