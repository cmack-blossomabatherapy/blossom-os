# Combine Pipeline Pulse into the Leads page

The "Lead-to-Ready Pipeline" page (`/intake/lead-to-active`, aka Pipeline Pulse) duplicates what the Leads page shows. We'll fold its pipeline visualization into the Leads page as a new "Pipeline" view, delete the standalone page, and repoint every menu/link.

## What ships

1. **Leads page gets a Pipeline view.** Add a view switcher on `/os/leads` (or wherever `OSLeadsV2` renders): **Board · Table · Pipeline**. Pipeline view shows the Pipeline Pulse content (stage counts, aging, conversion snapshot, per-state pulse) driven by the same lead dataset the Leads page already loads — no duplicate fetching.
2. **Pipeline Pulse header lives on the Leads page.** Preserve the "live snapshot of where every family sits" summary strip (totals, stage tallies, aging chips) above the leads list so the value shows without switching views.
3. **Delete the standalone page.**
   - Remove `src/pages/os/intake/LeadToActivePipeline.tsx`.
   - Remove the `/intake/lead-to-active` route and import from `src/App.tsx`.
   - Add a redirect from `/intake/lead-to-active` (and any `?src=pipeline` deep link) → `/os/leads?view=pipeline` so old bookmarks land correctly.
4. **Repoint every menu entry** in `src/lib/os/roleMenus.ts` (7 entries: "Lead-to-Active Funnel", "Intake Pipeline Visibility", "State Pipeline", "State Pipeline Support" x2, "Pipeline Aging by State", "Lead-to-Ready Pipeline") and `src/lib/os/superAdminMenu.ts` ("Lead to Ready-to-Start Pipeline") to the Leads page with the pipeline view preselected: `/os/leads?view=pipeline`.
5. **Clean references** in `src/lib/os/moduleRegistry.ts`, `src/lib/os/phase3Reports.ts`, `src/lib/ai/knowledgeBase.ts`, and `src/lib/training/academyData.ts` so nothing still describes a separate Pipeline page.
6. **Update tests** in `src/test/intakeExport81…`, `82…`, `84…` that assert against the old route/label.

## View switcher behavior

- URL param `?view=board|table|pipeline` controls the active view; defaults to Board.
- Filters (state, owner, source, stage) apply across all three views.
- Pipeline view is read-only visualization; clicking a stage/lead opens the existing Lead drawer via the `?lead=` param already wired.

## Out of scope

- No changes to the Lead drawer, referral CRM, or intake dashboard.
- No data-model changes; both pages already read the same leads source.

## Files touched

- Edit: `src/pages/os/OSLeadsV2.tsx` (view switcher + pipeline view), `src/App.tsx` (route removal + redirect), `src/lib/os/roleMenus.ts`, `src/lib/os/superAdminMenu.ts`, `src/lib/os/moduleRegistry.ts`, `src/lib/os/phase3Reports.ts`, `src/lib/ai/knowledgeBase.ts`, `src/lib/training/academyData.ts`, 3 intakeExport tests.
- Delete: `src/pages/os/intake/LeadToActivePipeline.tsx`.

## Validation

- `bunx tsgo --noEmit` clean.
- Vitest for the intakeExport suites and any leads deep-link tests.
- Manual: menu entries land on Leads with Pipeline view; `/intake/lead-to-active` redirects; `?lead=<id>` still opens the drawer.
