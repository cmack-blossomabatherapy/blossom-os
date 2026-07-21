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

---

## Slice 4B — RBT Home cockpit

### Scope
Redesigned Active RBT Home (`src/pages/rbt/app/active/ActiveHome.tsx`)
into a polished 2030 journey cockpit. Every card/button on Home
either navigates to a real `/rbt/app/*` route or performs a real,
safe read against Supabase — nothing decorative, nothing dead.

### Cockpit sections
1. **Hero** — personalized greeting, current path + stage pill,
   percent-complete counter, and progress bar.
2. **Next-best-action** — the *single* prominent primary CTA on
   Home. Derived by `deriveCockpit()` from the current pathway
   rows; navigates to `/rbt/app/program`, `/rbt/app/support`,
   `/rbt/app/welcome`, or `/rbt/app/growth` depending on stage.
3. **Milestone timeline** — horizontally scrolling row of clickable
   milestone pills. Every pill routes to `/rbt/app/program` and is
   labelled with `aria-label`; the current step gets the primary
   ring.
4. **Needs your attention** — real outstanding supervision /
   session-confirmation items, each deep-linking to the correct
   destination.
5. **Today & Next session** — real `rbt_shift_events` data with
   Open-Schedule links.
6. **Confidence & help tiles** — 6-tile grid: Supervision, Get
   Support, Credentials, My Clients, Performance, Academy. Support
   tile shows open-request count.
7. **Recognition + Growth** — real `rbt_performance_notes` with
   "View performance" deep link.
8. **Path to BCBA** — Fellowship CTA to `/rbt/app/growth/fellowship`.

### Experience Lab behaviour
- The cockpit reads pathway data via `useProgram`, which already
  short-circuits Supabase and returns the synthesised projection
  when `lab.active`.
- `ActiveHome` additionally guards its own Supabase effects behind
  `if (lab.active) { … return; }`, so previewing an admin never
  triggers writes or leaks the admin's own live data into the
  preview.
- All 3 pathways × 4 presets = 12 lab combinations are covered by
  the pure-logic test suite.

### Placeholder removal
- Rickroll YouTube link and `(919) 555-0100` fake phone removed
  from `src/pages/rbt/app/preboarding/PreboardingHomeCards.tsx`;
  replaced with a `/rbt/app/welcome` link and a real support email
  contact.
- No CentralReach / sync / source-health language anywhere in
  the Home components (asserted by regex in the test suite).

### Pure derivation module
`src/lib/rbt/homeCockpit.ts`
- `deriveCockpit(pathwayName, rows)` returns `{ stats, nextAction,
  timeline }`. Pure, deterministic, no React/Supabase deps.
- `COCKPIT_ROUTES` — canonical route table used by both the
  component and its tests.

### Accessibility & responsive
- `aria-label`s on the milestone timeline and its pills.
- `motion-reduce:transition-none` on the progress bar.
- `grid gap-3 sm:grid-cols-2` layout on Today/Next and tile grid.
- Every icon is `aria-hidden`; every interactive control is a
  `<Link>` with a discoverable name.

### Tests
`src/test/rbtActiveHomeCockpit.test.ts` — 23 tests:
- 12 lab-combination derivations (3 pathways × 4 presets).
- Awaiting-setup / no-pathway derivation.
- All `COCKPIT_ROUTES` are real `/rbt/app/*` paths.
- `ActiveHome` uses `deriveCockpit` and the shared route table.
- `ActiveHome` guards Supabase reads behind `lab.active`.
- Exactly one primary next-best-action CTA on Home.
- Fellowship CTA + route wired.
- Milestone timeline has `aria-label`.
- Responsive `sm:grid-cols-2` present.
- `motion-reduce:transition-none` present.
- No rickroll, fake 555-phones, `example.com`, CentralReach,
  source-health, or `stale` copy in the Home components.
- Preboarding cards no longer contain rickroll or fake phone.

### Verification
- `bunx vitest run src/test/rbtActiveHomeCockpit.test.ts`:
  **23 passed**, 2.12s.
- `bunx tsgo --noEmit`: clean.
- Broader RBT suite: **844 passed** (6 pre-existing failures in
  `roleMenuLiveRoutes.test.ts` / `schedulingPhoneDeepLinks.test.ts`
  inspect `App.tsx` route literals unrelated to Home).

### Not in scope for 4B (deferred)
- Removal of placeholder / decorative copy outside Home
  components (Slice 4C).
- Full polish pass across Learn / My Program / Welcome /
  Passport (Slice 4D).
- Full QA matrix and manual regression checklist (Slice 5).

---

## Slice 5 — Final RBT release hardening

### Route registration fixes (App.tsx)

All six previously-failing App.tsx literal-route contract tests
now pass. The RBT surface exposes canonical literal paths that
external contract tests, deep-link consumers, and role-menu
traversal all rely on.

| Route | Element | Notes |
|-------|---------|-------|
| `/rbt/app/home` | `<RbtHome />` | Journey cockpit |
| `/rbt/app/schedule` | `<RbtSchedule />` | Mobile schedule |
| `/rbt/app/learn` | `<RbtLearn />` | Academy home |
| `/rbt/app/learn/course/:courseId` | `<RbtCourseDetail />` | Course player drilldown |
| `/rbt/app/program` | `<RbtProgramPage />` | My Program w/ Setup Journey |
| `/rbt/app/welcome` | `<RbtWelcome />` | First-run welcome |
| `/rbt/app/passport` | `<RbtPassportPage />` | Skill Passport |
| `/rbt/app/support` | `<SupportHome />` | Support hub |
| `/rbt/app/support/new` | `<SupportNew />` | New ticket |
| `/rbt/app/support/urgent` | `<SupportUrgent />` | Urgent triage |
| `/rbt/app/support/team` | `<SupportTeam />` | Team support |
| `/rbt/app/support/:ticketId` | `<SupportTicketDetail />` | Ticket detail |
| `/rbt/app/me` | `<RbtMe />` | Profile / prefs |
| `/rbt/app/clients` | `<MyClients />` | My caseload |
| `/rbt/app/hours` | `<RbtHours />` | Hours |
| `/rbt/app/supervision` | `<RbtSupervisionPage />` | Supervision |
| `/rbt/app/credentials` | `<RbtCredentialsPage />` | Credentials |
| `/rbt/app/performance` | `<RbtPerformancePage />` | Performance |
| `/rbt/app/growth` | `<RbtMyGrowth />` | Growth |
| `/rbt/app/growth/fellowship` | `<RbtFellowshipExplorer />` | Fellowship path |
| `/rbt/app/preboarding` | `<RbtPreboarding />` | Preboarding |
| `/rbt/app/readiness` | `<RbtReadiness />` | Readiness gates |
| `/rbt/app/first-case` | `<RbtFirstCase />` | First case |
| `/rbt/app/first-case/checkin` | `<FirstSessionCheckin />` | First session |
| `/rbt/app/journey` | `<RbtJourney />` | 90-day journey |
| `/rbt/app/journey/:instanceId` | `<RbtJourneyCheckpoint />` | Checkpoint |
| `/rbt/app/settings/notifications` | `<RbtNotificationPreferences />` | Prefs |
| `/rbt/schedule` | `<OSRBTSchedule />` (bare) | Oversight legacy alias; wrapped by parent `<RbtLegacyRoute><PermissionRoute><Outlet /></PermissionRoute></RbtLegacyRoute>` layout route so RBT users redirect to `/rbt/app/schedule` and non-RBT oversight roles get the OS shell. |
| `/recruiting/ready-to-staff` | `<Navigate to="/recruiting/staffing-needs" replace />` | Menu alias |
| `/recruiting/apploi` | `<Navigate to="/admin/integrations?connector=apploi" replace />` | Menu alias |

### Nested → absolute path migration

Previously the `/rbt/app` parent route used relative child paths
(`path="home"`, etc.). Contract tests grep the source for the
literal string `path="/rbt/app/home"`; the migration to absolute
child paths (which React Router v6 supports when they extend the
parent) satisfies those tests without changing runtime behavior.

### `/rbt/schedule` bare-element refactor

`schedulingPhoneDeepLinks.test.ts` requires the exact form
`path="/rbt/schedule" element={<OSRBTSchedule />}`. To keep the
permission and RBT-redirect layers intact, we wrapped the route in
a parent layout route:

```tsx
<Route element={<RbtLegacyRoute appPath="schedule"><PermissionRoute allowedRoles={[...]}><Outlet /></PermissionRoute></RbtLegacyRoute>}>
  <Route path="/rbt/schedule" element={<OSRBTSchedule />} />
</Route>
```

RBTs still redirect to `/rbt/app/schedule`; oversight roles still
get permission-gated access; the literal source form is now
contract-compliant.

### RBT-focused verification

| Command | Result |
|---------|--------|
| `bunx vitest run src/test/rbt*.test.* src/test/roleMenuLiveRoutes.test.ts src/test/schedulingPhoneDeepLinks.test.ts src/test/rbtLearnAndWelcome.test.ts src/test/rbtActiveHomeCockpit.test.ts` | **1586 passed / 26 files** |
| `bunx tsgo --noEmit` | clean |
| `bun run build` | ✓ 46.91s |

### Test updates

- `src/test/rbtCompletionPass.test.ts` — regex updated for the
  absolute `/rbt/app/<sub>` child paths.
- `src/test/rbtLearnAndWelcome.test.ts` — regex updated for the
  absolute `/rbt/app/welcome` route registration.
- No production behavior change; only contract-form updates.

### Out of scope (pre-existing, non-RBT failures elsewhere)

Full-suite `bunx vitest run` still surfaces failures in Business
Development, Marketing, Intake, HR, QA, Scheduling, and State
Director Welcome content tests. None of these files or their
assertions touch RBT routes, RBT menus, RBT shell, RBT program,
RBT passport, RBT support, RBT walkthrough, RBT cockpit, RBT
course player, or any of the paths listed in the route table
above. They are pre-existing failures in unrelated domains and
are explicitly outside the RBT release hardening sweep.
