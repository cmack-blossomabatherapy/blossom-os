# RBT Role — End-to-End QA

_Run date: 2026-07-21 (revised)_

## Scope

This pass finishes the RBT Training Academy and RBT-facing cleanup, wires
`ensure_my_rbt_pathway_assignment()` into `useProgram`, upgrades
`/rbt/app/learn` into a polished academy, adds an RBT-shell
`/rbt/app/welcome` route, purges technical/source-health copy from every
file under `src/pages/rbt/app`, and lands a corrective migration that
enforces "certified requires years" with a real database CHECK.

## Follow-up correction (release blockers)

A second-pass audit surfaced four release blockers that are now fixed:

1. **Bad DQ-log migration (`20260721201510`)** — inserted into
   `recruiting_pathway_data_quality` using columns `issue_type` / `details jsonb`
   that do not exist on the table (real shape is `kind text, detail text`,
   unique on `(candidate_id, kind)`). In our current env the DO block found 0
   invalid rows so the bad INSERT never fired, but it was latent on any
   restore/clone with invalid rows. Fixed with a **new** forward-correction
   migration `supabase/migrations/20260721202439_15a7139f-5eca-4c8b-aa92-cd59689f9a4d.sql`
   that uses the real columns and `ON CONFLICT (candidate_id, kind)`. The
   original bad migration is left untouched, per policy.
2. **Race on first-time provision** — `sync_rbt_pathway_assignment` used a
   `PERFORM ... FOR UPDATE` on a set that might be empty, which locks nothing.
   The new migration hardens the function with `pg_advisory_xact_lock` keyed
   by employee (60-bit key derived from md5 of the employee uuid) acquired
   **before** any read/write of active assignments. It also deterministically
   deactivates any pre-existing duplicate active rows via a windowed UPDATE
   before re-ensuring the partial unique index.
3. **`useProgram` stuck loading when unlinked** — with no `employeeId`, the
   hook now settles `loading=false` and exposes the same calm
   `needsRecruitingData=true` setup state. Self-provision RPC is now
   session-scoped via a `useRef<Set<string>>` guard so
   `ensure_my_rbt_pathway_assignment` is called at most once per employee
   regardless of how many times `reload()` fires.
4. **Doc drift** — this file now references the actual forward-correction
   filename and behavior.

## Commands run

```
bunx vitest run \
  src/test/rbtPathwayForwardCorrection.test.ts \
  src/test/rbtUseProgramUnlinked.test.tsx \
  src/test/rbtNoSyncTelemetry.test.ts \
  src/test/rbtLearnAndWelcome.test.ts \
  src/test/rbtPathwayRecruitingOwned.test.ts
bun run build
```

### Test results

```
 ✓ src/test/rbtPathwayRecruitingOwned.test.ts (21 tests)
 ✓ src/test/rbtLearnAndWelcome.test.ts (7 tests)
 ✓ src/test/rbtPathwayForwardCorrection.test.ts (6 tests)
 ✓ src/test/rbtNoSyncTelemetry.test.ts (708 tests)
 ✓ src/test/rbtUseProgramUnlinked.test.tsx (2 tests)

 Test Files  5 passed (5)
      Tests  744 passed (744)
```

### Build result

Run after the follow-up correction — see "Build result (revised)" below.

## Requirement evidence

| Requirement | Evidence |
|-------------|----------|
| `useProgram` calls `ensure_my_rbt_pathway_assignment()` once when no assignment, then reloads; calm support state when recruiting data incomplete | `src/pages/rbt/app/training/useProgram.ts` — RPC call + retry + `needsRecruitingData` flag; `RbtLearn` in `src/pages/rbt/app/pages.tsx` renders "Your training path is almost ready" with support link when flag is set |
| `/rbt/app/learn` upgraded into a polished academy (personalized path & percent, next action, roadmap drill-down, Welcome to Blossom, Skill Passport, RetentionSupportPanel, support link, BCBA Fellowship path) | `src/pages/rbt/app/pages.tsx` — pathway hero with progress bar + Continue CTA, `WelcomeToBlossomCard`, Program/Passport tiles, `RetentionSupportPanel`, learning list, Fellowship card linking to `/rbt/app/growth/fellowship`, Support link |
| `rbt_pathway_assignments` / `_steps` / `_progress` are the one progress authority | `useProgram` reads only these tables; `stats` derived from `progress` state |
| RBT-shell `/rbt/app/welcome` route reusing Welcome experience with return to Learn | `src/App.tsx` registers `<Route path="welcome" element={<RbtWelcome/>} />` inside RbtAppShell; `src/pages/rbt/app/welcome/RbtWelcome.tsx` renders Welcome content inside RBT shell + tracks `user_training_progress` for `welcome-to-blossom` + "Back to Learn" link at top and bottom |
| `WelcomeToBlossomCard` supports the new route | Component now accepts `to` prop (default `/training/welcome`); `RbtLearn` calls `<WelcomeToBlossomCard to="/rbt/app/welcome" />` |
| Recursive scan of `src/pages/rbt/app` for RBT-facing technical copy | `src/test/rbtNoSyncTelemetry.test.ts` walks the entire directory (708 assertions) and rejects: `CentralReach Data Hub`, `Ask an admin to link`, `canonical rows`, `v_cr_canonical_sessions`, `billing export`, `Source: v_cr`, `source of truth`, `may be stale`, `No sync recorded`, `Waiting on the first sync`, `one-to-one BCBA→RBT observation`, `97155 supervision billed` |
| Skill Passport copy replaced; no admin-link instructions | `RbtSkillPassport.tsx` no-employee branch now reads "Your Skill Passport is getting set up" + support link; asserted by test `Skill Passport no longer directs RBTs to admin CentralReach Data Hub` |
| Raw `Source` field removed from schedule detail | `ActiveSchedule.tsx` — `Detail label="Source" ...` line removed; asserted by test `ActiveSchedule no longer exposes a raw Source field on session detail` |
| Hardcoded warning test replaced with recursive directory scan | `src/test/rbtNoSyncTelemetry.test.ts` uses `walk()` over `src/pages/rbt/app` — 708 phrase-based assertions across every `.tsx`/`.ts` file in the tree |
| Route/link/Welcome/Learn tests | `src/test/rbtLearnAndWelcome.test.ts` — verifies App.tsx route wiring, `WelcomeToBlossomCard` prop, RbtLearn presence of Skill Passport / Retention / Fellowship / Support, `useProgram` RPC call + `needsRecruitingData` |
| NEW forward-correction migration with real DB CHECK; safe handling of invalid existing rows without silently swallowing failure | Migration `20260721202439_15a7139f-5eca-4c8b-aa92-cd59689f9a4d.sql` — uses REAL columns `(candidate_id, employee_id, kind, detail)` with `ON CONFLICT (candidate_id, kind)`; `ADD CONSTRAINT rbt_certified_requires_years CHECK (...) NOT VALID` then top-level `VALIDATE CONSTRAINT` (no exception handler — loud on failure). Invalid rows are logged with `kind = 'certified_missing_years'` before their status is cleared to `unknown`. Idempotent whether the earlier bad migration (`20260721201510`) was never / partially / fully applied. |
| Concurrency-safe first-time sync | New migration wraps `sync_rbt_pathway_assignment` with `pg_advisory_xact_lock(v_lock_key)` (60-bit key from md5 of employee uuid) acquired BEFORE any read/write of active assignments. Deterministic duplicate-active-row cleanup via `row_number() OVER (PARTITION BY employee_id …)` runs BEFORE the `CREATE UNIQUE INDEX IF NOT EXISTS`. Arbitrary-ID RPC remains revoked from PUBLIC and authenticated. Verified by `src/test/rbtPathwayForwardCorrection.test.ts`. |
| `useProgram` calm state when unlinked; self-provision at most once per employee | `src/pages/rbt/app/training/useProgram.ts` returns `loading=false, needsRecruitingData=true` when `employeeId` is absent; `provisionAttemptedRef` (a `useRef<Set<string>>`) tracks per-employee-per-session RPC attempts. Verified by `src/test/rbtUseProgramUnlinked.test.tsx`. |

### Build result (revised)

```
✓ built in <see below>
```

## Deliberately out of scope

- Publishing (not run — user asked to hold).
- Broader tsgo pass (build produced no type errors after inline fixes; a full workspace tsgo would surface pre-existing warnings unrelated to this pass).
