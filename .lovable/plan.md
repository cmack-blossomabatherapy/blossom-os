## Goals

1. Temporarily unlock the entire system so any signed-in user (including elviscooperdigital@gmail.com) can see and visit every page.
2. Fix the floating mobile notifications/alerts bubble that's currently hidden behind the bottom navigation bar.
3. Make sure the updated sidebar/menu design actually shows up on mobile for this account (right now they're stuck on the limited "intake" view, which is why nothing looks changed).

## What to change

### 1. Unlock everything (frontend gating only)
File: `src/lib/navigationAccess.ts`
- `hasFullNavigationAccess(roles)` → return `true` whenever the user has any role at all (so every authenticated user gets the full sidebar + every section).
- `canAccessRouteForRoles(pathname, roles)` → return `true` for any signed-in user.
- Leave the role tables untouched so we can re-enable per-role gating later by reverting these two functions.

File: `src/components/auth/ProtectedRoute.tsx`
- Keep the auth check; remove the `canAccessRouteForRoles` redirect (since it now always returns true, this is a no-op but we'll simplify the fallback).

File: `src/components/layout/AppSidebar.tsx`
- Because `hasFullNavigationAccess` now returns true for everyone, the existing `allSections` branch will already render Blossom OS, Dashboards (admin-only stays admin-only via `superAdminOnly`), Operate, Pipeline, Records, Intelligence, HR Suite, Enterprise, Admin. Verify nothing else still gates on `isAdmin` for visibility (the dashboards section will still be admin-only — we'll relax that too so the user can preview them).
- Change `superAdminDashboardSection` insertion so it's included for all signed-in users (drop the `isAdmin` check on that single insertion). Individual dashboards keep their `superAdminOnly` flag in the data, but we'll also relax the per-item filter to ignore `superAdminOnly` for now.

File: `src/components/layout/MobileBottomNav.tsx`
- The `Insights` slot currently keys off `isAdmin`. Since everyone is unlocked, show `Insights → /intelligence` for all users so the new design surfaces.

No backend/RLS changes — this is purely a UI-visibility unlock so the user can audit the system. Data RLS still protects writes/reads server-side.

### 2. Fix the notifications bubble behind the bottom nav
File: `src/components/mobile/MobileAlertsSheet.tsx`
- The trigger uses `bottom-[calc(56px+env(safe-area-inset-bottom)+12px)]`, but the bottom nav was bumped to `h-16` plus extra padding (~78–84px tall). Update the offset to match the assistant FAB:
  `bottom-[calc(72px+env(safe-area-inset-bottom)+16px)]` and bump z-index to `z-50` so it sits above the nav.

### 3. Confirm the new menu design renders
- After step 1, opening the mobile menu (hamburger) will show every section with the updated grouping/labels, the sign-out button at the bottom, and the new bottom nav with Home / Academy / Training / Resources / Insights.
- Quick smoke check on mobile viewport (430×777) after the change: open sidebar sheet → verify Blossom OS, Dashboards, Operate, Pipeline, Records, Intelligence, HR Suite, Enterprise, Admin all appear; tap Insights in bottom nav → `/intelligence` loads; scroll page → notifications bubble stays above the bottom nav.

## Out of scope
- No database/RLS/role changes.
- No redesign of individual pages — this is purely visibility + the one z-index/positioning fix.
- Re-locking by role is a one-line revert in `navigationAccess.ts` when you're ready.
