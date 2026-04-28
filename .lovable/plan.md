Plan: make all HR Suite data real, including Training Admin, and migrate existing local/mock training content where possible.

## Phase 1 — Audit and stabilize the HR data layer
- Create a shared HR data/service layer for reads and writes instead of each HR page hand-building queries.
- Standardize employee joins with departments, managers/relationships, onboarding, documents, trainings, reviews, time clock, payroll, cases, notes, and timeline.
- Remove the HR Dashboard dependency on `src/data/hrDashboard.ts` and map the existing backend tables into the dashboard’s KPI/action-queue shape.
- Fix the broken default employee side panel by starting HR Dashboard with no selected employee.

## Phase 2 — Convert the main HR Dashboard to backend records
- Load employees from `employees` and `hr_departments`.
- Load related HR records from:
  - `employee_onboarding` and `employee_onboarding_tasks`
  - `employee_documents_hr`
  - `employee_trainings` and `training_courses`
  - `employee_reviews`
  - `time_clock_punches`, `attendance_exceptions`, `hours_timesheets`
  - `payroll_runs`, `payroll_run_items`, `employee_bonuses`, `employee_pay_changes`
  - `employee_cases`, `employee_notes`, `employee_timeline`
- Recalculate dashboard statuses from real records, not canned labels.
- Make dashboard actions persist to the backend instead of only changing local React state.

## Phase 3 — Convert Training Admin/localStorage to real backend tables
- Replace localStorage-backed Training Admin data with backend-backed data.
- Map current Training Admin courses into `training_courses` where the existing schema supports it.
- Map assignments into `employee_trainings` linked to real employees.
- Preserve email assignment behavior using the existing training email function.
- For training fields that do not currently exist in the backend schema, add small schema extensions only where needed, such as metadata JSON for lessons/resources/version history/audit/badges if required.

## Phase 4 — Migrate existing local/mock training content safely
- Add a one-time client-side migration guard that detects local Training Admin content and offers/imports it into backend records without duplicating existing courses.
- Match employees by email/name when importing assignments; skip unmatched assignment rows with a clear warning.
- After successful migration, stop reading localStorage as a data source.

## Phase 5 — Verify every HR Suite page is backend-backed
- Confirm these pages only use backend data or derived values from backend data:
  - HR Dashboard
  - Employee Directory
  - Employee Profile tabs
  - Org Chart
  - Onboarding Center
  - Reviews
  - Training & Compliance
  - Training Admin
  - Time Clock / Hours
  - Payroll
  - Resource Hub
  - Announcements
  - HR Reports
  - HR Settings
- Remove or isolate demo files so they are no longer imported by HR Suite screens.

## Technical notes
- No backend data will be made public. Existing HR RLS policies remain permission-based.
- Any schema changes will be minimal and only for missing Training Admin persistence fields.
- Sensitive fields like pay rate, notes, documents, and payroll remain behind existing HR/payroll permissions.
- The implementation will be phased so each screen keeps working while mock/static dependencies are removed.