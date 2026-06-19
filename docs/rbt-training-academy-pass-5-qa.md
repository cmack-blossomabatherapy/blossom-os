# RBT Training Academy — Pass 5 QA

_RBT Competency Journey and Management_

## What changed

- Added a real **Initial Competency Assessment** model with all 19 BACB 2026 tasks, validation rules, the 90-day window, and the 8-hour supervision / organizational-relationship checks for the responsible assessor.
- Upgraded the **RBT module runtime** so the 25 RBT modules called out in the spec (welcome, classroom & role-play, client-based competency, knowledge assessment, shadowing, full session, BCBA oversight, the under-2-years branching path, and the 2+ years experienced path) render real LMS content: objectives, lessons, checklists, trainer notes, knowledge checks, reflection prompts, and signoff requirements.
- The **RBT Readiness Board** now shows:
  - A roll-up by track (counts per track, ready, competency open) with deep links into `/academy/path/rbt?track=…`.
  - A per-trainee "Open competency" panel for Not-Certified trainees, embedding the new `CompetencyPanel` for live admin/clinical use.
  - Per-track "Open path" buttons that deep-link into the universal LMS for the right experience track.
- **Readiness logic** for the Not-Certified track now refuses to mark a trainee independently ready unless the per-trainee competency record validates (40-hour complete, ≥3 With-Client demonstrations in items 6–14, all 19 tasks competent, all assessment dates inside the 90-day window, assessor rules satisfied). The blocker text surfaces in the trainee's "Missing requirements" list.
- **OSRBTTrainingAcademy** keeps its existing tabs/resources/signoffs but now has a prominent banner that deep-links into `/academy/path/rbt?track=<assigned>` so the RBT-flavored landing and the universal LMS share one source of truth.
- **Resources** added: "Official 2026 RBT Initial Competency Assessment" and "Assistance Test" as required, with placeholder URLs that render "Resource pending" in the UI per the design rule.
- **Tests** added covering route registration, the 25 module contents, the four tracks, branching, competency rules, and readiness gating.

## Files touched

New:
- `src/lib/training/rbtCompetency.ts`
- `src/lib/training/rbtModuleContent.ts`
- `src/components/training/CompetencyPanel.tsx`
- `src/test/rbtTrainingAcademyPass5.test.ts`
- `docs/rbt-training-academy-pass-5-qa.md`

Edited:
- `src/lib/training/rbtReadiness.ts` — competency-aware gating
- `src/lib/training/rbtResources.ts` — official 2026 packet + Assistance Test entries
- `src/pages/academy/TrainingModuleRuntime.tsx` — resolve real RBT module content; render trainer notes / reflection / signoff
- `src/pages/os/OSRBTReadinessBoard.tsx` — competency panel, roll-up, deep links
- `src/pages/os/OSRBTTrainingAcademy.tsx` — deep-link banner into universal LMS

## How to test the learner path

1. Open `/academy` — confirm the page renders and the RBT card links into `/academy/path/rbt`.
2. Open `/academy/path/rbt` — the experience-track switcher should appear. Click each track and confirm the URL gains `?track=...` and the curriculum changes.
3. Click any day card — the URL should preserve `?track=...`. Inside a day, click any module — same.
4. Inside an RBT module (e.g. **Welcome to Blossom for RBTs**, **ABA Explained**, **Client-Based Competency Session**, **Implementation Evaluation**, **Day 2 BCBA Supervision**), confirm the runtime shows real objectives, lessons, checklist, trainer notes, reflection prompt, signoff requirement, and the elapsed timer.
5. Open `/rbt/training-academy` — confirm the new "Open the full LMS journey" banner appears at the top and links into `/academy/path/rbt?track=<assignedTrack>`.

## How to test the admin / clinical path

1. Open `/training/rbt-readiness` (or `/rbt/readiness`).
2. Confirm the **RBT roll-up** card shows counts per experience track and that each card deep-links into `/academy/path/rbt?track=...`.
3. Find a Not-Certified trainee (e.g. **Aaliyah Brooks** or **Jordan Wells**). The card should show "Initial Competency Assessment incomplete…" inside missing requirements until the record validates.
4. Click **Open competency** on a Not-Certified trainee. The `CompetencyPanel` should expand showing:
   - Validation banner with blockers.
   - 40-hour date + certification application date + final attestation slot.
   - Responsible assessor fields (name, credential, 8-hour supervision, organization relationship).
   - Filter chips (All, Needs Reassessment, With Client Required, Interview, Complete).
   - All 19 BACB tasks with status, assessment type, date, initials, evidence, reassessment, corrective feedback.
   - "Sign final attestation" button that is disabled until validation passes.
5. Try to attest before satisfying the rules — the button should remain disabled. Fill in the meta + assessor, mark every task Competent, set assessment dates inside the 90-day window, and ensure ≥3 of items 6–14 use **With Client** — the button activates and signing records `finalAttestationAt`.
6. Go back to the trainee row. The trainee should now move toward "Ready for Independent Assignment" provided the path's other signoffs are also complete.

## Known placeholder resources

The following resources are marked as required but their files are not yet uploaded; the LMS renders them as "Resource pending":

- Official 2026 RBT Initial Competency Assessment packet.
- Assistance Test knowledge check.
- Several legacy `/library/rbt/...` PDFs that already existed in `rbtResources.ts` keep their placeholder URLs.

## What remains for the Supabase persistence pass

- Move `blossom.rbt.competency.v1` localStorage record to a `rbt_competency_records` table with one JSON column for tasks, plus the meta + assessor columns. Add RLS so only Admins, BCBAs, and the trainee themselves can read; only Admins and BCBAs can write.
- Move `blossom.rbt.trainees.v1` overrides to a `rbt_trainees` table (or extend `employees` with a `rbt_path` join row).
- Replace the placeholder "evidence" text input on each task with a Storage upload + signed URL.
- Wire the official 2026 packet upload through the existing resource library so the placeholder URL is replaced once the file is mapped.
- Add the Supabase backend for `runtimeStore` so module timer/progress survives device changes (currently localStorage-only).

## Sanity check

- `bunx vitest run src/test/rbtTrainingAcademyPass5.test.ts` — 18 tests, all green.
- State Director (`/training`) and BCBA (`/academy/path/bcba`) routes were not modified and still resolve.
- Existing BCBA Productivity Report, Resource Library, and admin pages were not touched.