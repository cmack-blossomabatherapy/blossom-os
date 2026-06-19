## Goal

Finish the RBT Training Academy as a real role-based LMS journey inside the universal `/academy` surface, fit in the 4 experience-based tracks from the meeting notes, and represent the official 2026 BACB Initial Competency Assessment as a structured, validated workflow — without breaking State Director or BCBA training, or any existing OS module.

## Current baseline (confirmed by reading the codebase)

- Universal LMS runtime exists: `TrainingAcademyHome`, `TrainingPathDetail`, `TrainingPathDayDetail`, `TrainingModuleRuntime`.
- RBT journey content lives in `src/lib/training/rbtAcademy.ts` (~370 lines).
- RBT readiness store: `src/lib/training/rbtReadiness.ts`.
- RBT resources: `src/lib/training/rbtResources.ts`.
- RBT-specific surfaces: `OSRBTTrainingAcademy`, `OSRBTAcademyAdmin`, `OSRBTReadinessBoard`.
- Universal journey content / resource resolver in `src/lib/academy/`.

## Scope (this pass)

### 1. Source-of-truth data layer
- Rewrite/extend `src/lib/training/rbtAcademy.ts` so the 4 tracks (`not_certified`, `certified_no_experience`, `certified_under_2yrs`, `certified_2yrs_plus`) match the meeting-notes structure (phases 1–6 + branching for under-2yrs).
- Create `src/lib/training/rbtCompetency.ts` with: 19 BACB tasks (with allowed assessment types), trainee record, responsible/assistant assessor fields, validation rules (40-hour complete, 90-day window, items 1–19 done, ≥3 of items 6–14 with-client). LocalStorage-backed, shaped so a Supabase swap is trivial.
- Extend `src/lib/training/rbtReadiness.ts` so "Ready for Independent Assignment" requires the per-track checklist from the spec (sec. 7).
- Extend `src/lib/training/rbtResources.ts` to add: official 2026 Competency Packet, ABA Explained pack, Data Collection guide, Session Notes guide, Assistance Test placeholder. Mark unmapped links as "resource pending" in the UI.

### 2. Universal LMS wiring
- Ensure `/academy/path/rbt` renders and accepts `?track=` query string; track persists from path → day → module routes.
- `OSRBTTrainingAcademy` becomes an RBT-flavored landing that deep-links into `/academy/path/rbt?track=...` (does not re-render its own runtime).
- Wire each RBT module in `src/lib/academy/journeyContent.ts` so the module runtime returns real content (objectives, lessons, resources, checklist, trainer notes, reflection, knowledge-check placeholder, signoff requirement, estimated time) for the 25 modules listed in spec sec. 5.

### 3. Competency UI
- **Learner view** inside the Not Certified path: an "Initial Competency Assessment" day/module that shows status, prep resources, scheduled assessments, and a read-only task list (no self-signoff).
- **Admin/clinical view**: new `CompetencyPanel` component embedded into `OSRBTAcademyAdmin` (trainee detail drawer) and into `OSRBTReadinessBoard`. Supports filters (All / Needs Reassessment / With Client Required / Interview / Complete), per-task status/type/initials/notes/reassessment, evidence upload placeholder, final validation checklist, and a clear "Blocked because…" banner.
- **Training Management Center**: add an RBT roll-up card (counts by track, in training, needs coaching, awaiting BCBA signoff, competency incomplete, ready). Keep State Director launch readiness intact.

### 4. Module runtime content upgrade
- Expand `src/lib/academy/journeyContent.ts` (and a new `src/lib/training/rbtModuleContent.ts` if it keeps `journeyContent` lean) so all 25 RBT modules in spec sec. 5 return real content blocks. Display Hannah/Anju as label text only (no user IDs).

### 5. Tests and QA
- Add `src/test/rbtTrainingAcademyPass5.test.ts` covering the verification list in spec sec. 10 (route renders, all 4 tracks, query-string preservation through path→day→module, Not Certified phase coverage, Under-2yrs branching, module runtime content, 19 competency tasks, ≥3 with-client items 6–14 rule, 40-hour gate, 90-day window, readiness gating, SD/BCBA routes still resolve).
- Create `docs/rbt-training-academy-pass-5-qa.md` listing changes, files touched, learner walkthrough, admin walkthrough, placeholder resources, and what remains for the Supabase persistence pass.

## Out of scope (this pass)

- Supabase persistence for competency/readiness — left as localStorage with a clear migration shape.
- Real file uploads for evidence — placeholder UI only.
- New NFC / Login Vault / unrelated admin pages.
- Any change to State Director content (`sdWeek*Content.ts`, `stateDirector*.ts`) or BCBA training files.

## Technical notes

- All four tracks share the universal runtime; track selection lives in URL params and is mirrored into `rbtReadiness` for the trainee record.
- Competency validation is a pure function (`validateCompetency(record): { ok, blockers[] }`) so the same rules drive learner banners, admin badges, and readiness gating.
- `OSRBTTrainingAcademy` keeps its name and route but its body is replaced by a thin "Pick your path" landing + recommended-track CTA that links into `/academy/path/rbt?track=…`. Old static tabs are removed only if they are duplicated by the universal runtime.
- No edits to `supabase/migrations/`, edge functions, or unrelated OS modules.

## File map (planned)

```text
new   src/lib/training/rbtCompetency.ts
new   src/lib/training/rbtModuleContent.ts
new   src/components/training/CompetencyPanel.tsx
new   src/test/rbtTrainingAcademyPass5.test.ts
new   docs/rbt-training-academy-pass-5-qa.md
edit  src/lib/training/rbtAcademy.ts            (4 tracks, phases, branching)
edit  src/lib/training/rbtReadiness.ts          (per-track checklist gating)
edit  src/lib/training/rbtResources.ts          (add required resources)
edit  src/lib/academy/journeyContent.ts         (resolve RBT modules to real content)
edit  src/pages/os/OSRBTTrainingAcademy.tsx     (landing → deep-link into /academy/path/rbt)
edit  src/pages/os/OSRBTAcademyAdmin.tsx        (embed CompetencyPanel)
edit  src/pages/os/OSRBTReadinessBoard.tsx      (embed CompetencyPanel + roll-up)
edit  src/pages/hr/TrainingManagementCenter.tsx (RBT roll-up card)
edit  src/pages/academy/TrainingPathDetail.tsx  (track param + RBT track switcher)
edit  src/pages/academy/TrainingPathDayDetail.tsx (preserve ?track=)
edit  src/pages/academy/TrainingModuleRuntime.tsx (preserve ?track=)
```

## Suggested delivery order

1. Data layer (`rbtCompetency`, `rbtAcademy` rewrite, `rbtReadiness` gating, resources).
2. Module runtime content for the 25 RBT modules.
3. Universal LMS routing (track query string end-to-end).
4. `CompetencyPanel` + embed into admin/readiness/management.
5. `OSRBTTrainingAcademy` landing refactor.
6. Tests + QA doc.

This is a large pass and will require many parallel file writes. Confirm scope and I will start with step 1 in the next turn.
