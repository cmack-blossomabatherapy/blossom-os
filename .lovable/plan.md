## Goal
Place a persistent **Home** button at the top of the left sidebar navigation so users can always return to `/home` from anywhere in the app.

## Scope
- Update `src/components/layout/AppSidebar.tsx` — the main left sidebar used by `/home` and most app pages.
- Keep the change role-agnostic: every authenticated user sees Home first.
- Preserve existing navigation behavior, active states, and mobile sheet layout.

## What will change
1. **Pinned Home item**
   - Insert a non-collapsible Home row at the very top of the sidebar, above the first collapsible section.
   - Use the `Home` icon from `lucide-react`.
   - Route to `/home`.
   - Highlight when the current route is `/home` using the existing `isItemActive` helper.

2. **Desktop sidebar**
   - Add the Home row right after the search input and before `sections.map(...)`.
   - Style it like the existing nav items (`nav-item` classes) so it matches the sidebar design.

3. **Mobile sheet sidebar**
   - Add the same Home row near the top of the mobile menu, after the search input and before the first collapsible section.
   - Close the mobile sheet on click.

## Out of scope
- No changes to role-based menu definitions in `roleMenus.ts`.
- No changes to top-bar icons or command palette.
- No backend/schema changes.

## Verification
- Open `/home` and confirm the Home item is highlighted.
- Navigate to another page and confirm Home remains at the top and clickable.
- Open the mobile menu and confirm Home appears first.
- Run the existing sidebar/navigation tests if available.