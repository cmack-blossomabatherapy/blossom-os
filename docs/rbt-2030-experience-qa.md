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

## Slice 2 — Pathway content aligned to the approved Training Program

**Goal:** Realign all three RBT pathways to the approved Blossom Training
Program source. Every step should be actionable (owner, delivery mode,
scheduling hint, evidence type). Filter unpublished courses from the RBT
Learn page. Guarantee safe/idempotent progress writes.

### Approved program → step catalog

**Experienced RBT (2+ years) — orientation then staffed:**
`orientation_short` → `staffing_ready` → `retention_two_week`.

**Developing RBT (Under 2 years):**
`orientation_new_hire` → `zoom_learning_day` (session structure / data
collection / session notes; **no ABA Basics**) → `role_play_in_clinic` →
`lead_rbt_client_session` → `competency_evaluation_scored` (deterministic
bands: 0–36 repeat Lead session, 37–47 Lead attends full first session,
48–60 BCBA supervises first session) → `staffing_first_case` →
`first_session_support` → `session_note_review` → `retention_two_week`.

**Certification track (Not certified):**
`intro_welcome_15min` → `paired_roleplay_competency` → `client_demos_three`
(≥3 in-person) → `bcba_competency_signoff` → `exam_prep` → `exam_attempt`
→ `zoom_aba_explained` + `zoom_data_collection` + `zoom_session_notes`
(interactive) → `shadow_lead_rbt_session` → `post_shadow_evaluation`
(score-branched) → `submit_session_note_for_feedback` →
`staff_case_first_assignment` → `first_session_lead_full` (traveling Lead
RBT attends entire first session) → `second_session_bcba` (BCBA attends
second session) → `retention_two_week`.

### Changes

- **Migration** — forward-only, idempotent:
  - Ensures unique `(employee_id, pathway_step_id)` index on
    `rbt_pathway_progress` for safe concurrent upserts (de-dupes existing
    duplicates by keeping the oldest row).
  - Upserts the full step catalog above via the existing
    `public._upsert_rbt_step()` helper.
  - Retires legacy step keys: deletes when they have no trainee progress,
    otherwise marks `metadata.retired = true`, sets `required = false`,
    and pushes `order_index += 900` so historical progress is preserved.
- **`src/pages/rbt/app/pages.tsx` — Learn page:** unpublished courses are
  filtered out of the learner list entirely (no more amber "Unpublished"
  rows). Empty/loading/error states adjust to the filtered count.
- **`src/pages/rbt/app/training/useProgram.ts`:** defensively filters
  steps with `metadata.retired === true` or `deprecated === true` so
  retired steps never appear in the RBT roadmap even if a row lingers.

### Scoped tests

`bunx vitest run src/test/rbtPathwayAlignmentSlice2.test.ts src/test/rbtProgramSetupJourney.test.ts src/test/rbtLearnAndWelcome.test.ts src/test/rbtNoSyncTelemetry.test.ts src/test/rbtUseProgramUnlinked.test.tsx src/test/rbtPathwayRecruitingOwned.test.ts src/test/rbtPathwayForwardCorrection.test.ts`

See "Verification" below for the executed result.

### Production build

See "Verification" below.

### Verification (2026-07-21)

- **Scoped vitest suites:** `7 files, 769 tests passed` in 4.10s.
- **`bun run build`:** ✓ built in 53.60s, no errors.
- **Migration applied:** RBT pathway step catalog realigned in-place; unique
  index `rbt_pathway_progress_employee_step_uniq` created; legacy steps
  retired (deleted when unused, otherwise flagged `metadata.retired=true`).

## Slice 3 — RBT Experience Lab (superadmin-only, read-only)

- New module `src/lib/rbt/experienceLab.ts` — projections, fixtures, and
  role-gated hook (`useExperienceLabController`). Zero Supabase writes.
- New hook `src/pages/rbt/app/useExperienceLab.ts` binds the controller to
  `useAuth()` so eligibility always follows the *underlying* roles, not the
  OSRoleProvider view-as override.
- New UI `src/pages/rbt/app/RbtExperienceLabBar.tsx` — elegant primary/indigo
  bar (deliberately non-yellow) with pathway + stage selectors and
  Reset/Exit. Rendered inside the RBT shell.
- `useProgram` short-circuits DB reads when the lab is active, feeding
  synthetic pathway + progress rows. Save controls disabled in `RbtProgram`
  and `RbtSkillPassport` while lab is active.
- Presets: `starting` · `midway` · `nearly_done` · `needs_support`.
- Pathways: `new_rbt_certification`, `under_2_years`, `experienced_rbt`.
- Persistence: `sessionStorage` only, key `rbt.experienceLab.v1:<adminUserId>`.
  Tampered payloads are rejected on read; storage is purged on eligibility
  loss.
- Ordinary RBTs cannot activate the lab: eligibility gate + storage-scrub
  covers URL tampering, hand-crafted storage payloads, and role downgrades.
- Tests: `src/test/rbtExperienceLabSlice3.test.ts` — 15 tests covering all
  three pathways × all four presets, stage switching, persistence isolation,
  tamper rejection, write blocking, and ordinary-user denial.

## Slice 3 — Experience Lab (admin-only pathway preview) (pending)

## Slice 4 — Walkthrough persistence + 2030 polish (pending)

## Slice 5 — Full QA sweep + manual test matrix (pending)
---

## Slice 4A — First-login walkthrough (shipped 2026-07-21)

### Scope
Warm, versioned first-login tour that introduces every RBT surface:
Home, My Program, Learn, Schedule, Skill Passport, Support, Me, and the
BCBA Fellowship path. Replay controls on Home, Learn, and Me.

### Files added
- `src/lib/rbt/walkthrough.ts` — pure module. `TOUR_VERSION=1`,
  `TOUR_STEPS` deck (9 warm-toned steps), per-user localStorage
  persistence, `shouldAutoOpen`, `useReducedMotion`, and the
  `useRbtWalkthroughController` state machine (open/index/next/prev/
  goTo/finish/dismiss/start).
- `src/pages/rbt/app/useRbtWalkthrough.ts` — `RbtWalkthroughContext`
  and consumer hook used by replay buttons.
- `src/pages/rbt/app/RbtWalkthrough.tsx` — Radix Dialog UI with
  ARIA progressbar, step dots (jump targets), Skip/Back/Next/Finish,
  Arrow-key navigation, auto-focus on the primary action, reduced-
  motion suppression of transitions.

### Files edited
- `src/pages/rbt/app/shell.tsx` — mounts `RbtWalkthroughProvider`
  under the OSShell so every RBT route gets the tour.
- `src/pages/rbt/app/pages.tsx` — replay buttons on Home, Learn, Me.

### Persistence & preview isolation
- Key: `rbt.walkthrough.v1:<userId>` in `localStorage` — real users only.
- Completion payload: `{ version, completedAt }`.
- `canPersist = Boolean(userId) && !previewActive`. `previewActive`
  = Experience Lab active **or** OSRole preview-as active. When
  either is true the tour never auto-opens and Finish/Dismiss are
  visual-only — no `localStorage` write.
- Bumping `TOUR_VERSION` re-opens the tour for everyone at next login.
- Skip and Escape write the same completion record as Finish — users
  who intentionally dismiss the tour are not re-nagged.

### Accessibility
- Radix Dialog: focus trap, Escape-to-close, body-scroll lock, focus
  return to the invoking button.
- `role="progressbar"` with `aria-valuenow/valuemin/valuemax` and
  `aria-current="step"` on the active dot.
- Every icon is `aria-hidden`; every interactive control has a name.
- Arrow keys navigate; Enter activates the focused button.
- `prefers-reduced-motion: reduce` disables Dialog transitions and
  progress-bar tweening; `data-reduced-motion="true"` is exposed on
  the DialogContent for verification.

### Tests
- `src/test/rbtWalkthroughSlice4a.test.tsx` — 19 controller/logic
  tests: storage key isolation, read/write/clear, version bump auto-
  reopen, first-login open, finish/dismiss persistence, replay start,
  next/prev/goTo bounds, preview-active blocking of both auto-open
  and persistence, anonymous user, reduced-motion, and the tour deck
  covering every required route.
- `src/test/rbtWalkthroughDialog.test.tsx` — 5 component tests:
  first-login render, ArrowRight/ArrowLeft navigation, focus on the
  Next button, reduced-motion attribute, Skip persists completion.

### Verification
- `bunx vitest run` (10 scoped RBT suites): **860 tests passed**, 6.73s.
- `bun run build`: ✓ 49.19s.

### Not in scope for 4A (deferred to later slices)
- Home cockpit redesign (Slice 4B).
- Removal of placeholder / decorative / test-data copy (Slice 4C).
- Coherent premium polish pass across Home / Learn / My Program /
  Welcome / Passport (Slice 4D).
- Full QA matrix and manual regression checklist (Slice 5).
