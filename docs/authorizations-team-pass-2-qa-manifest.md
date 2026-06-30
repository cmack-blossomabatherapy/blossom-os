# Authorizations Team — Pass 2 QA Manifest

Pass 2 closes the seven items deferred by Pass 1. This manifest records the
routes touched, migrations added, non-negotiables verified, and the residual
items intentionally carried into a future pass.

## Pass 1 deferred items — status

| # | Deferred item                                   | Pass 2 status | Where it lives |
|---|-------------------------------------------------|---------------|----------------|
| 1 | `OSAuthWorkspace` action persistence            | ✅ Shipped    | `src/pages/os/OSAuthWorkspace.tsx` (wired to `useAuthorizationActions`) |
| 2 | `OSAuthorizations` writing into overlay         | ✅ Shipped    | `src/pages/os/OSAuthorizations.tsx` (via `actions.ensureOverlay` + workflow helpers) |
| 3 | Saved views                                     | ✅ Shipped    | `useAuthorizationSavedViews` + `SavedViewsMenu` in both surfaces |
| 4 | Per-state RLS scoping                           | ✅ Shipped    | `supabase/migrations/20260629214739_*.sql` — `has_authorization_state_access` + SELECT policy on `authorization_operational_records` |
| 5 | Source badges (Monday / CR / Manual)            | ✅ Shipped    | `SourceBadge` in `AuthorizationActionUI.tsx`, used in OSAuth + Workspace |
| 6 | Authorization-specific report tiles in `/reports` | ✅ Shipped    | `src/lib/os/reportsCatalog.ts` — `visibleReportsForRole` now exposes 7 auth-operational tiles for auth/leadership roles |
| 7 | External send integration                       | 🟡 Surfaced as **Queued** | `useAuthorizationActions.queueExternalSend` logs an `external_send_pending` activity row; button now shows a `Queued` chip + toast explaining integration is pending |

## Routes touched
- `/ops/authorizations` (`OSAuthorizations.tsx`) — Message BCBA button now communicates queued state.
- `/reports` (`ReportsHome.tsx`) — automatically picks up the 7 new auth-operational tiles via catalog filter.

## Files modified this pass
- `src/lib/os/reportsCatalog.ts` — `visibleReportsForRole` now unions shared reports with auth-operational tiles for `super_admin`, `authorization_coordinator`, `operations_leadership`, `executive_leadership`, `state_director`, and `qa_team`.
- `src/pages/os/OSAuthorizations.tsx` — "Message BCBA" button shows a `Queued` chip, tooltip, and toast that name the pending integration boundary.

## Migrations
- No new migrations this pass. Per-state RLS (`has_authorization_state_access`) was shipped in `20260629214739_b96a3f0a-910f-4d01-8a2a-9234f7b26440.sql` during Pass 1 hardening and is re-verified here.

## Non-negotiables verified
- ✅ No mock writes — every action goes through `useAuthorizationActions` → Supabase.
- ✅ Saved views persist per-user via `auth_saved_views` table.
- ✅ Overlay (`authorization_operational_records`) is the single source of truth; both surfaces call `ensureOverlay` before mutating.
- ✅ Source provenance is always visible — every row in both surfaces renders a `SourceBadge`.
- ✅ Per-state read scoping enforced at the DB layer via `has_authorization_state_access`.
- ✅ Reports home now lists 7 auth-operational tiles in addition to the shared CR-upload reports for auth/leadership roles.
- ✅ External send actions are clearly labeled as queued until an integration partner (Twilio/SendGrid/Outlook) is wired.

## Intentionally deferred to a future pass
1. Real outbound delivery for `queueExternalSend` (Twilio SMS, SendGrid/Outlook email). Current behavior writes an `external_send_pending` activity row only.
2. Saved-view sharing UI (server-side share + permissions matrix). Schema supports it; UI today is owner-only.
3. Authorization-report drilldowns from `/reports` tiles into pre-filtered Authorization workspace views.