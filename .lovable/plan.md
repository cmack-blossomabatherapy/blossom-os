## Goal
Give every table across the Marketing surfaces a consistent, powerful **top-of-table filter bar** — search + full chip row of common facets — with all filter state persisted in the URL so views are shareable and reload-safe.

## Scope (tables to touch)

**Referral CRM** (`src/pages/os/marketing/ReferralCRM.tsx`)
- Contacts — already has view + search + state; add: **owner**, **partner status**, **source type**, **has patients Y/N**, Clear
- Companies — add: **state**, **company type**, **owner**, **partner status**, **active partner Y/N**, search, Clear
- Referrals — already has status + pipeline; add: **state**, **owner**, **source type**, **date range**, search, Clear
- Tasks — currently only groupBy; add: search, **status**, **priority**, **owner**, **state**, **due window** (overdue / today / this week / no date), Clear
- Activities — currently only type chips; add: search, **user**, **date range**, Clear
- Users — no filters today; add: search, **role**, **state**, **status (active/inactive)**, Clear
- Files — has search + type; add: **owner/uploader**, **date range**, Clear
- Audit — has search + action; add: **actor**, **object type**, **date range**, Clear
- Deleted — add: search + **object type** filter, Clear
- Patient Pipeline — has search + status + state; add: **source type**, **owner**, **date range**, Clear

**Other Marketing pages with real tables**
- `Referrals.tsx` — 3 tables (funnel / activity / partners); add search + relevant chip row per table
- `EmailMarketing.tsx` — sequences table; add search + **status**, **owner**, **date range**
- `Reputation.tsx` — 2 tables (reviews / responses); add search + **platform**, **rating**, **status**, **date range**

Pages without tables (Campaigns, LeadSources, CallTracking, WebAnalytics, SEO, AttributionROI, CommunityOutreach, StateGrowth, RecruitingMarketing, MarketingTraining, MarketingDashboard) are out of scope.

## Design (Blossom OS calm/premium)

One shared `<TableFilterBar>` presentation component used everywhere so every table looks and behaves identically.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ [🔍 Search…]  [Status ▾] [Owner ▾] [State ▾] [Type ▾] [Date ▾]   n · Clear  │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Rounded 2xl card, subtle border, soft muted background — matches existing CRM filter rows.
- Left: search input (flex-1, max-w-md, icon inside).
- Middle: chip-style `Select` dropdowns, `h-9`, small text. Each dropdown shows its label + selected value; unset = muted.
- Right: result count + a `Clear` link (only shown when any filter is active).
- Wraps cleanly on narrow widths, sticky-top optional per table.
- Active filters render as small removable pills below the bar when 2+ are set.

## URL persistence

- Each module already scoped by a top-level `m=` param. Each table adds its own short-prefixed params (e.g. Tasks: `ts_q`, `ts_status`, `ts_owner`, `ts_state`, `ts_due`, `ts_pri`).
- Introduce a tiny `useUrlState(key, default)` helper (thin wrapper over `useSearchParams`) so every table filter round-trips through the URL identically.
- Empty / default values are stripped from the URL to keep it clean.
- Reload, deep-link, and share all restore the exact view.

## Technical notes

- Add `src/components/marketing/TableFilterBar.tsx` (presentational) + `src/hooks/useUrlState.ts` (state helper).
- Refactor each table's filter row to use `TableFilterBar`; keep the existing filtering logic but source values from `useUrlState`.
- Reuse existing option sources (`s.users`, `STATES`, canonical status enums, referral source types) — no new data layer.
- No DB migrations, no backend changes, no changes outside `src/pages/os/marketing/**`, `src/components/marketing/**`, and the new hook.
- Preserve current sorting, bulk-select, and drawer click-through behavior on every table.

## Out of scope
- Column show/hide, saved views, per-user default filters, server-side pagination — not requested.
- Non-marketing pages (Intake, HR, etc.) — separate pass.
