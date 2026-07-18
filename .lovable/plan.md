# RBT: fix broken pages and stop leaking non-RBT menu items

## What's actually going on

Two separate problems are stacking on top of each other for an RBT (or a super-admin using "View as RBT"):

1. **Two different "menus" exist for an RBT.**
   - The new mobile bottom bar I just made role-aware (`MobileBottomNav`) is correct — Home / Schedule / Learn / Support / Me pointing at `/rbt/app/*`.
   - But `AppSidebar` (the drawer opened from the top-bar hamburger on mobile, and the sidebar on desktop) is driven by `ROLE_MENUS.rbt` in `src/lib/os/roleMenus.ts`, which currently lists a **completely different set** of paths: `/rbt/my-day`, `/welcome`, `/rbt/resources`, `/rbt/schedule`, `/rbt/clients`, `/rbt/supervision`, `/rbt/help`, `/rbt/readiness`, `/rbt/messages`. Most of these are NOT mounted in `App.tsx` and route the RBT to white screens.
   - Reports specifically leaks in because when a super-admin uses "View as RBT" outside `/rbt/app/*`, they see the desktop shell with the generic Training/Resources/Reports section still visible (added elsewhere in the shell). The RBT role should never see "Reports".

2. **`/rbt/app/*` pages themselves can white-screen** because none of them are wrapped in an error boundary. If any of the underlying hooks (`useDashboardCards`, `ActiveHome`, `ActiveSchedule`, `RbtLearn` supabase queries, support/me pages) throws — for example because a table lookup fails or returns unexpected shape — React unmounts the subtree and the user sees a blank page instead of a friendly "we couldn't load this" state.

Both are frontend/presentation problems. No permission model, RLS, or backend changes.

## Changes

### 1. Realign the RBT role menu to the real RBT app (`src/lib/os/roleMenus.ts`)

Replace the `rbt:` block so its only section is the RBT app, and drop `TRAINING_AND_RESOURCES` for this role (so "Reports" never appears for RBTs anywhere — mobile drawer or desktop sidebar):

```
rbt: {
  sections: [
    {
      id: "rbt_app", label: "My Blossom",
      items: [
        { label: "Home",     path: "/rbt/app/home",     icon: Home },
        { label: "Schedule", path: "/rbt/app/schedule", icon: Calendar },
        { label: "Learn",    path: "/rbt/app/learn",    icon: GraduationCap },
        { label: "Support",  path: "/rbt/app/support",  icon: LifeBuoy },
        { label: "Me",       path: "/rbt/app/me",       icon: User },
      ],
    },
  ],
},
```

This makes both the mobile drawer and any desktop-shell rendering of the RBT menu point at real, mounted pages. No `Reports` entry for RBT.

### 2. Guarantee RBTs never leave `/rbt/app/*`

- Keep the existing redirect I added in `AppLayout` (`/` and `/home` → `/rbt/app/home` for RBT).
- Extend it: if `role === "rbt"` and the pathname does not start with `/rbt/app`, `/auth`, `/inbox`, `/profile`, or `/rbt/app/settings/notifications`, redirect to `/rbt/app/home`. That way stale deep links or drawer taps into paths like `/reports`, `/tasks`, `/clients` bounce back into the RBT app instead of landing on a generic (or broken) page.

### 3. Kill white screens with an RBT-app error boundary

- Add a small `RbtAppErrorBoundary` component (class component, `componentDidCatch`) that renders a calm "We couldn't load this page — try again" card with a Reload button (`window.location.reload()`) and a link back to `/rbt/app/home`.
- Wrap `<Outlet />` inside `src/pages/rbt/app/shell.tsx` with it, so any thrown error in Home / Schedule / Learn / Support / Me or their children stops producing a blank screen and shows the recovery card.
- Do the same for the RBT training console routes (`RbtProgramPage`, `RbtPassportPage`) which render inside the same shell.

### 4. Defensive rendering on the 5 tab pages

Only touch the top-level page components, not their business logic:

- `RbtHome` (`pages.tsx`) — already handles `loading`/`error`; verify the `context.lifecycleStage` supabase call is wrapped in `try/catch` on the `.then` (add a `.catch` that just leaves `stageMessage` undefined). Ensure `ActiveHome` renders inside the error boundary.
- `RbtSchedule` → `ActiveSchedule`: add a top-level try/catch fallback via the error boundary (no logic change).
- `RbtLearn`: it already stores `err` — render the error state as a `CardFrame` instead of returning `null` on failure, so users see something.
- `RbtSupport` / `SupportHome`: confirm it renders even when there are zero tickets (empty state), not a bare fragment.
- `RbtMe`: same — ensure profile fetch failures show a message, not blank.

No data-model changes; each page's existing hooks stay as-is. The point is to eliminate the "returns null / throws → white screen" paths.

### 5. Sanity check

- `tsgo` typecheck on the touched files.
- Manually walk each tab in the preview at mobile viewport to confirm none are blank and the drawer/bottom-nav only shows RBT items (no Reports).

## Files touched

- `src/lib/os/roleMenus.ts` — rewrite the `rbt:` entry.
- `src/components/layout/AppLayout.tsx` — broaden the RBT-off-app redirect.
- `src/pages/rbt/app/shell.tsx` — add `RbtAppErrorBoundary` wrapping `<Outlet />`.
- `src/pages/rbt/app/RbtAppErrorBoundary.tsx` (new) — small recovery boundary.
- `src/pages/rbt/app/pages.tsx` — friendly error states in `RbtLearn`, `RbtMe`, `RbtSupport`; hardened `.then` in `RbtHome`.

## Explicitly out of scope

- Desktop non-RBT sidebars, other role menus, backend/RLS, notification payloads, and the underlying data hooks' business logic. If a specific tab still shows the recovery card after this pass, we'll then diagnose that page's data hook in a follow-up.
