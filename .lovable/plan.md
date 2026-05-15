## Rename to "BCBA Performance"

Update the user-facing labels/headings and move the public dashboard URL to `/bcba-performance-dashboard`, while keeping legacy redirects for old bookmarks.

### Changes

1. **Sidebar label** — `src/components/layout/AppSidebar.tsx` (line 61)
   - `"CEO Dashboard V2"` → `"BCBA Performance"`

2. **Main page hero heading** — `src/pages/CeoDashboardV2.tsx` (line 494)
   - `<h1>CEO Dashboard V2</h1>` → `<h1>BCBA Performance</h1>`

3. **Sub-page back links** (3 files)
   - `src/pages/CeoDashboardV2Insights.tsx` (line 637): "Back to CEO Dashboard V2" → "Back to BCBA Performance"
   - `src/pages/CeoDashboardV2RevenueLeaks.tsx` (line 313): same
   - `src/pages/CeoDashboardV2Logic.tsx` (line 27): same

4. **Logic page heading** — `src/pages/CeoDashboardV2Logic.tsx` (line 32)
   - `"How CEO Dashboard V2 works"` → `"How BCBA Performance works"`

### Route update

- New route paths use `/bcba-performance-dashboard/*`.
- Legacy `/ceo-dashboard-v2/*` routes redirect to the matching new URL.
- File names and component identifiers (`CeoDashboardV2*`) stay the same — pure internal naming, no user impact.
- Sub-page titles ("Insights & Trends", "Revenue Leaks") stay as they are — they already work as section names under the parent.
