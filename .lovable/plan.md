## Two small fixes in `src/pages/os/OSShell.tsx`

### 1. Reset scroll to top on every route change (mobile fix)

Right now navigating between pages preserves the previous page's scroll position, so on mobile you land partway down and have to scroll up to see the header/title.

Add a small effect keyed on `pathname` that runs on every route change:
- Scroll the `window` to `(0, 0)` (this is the mobile scroll container).
- Also scroll the desktop main content container (the `md:overflow-y-auto` wrapper at line 971) back to top by giving it a `ref` and setting `scrollTop = 0`.
- Skip the reset when the URL has a `#hash` (anchor links should still work).

This makes every page open at the top on both mobile and desktop.

### 2. Hide the floating escalation chat for RBT and BCBA

`FloatingEscalationChat` is rendered unconditionally at the bottom of `OSShell` (line 1230). RBTs and BCBAs use different escalation paths (RBT app has its own Support tab; BCBAs use the Support Center / notifications workspace).

Change the render to:

```tsx
{role !== "rbt" && role !== "bcba" && <FloatingEscalationChat />}
```

`role` is already destructured from `useOSRole()` in the same component (line 688), so no new imports or hooks are needed. The RBT app shell (`/rbt/app/*`) doesn't render `OSShell`, so this is belt-and-suspenders for any RBT that briefly passes through a shared page, and it fully removes the button for BCBAs everywhere.

### Out of scope

No changes to navigation, layout, page contents, or escalation routing logic — just scroll-on-navigate and one conditional render.
