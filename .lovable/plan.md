# Fix: RBTs see the generic mobile menu

## What's happening now

- `src/components/layout/MobileBottomNav.tsx` renders one hardcoded 5-tab bar for everyone (Home / Academy / Learning / Resources / Profile). It is not role-aware.
- The RBT-specific bottom bar (Home / Schedule / Learn / Support / Me → `/rbt/app/*`) only exists inside `src/pages/rbt/app/shell.tsx`, and only shows when the RBT is already inside `/rbt/app/*`.
- Anywhere else — `/`, `/tasks`, `/resources`, `/profile`, notification deep-links, etc. — an RBT falls back to `AppLayout` + the generic `MobileBottomNav`, so they see the same menu as everyone else.
- OS role is available via `useOSRole()` (`OSRoleContext`) and resolves to `"rbt"` for RBT users, with the same wait-for-role loading pattern already used elsewhere.

## What to change

Frontend/presentation only. No permission model, routing, or data changes.

1. **Make `MobileBottomNav` role-aware.**
   - Read `role` from `useOSRole()` (with `useOSRoleSafe()` fallback so it's tolerant outside providers) and the loading state from `useAuth()`.
   - While auth/role is still loading, render nothing (avoid flashing the wrong menu — the pattern already used elsewhere).
   - When `role === "rbt"`, render the RBT tab set that mirrors `RbtAppShell`:
     - Home → `/rbt/app/home`
     - Schedule → `/rbt/app/schedule`
     - Learn → `/rbt/app/learn`
     - Support → `/rbt/app/support`
     - Me → `/rbt/app/me`
   - Active-state matching uses `pathname.startsWith(tab.to)`, matching the RBT shell.
   - Otherwise keep the current generic tabs unchanged.

2. **Avoid a double bottom bar inside `/rbt/app/*`.**
   - `RbtAppShell` already renders its own bottom nav. In `MobileBottomNav`, if `pathname.startsWith("/rbt/app")`, return `null` so we don't stack two bars when an RBT route happens to be rendered under `AppLayout`.

3. **Send RBTs to their app by default on mobile.**
   - In `AppLayout` (or a small `RbtHomeRedirect` used at `/` and `/home`), if `role === "rbt"` and the user lands on a generic root path (`/`, `/home`), `<Navigate to="/rbt/app/home" replace />`. This guarantees the "Home" tab in the new RBT mobile menu is where they actually live.
   - Do not touch permissions or non-RBT routing.

4. **Sanity-only verification (no functional test changes required).**
   - Manually confirm via Playwright at mobile viewport, signed in as an RBT: bottom nav shows Home/Schedule/Learn/Support/Me, tapping each routes into `/rbt/app/*`, and non-RBT users still see the existing 5 tabs.

## Files touched

- `src/components/layout/MobileBottomNav.tsx` — role-aware tab set + hide inside `/rbt/app/*`.
- `src/components/layout/AppLayout.tsx` (or a tiny new `RbtHomeRedirect`) — redirect RBT off `/` and `/home` to `/rbt/app/home`.

## Explicitly out of scope

- Desktop sidebar contents, permission model, backend/RLS, notification payloads, and any non-RBT role menus.
