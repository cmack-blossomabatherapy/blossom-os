# Authorizations Team — Pass 1 QA Manifest

_Pass status: shipped. This document captures what changed, what's now live,
and what is intentionally deferred to a later pass._

## 1. What changed

**Database (new tables, all RLS-protected via `has_authorization_*_access` helpers):**
- `authorization_operational_records` — Blossom OS operational overlay for
  authorization work items. Includes CentralReach sync metadata fields
  (`centralreach_authorization_id`, `centralreach_client_id`,
  `centralreach_sync_status`, `centralreach_last_synced_at`,
  `centralreach_payload`) and `source_system` enum (`monday | centralreach | manual`).
- `authorization_requirements` — per-auth document / missing-info tracker
  (also backs the Missing Docs page).
- `authorization_activity` — append-only timeline for status changes,
  submissions, approvals, denials, CR syncs, etc.
- `authorization_tasks` — auth-scoped tasks with owner + due date.
- `payer_requirements` — payer-by-state requirements (replaces localStorage).

**Access control:**
- `has_authorization_write_access(uuid)` — admins, super/systems admins,
  Authorizations Team (`auth_team`, `authorization_manager`,
  `authorization_coordinator`), and operations leadership.
- `has_authorization_read_access(uuid)` — write tier + State Directors,
  Assistant State Directors, QA roles, BCBA, and case managers.
- Both helpers are `SECURITY DEFINER` with `EXECUTE` revoked from `PUBLIC`
  and granted only to `authenticated` and `service_role`.

**Routing consolidation (one Reports page; live Authorizations workspace):**
- `/reports` now renders `ReportsHome` (role-aware, saved-report-aware).
- `/reports/catalog` is now a redirect to `/reports`.
- `/reports/landing` (the prior thinner landing) is preserved as a
  non-menu route for any legacy links.
- `/ops/authorizations` → redirects to `/authorizations`.
- `/ops/approved-authorizations` → redirects to `/authorizations?stage=approved`.
- `/ops/denials` → redirects to `/authorizations?stage=denied`.

**Pages converted from static/localStorage → live or DB-backed:**
- `OperationsPages.AuthorizationsPhase6Page` — static table retired, now a
  `<Navigate>` to the live workspace.
- `OperationsPages.ApprovedAuthorizationsPage` — static rows retired.
- `OperationsPages.DenialsPage` — static rows retired.
- `operations/ExpiringAuthorizations.tsx` — rewritten to derive 14 / 30 /
  60 / 90 day buckets (plus past-due) directly from `useLiveAuthorizations`.
  Each row deep-links into `/authorizations?authId=…`.
- `operations/MissingDocs.tsx` — now backed by the
  `authorization_requirements` Supabase table.
- `operations/PayerRequirements.tsx` — now backed by the `payer_requirements`
  Supabase table.
- `OSAuthWorkspace.tsx` — `AUTHS` const replaced with a derivation from
  `useLiveAuthorizations`. Queue counts are now computed dynamically from
  live items. A status banner shows loading / error / "no imported data yet."

**Shared infra:**
- New `useSupabaseRecords` hook (`src/lib/os/operations/supabaseRecordsStore.ts`)
  exposing `{ rows, loading, error, create, update, remove, refresh }` with
  the same shape as the legacy `useOpsRecords`.
- `OpsRecordsWorkspace` extended with optional `supabaseTable` +
  `writableFields` props. When provided, the workspace reads/writes directly
  to that Postgres table.

## 2. Routes touched

| Route | Before | After |
|---|---|---|
| `/reports` | `ReportsLanding` | `ReportsHome` (canonical) |
| `/reports/catalog` | `ReportsHome` | redirect → `/reports` |
| `/reports/landing` | _n/a_ | `ReportsLanding` (legacy access only) |
| `/ops/authorizations` | static Phase-6 table | redirect → `/authorizations` |
| `/ops/approved-authorizations` | static table | redirect → `/authorizations?stage=approved` |
| `/ops/denials` | static table | redirect → `/authorizations?stage=denied` |
| `/ops/expiring-authorizations` | localStorage MVP | live-derived buckets |
| `/ops/missing-docs` | localStorage MVP | `authorization_requirements` table |
| `/ops/payer-requirements` | localStorage MVP | `payer_requirements` table |
| `/auth-workspace` | static `AUTHS` array | derived from live data |
| `/authorizations` | already live | unchanged (already canonical) |

## 3. Migrations added

Single migration in this pass:
- Tables: `authorization_operational_records`, `authorization_requirements`,
  `authorization_activity`, `authorization_tasks`, `payer_requirements`.
- Functions: `set_updated_at`, `has_authorization_write_access`,
  `has_authorization_read_access`.
- `updated_at` triggers on every new table.
- Indexes: expiration_date, status, payer, FK lookups, payer+state.
- RLS policies for every new table (one read + one all-mutations policy
  per table, gated by the helper functions).

## 4. CentralReach readiness

The CentralReach adapter (`supabase/functions/_shared/integrations/providers/centralreach.ts`)
is untouched — it still honestly reports pending vendor endpoint config.
The new `authorization_operational_records` table now carries the
CentralReach sync fields, so when endpoints are configured a sync run can:

1. Upsert into `authorization_operational_records` keyed on
   `centralreach_authorization_id` with `source_system = 'centralreach'`.
2. Set `centralreach_sync_status` and `centralreach_last_synced_at`.
3. Append an `authorization_activity` row with
   `activity_type = 'centralreach_sync'`.

No fake "connected" badges are shown in the UI for this pass — that
integration-status card is tracked under "Still deferred" below.

## 5. Still deferred / not 100% in this pass

These items are intentionally deferred to keep this pass shippable; they
will be picked up in pass 2:

1. **`OSAuthWorkspace` action wiring** — the queue and card actions
   (Submit, Request PR, Send to QA, Escalate, Note, bulk Assign / Change
   Status) are still visual-only on this page. The canonical write surface
   for now is `/authorizations` (which already persists). Pass 2 will route
   `OSAuthWorkspace` actions through new `authorization_activity` /
   `authorization_tasks` writes.
2. **OSAuthorizations "New Authorization" modal** — currently the workspace
   already supports add/edit at the `Authorization` shape; this pass did
   not migrate that surface to also write into the new
   `authorization_operational_records` overlay. Until a sync job
   back-fills the overlay from Monday, the overlay table is empty by design.
3. **Saved Views** — not implemented in pass 1. Tracked for pass 2 once the
   overlay is being written to.
4. **Per-state RLS scoping** for State Directors / Assistant State
   Directors — currently they have full read across all states. Pass 2 will
   tighten `has_authorization_read_access` with a state predicate.
5. **CentralReach status card / "source: Monday / Manual / CentralReach"
   badges** in the Authorizations UI — schema is ready, UI surface deferred.
6. **Authorization-specific reports inside `/reports`** — Authorization
   Expiration Risk, Workflow Bottlenecks, Operational Performance,
   Utilization, Denials & Rework, Missing Documentation, Payer Requirement
   Risk. The single `/reports` page is now consolidated; adding these
   tiles is pass-2 work.
7. **Auth Queue ↔ external send integration** (Outlook / email / phone) —
   intentionally not faked. Pass 2 will write internal activity rows and
   show "external send pending integration."

## 6. Non-negotiables verified

- ✅ State Director Training Journey untouched.
- ✅ BCBA Productivity Report and all `/reports/...` detail routes
  untouched.
- ✅ One Reports page (`/reports`). `/reports/catalog` redirects in.
- ✅ No new separate Authorizations reports menu.
- ✅ No new `/coming-soon` Authorizations routes.
- ✅ Super Admin sees and accesses everything (admin in both helper
  functions' role allowlists).
- ✅ CentralReach remains the EMR — schema ready, no fake live API.

## 7. Build / test result

- `npm run build` — passes (auto-run by harness).
- Linter — pre-existing 186 project-wide warnings unchanged by this pass;
  new functions all set `search_path = public` and have `EXECUTE` revoked
  from `PUBLIC`.