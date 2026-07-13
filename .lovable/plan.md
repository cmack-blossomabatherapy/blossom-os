# Fix duplicate Reports + upgrade Company Home calendar

## 1. Remove duplicate "Reports" from every role menu

In `src/lib/os/roleMenus.ts`, "Reports" appears twice for most roles: once inside the role's own section (e.g. Intake → Reports, Marketing → Reports, State → Reports) AND again inside the shared `TRAINING_AND_RESOURCES` / `STATE_TRAINING_AND_RESOURCES` sections that get appended to every menu.

Change: keep Reports ONLY under **Training & Resources** (the shared appended section), and delete the per-role Reports entries.

- Remove every in-section `{ label: "Reports"..., path: "/reports..." }` line across all roles (~30 lines, including the deep-linked variants like `/reports?category=intake`, `/reports?category=state`, etc.).
- Keep the single Reports item in `TRAINING_AND_RESOURCES` (line 62) and `STATE_TRAINING_AND_RESOURCES` (line 76), both routing to `/reports`.
- Leave specialized non-"Reports"-labeled items alone (e.g. "BCBA Productivity Reports" on line 678 stays — it is a distinct labeled shortcut, not the generic Reports entry).
- Super Admin menu is unaffected (it doesn't use the shared appended section).

Result: every non-super-admin role sees exactly one "Reports" link, always under Training & Resources.

## 2. Upgrade `/home` with a real monthly calendar

`src/pages/os/home/CompanyHome.tsx` currently shows only a text list of events. Add a proper visual month calendar as the centerpiece.

Changes to `CompanyHome.tsx`:
- Reorder layout so the **calendar is the hero** below the welcome header. Grid becomes: month calendar on the left (spans wider), a "Selected day / Up next" panel on the right.
- Add a month grid using the existing shadcn `Calendar` component (`@/components/ui/calendar`) in `mode="single"`:
  - Custom `DayContent` (or `modifiers` + `modifiersClassNames`) to show a small dot under any date that has one or more events from `useCompanyHome().events`.
  - Track `selectedDate` state; clicking a day filters the right-hand panel to that day's events.
  - Add prev/next month controls (built in) and a "Today" button that resets `selectedDate` and `month`.
- Right-hand panel:
  - Header: formatted selected date (e.g. "Monday, Jul 13").
  - List of that day's events with time, location, category badge, description.
  - Empty state: "Nothing scheduled." with a soft illustration-free calm card.
  - Below it: a compact "Up next" list (next 5 upcoming events across all months) so users see what's coming even when they land on an empty day.
- Keep Highlights and Company Updates sections below the calendar, unchanged in style.
- Keep the "Manage" button gated by `useCanManageCompanyHome()`.
- Preserve loading skeletons and empty states.

Visual/UX (per Blossom OS design system):
- Rounded-2xl cards, soft borders, generous spacing, muted labels in uppercase tracking-widest.
- Event dot uses `bg-primary`; today ring uses existing calendar styles.
- No hardcoded colors — use semantic tokens.
- Add `pointer-events-auto` on the `Calendar` wrapper (per shadcn-datepicker guidance) for reliability.

No data model changes. No route changes. No changes to `useCompanyHome` — it already returns `events`, `updates`, `highlights`.

## Files touched

- `src/lib/os/roleMenus.ts` — delete per-role Reports items.
- `src/pages/os/home/CompanyHome.tsx` — new calendar-first layout.

## Validation

- Grep confirms only two remaining `label: "Reports"` occurrences (the two shared sections).
- Manual: sign-in as intake role → single Reports link under Training & Resources; `/home` renders month calendar, clicking a day filters events, "Today" resets.
