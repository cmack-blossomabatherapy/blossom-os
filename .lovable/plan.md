# Monday.com Excel Import — Implementation Plan

## What's already uploaded in `data-uploads/`
| File | Sheet | Rows | Cols | Groups (kanban) |
|---|---|---|---|---|
| `monday_leads` | leads | 6,025 | 99 | New Lead, Attempt #1–4, etc. |
| `monday_clients` | clients | 6,664 | 124 | BCBA Assignment, Pending Initial Auth, … |
| `monday_no_oon_benefits` | no oon benefits | 115 | 119 | Working on SCA, … |
| `monday_authorizations` | authorizations | 2,808 | 45 | Awaiting Submission, In QA Review, Submitted, Approved, Expiring, … |
| `monday_auth_approvals` | approved auths | 1,232 | 22 | Pending IA, Pending Initial Treatment, Pending Concurrent, … |
| `monday_denials` | denials | 172 | 20 | IA Denials, Treatment Denials, … |
| `cred_va` | va insurance credentialing | 374 | 8 | (credentialing groups) |

Monday export shape: row 0 = board name, row 1 = first group name, row 2 = header, then data rows with new group-name rows interspersed and "Subitems" sub-headers in between.

## Phase 1 — Database (one migration)

Create one raw table per board, all columns preserved, plus `monday_group` (kanban column) and `monday_item_id` for upsert. RLS: `state_director` reads only their state; admin/exec/ops read all.

- `monday_leads_raw` — 95 data cols + `monday_group`, `state`, `monday_item_id`
- `monday_clients_raw` — 120 data cols + `monday_group`, `state`, `monday_item_id`
- `monday_no_oon_raw`
- `monday_authorizations_raw`
- `monday_auth_approvals_raw`
- `monday_denials_raw`
- `va_credentialing_raw`
- `monday_subitems_raw` (polymorphic: `parent_board`, `parent_item_id`, `name`, `owner`, `status`, `due_date`)
- `monday_updates_raw` (polymorphic: `parent_board`, `parent_item_name`, `author`, `posted_at`, `body`)
- `monday_import_runs` (audit: file path, board, rows_inserted, rows_updated, errors, started_by, started_at)

Unique key for upsert: `(monday_item_id)` where present, fallback `(name, state, payor)`.

## Phase 2 — Edge function `parse-monday-export`

Input: `{ board: 'leads'|'clients'|..., storage_path: 'monday_leads/xxx.xlsx' }`

Logic:
1. Download from `data-uploads` bucket via service role.
2. Use `npm:exceljs` (Deno-compatible) to stream sheet.
3. Walk rows: detect group-name rows (single non-empty cell, value not in header), detect header rows ("Name" in col 0), data rows otherwise.
4. Carry current `monday_group` into each data row.
5. Parse "Subitems" blocks → `monday_subitems_raw`.
6. Parse "updates" sheet → `monday_updates_raw`.
7. Upsert by `monday_item_id` (always last column on most boards).
8. Write `monday_import_runs` summary; return counts.

Batch inserts in chunks of 500.

## Phase 3 — Admin upload page

Route: `/os/admin/imports` (super_admin only).
- Lists rows in `data-uploads` grouped by board folder.
- "Parse" button per file → invokes edge function, shows progress + summary.
- Shows `monday_import_runs` history table.
- Drag-drop a new .xlsx → uploads to correct folder then parses.

## Phase 4 — Backfill the 7 already-uploaded files

Run the edge function once per file via curl/invoke from a script.

## Phase 5 — Wire existing pages to raw tables (read-only first)

- `OSLeads` / pipeline kanban → group by `monday_leads_raw.monday_group`, state-scoped.
- `OSClients` → `monday_clients_raw` joined with `bcba_billable_sessions` aggregates.
- `OSAuthorizations` → `monday_authorizations_raw` + `_auth_approvals_raw` + `_denials_raw` (tabbed).
- `OSCredentialing` (VA) → `va_credentialing_raw`.

Each page filters by `useOSRole().activeState` for non-super-admins. **No mock writes anywhere** — replace mock imports module-by-module.

## Technical notes

- Use `security_invoker=on` for any views.
- `monday_group` becomes the kanban swimlane key — preserved 1:1.
- "No Insurance Selected" / "No State Selected" / "No Gender" normalized to `NULL`.
- Date strings like `"2026-05-12 00:00:00"` → `timestamptz`.
- Subitems and Updates kept polymorphic to avoid 7× duplicate tables.
- Phases 1–4 land this turn. Phase 5 (UI wiring) is a follow-up because each module is its own surface.

## Out of scope (this turn)
- Replacing mock data in Recruiting / Phone Calls / Training / Marketing — no source data uploaded.
- Real-time sync to Monday — uploads remain manual exports for now.
