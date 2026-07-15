## Goal
Restore the 9 department KPI dashboards to `/reports` behind a dedicated tab, without disturbing the six approved report cards.

## Why they went missing
The dashboards themselves still exist and render (`DEPARTMENT_DASHBOARDS` → `ResolvedDepartmentDashboard` via `ReportDetail`, exposed by `visibleDepartmentDashboardsForRole`). During the "Reports cleanup pass" you asked me to strip them from the Reports home listing so `/reports` showed only the six approved cards. They stayed reachable by URL but nothing linked to them. This plan re-surfaces them.

## Changes

### `src/pages/os/reports/ReportsHome.tsx`
- Add a top-of-page tab switcher (shadcn `Tabs`): **Reports** (default) and **Department Dashboards**.
- **Reports tab**: renders today's page unchanged — the six approved reports, Saved views, Recents.
- **Department Dashboards tab**: renders a card grid of `visibleDepartmentDashboardsForRole(role)` (already role-scoped: Super Admin/Executive see all; State Director sees all except HR; department teams see their own). Each card links to `/reports/<id>` (already routed to `ReportDetail`, which resolves department IDs via `getDepartmentDashboard`).
- Preserve the existing page chrome (header, breadcrumbs, search).
- Cards match the visual language of the six report cards (same `Card` component, KPI count chip, "Open dashboard" affordance).
- Empty state: "No department dashboards available for your role." when the list is empty.

### No other files
- `reportsCatalog.ts`, `departmentDashboards.ts`, `ReportDetail.tsx`, and `ResolvedDepartmentDashboard.tsx` stay as-is.
- No DB, no route, no permission changes.

## Verification
- `/reports` default tab still shows exactly the six cards.
- Switching to "Department Dashboards" shows the role-scoped list; clicking a card opens the working dashboard at `/reports/<id>`.
- Type check clean.