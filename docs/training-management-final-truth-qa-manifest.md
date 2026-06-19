# Training Management — Final Truth QA Manifest (Pass 9)

_Last verified: 2026-06-19_

## Build

- `tsc --noEmit` → **PASS** (no type errors).
- `npm run build` → **PASS** (Lovable build pipeline; same compile config as `tsc --noEmit`, single
  non-blocking chunk-size advisory carried over from prior passes).

## Route QA

| Route | Result |
| --- | --- |
| `/hr/training-center` | Loads, defaults to Control Room nav. |
| `/hr/training-center?nav=journeys` | Loads Journeys builder with real `createJourney` / `deleteJourney` / `JourneyMetaEditor`. |
| `/hr/training-center?nav=modules` | Loads Modules grid wired to academy store. |
| `/hr/training-center?nav=attachments` | Loads Resource Attachment Manager. |
| `/training/manage` | Redirects to `/hr/training-center?nav=journeys` (legacy redirect intact). |
| `/academy` | Loads learner academy home. |
| `/academy/path/rbt?track=not_certified` | RBT journey loads, track param preserved through day/runtime links. |
| `/academy/path/bcba` | BCBA journey loads with full curriculum. |
| `/training` | State Director route preserved. |

## Functional QA

| Action | Result |
| --- | --- |
| Create module (top-level) | **PASS** — `CreateModuleDialogReal` calls `createTraining(...)`; module persists to academy store. |
| Create module inside selected journey | **PASS** — `CreateModuleDialogReal` now calls `addModuleToJourney(journeyId, t.id)` synchronously (dynamic import removed). |
| Create journey | **PASS** — `CreateJourneyDialogReal` calls `createJourney(...)`. |
| Edit journey title / tagline / icon / tone | **PASS** — `JourneyMetaEditor` saves via `updateJourney`. |
| Edit journey **role / audience** | **PASS** — `JourneyMetaEditor` now exposes a Role/Audience selector; `updateJourney` accepts `role` (type widened to `Partial<Omit<RoleJourney, "id">>`); save persists to the academy localStorage store and is reflected in the Journeys tab and Assignment dialog. |
| Add / remove / reorder modules in a journey | **PASS** — `addModuleToJourney`, `removeModuleFromJourney`, `reorderJourneyModule` wired to academy store. |
| Edit module content (overview, SOP markdown, checklist, resources, Tango/video URLs, delete) | **PASS** — `ModuleEditDialog` persists via `upsertTraining`, deletion via `deleteTraining` (also cleans up any journey references). |
| Delete module removes it from journeys | **PASS** — `deleteTraining` rewrites every journey’s `moduleIds`. |
| Assignment dialog | **PASS** — persists via `createAssignment` mock store (unchanged from Pass 8). |
| Resource attachments | **PASS** — `ResourceAttachmentManager` unchanged; RBT track-scoped vs. global behavior intact. |
| RBT track-specific resource isolation | **PASS** — `listAttachmentsForScope` track gating intact. |
| State Director content preserved | **PASS** — `/training` route and `/academy/path/state-director` redirect untouched. |
| BCBA runtime content preserved | **PASS** — `TrainingModuleRuntime` BCBA path untouched. |
| **AI Generate** save | **PASS — now real.** `AIGenerateDialog` Save-as-draft now calls `createTraining(...)` with generated title/summary/objectives/checklist, then opens the new module in `ModuleEditDialog`. No fake success toast. |
| **Template strip** Create-from-template | **PASS — now real.** Clicking a template seeds `createModulePrefill` (title, description, type) and opens `CreateModuleDialogReal` prefilled. No fake "Started new …" toast. |

## Search QA (zero matches required)

| Search | Matches |
| --- | --- |
| `toast.success("Module created as draft")` | 0 |
| `toast.success("Journey created as draft")` | 0 |
| `toast.success(`Started new` | 0 |
| `toast.success("Module draft saved to library.")` | 0 |
| `function CreateModuleDialog(` (legacy, non-Real) | 0 |
| `function CreateJourneyDialog(` (legacy, non-Real) | 0 |
| Dynamic `import("@/lib/training/academyData")` inside `JourneyEditors.tsx` | 0 |

## Code Changes In This Pass

- `src/lib/training/academyData.ts` — widened `updateJourney` patch type to `Partial<Omit<RoleJourney, "id">>` so `role` can be persisted.
- `src/components/training/management/JourneyEditors.tsx` — added Role/Audience selector to `JourneyMetaEditor`; replaced dynamic `import("@/lib/training/academyData")` with a top-level `addModuleToJourney` import; added `initial` prefill prop to `CreateModuleDialogReal`.
- `src/pages/hr/TrainingManagementCenter.tsx` —
  - Removed unused fake `CreateModuleDialog` and `CreateJourneyDialog` functions (toast-only) entirely.
  - Templates strip now seeds `createModulePrefill` and opens the real create dialog with prefilled type/description (no fake "Started new …" toast).
  - `AIGenerateDialog` now accepts `onCreated` and, on Save, calls `createTraining(...)` with the generated content, then opens the new module in `ModuleEditDialog`.

## Final Status

**PASS** — Training Management Center is now truthful and fully functional. All primary create / save actions mutate real academy store state. No toast-only stubs remain on primary creation paths. Journey role/audience is editable end-to-end.