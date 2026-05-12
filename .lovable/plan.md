I’ll rebuild the CEO Dashboard V2 front end instead of making small tweaks. The current screen is still too table-like, too much content appears before the useful data, and the mobile/tablet layout does not feel purpose-built.

Plan:

1. Replace the current plain layout with an executive mobile-first dashboard
- Add a compact command header with the dashboard title, dataset status, refresh, and upload actions.
- Make the first screen immediately useful: total hours, data quality alerts, and search/filter access without a long stack of boxes.
- Reduce duplicate padding inside the app shell so the dashboard uses the available mobile width better.

2. Turn filters into a mobile-friendly control system
- Keep desktop filters inline.
- On mobile, move filters into a clean bottom-sheet style drawer / compact control bar so users do not lose half the page before seeing BCBAs.
- Add active filter chips and a quick clear action.

3. Redesign BCBA rows as clickable performance cards
- Replace the cramped table-first experience with BCBA cards on mobile.
- Each BCBA card will show:
  - total billable hours
  - session count
  - patient count
  - RBT count
  - percentage of total hours
  - top billing-code breakdown
- Make the whole card clickable to open details.
- Keep a more compact table/card hybrid for desktop.

4. Improve BCBA detail view
- Rework the BCBA modal into a polished drill-down panel with clear sections:
  - overview metrics
  - billing codes
  - RBTs
  - patients
- Fix the accessibility warning by ensuring the dialog always has a proper title and description.
- Make the modal usable on mobile with safe bottom spacing and internal scrolling.

5. Make Unassigned/Mismatch sections useful but not disruptive
- Keep the Unassigned/Mismatch alert collapsed by default.
- Convert the alert into a compact “Needs label fix” banner with counts and hours.
- Let users expand into a focused review list only when needed.
- Keep it out of the way so it does not block scrolling to the main BCBA list.

6. Fix the mobile scroll problem
- Audit the dashboard container and app shell spacing.
- Add reliable bottom safe-area padding so content is not hidden behind the mobile nav or Ask Blossom button.
- Avoid nested fixed-height sections that trap scrolling.

7. Improve empty/loading states
- Replace the generic “Loading…” table with a dashboard skeleton.
- If no sessions load, show a clear upload/import state.
- Keep any import errors visible enough to troubleshoot quickly.

Technical notes:
- I’ll keep the current data source and import logic intact.
- Changes will focus on `src/pages/CeoDashboardV2.tsx` and only touch layout/shared UI if needed for mobile scrolling.
- I will use existing semantic design tokens only, matching the Blossom design system.