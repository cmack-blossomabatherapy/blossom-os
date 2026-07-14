## Goal
Remove the "Lead-to-Active Funnel" menu entry so it no longer shows in the left sidebar on `/leads` (or anywhere else). The `/leads?view=pipeline` view already lives inside the Leads page, so the separate menu item is redundant.

## Change
- `src/lib/os/roleMenus.ts` line 99: delete the menu item
  ```
  { label: "Lead-to-Active Funnel", path: "/leads?view=pipeline", icon: TrendingUp }
  ```
  If `TrendingUp` isn't used elsewhere in the file after removal, drop its import too.

## Keep intact
- `App.tsx` route `/intake/lead-to-active` → `Navigate to="/leads?view=pipeline"` stays as a safety redirect for any bookmarks/deep links.
- Existing tests referencing the pipeline route still pass because the route + query param behavior is unchanged.

## Verify
- Load `/leads` and confirm the sidebar no longer lists "Lead-to-Active Funnel".
- Confirm `/leads?view=pipeline` still opens the combined pipeline view via the Leads page tabs.
