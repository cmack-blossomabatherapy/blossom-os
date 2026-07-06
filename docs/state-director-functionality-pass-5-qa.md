# State Director Functionality — Pass 5 QA

## Goal
Correct Pass 4 test contradictions, move state metrics from seed-only to
persisted-live-first, and finish reliability contracts on notes / activity
/ update writes without regressing the rest of the State Director role.

## What changed

### Route access
- `state_director` re-added to `PhoneSystemRoute` `ALLOWED` set.
- `assistant_state_director` remains blocked.
- `/phone` restored to `state_director` menu (`roleMenus.ts`) and live
  path set (`OSShell.tsx`).
- `/reports` and `/training` links preserved.

### Test contract corrections (Pass 4 failures resolved)
Four tests still asserted the pre-Pass-4 rule that State Director had
no Phone System access. Updated to inspect the actual `ALLOWED` set
instead of a flat regex:
- `src/test/assistantStateDirectorPass3.test.ts` — now asserts
  `"state_director"` is present and `assistant_state_director` is not.
- `src/test/assistantStateDirectorPass4.test.ts` — renamed to
  “PhoneSystemRoute allows state_director but excludes
  assistant_state_director”. Reads the `ALLOWED` block explicitly.
- `src/test/stateDirectorAssistantPass5.test.ts` — updated for Pass 5:
  state_director allowed, assistant_state_director not; menu-includes
  check flipped to reflect restored `/phone` entry.
- `src/test/stateDirectorFunctionalityPass4.test.ts` — matches the new
  correct allow list.

### Live state metrics
- New migration adds `public.state_operational_metrics` (health,
  hours, staffing gaps, expirations, escalations, tasks, `source`,
  `source_updated_at`).
- RLS: leadership sees/edits all states; State Director /
  Assistant State Director sees/edits their own state via the existing
  `user_is_state_scoped_role()` / `user_state_code()` helpers.
- `GRANT`s added for `authenticated` (SELECT/INSERT/UPDATE/DELETE) and
  `service_role` (ALL).
- `updated_at` trigger installed.
- Bridge: `loadStateMetrics()` and `upsertStateMetric()` added to
  `stateOperationsService.ts` (typed via `StateMetricSource`).
- Store: hydration merges live rows over the seed. Seed rows are
  explicitly tagged `source: "seed"`; live rows carry their persisted
  `source` (`live` / `manual` / `integration`).
- UI (`StateDirectorPages.tsx`):
  - KPI band header switches between “Live state metrics”, “Mixed live
    + seed fallback metrics”, and “Seed fallback metrics”.
  - “State health” table adds a `Source` badge and `Updated` column so
    every row shows provenance.
  - Description line reflects the mixed/live/seed source honestly.

### Persistence reliability
- `insertNote` and `insertActivity` and `updateTaskRow` and
  `updateEscalationRow` now return `{ ok, error }` (note also returns
  the created `id`).
- `stateDirectorStore` uses those return values on:
  - `updateEscalation`, `updateTask` — marks the row `persistError` on
    failure and toasts via `reportSaveFailure`.
  - `addEscalationNote`, `addTaskNote` — same treatment.
  - `createEscalation` / `createTask` / `escalateTask` activity writes
    — check `.then(r => if !r.ok reportSaveFailure)` in addition to
    the existing `.catch`.
- `stateOperationsService.ts` module comment rewritten. The old
  “best-effort / fire-and-forget” note is gone; replaced with the
  Pass 5 contract stating no write path silently swallows errors.

### Snapshot banner counts
- `IntakeDashboard` passes real `counts.missing` /
  `counts.followUps` / risk breakdown.
- `OSAuthWorkspace` passes `liveItems.length` blockers + risk hint.
- `OSStaffingWorkspace`, `OSSchedulingWorkspace`, `OSQATeam` pass a
  neutral `topRisks: ["Snapshot counts not connected yet"]` so the
  banner never shows blank dashes without misrepresenting counts.

## Validation
- `bunx tsgo --noEmit` — clean.
- `bunx vite build` — passes (existing chunk-size warning only).
- Full State Director suite (12 files / 109 tests) — **all passing**:
  - `assistantStateDirectorCompletion.test.ts`
  - `assistantStateDirectorPass2.test.ts`
  - `assistantStateDirectorPass3.test.ts`
  - `assistantStateDirectorPass4.test.ts`
  - `stateDirectorAssistantPass.test.ts`
  - `stateDirectorAssistantPass5.test.ts`
  - `stateDirectorFunctionalityPass1.test.ts`
  - `stateDirectorFunctionalityPass4.test.ts`
  - `stateDirectorFunctionalityPass5.test.ts` (new)
  - `stateDirectorJourney.test.ts`
  - `stateDirectorPass2.test.ts`
  - `stateDirectorPass3.test.ts`

## Remaining limitations
- CentralReach-ready integration context exists, but live CentralReach
  sync is not connected yet. `centralreach_sync_status: "not_connected"`
  continues to be written on new tasks/escalations/handoffs.
- Auth / Staffing / Scheduling / QA snapshot banners still use the
  neutral “Snapshot counts not connected yet” risk chip pending a
  proper aggregate query per department.
- Live state metrics start empty on new environments — the seed
  fallback continues to render until leadership or a data importer
  writes rows into `state_operational_metrics`.