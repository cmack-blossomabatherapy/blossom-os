## Goal
Make `/academy` show **only the signed-in user's assigned role journey** (plus a universal "Welcome to Blossom" entry). Remove the cross-role browsing sections that expose every other role's paths.

## Changes (single file: `src/pages/academy/TrainingAcademyHome.tsx`)

1. **Keep the hero + greeting** and the 3-tile "Today / Journey progress / Resources" strip (already role-aware via `primarySlug`).

2. **Add a persistent "Welcome to Blossom" card** at the top of the page for every signed-in user (using the existing `WelcomeToBlossomCard` component from `src/components/onboarding/WelcomeToBlossomCard.tsx`) so Phase 0 is always one click away — regardless of role.

3. **Replace "My Training" section** — instead of listing 3 mixed paths, render a single focused card for the user's assigned role path (`primarySlug` → `TRAINING_PATHS.find(...)`) with progress + Continue CTA. If somehow unresolved, fall back to `blossom-os-basics`.

4. **Remove these sections entirely for non-admins:**
   - "Required Training" (was leaking other-role paths)
   - "Role Training Paths" grid (all roles)
   - "Department Training" grid (all departments)

5. **Keep "Completed Training"** section (personal record, role-agnostic).

6. **Super Admin block unchanged** — admins still see Training Management quick links at the bottom (that's their management surface, not a learner surface). The role-wide/department-wide browsing grids move behind the admin gate: if `isAdmin`, render a collapsed "All Role Paths (admin view)" section so admins can still preview any journey for assignment purposes.

7. **Role resolution** stays as-is (the existing `ROLE_TO_SLUG` map already covers every role and falls back to `blossom-os-basics`).

## Non-goals
- No changes to `TRAINING_PATHS`, routes, `learnerHome`, or per-path content.
- No changes to `/training`, `/my-learning`, or admin editor pages.
- No RBAC/route guard changes.

## Verification
- Sign in as intake, RBT, BCBA, HR, scheduling, finance, exec → each sees only their own role journey card + Welcome to Blossom + Completed + (admins only) management links.
- No "Role Training Paths" or "Department Training" grids visible to non-admins.
- Run `src/test/learnerAcademyHome.test.ts` and any academy-home tests; update snapshots/assertions if they reference the removed sections.
