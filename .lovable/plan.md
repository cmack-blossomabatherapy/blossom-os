
## Goal

Right now the mapping of role → assigned wireframe journey (`TRAINING_PATHS` slug) is hard-coded in `src/pages/academy/TrainingAcademyHome.tsx` (`ROLE_TO_SLUG`). HR cannot change it without a code push. Add a live "Role Journeys" management screen inside the existing HR **Training & Certifications** hub (`TrainingManagementCenter`) so an admin can pick which journey each role sees, with a default fallback that keeps the current behavior intact.

## What gets built

### 1. New table: `training_role_journey_assignments`
Cloud-persisted overrides for the role → journey slug map.

Columns (domain-specific): `role_slug` (unique text), `path_slug` (text, references a `TRAINING_PATHS` slug), `notes` (text, optional), `updated_by` (uuid).

Access rules:
- Any signed-in user can read (the Academy home page needs it to resolve their assigned journey).
- Only HR, Training Admin, and Super Admin roles can insert/update/delete.
- Every write is audited via `hr_audit_logs` (existing table) with a trigger or hook-side log.

### 2. Data layer
- `src/lib/training/roleJourneyAssignments.ts` — pure module exporting:
  - `DEFAULT_ROLE_TO_SLUG` (moved out of `TrainingAcademyHome.tsx`).
  - `ALL_ROLE_SLUGS` (union of default keys + any Blossom OS role we recognize) for the picker.
  - `resolveRoleJourney(roles, overrides)` helper: returns the first matching path slug, override-first, then default, then `blossom-os-basics`.
- `src/hooks/useRoleJourneyAssignments.ts` — realtime hook: loads rows from the new table, subscribes to changes, exposes `{ overrides, save(roleSlug, pathSlug, notes?), clear(roleSlug), loading }`.

### 3. Wire the Academy home to the overrides
Update `src/pages/academy/TrainingAcademyHome.tsx`:
- Import `DEFAULT_ROLE_TO_SLUG` and `resolveRoleJourney` from the new module (delete the inline `ROLE_TO_SLUG` object).
- Consume `useRoleJourneyAssignments()` and pass its `overrides` into `resolveRoleJourney(roles, overrides)`.
- Behavior stays identical when no overrides exist.

### 4. New "Role Journeys" tab inside Training Management Center
Edit `src/pages/hr/TrainingManagementCenter.tsx`:
- Add `role-journeys` to `NavId` and to the `NAV` array (icon: `Users` or `Compass`, label "Role Journeys"), placed right under **Journeys**.
- Render a new component `RoleJourneyAssignmentsView` when `nav === "role-journeys"`.

`RoleJourneyAssignmentsView` (defined in the same file or a small sibling under `src/components/training/`):
- Header + one-sentence explanation ("Choose which wireframe training path each role sees in the Training Academy. Leave blank to use the built-in default.").
- Search input filters the role rows.
- A clean card list — one row per role slug — showing:
  - Role slug + friendly label.
  - `Select` of every `TRAINING_PATHS` entry (title + slug).
  - Small "Default" pill when using the fallback; "Custom" pill when overridden.
  - Inline notes field (optional).
  - Save / Reset-to-default buttons per row.
- Bulk actions row: "Reset all to defaults" (confirm dialog).
- Uses `toast` for success/error and calls the hook's `save` / `clear`.

Access-gate the tab so only HR / Training Admin / Super Admin can see it — reuse the same pattern already used for `canUploadResources` in this file.

### 5. Route + entrypoint touch-ups
- Ensure `/hr/training-center?nav=role-journeys` works (it already will, since the tab drives off `?nav=`).
- Add a small "Manage Role Journeys" quick-link inside the existing **Journeys** view header so HR can jump from the Journeys tab to the new assignment screen.

### 6. Cleanup
- Remove the giant inline `ROLE_TO_SLUG` block from `TrainingAcademyHome.tsx` (moved into `roleJourneyAssignments.ts`) so there is one source of truth.
- Update `src/test/welcomeToBlossomFinalize.test.ts` and `src/test/trainingManagement.test.ts` only if they explicitly assert the removed inline map.

## Files touched

- New: `supabase/migrations/<timestamp>_role_journey_assignments.sql`
- New: `src/lib/training/roleJourneyAssignments.ts`
- New: `src/hooks/useRoleJourneyAssignments.ts`
- Edit: `src/pages/academy/TrainingAcademyHome.tsx`
- Edit: `src/pages/hr/TrainingManagementCenter.tsx` (add nav entry + `RoleJourneyAssignmentsView`)

## Out of scope

- Editing modules inside a wireframe journey — that already exists in the current **Journeys** tab and is not part of this request.
- Per-user (not per-role) overrides.
- Changing the wireframe journey generator in `academyData.ts`.
