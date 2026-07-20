## Goal

1. Remove the generic "Training & Resources" sidebar section from BCBA and RBT — those roles reach the Academy via their own in-shell "Academy" / "Learn" entry.
2. Turn off the "Soon" gating on BCBA and RBT menu items whose pages are already built and mounted, so the sidebar links become clickable.

## 1. Remove Training & Resources for BCBA and RBT

`src/lib/os/roleMenus.ts`
- BCBA (`bcba` menu, ~line 646): remove the `TRAINING_AND_RESOURCES` section from `sections`. The existing in-shell "Academy" item (`/bcba/academy`) is the BCBA's academy entry; the general Resource Library / Reports section is dropped for BCBAs.
- RBT (`rbt` menu, ~line 691): already has no `TRAINING_AND_RESOURCES` section — no change needed. The in-shell "Learn" tab (`/rbt/app/learn`) is the RBT's academy entry.
- Keep the shared `TRAINING_AND_RESOURCES` constant in place for every other role.

## 2. Turn on BCBA pages (remove "Soon" labels)

BCBA on desktop renders inside `OSShell`, which greys out any menu item whose base path is not in `ROLE_SPECIFIC_LIVE_PATHS.bcba`. The current set (`src/pages/os/OSShell.tsx` ~line 480) lists old paths (`/bcba/workspace`, `/bcba/clients`, `/bcba/training-academy`, etc.) that don't match the new menu, so most items render as "Soon".

`src/pages/os/OSShell.tsx` — replace the `bcba` entry in `ROLE_SPECIFIC_LIVE_PATHS` with the current menu paths (all confirmed mounted in `src/App.tsx` ~lines 1521-1540):

```
/bcba/home
/bcba/copilot
/bcba/caseload
/bcba/rbts
/bcba/supervision
/bcba/assessments
/bcba/progress-reports
/bcba/parent-training
/bcba/productivity
/bcba/clinical
/bcba/fellowship
/bcba/academy
/bcba/support-center
/bcba/me
```

Drop the obsolete entries (`/bcba/workspace`, `/bcba/clients`, `/bcba/authorizations`, `/bcba/scheduling`, `/bcba/resources`, `/bcba/training-academy`, `/evaluations`, `/reports`) since Training & Resources is gone and legacy paths are now redirects.

## 3. RBT pages

RBT does not use `OSShell` at runtime — `/rbt/app/*` is rendered by `RbtAppShell` (five tabs: Home, Schedule, Learn, Support, Me), and all five routes are already mounted. There is nothing to un-gate for RBT.

If RBT-facing "Coming Soon" copy exists inside a specific `/rbt/app/*` page, that is out of scope for this pass and would be handled per-page in a follow-up. (Scan confirms the only remaining static "coming soon" copy is `src/pages/rbt/app/growth/RbtFellowshipExplorer.tsx`, which is not on the 5-tab menu.)

## 4. Verification

- Existing test `src/test/roleMenuLiveRoutes.test.ts` will re-run: every remaining BCBA/RBT menu item must map to a mounted route.
- Manual check: sign in as BCBA on desktop, confirm no "Training & Resources" section, and confirm Home / Caseload / Copilot / Supervision / Assessments / Progress Reports / Parent Training / Productivity / Clinical / Fellowship / Academy / Support / Me are all clickable (no "Soon" chip).

## Out of scope

- Content quality of the individual BCBA pages.
- Any per-page "coming soon" copy inside RBT growth explorer or similar; call those out in a separate pass if you want them wired up.
- No changes to other roles' menus or to Super Admin.
