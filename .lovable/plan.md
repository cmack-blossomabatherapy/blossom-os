## Problem

On any `/marketing/...` sub-route (Referral CRM, Lead Sources, Campaigns, Call Tracking, etc.), the "Marketing Dashboard" item in the sidebar stays highlighted alongside the actual sub-page.

Root cause in `src/components/layout/AppSidebar.tsx` (`isItemActive`, line 505):

```ts
return location.pathname === bare || location.pathname.startsWith(`${bare}/`);
```

Because the Marketing Dashboard's path is `/marketing`, every `/marketing/<child>` route passes the `startsWith` check, so the dashboard row is marked active on every marketing sub-page. The same pattern also affects other "hub" entries whose path is a prefix of sibling items (e.g. `/intake`, `/os`, etc.).

## Fix

Update `isItemActive` so a prefix match only wins when no more-specific sibling item also matches. Concretely:

1. Collect the full list of item paths from all sections (`sections` + `mobileSections`) once per render into a memoized `allItemPaths: string[]`.
2. In `isItemActive(path)`:
   - Keep the query-string branch unchanged.
   - Exact match (`location.pathname === bare`) → active.
   - Prefix match (`location.pathname.startsWith(bare + "/")`) → active **only if** no other registered item path is a longer prefix of `location.pathname`. This way `/marketing/referral-crm` deactivates `/marketing`, but `/marketing/campaigns/123` (a detail route with no dedicated menu item) still highlights `Campaigns`.

This is a localized change to one helper and its memoized inputs — no route, no menu-config, and no styling changes.

## Files touched

- `src/components/layout/AppSidebar.tsx` — add `allItemPaths` memo, update `isItemActive` logic. No other files.

## Verification

- Navigate to `/marketing/referral-crm`, `/marketing/lead-sources`, `/marketing/campaigns`, `/marketing/call-tracking`: only that specific row is highlighted; "Marketing Dashboard" is not.
- Navigate to `/marketing`: "Marketing Dashboard" is highlighted.
- Spot-check the Intake section (which also has an `/intake` overview + `/intake/...` children) behaves the same way.
- A deep detail route like `/marketing/campaigns/<id>` (no dedicated menu item) still highlights the closest parent (`Campaigns`).
