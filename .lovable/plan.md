# Fix: Phone System menu missing for HR Team and Super Admin

## Problem

`src/components/layout/AppSidebar.tsx` wires `phoneSystemSection` into:

1. `hrSections` (line 619) — works when a real HR user logs in (`isHrOnly === true`).
2. The impersonation branch (line 655) — but **only** when `osRole === "marketing_team"`.
3. The default branch (line 662) — gated on `showOperations || roles.includes("marketing")`.

This breaks the two most common viewing modes:

- **Super Admin using "View as Role" → HR Team**: takes the impersonation branch, which uses `buildGenericRoleSections(osRole)` and does not inject the phone section for `hr_team`.
- **Super Admin (not impersonating)**: `showOperations` requires `roles` to include `admin` / `exec` / `ops_manager`. Accounts that are admin via `isAdmin` only (not via the `roles` array) get the section dropped.

The Marketing impersonation path already works; real HR users also work. Everything else silently hides the menu.

## Fix

Edit only `src/components/layout/AppSidebar.tsx`:

1. **Impersonation branch (around line 652-657)**: include `phoneSystemSection` for `osRole` in `["hr_team", "marketing_team", "super_admin"]` (covers HR + Marketing impersonation, and a defensive case for super_admin self-view).

   ```ts
   : impersonating && osRole
   ? [
       ...buildGenericRoleSections(osRole),
       ...(["hr_team", "marketing_team", "super_admin"].includes(osRole)
         ? [phoneSystemSection]
         : []),
       intelligenceSection,
     ]
   ```

2. **Default (Super Admin / Ops) branch (around line 662)**: also include when `isAdmin` is true, so Super Admins always see it regardless of how their `roles` array is populated.

   ```ts
   ...(isAdmin || showOperations || roles.includes("marketing")
     ? [phoneSystemSection]
     : []),
   ```

No other files change. Routes, provider, and pages are already wired correctly in `src/App.tsx` and the section/icons already exist in the sidebar — this is purely a visibility-gating bug.

## Verification

- Log in as Super Admin → expect "Phone System" group with 7 items in the sidebar.
- View as Role → HR Team → expect "Phone System" to appear.
- View as Role → Marketing Team → still appears (unchanged).
- Real HR user → still appears via `hrSections` (unchanged).
