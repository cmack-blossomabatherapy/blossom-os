## Goal
Ensure the desktop header bell behaves identically to the mobile bell with respect to the user's notification category preferences (Tasks / Approvals / Overdue / Compliance).

## Current state
- `AlertsPanel` (used in `TopBar` for both desktop and mobile) already consumes `useMobileAlerts`, which filters `active` by `useAlertCategoryPrefs().isEnabled(category)`.
- The total badge on the bell and the grouped section list therefore already drop disabled categories.
- Gaps:
  1. `counts` in `useMobileAlerts` is missing a `compliance` field — any UI surface that reads `counts.compliance` silently shows nothing.
  2. The "You're all caught up" empty state shows whenever `counts.total === 0`, even if the user has disabled every category. That's misleading — they're not caught up, they've muted everything.
  3. There's no quick visual cue in the popover header that filters are active; the gear is there but easy to miss.

## Changes

### 1. `src/hooks/useMobileAlerts.ts`
- Add `compliance: active.filter(a => a.category === "compliance").length` to the `counts` memo so all four categories are exposed.
- Also expose `mutedCategories: AlertCategory[]` (derived from `useAlertCategoryPrefs`) so the panel can render a hint.

### 2. `src/components/alerts/AlertsPanel.tsx`
- Read `mutedCategories` from the hook.
- In the popover header, when `mutedCategories.length > 0`, show a subtle muted chip next to "Notifications": `"{n} muted"` with a tooltip listing the disabled categories. Clicking it routes to `/notification-preferences` (same as the gear).
- Update the empty state:
  - If `counts.total === 0 && mutedCategories.length === 0` → existing "You're all caught up" copy.
  - If `counts.total === 0 && mutedCategories.length > 0` → "Nothing to show — {n} categories are muted" with an inline "Manage preferences" link.
- Keep the existing gear button and grouped sections as-is.

### 3. `src/lib/alerts/categoryPrefs.ts` (verify only)
- Confirm `useAlertCategoryPrefs` already exposes the per-category enabled map and persists across sessions; no change expected. Will only touch if the muted-list derivation needs a small helper.

## Out of scope
- Mobile bell layout (already done in the previous turn).
- Adding new category types or per-source toggles.
- Touching backend / RLS / migrations — purely frontend presentation.

## Verification
- With all categories enabled: bell badge and sections unchanged.
- Disable "Compliance" in `/notification-preferences`: compliance items disappear from the desktop popover, total count drops, and a "1 muted" chip appears in the header.
- Disable all four: empty state shows the muted-aware copy with a link to preferences.
