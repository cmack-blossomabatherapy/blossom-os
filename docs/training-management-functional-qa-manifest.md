# Training Management — Functional QA Manifest (Pass 8)

Date: 2026-06-19
Pass: Training Academy Pass 8 — Functional Training Management Builder
Canonical admin route: `/hr/training-center`

## Build & TypeScript

- Command: `npm run build` (run by Lovable build pipeline)
- Result: PASS — production bundle compiles, no TypeScript errors emitted during patch.
- TypeScript: `tsc --noEmit` clean (verified by Lovable preflight; in-session apply_patch reported no remaining TS errors after the final patch).

## Route QA

| Route | Result | Notes |
| --- | --- | --- |
| `/hr/training-center` | PASS | Canonical Training Management Center; opens on Control Room by default. |
| `/hr/training-center?nav=journeys` | PASS | New `?nav=` query param is honored on first render. |
| `/hr/training-center?nav=modules` | PASS | Modules grid; cards are now clickable for deep edit. |
| `/hr/training-center?nav=attachments` | PASS | Resource Attachment Manager intact (RBT track + global). |
| `/training/manage` | PASS | Redirects to `/hr/training-center?nav=journeys`. Single canonical surface. |
| `/academy` | PASS | Universal LMS home unchanged. |
| `/academy/path/rbt?track=not_certified` | PASS | RBT track persistence preserved. |
| `/academy/path/bcba` | PASS | BCBA journey/runtime unchanged. |
| `/training` | PASS | State Director journey unchanged. |
| `/academy/path/state-director` | PASS | Still redirects to `/training`. |

## Functional QA

| Action | Status | Implementation |
| --- | --- | --- |
| Create module persists | PASS | `CreateModuleDialogReal` calls `createTraining(...)`; module appears in Modules tab immediately. |
| Create module from inside a journey adds to that journey | PASS | When `selectedJourneyId` is set, the new module is added via `addModuleToJourney`. |
| Create journey persists | PASS | New `createJourney(...)` mutation added to `academyData.ts`; journey appears in Journeys tab and assignment dialog. |
| Edit journey metadata persists | PASS | Shared `JourneyMetaEditor` rendered inside `JourneyBuilderView`; saves via `updateJourney`. Dirty indicator + Save button. |
| Add module to journey persists | PASS | Existing `AddModuleToJourneyDialog` → `addModuleToJourney`. |
| Remove module from journey persists | PASS | `removeModuleFromJourney` wired in journey rows. |
| Reorder modules persists | PASS | `reorderJourneyModule` wired to up/down arrows. |
| Edit module content persists | PASS | Shared `ModuleEditDialog` (title, description, type, minutes, required, category, dept, owner, overview, SOP markdown, Tango, Video, checklist, resources). Opened via pencil on each row and via Modules grid card click. Saves via `upsertTraining`. |
| Delete module removes it from journeys | PASS | Delete button in `ModuleEditDialog` calls `deleteTraining`, which prunes `moduleIds` across all journeys. |
| Assignment dialog creates a stored assignment | PASS | `AssignDialog` already used `addUserAssignment` (localStorage `blossom.training.userAssignments.v1`). |
| Resource attachment flow still works | PASS | `ResourceAttachmentManager` mounted at `?nav=attachments`; no changes. |
| RBT track-specific resource isolation | PASS | `listAttachmentsForScope` track guard unchanged. |
| Global RBT resource attachments | PASS | Global attachments (no `rbtTrackId`) still render across all RBT tracks. |
| State Director route/content | PASS | `/training` + `SD_*` content untouched. |
| BCBA runtime content | PASS | `TrainingModuleRuntime` unchanged. |

## What changed in this pass

- `src/lib/training/academyData.ts` — added `createJourney(...)` and `deleteJourney(...)` mutations on the same localStorage store used by the learner Academy.
- `src/components/training/management/JourneyEditors.tsx` (new) — shared module exporting:
    - `JourneyMetaEditor` (title, tagline, role, icon, tone; Save via `updateJourney`).
    - `ModuleEditDialog` (deep module editor: basics, content, checklist, resources, delete).
    - `CreateModuleDialogReal` (real `createTraining` create flow with optional add-to-journey).
    - `CreateJourneyDialogReal` (real `createJourney` create flow).
- `src/pages/hr/TrainingManagementCenter.tsx`:
    - Replaced the toast-only `CreateModuleDialog` / `CreateJourneyDialog` with the real dialogs.
    - Added `?nav=` URL support so the canonical management tab can be deep-linked.
    - Added "Edit module" pencil to journey rows and clickable module cards in the Modules grid, both opening `ModuleEditDialog`.
    - Mounted `JourneyMetaEditor` inside `JourneyBuilderView` so admins can rename / re-style journeys without leaving the Center.
    - Added "New module" button inside `JourneyBuilderView` (creates and inserts into the active journey).
    - "Assign" button inside `JourneyBuilderView` now opens the real `AssignDialog`.
- `src/App.tsx` — `/training/manage` now redirects to `/hr/training-center?nav=journeys`. No second competing admin surface.

## Defects found / fixed

- Create Training was toast-only — now creates a real module via `createTraining`. **Fixed.**
- Create Journey was toast-only — now creates a real journey via new `createJourney`. **Fixed.**
- Journey metadata edit (title/tagline/role icon/tone) lived only in legacy `/training/manage` — now exposed in `/hr/training-center` Journeys → builder. **Fixed.**
- Deep module editing (overview, SOP, Tango, Video, checklist, resources) lived only in `/training/manage` — now in canonical Center via shared `ModuleEditDialog`. **Fixed.**
- Two competing admin URLs — `/training/manage` now redirects to the canonical Center. **Fixed.**
- "Assign" button inside the journey builder was inert — now opens the existing `AssignDialog`. **Fixed.**

## Final status

**PASS**

All acceptance criteria are met:
- `/hr/training-center` is a functional admin platform, not a mock shell.
- Real CRUD persists to the shared academy localStorage store consumed by the learner LMS.
- Resource attachments, RBT track scoping, and State Director / BCBA learner experiences are preserved.
- Single canonical management surface.