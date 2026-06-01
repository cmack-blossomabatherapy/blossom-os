## Problem

The Training Academy and Training Management Center are reading from two completely different data stores:

- **Academy** (`src/lib/training/academyData.ts`) — reactive store with the real **51-module State Director journey**, deep content (overview, SOP, Tango, checklist, resources), and localStorage persistence. This is what users see.
- **Training Management Center** (`src/lib/hr/trainingCenterData.ts`) — a static file with only **5 modules** for State Director and no deep content. Editing it changes nothing the user sees.

The sub-section editors on `OSTrainingManage.tsx` already write to the Academy store, but the Management Center page itself doesn't read or write to it.

## Fix

### 1. Unify the journey/module source
- `src/lib/training/academyData.ts`: add optional `assignedCount` and `completionPct` fields to `RoleJourney` so the Management Center can use the same type without an adapter.
- `src/pages/hr/TrainingManagementCenter.tsx`:
  - Replace `trainingJourneys` / `trainingModules` imports from `@/lib/hr/trainingCenterData` with `useAcademy`, `getJourneyForRole`, `getTraining`, and the journey list from `@/lib/training/academyData`.
  - Subscribe via `useAcademy()` so edits made anywhere update live.
  - `selectedJourney` lookup → use the academy journeys list (filter by role keys).
  - `JourneyBuilderView` module resolution → `getTraining(id)` instead of `trainingModules.find`.
  - Keep the existing UI shell, KPIs, filters, and layout — only swap the data plumbing.

### 2. Make the Journey Builder actually edit
Currently "Add module to journey" only shows a toast. Wire it to the real store:
- Add module: open a searchable picker over all academy trainings (excluding ones already in the journey) → call `addModuleToJourney(journeyId, moduleId)`.
- Remove module from journey → call `removeModuleFromJourney(journeyId, moduleId)`.
- Reorder modules (drag handles or up/down) → call `setJourneyModules(journeyId, nextIds)`.
- Update module title/minutes/type inline → call `updateTraining`.

### 3. Keep non-overlapping data alone
- `trainingCenterData.ts` keeps the unrelated exports it still owns (`trainingAssignments`, `trainingSops`, `trainingTangos`, `trainingCategories`, `trainingTemplates`) so the rest of the Management Center keeps working.
- Remove only the now-unused `trainingModules` and `trainingJourneys` exports from `trainingCenterData.ts` once the page is migrated.

### 4. Audit pass
After the swap, verify:
- State Director journey in Management shows the same 51 modules as the Academy.
- All 7 role journeys (BCBA, RBT, Intake, Auth, Scheduling, QA, State Director, etc.) reflect the academy data.
- Editing a module's overview/SOP/Tango/checklist/resources from `OSTrainingManage` is visible in both the Academy and the Management Center.

## Out of scope
- No backend migration — the Academy store stays on its existing localStorage-backed reactive store for now.
- No changes to the Academy page UI.
- `assignedCount` / `completionPct` will display as 0 / `—` until a real assignments source is wired (separate ticket).
