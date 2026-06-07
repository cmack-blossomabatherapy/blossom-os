## Training Academy Redesign Pass 2

This is a large, multi-file redesign touching ~6k lines of existing code. Before I implement it, I want to confirm scope and a few decisions so we don't burn a long round only to redo it.

### What I'll build

**Part 1 — Shared learner academy model (`src/lib/academy/learnerHome.ts`)**

New helper that wraps the existing `src/lib/academy/api.ts` (Supabase-backed) and produces a single normalized view-model for both the learner page and Training Management:

- employee link status
- enrollment + track + path + state + mentor
- current week + current focus block
- welcome status (Phase 0 module)
- next module / next action
- launch-scoped required completed / total
- readiness (reuses `computeReadiness`)
- shadow + check-in + sign-off signals
- setup gaps (no employee, no enrollment, no curriculum)

Exposes `startModule()` / `completeModule()` that call `upsertProgress` so learner actions show up in Training Management instantly.

**Part 2 — Count scope fix**

Audit the seeded SD journey in `src/lib/training/academyData.ts` (currently 104+ items) and the DB curriculum. Two-part fix:

- Learner counters always scope to the **active launch path** (SD new-state), never global required.
- Replace "X / 133 required" with: Welcome complete · Launch modules complete · Current week · Shadowing · Next action.

I will need your decision on the consolidation (see questions below) before trimming.

**Part 3 — `/training` visual redesign (`OSTraining.tsx` + `SDJourneyView.tsx`)**

Warm header with eyebrow + greeting + supporting copy + small status group (week / readiness / mentor + state). Welcome to Blossom anchor panel near the top. "Today's next step" + "Current focus" panel replacing the Continue Learning strip. Roadmap with 5 weeks as segmented cards — only the current week expanded; future weeks are quiet summaries. Module rows feel like training, not tickets. Right rail = launch progress + help + shadowing/check-ins; overdue is demoted to a calm "Needs attention" lower down.

**Part 4 — `OSWelcomeToBlossom` polish**

Keep video first. Add leadership letter section (Chad Kaufman CEO, Shira Lasry DOO — placeholder copy you can edit). Mission / Values / Team tiles already exist; tighten. Add a "Continue to State Director Journey" CTA back into the active role journey.

**Part 5 — Training Management connection**

Wire `TrainingControlRoom` / `TrainingManagementCenter` to the same shared model so active trainees + launch readiness + setup gaps reflect what the learner just did. Minimal surgical changes — no redesign here.

**Part 6 — Tests**

Update / add tests covering: shared model wiring, `upsertProgress` called on learner actions, launch-scoped counts, no global `2/133` totals on SD page, welcome reachable + revisitable, future weeks collapsed, Resource Library links correct, no `href="#"`.

### Files

- **new**: `src/lib/academy/learnerHome.ts`, `src/components/training/LearnerHeader.tsx`, `src/components/training/WelcomeAnchor.tsx`, `src/components/training/TodayNextStep.tsx`, `src/components/training/LaunchRoadmap.tsx`, `src/components/training/LearnerSideRail.tsx`, `src/test/learnerAcademyHome.test.ts`, `src/test/trainingRedesignPass2.test.tsx`
- **edited**: `src/pages/os/OSTraining.tsx` (rewritten), `src/components/training/SDJourneyView.tsx` (or replaced by new roadmap), `src/pages/os/OSWelcomeToBlossom.tsx`, `src/components/training/TrainingControlRoom.tsx`, `src/lib/training/academyData.ts` (count scope only — no destructive change without your call)

### Decisions I need from you before I start

1. **Module count — 51 vs current 104?** The spec says "Corey expects ~51 modules." Do you want me to:
   - (a) Trim the seeded SD launch path to ~51 modules and move the rest to a "Continued Learning" bucket, or
   - (b) Keep all 104 in the curriculum but only show the launch-scoped subset in the learner counter (and label the rest "Beyond launch")?

2. **Leadership letters** — for the Welcome page, should I write placeholder copy under Chad's and Shira's names that you'll edit later, or leave the section as a styled empty state ("A note from Chad — coming soon")?

3. **DB vs seeded data** — if a State Director has no DB enrollment, should `/training` keep using the local `academyData.ts` seed as a preview (current behavior), or show the warm "Your journey is being set up" empty state always?

Once you answer these I'll implement in one pass.