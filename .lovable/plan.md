## Problem

`/intake/cr-packet-prep` is fully built (`src/pages/os/intake/CentralReachPacketPrep.tsx`) and mounted in `App.tsx`, but the sidebar entry shows "Coming Soon" for the Intake Coordinator (and other roles that expose it) because the path is not in that role's `ROLE_SPECIFIC_LIVE_PATHS` set in `src/pages/os/OSShell.tsx`.

Currently only `authorization_coordinator`, `authorization_manager`, and `billing_finance` have `/intake/cr-packet-prep` whitelisted. `intake_coordinator` (the primary owner) does not, so the menu item renders as an inert "Soon" chip.

## Fix

1. **`src/pages/os/OSShell.tsx`** — add `/intake/cr-packet-prep` to the `intake_coordinator` role-specific live path set so the menu item is clickable for the role that owns it. Verify any other roles whose menus list the item (Intake Manager/Lead if present, State Director intake snapshots) are also whitelisted, matching the pattern already used for the Auth Section variant.

2. **Sanity audit** — confirm no other role menu entries pointing at `/intake/cr-packet-prep` (including the `?section=auth` deep-link) are stuck as "Coming Soon" by cross-checking each role that references the path in `src/lib/os/roleMenus.ts` against its live-path set. Add missing entries in the same edit.

3. **No page changes** — the page component itself is functional (search, filters, readiness scoring, CR Handoff / Missing Info actions, lead drawer links). No refactor needed.

## Verification

- Load `/intake/cr-packet-prep` as Intake Coordinator: sidebar link is active (no "Soon" chip), page renders with lead readiness cards.
- Same check for Authorization Coordinator/Manager and Billing/Finance (already live — regression check).
- Executive/COO/Super Admin already have full menu access — spot check.
