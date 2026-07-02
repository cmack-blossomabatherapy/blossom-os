## Goal
Persist sort order and pagination (page number + page size) in URL query params for the Contacts, Companies, and Referrals views inside `src/pages/os/marketing/ReferralCRM.tsx`, so users can bookmark, share, and reload the exact same view they were looking at.

The three modules today already read/write their filters via `useUrlState`, so this plan extends that same pattern to sort and pagination.

## What changes per module

### 1. Shared pagination footer
Add a small `TablePagination` component at `src/components/marketing/TablePagination.tsx` used by all three modules:
- Rows-per-size selector (10 / 25 / 50 / 100)
- Prev / Next buttons and a page indicator like `Page 2 of 7 · 143 rows`
- Auto-clamps the current page when the result set shrinks below the current page start (e.g., after a filter change) and syncs the clamped value back to the URL.

### 2. Contacts module (`ContactsModule`)
- Replace local `useState` sort with URL-persisted state:
  - `csk` → sort key (default `name`)
  - `csd` → sort direction (default `asc`)
- Add URL-persisted pagination:
  - `cpg` → page (default `1`)
  - `cps` → page size (default `25`)
- Slice the sorted rows by `(page-1)*pageSize` for rendering. Reset to page `1` when filters/search change.

### 3. Companies module (`CompaniesModule`)
- Same treatment, with distinct keys to avoid clashes:
  - `osk`, `osd`, `opg`, `ops` (default sort `name` asc, page 1, size 25)

### 4. Referrals module (`ReferralsModule`)
- Currently uses a fixed `referralDate desc` sort. Add sortable table headers using the existing `SortTh` component with these keys: Patient (`name`), Company (`company`), State (`state`), Service (`service`), Status (`status`), Intake owner (`owner`), Referral date (`date`, default), Pipeline stage (`pipeline`).
- URL-persisted sort: `rsk` (default `date`), `rsd` (default `desc`).
- URL-persisted pagination: `rpg` (page, default `1`), `rps` (page size, default `25`).

## URL param key summary
| Module    | Sort key | Sort dir | Page | Page size |
|-----------|----------|----------|------|-----------|
| Contacts  | `csk`    | `csd`    | `cpg` | `cps`    |
| Companies | `osk`    | `osd`    | `opg` | `ops`    |
| Referrals | `rsk`    | `rsd`    | `rpg` | `rps`    |

All keys are stripped from the URL when they equal their defaults (existing `useUrlState` behavior), so a clean view produces a clean URL.

## Behavior details
- Changing any filter, the search query, or the page size resets `page` back to `1`.
- Changing sort does NOT reset the page (users often want to keep their position while re-sorting the whole set).
- Page size selector persists across navigation to the same module because it lives in the URL.
- Bulk-select checkboxes stay scoped to the currently visible page; a small helper text notes when there are additional matching rows on other pages.

## Files touched
- `src/components/marketing/TablePagination.tsx` — new shared component.
- `src/pages/os/marketing/ReferralCRM.tsx` — wire `useUrlState` sort + pagination into `ContactsModule`, `CompaniesModule`, and `ReferralsModule`; add sortable headers to the Referrals table; render `TablePagination` under each table.

## Out of scope
- No schema, hook, or backend changes.
- Other tables (Tasks, Files, Audit, Activities, Patient Pipeline, Users, Deleted) are not part of this pass.
- The standalone `src/pages/os/marketing/Referrals.tsx` page is a separate surface and not included unless you want it too.
