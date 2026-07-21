# RBT 2030 Experience — QA Log

Progressive rebuild of the RBT experience, shipped as slices. Each slice
is committed only after its scoped tests + full production build pass.

---

## Slice 1 — Fix Program dead-end + interactive Program Setup journey

**Goal:** `/rbt/app/program` must always render something useful. If the RBT
has no active `rbt_pathway_assignment` row yet, replace the previous
"No pathway assigned yet" dead-end with an interactive setup journey that
tells them what's happening and gives them things they can do right now.

### Changes

- `src/pages/rbt/app/training/ProgramSetupJourney.tsx` (new): interactive
  setup component with headline banner, three-checkpoint status
  ("profile linked", "path being assigned", "you can start Welcome to
  Blossom now"), retry button, and action cards for Welcome to Blossom,
  Skill Passport, and Support.
- `src/pages/rbt/app/training/RbtProgram.tsx`: renders `ProgramSetupJourney`
  in place of the old empty state; wires retry to `useProgram.reload()`.
- Copy is RBT-appropriate — no sync/canonical/CentralReach/source-of-truth
  language.

### Scoped tests

`bunx vitest run src/test/rbtProgramSetupJourney.test.ts src/test/rbtLearnAndWelcome.test.ts src/test/rbtNoSyncTelemetry.test.ts src/test/rbtUseProgramUnlinked.test.tsx src/test/rbtPathwayRecruitingOwned.test.ts src/test/rbtPathwayForwardCorrection.test.ts`

Result: **6 files, 763 tests passed** (2026-07-21).

### Production build

`bun run build` — ✓ built in 49.65s.

### Requirement evidence

| Requirement | Evidence |
| --- | --- |
| `/rbt/app/program` never shows "No pathway assigned yet" | `rbtProgramSetupJourney.test.ts` forbids the phrase in the new component and in `RbtProgram.tsx` |
| Interactive Program Setup with actionable links | `ProgramSetupJourney` links to `/rbt/app/welcome`, `/rbt/app/passport`, `/rbt/app/support/new?category=training` |
| Auto-refresh path | Retry button calls `useProgram.reload()`; verified by regex test |
| RBT-appropriate copy | `rbtNoSyncTelemetry.test.ts` recursive scan continues to pass |

---

## Slice 2 — Learn → Program navigation + pathway content (pending)

## Slice 3 — Experience Lab (admin-only pathway preview) (pending)

## Slice 4 — Walkthrough persistence + 2030 polish (pending)

## Slice 5 — Full QA sweep + manual test matrix (pending)