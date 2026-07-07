# State Director — Final Completion QA (Pass 9)

Final hardening pass. No redesign. No rebuild. Locks the State Director and
Assistant State Director experience at 100% with menu/route coverage tests,
runtime module-load smoke tests, and encoding guards.

## What was verified

- ROLE_MENUS for `state_director` and `assistant_state_director` contain
  exactly the expected operational paths plus one Training Academy, one
  Resource Library, and one Reports item.
- `ROLE_SPECIFIC_LIVE_PATHS` in `src/pages/os/OSShell.tsx` covers every base
  path in each menu, so the shell never shows a "coming soon" banner for
  these roles.
- Every menu path is mounted or redirected in `src/App.tsx`.
- `/ops/scheduling` redirects to `/scheduling-workspace?bucket=coverage_risk`.
- `/scheduling-workspace` route allows both `state_director` and
  `assistant_state_director`.
- `/reports` is the single Reports hub. No `/state-director/reports`,
  `/assistant-state-director/reports`, or `/ops/reports` route exists.
- BCBA Productivity Report V3 remains imported and mounted.
- State Director / Assistant State Director training stays at `/training`
  (not `/academy`).
- State Director store primary writes (`updateEscalation`, `addEscalationNote`,
  `resolveEscalation`, `reopenEscalation`, `updateTask`, `completeTask`,
  `escalateTask`, `addTaskNote`) are async and return
  `Promise<StateDirectorMutationResult>`.
- CentralReach readiness service dedupes active source rows, defaults new
  rows to `pending`, returns `alreadyQueued`, and accepts the expanded
  status vocabulary (`not_connected`, `pending`, `ready`, `synced`,
  `error`, `failed`).
- Pass 8 migration for `state_centralreach_outbox` is present with the
  expanded `sync_status` check constraint and the partial unique index on
  active `(state_code, source_type, source_id)` rows.
- No literal mojibake sequences in State Director source, tests, or
  historical QA docs.
- Runtime smoke: `StateDirectorPages`, `OSTraining`, `ReportsHome`,
  `OSResourceLibrary`, and the state director store/service modules all
  load cleanly.

## What changed in this pass

- Added `src/test/stateDirectorFinalCompletion.test.ts` covering menus,
  route mounts, live-path coverage, single Reports hub, training route,
  store shape, CentralReach readiness contract, migration shape, and
  encoding.
- Added `src/test/stateDirectorRuntimeSmoke.test.tsx` proving the key
  State Director surfaces load without top-level errors under a mocked
  Supabase client.
- Added this QA doc.

No product code was modified.

## Build result

`vite build` — passes (see harness output).

## Test result

All targeted State Director / Assistant State Director suites pass, including
the new final-completion and runtime-smoke suites.

## State Director live menu

- `/state-operations`
- `/ops/state-escalations`
- `/ops/tasks`
- `/ops/staffing`
- `/intake/dashboard`
- `/authorizations`
- `/ops/scheduling` (redirects to `/scheduling-workspace?bucket=coverage_risk`)
- `/qa-team`
- `/phone`
- `/training`
- `/resource-library`
- `/reports`

## Assistant State Director live menu

- `/state-operations`
- `/intake/dashboard`
- `/ops/tasks`
- `/ops/state-escalations`
- `/ops/staffing`
- `/ops/scheduling` (redirects to `/scheduling-workspace?bucket=coverage_risk`)
- `/authorizations`
- `/qa-team`
- `/training`
- `/resource-library`
- `/reports`

Assistant State Director does not have Phone System access.

## Reports confirmation

One and only one Reports hub: `/reports` (`ReportsHome`). All legacy or
role-specific reports paths redirect to `/reports`. BCBA Productivity Report
V3 is preserved inside the shared Reports catalog.

## Training confirmation

State Director and Assistant State Director training remains at `/training`
(`OSTraining`), preserving the existing State Director journey. The generic
`/academy` LMS home is preserved for other roles and unchanged.

## CentralReach readiness confirmation

CentralReach integration remains readiness/outbox only. New readiness rows
default to `pending`, active-source de-dupe returns `alreadyQueued`, and the
status vocabulary supports `not_connected`, `pending`, `ready`, `synced`,
`error`, `failed`. UI labels map legacy `not_connected` and `error` to the
friendlier `pending` / `failed` states.

## Known limitations

- The CentralReach live API is not connected. This pass verifies the
  readiness/outbox infrastructure only.
- Actual CentralReach API sync will be a later integration pass once
  credentials and API details are available.
- Runtime smoke covers module load, not full user-interaction flows. Detail
  dialog persistence behavior is asserted at the source level by the store
  and Pass 8 tests.