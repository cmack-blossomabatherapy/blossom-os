## Goal
The new `/os` is the only product. The old multi-dashboard app retires. Nothing important is lost — BCBA Performance moves into Reports, Training Tracks move into Training Academy, and all onboarding / training / employee data is preserved (employees are wiped but their schema/history tables stay so we can re-import cleanly).

## 1. Make `/os` the home

- `/` now redirects to `/os` for every authenticated user. `WelcomeHome`, `Dashboard`, `RoleDashboardRedirect`, and all role-specific dashboard routes (`/leadership-dashboard`, `/intake-dashboard`, `/authorizations-dashboard`, `/scheduling-dashboard`, `/staffing-dashboard`, `/clinic-dashboard`, `/qa-dashboard`, `/finance-dashboard`, `/recruiting-dashboard`, `/bcba-performance-dashboard/*`, `/ceo-dashboard-v2/*`) become permanent redirects into `/os` (mostly `/os/state-director` or `/os/reports/bcba-performance`).
- The legacy `AppLayout` sidebar is no longer shown at `/`. The old pages stay on disk but only as deep-link redirects (no nav entry). This keeps imports stable while removing them from the user experience.
- `/os` itself routes to the role-correct landing page using `OSRoleContext`. For the State Director test user that means `/os/state-director`.

## 2. State Director OS — keep simple

Already rebuilt around Hours vs Active Clients. No layout change in this pass. We just confirm it is the landing for `state_director` role and ensure the OS shell hides any module the role does not need (Marketing, Enterprise, Intelligence, legacy HR admin tools, etc.) — those routes still exist but are filtered out of the OS sidebar for this role.

## 3. BCBA Performance → Reports

- Move the existing `CeoDashboardV2` experience under `/os/reports/bcba-performance` and add a card for it on `/os/reports` (ReportsHome).
- `/bcba-performance-dashboard` and the `/ceo-dashboard-v2` aliases redirect into the new path so links keep working.
- No data changes — it reads the same `bcba_billable_sessions` table the State Director hero already uses.

## 4. Training Tracks → Training Academy

- Surface all existing tracks (currently shown in `/blossom/academy`, `TrackDetail`, `TrainingDepartment`, `TrainingCatalog`, `AcademyHome`, `AcademyEditor`) under one entry point `/os/training`.
- `/os/training` becomes a real page (not "coming soon") that lists Tracks, Departments, and Catalog tabs and reuses the existing `OperationsAcademy`, `TrackDetail`, and `TrainingDepartment` components inside the OS shell. No DB changes — track tables, assignments, completions stay intact.
- Old `/training/*`, `/blossom/academy/*`, `/hr/training*` URLs redirect into `/os/training/...` equivalents.

## 5. Onboarding & training data — preserve

- Do not drop any tables. Onboarding progress, journey overrides, academy completions, track assignments, course progress, and all related history remain untouched.
- Only the *employee roster* gets cleared (see next section). Historical rows that reference deleted employees are kept; we just won't display them until employees are re-imported with matching IDs.

## 6. Employee reset + User Management in OS

- New table is not needed; we wipe `public.employees` and any dependent staging tables we own (e.g. `employee_directory_overrides` if present). Auth users are NOT touched here except for creating the test State Director.
- `/os/user-management` becomes a real, minimal page: a single table of users with columns Name / Email / Role / State / Status, plus an "Invite user" button and a row action to change role. That is the entire screen.
- We remove the older `/blossom/users` from nav and redirect it to `/os/user-management`.

## 7. Test State Director login

- Create auth user `teststatedirector@blossomabatherapy.com` / `Blossom@123`, email auto-confirmed (test seed only).
- Insert a matching row in `profiles` and grant `state_director` in `user_roles` scoped to North Carolina (the state we've been using for the demo).
- On login this user lands on `/os/state-director` automatically.

---

## Technical notes

### Routing (`src/App.tsx`)
- Replace `<Route path="/" element={<WelcomeHome />} />` with `<Route path="/" element={<Navigate to="/os" replace />} />`.
- Wrap every legacy dashboard route in a small `<Navigate>` (preserve query string) pointing into `/os`.
- Add real routes:
  - `/os/reports/bcba-performance` → `CeoDashboardV2` rendered inside `OSShell`.
  - `/os/training`, `/os/training/tracks/:trackId`, `/os/training/department/:slug`, `/os/training/catalog` → reuse existing components inside `OSShell`.
  - `/os/user-management` → new lightweight `OSUserManagement.tsx`.
- Keep file imports for legacy pages so redirects compile; mark them for later deletion.

### OS shell / nav
- `OSShell` sidebar already has placeholders for Reports, Training Academy, User Management — switch their hrefs to the real routes and remove the "coming soon" badge.
- Filter sidebar items by role using `OSRoleContext`. For `state_director` show: Command Center (State Director), Reports, Training Academy, User Management, Settings.

### Data migrations (one approval batch)
1. `delete from public.employees;` (and any owned staging tables); leave history intact.
2. Insert auth user via Supabase admin (handled in migration with `auth.users` + `auth.identities` seed pattern already used in this project), then insert profile + `user_roles` row.
3. No schema changes.

### Out of scope
- No changes to the State Director hero chart itself.
- No PHI surfacing — `redactClient` stays in place.
- No edits to `bcba_billable_sessions` shape; just consumed by both /os/state-director and /os/reports/bcba-performance.
- Old `AppLayout`, `Dashboard.tsx`, `WelcomeHome.tsx`, and legacy dashboard files stay on disk this pass; we'll garbage-collect after a release of /os.
