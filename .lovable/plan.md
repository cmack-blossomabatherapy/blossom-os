## Problem

An Intake user sees **"Blossom OS Basics"** in the *Your Journey* card on `/academy` even though the *Journey Progress* card correctly opens the Intake journey. That happens because `resolveRoleJourney` (in `src/lib/training/roleJourneyAssignments.ts`) walks the user's roles in array order and returns the first match. Generic roles like `staff`, `admin`, `exec`, `ops_manager`, `clinic`, `viewer` are all mapped to `"blossom-os-basics"`. Whenever one of those appears before the department role, or before the roles finish loading, the fallback wins.

The user also wants every department to have a journey card ready — not funnel everyone into Blossom OS Basics.

## Fix 1 — Journey resolver: prefer department journeys over generic fallbacks

Rework `resolveRoleJourney` so it doesn't depend on role array order:

1. Build two sets from `DEFAULT_ROLE_TO_SLUG`:
   - **Department/role journeys** (specific — `intake`, `bcba`, `qa`, `hr`, `scheduling`, `authorizations`, `state-director`, `marketing`, `recruiting`, `credentialing`, `staffing`, `case-manager`, `behavioral-support`, `clinical-director`, `business-development`, `finance`, `operations`, `executive`, `systems`, `rbt`).
   - **Generic fallbacks** (any role whose slug is `blossom-os-basics`).
2. Iterate overrides first, then iterate user roles looking for a **specific** journey slug, and only fall back to a generic mapping if no specific one exists.
3. Result: an Intake user with `["staff","intake"]` always gets `intake`, not `blossom-os-basics`.

## Fix 2 — Blank-canvas journeys for every department

Currently `TRAINING_PATHS` (in `src/lib/academy/trainingPaths.ts`) has paths for the clinical + department roles but leaves several groups pointing at `blossom-os-basics`. Add blank-canvas paths so every department has its own:

- `finance` — *Finance & Billing Training*
- `payroll` — *Payroll Training* (alias handled in role map)
- `operations` — *Operations Training*
- `executive` — *Executive Training*
- `systems` — *Systems Admin Training*
- `clinic-operations` — *Clinic Operations Training* (for `clinic` / office manager)

Each new path is registered with title, audience, category `Department`, a one-line description, `estimatedHours: 0`, `lessonCount: 0`, and a sensible lucide icon. No modules are wired yet — this is the requested blank canvas.

## Fix 3 — Map the remaining roles to their new journeys

Update `DEFAULT_ROLE_TO_SLUG` so previously-fallback roles now resolve to a real department path:

- `finance`, `finance_benefits_lead`, `finance_benefits_team`, `billing_lead`, `rcm_team` → `finance`
- `payroll_admin`, `payroll_lead` → `finance` (or `payroll` — use `finance` to keep count low)
- `exec`, `executive`, `executive_leadership`, `ceo` → `executive`
- `coo`, `director_of_operations`, `ops_manager`, `operations_manager`, `operations_leadership`, `dept_manager` → `operations`
- `admin`, `super_admin`, `systems_admin`, `training_admin` → `systems`
- `clinic` → `clinic-operations`
- `staff`, `viewer`, `phone_support` → keep on `blossom-os-basics` (true universal fallback)

`FALLBACK_PATH_SLUG` stays as `blossom-os-basics` so brand-new/unknown roles still get *something*.

## Fix 4 — Journey renderer for the new paths

`sourceTrainingsForSlug` in `src/lib/academy/journeyContent.ts` returns `[]` for any slug it doesn't recognize, which already produces the "curriculum coming online" blank-canvas state. Add cases for the new slugs (`finance`, `operations`, `executive`, `systems`, `clinic-operations`) so they filter academyData by matching department when content shows up later; today they'll still render as blank canvas because those departments don't have modules yet — exactly what the user asked for.

## Files touched

- `src/lib/training/roleJourneyAssignments.ts` — new resolver + updated role map.
- `src/lib/academy/trainingPaths.ts` — add finance/operations/executive/systems/clinic-operations paths.
- `src/lib/academy/journeyContent.ts` — recognise the new slugs so `hasContent` behaves correctly.

## Verification

- Sign in as an Intake user (role `intake`): *Your Journey* card shows **Intake Training** and links to `/academy/path/intake`.
- Sign in as any role that previously fell back to Blossom OS Basics (finance, exec, ops, clinic, systems): the card shows their department journey with a blank-canvas body.
- Users with only `staff`/`viewer` continue to see Blossom OS Basics (correct fallback).
- Existing RBT/BCBA/clinical/state-director/HR/QA/etc. journeys are unchanged.
- Type-check succeeds.
