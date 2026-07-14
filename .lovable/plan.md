## Problem

`TrainingAcademyHome` resolves the learner journey from `useAuth().roles` (the raw account roles). For a Super Admin, that always starts with `admin` → journey `systems`, even when they use "View As Role" to preview Intake. The OS role context (`useOSRole`) already tracks the active "viewing as" role — the Training Academy just isn't consulting it.

## Fix (single file: `src/pages/academy/TrainingAcademyHome.tsx`)

1. Import `useOSRoleSafe` from `@/contexts/OSRoleContext`.
2. Read the active OS role: `const osRole = useOSRoleSafe()?.role`.
3. When resolving the journey, prefer the OS role over raw auth roles:
   ```ts
   const rolesForJourney = osRole ? [osRole, ...(roles as string[])] : (roles as string[]);
   const resolvedFromRoles = user ? resolveRoleJourney(rolesForJourney, overrides) : null;
   ```
   OS role strings like `intake_coordinator`, `authorization_coordinator`, `scheduling_team`, `hr_lead`, etc. are already keys in `DEFAULT_ROLE_TO_SLUG`, so no mapping table changes are needed. Because `resolveRoleJourney` prefers the first specific match, the currently-active OS role wins for Super Admins in "View As" mode while normal users get identical behavior (their real role still resolves first).

## Result

- Super Admin viewing as Intake → Training Academy shows the **Intake** journey.
- Switching "View As" to another role instantly reflects in the Training Academy home (context re-render).
- Non-admin users are unaffected (their OS role equals their derived role).
- The Super Admin "Training Management" panel still shows because it's gated on `isAdmin`, independent of the journey selection.

## Out of scope

No changes to `resolveRoleJourney`, role-menu wiring, `AcademyHome` (DB-backed variant), or `OSTraining`.
