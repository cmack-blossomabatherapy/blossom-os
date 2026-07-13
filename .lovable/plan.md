# Training Academy — Role → Journey Fix Plan

Audit result: the mapping is nearly complete (every `AppRole` is in `DEFAULT_ROLE_TO_SLUG`, and the HR admin tab lists every role). Three real gaps to close:

## Gap 1 — `state-director` journey has no content

`src/lib/academy/journeyContent.ts` has no `case "state-director"` in `sourceTrainingsForSlug`, so its journey renders empty. `TrainingAcademyHome.tsx:170` currently side-routes state-director to `/training` as a workaround.

**Fix:** Add `case "state-director": return byDept("state_director", "state_operations", "leadership_state");` in `journeyContent.ts` so it works as a normal blank-canvas department journey. Remove the `/training` side-route in `TrainingAcademyHome.tsx` — state-director goes through `/academy/path/state-director` like every other department.

## Gap 2 — HR overrides ignored for RBT / BCBA

`src/pages/academy/TrainingAcademyHome.tsx:57`:
```
const primarySlug = isRbt ? "rbt" : isBcba ? "bcba" : (resolvedFromRoles ?? "blossom-os-basics");
```
This hardcodes `rbt`/`bcba` before the override-aware resolver runs, so HR-configured overrides for those roles are discarded.

**Fix:** Trust `resolveRoleJourney` for everyone. Replace with:
```
const primarySlug = resolvedFromRoles ?? "blossom-os-basics";
```
Confirm `DEFAULT_ROLE_TO_SLUG` maps `rbt → "rbt"` and `bcba → "bcba"` (audit shows it does), so the default behavior is unchanged while HR overrides now actually apply.

## Gap 3 — Unreachable / legacy keys in the map and HR admin UI

`DEFAULT_ROLE_TO_SLUG` includes several keys that aren't `AppRole` values: `case_manager`, `clinical_director`, `authorizations`, `auths`, `bd`, `business_development`, `intake_team`, `hr_team`, `executive_leadership`, `ceo`, `operations_leadership`, `recruiting`, `recruiting_team`, `authorizations_team`. Because the HR "Role Journeys" tab is driven by `ALL_ROLE_SLUGS = Object.keys(DEFAULT_ROLE_TO_SLUG)`, HR sees ghost rows they can't actually assign.

**Fix in `src/lib/training/roleJourneyAssignments.ts`:**
1. Keep the extra keys in `DEFAULT_ROLE_TO_SLUG` as tolerated aliases for the resolver (data may still contain them).
2. Change `ALL_ROLE_SLUGS` so the HR admin UI only lists **canonical `AppRole` values**. Import `AppRole` from `src/lib/roles.ts` (or a static array of the same) and export `ALL_ROLE_SLUGS = [...canonical AppRole slugs].sort()`.
3. Result: `RoleJourneyAssignmentsView` shows exactly 59 rows — one per real OS role — while the resolver still handles legacy aliases gracefully.

## Nice-to-have — verify departments in `byDept`

The new `state-director` case (Gap 1) and the existing blank-canvas cases (`finance`, `operations`, `executive`, `systems`, `clinic-operations`) call `byDept("<slug>", ...)`. If no records exist yet in `hr_resources` with those department slugs the journey renders as an intentional blank canvas — matches the earlier "blank canvas will be added later" decision. No content changes.

## Files touched

- `src/lib/academy/journeyContent.ts` — add `state-director` case.
- `src/pages/academy/TrainingAcademyHome.tsx` — remove RBT/BCBA hardcoding; remove `/training` side-route for state-director; route state-director through `/academy/path/state-director`.
- `src/lib/training/roleJourneyAssignments.ts` — narrow `ALL_ROLE_SLUGS` to canonical `AppRole` values only.

## Validation

- `bunx tsgo --noEmit` passes.
- Grep confirms `ALL_ROLE_SLUGS` still exported and no consumer is broken.
- Manual: as a state_director user, `/academy` primary card links to `/academy/path/state-director` and renders (blank-canvas is acceptable). As RBT with an HR override to another slug, the override is respected. HR "Role Journeys" tab shows exactly the canonical OS roles.

Out of scope: seeding actual training modules for blank-canvas department paths — deferred per earlier decision.
