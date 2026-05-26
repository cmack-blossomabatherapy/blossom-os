# Payroll Role — Full Audit & Wire-Up Plan

13 Payroll pages exist. Goal: every page renders from real Supabase data, every button does something real, one consistent new design, no mock arrays, no legacy placeholders.

## Current state (from DB audit)

Populated: `payroll_adjustments` (12), `payroll_issues` (19), `payroll_benefits` (20), `payroll_deductions` (22), `payroll_communications` (31), `pto_requests` (18), `employee_documents_hr` (56), `employees` (85).

**Empty (pages depend on these):** `payroll_runs`, `payroll_run_items`, `payroll_reminders`, `hours_timesheets`, `hours_timesheet_entries`, `employee_hours_snapshots`, `employee_hr_profiles`, `employee_pay_changes`.

Also: `/payroll/issues` route is still an `OSPlaceholder`.

## Phase 1 — Data foundation
- Seed realistic data into the 8 empty tables (2 recent payroll runs with run items per employee, 2 weeks of timesheets, hours snapshots, HR profiles for all 85 employees, recent pay changes, active reminders).
- Verify FK integrity and that `employees` ids match across all payroll tables.
- Add any missing columns/indexes the pages need.

## Phase 2 — Shared atoms + design audit
- Audit `_PayrollAtoms.tsx` and unify: KPI tile, status pill, drawer shell, empty state, AI prompt card — semantic tokens only.
- Remove any remaining hardcoded colors / mock arrays across all 13 files.
- Standardize page chrome (OSShell header, search, filter row, right rail).

## Phase 3 — Wire each page to real data + working actions
One pass per page. For each: replace mocks with Supabase queries, make every button perform a real insert/update (with toast + optimistic refresh), confirm drawers/detail panels load from DB.

1. `OSPayrollWorkspace` — aggregate counts/KPIs from real tables, quick-action buttons navigate or open drawers.
2. `OSPayrollQueue` — live `payroll_runs` + `payroll_run_items`; approve/hold/flag write to DB.
3. `OSPayrollAdjustments` — `payroll_adjustments`; create/resolve/escalate actions.
4. `OSPayrollTimeAttendance` — `hours_timesheets` + entries; approve/flag/adjust.
5. **`OSPayrollIssues` (NEW)** — replace placeholder; reads `payroll_issues`, resolve/assign/escalate.
6. `OSPayrollProfiles` — `employees` + `employee_hr_profiles` + `employee_pay_changes`; edit pay rate writes back.
7. `OSPayrollPTO` — `pto_requests`; approve/deny/note actions.
8. `OSPayrollBenefits` — `payroll_benefits` + `payroll_deductions`; toggle/edit deductions.
9. `OSPayrollCompliance` — derived from documents + issues; mark-reviewed actions.
10. `OSPayrollTaxDocuments` — `employee_documents_hr`; mark reviewed / request from employee.
11. `OSPayrollMessages` — `payroll_communications` + `payroll_reminders`; send reminder writes real row.
12. `OSPayrollResources` — confirm library wiring already on real resource tables.
13. `OSPayrollTrainingAcademy` — confirm wiring to training tables.
14. `OSPayrollCoordinator` (landing) — real aggregate counts across all of the above.

## Phase 4 — QA pass
- Click every primary button on every page; verify DB row changes and UI refresh.
- Mobile responsive check.
- Remove dead imports / unused mock files.
- Confirm no `bg-white`, `text-black`, `bg-gray-*` etc. in payroll files.

## Technical notes
- One migration in Phase 1 (additive only — new columns + seeds via separate insert calls).
- Mutations use `supabase.from(...).insert/update` then refetch via React Query `invalidateQueries`.
- Keep `_PayrollAtoms.tsx` as the single source of UI primitives.
- No new routes besides replacing the `/payroll/issues` placeholder.

## Deliverable order
I'll do Phase 1 in the next message (migration + seed), confirm with you, then proceed Phase 2 → 3 → 4. Each phase is a discrete, reviewable step.
