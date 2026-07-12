# Consolidate Integrations into one page

Right now Super Admin has two side-by-side entries — **Integrations** (`/admin/integrations`, driven by the code-defined integration registry) and **Integration Registry** (`/system/integration-registry`, a CRUD table over the `integration_catalog` DB rows used by dropdowns). Plus a legacy `/integrations` route. This unifies everything under one page.

## What changes

1. **Single canonical page:** `/admin/integrations` becomes the only Integrations page — the current list of all live and planned integrations, connect/toggle actions, status overlays, and per-integration deep links (opened via `?id=<integration>`).
2. **Fold catalog management in:** move the `integration_catalog` CRUD (Add / Edit / Enable / Disable / Delete rows used by picker dropdowns) into a secondary **"Catalog metadata"** section on the same page, collapsed by default. Nothing that admins do today on `/system/integration-registry` is lost.
3. **Delete the second page:** remove `src/pages/os/system-tools/IntegrationRegistryPage.tsx` and its route `/system/integration-registry`.
4. **Menu cleanup (Super Admin):** in `src/lib/os/superAdminMenu.ts` remove the "Integration Registry" item; keep a single **Integrations** entry pointing to `/admin/integrations`.
5. **Route hygiene in `src/App.tsx`:**
   - Redirect `/integrations` → `/admin/integrations`.
   - Redirect `/system/integration-registry` → `/admin/integrations` (so any bookmarks or in-app links keep working during the transition).
   - Remove the now-unused `IntegrationRegistryPage` import.
6. **Fix stray internal links** so nothing points at the removed page or the legacy `/integrations` path:
   - `src/pages/os/OSStaffingWorkspace.tsx` link `to="/integrations"` → `/admin/integrations`.
   - `src/lib/os/workspaces.ts` entries already use `/admin/integrations` — leave as is.
   - `src/hooks/useIntegrationCatalog.ts` doc comment updated from "Settings > Integration Registry" to "Admin > Integrations".

## Access

`/admin/integrations` stays behind `PermissionRoute allowedRoles={["admin"]}` (matches today's Super Admin visibility). The catalog metadata section inside the page renders only for admins as well.

## Verification

- Super Admin menu shows exactly one Integrations entry.
- Visiting `/system/integration-registry` or `/integrations` lands on `/admin/integrations`.
- The consolidated page still lists every registry integration, and admins can still add/edit/disable catalog rows used by other pickers.
- Build passes (`vite build`).

## Technical notes

- Files edited: `src/App.tsx`, `src/lib/os/superAdminMenu.ts`, `src/pages/admin/Integrations.tsx` (append a `CatalogMetadataSection` powered by `useIntegrationCatalog`, reusing the dialog/table logic from the old page), `src/pages/os/OSStaffingWorkspace.tsx`, `src/hooks/useIntegrationCatalog.ts` (comment only).
- Files deleted: `src/pages/os/system-tools/IntegrationRegistryPage.tsx`.
- No DB schema changes; `integration_catalog` table and its RLS remain untouched.
