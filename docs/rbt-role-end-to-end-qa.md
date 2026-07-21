# RBT Role — End-to-End QA

_Run date: 2026-07-21_

## Scope

This pass finishes the RBT Training Academy and RBT-facing cleanup, wires
`ensure_my_rbt_pathway_assignment()` into `useProgram`, upgrades
`/rbt/app/learn` into a polished academy, adds an RBT-shell
`/rbt/app/welcome` route, purges technical/source-health copy from every
file under `src/pages/rbt/app`, and lands a corrective migration that
enforces "certified requires years" with a real database CHECK.

## Commands run

```
bunx vitest run \
  src/test/rbtNoSyncTelemetry.test.ts \
  src/test/rbtLearnAndWelcome.test.ts \
  src/test/rbtPathwayRecruitingOwned.test.ts
bun run build
```

### Test results

```
 ✓ src/test/rbtPathwayRecruitingOwned.test.ts (21 tests)
 ✓ src/test/rbtLearnAndWelcome.test.ts (7 tests)
 ✓ src/test/rbtNoSyncTelemetry.test.ts (708 tests)

 Test Files  3 passed (3)
      Tests  736 passed (736)
```

### Build result

```
✓ built in 56.38s
```

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
| NEW corrective migration with real DB CHECK; safe handling of invalid existing rows without silently swallowing failure | Migration `20260721201520` — `ALTER TABLE ... ADD CONSTRAINT rbt_certified_requires_years CHECK (...) NOT VALID` + `VALIDATE CONSTRAINT` (loud on failure). Invalid rows are logged to `recruiting_pathway_data_quality` with reason `certified_missing_years` before their status is cleared to `unknown`, so nothing is silently swallowed |

## Deliberately out of scope

- Publishing (not run — user asked to hold).
- Broader tsgo pass (build produced no type errors after inline fixes; a full workspace tsgo would surface pre-existing warnings unrelated to this pass).
