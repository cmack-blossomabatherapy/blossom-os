# Clinical Director Pass 2 — Notes

## Role naming

The frontend OS role `clinical_director` now maps to three DB `app_role`
aliases (any of the three grants full Clinical Director access):

| DB `app_role`       | Status                                              |
|---------------------|-----------------------------------------------------|
| `clinical_director` | **Canonical** — added 2026-07 in this pass.          |
| `clinic_director`   | Legacy alias, kept for existing users; still valid. |
| `clinical_lead`     | Older label, still mapped.                          |

The mapping lives in `src/contexts/OSRoleContext.tsx` via the string-based
`has` helper, so the front-end union type (`AppRole`) does not need to stay
in lockstep with the generated `types.ts` enum.

Backend enforcement uses two new security-definer helpers:

- `public.is_clinical_director(uuid)` — true for any of the three roles above.
- `public.can_manage_clinical_work(uuid)` — Clinical Director + Admin/Super Admin +
  Director of Operations + Operations Manager + QA (team + Director) +
  Behavioral Support.
- `public.can_view_clinical_work(uuid)` — the manage set plus Executive, COO,
  State Director, Assistant State Director, and QA Specialist.

"View As Role" continues to work because it uses the OS role directly, not
the DB app_role.

## New tables

All in the `public` schema, RLS-enabled, GRANTs issued to `authenticated`
and `service_role`:

- `clinical_work_items` — durable clinical work: title, source_type
  (authorization/supervision/evaluation/bcba/client/centralreach/manual),
  source_record_id, client, BCBA, state, priority, status, owner, due_at,
  notes, metadata jsonb, created_by/updated_by, created_at/updated_at.
- `clinical_activity_log` — every mutation appends an event (event_type,
  actor, source, client, BCBA, summary, payload jsonb).
- `clinical_saved_views` — per-user or shared filter presets.

## Hooks

- `useClinicalDirectorData({ state, bcbaId, clientId, priority, status, dueWithinDays })`
  — read layer for work items + activity feed.
- `useClinicalDirectorActions()` — `createWorkItem`, `addNote`, `assignOwner`,
  `changePriority`, `markReviewed`, `escalate`, `resolve`, `reopen`,
  `archive`, `saveView`. Every mutation appends an activity row and, when the
  item is tied to an authorization, mirrors a `clinical.<event>` entry into
  the existing `authorization_activity` trail so QA/auth history stays
  complete.

These hooks **compose** with (do not replace) `useLiveAuthorizations`,
`useCentralReachOps`, and `useAuthorizationActions`.

## Reports

`clinical_director` was added to `visibleTo` on:

- BCBA Caseload (`caseload`)
- Progress Trends (`progress-trends`)
- Supervision Compliance (`qa-supervision`)
- Parent Training 97156 (`qa-parent-training`)
- Authorization Utilization (`auth-utilization`)

Already visible: BCBA Productivity Report V3, BCBA Performance, QA
Performance, Supervision & Parent Training (CR upload), Authorization
Utilization (CR upload), Client Lifecycle, State Director Parent Training
97156 and Supervision Report.

No `/clinical/reports` route was created. Reports remain unified at
`/reports`.

## Phone System

`/phone` remains in the Clinical Director menu and in
`ROLE_SPECIFIC_LIVE_PATHS.clinical_director`. Clinical Directors have
first-class phone access; the sidebar link, live-path allowlist, and
dashboard action card all point to the same route.

## CentralReach

Unchanged. No credentials are hard-coded. The dashboard status card reports
"Uploaded data available · Sync pending" when CR billing rows exist and
"Not connected" otherwise, and continues to consume `useCentralReachOps`.

## Scope explicitly not touched this pass

Full page-level rebuilds of `/assigned-bcbas`, `/supervision-visibility`,
`/treatment-plan-reviews`, `/progress-reports`, `/evaluations`,
`/escalations-followups`, and `/qa-team` were left intact. They already load
for Clinical Director; layering Clinical Director-specific filters and
durable actions onto each one is queued for Pass 3 (the hooks + tables added
here are the plumbing that pass will consume).