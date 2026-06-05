# Blossom OS — Department Access Model (RBAC Pass 1)

This document describes the department-based RBAC foundation introduced in
`src/lib/rbac.ts`. It is the source of truth for how AppRoles map to
departments, layers, role levels, scopes, and permission bundles.

Existing per-feature gates (`PermissionRoute`, `AdminRoute`,
`navigationAccess.canAccessRouteForRoles`) are still authoritative for routes
today. RBAC helpers complement them and will progressively take over.

---

## 1. Department layers

| Layer | Departments |
|---|---|
| `company_control` | Executive Leadership, Operations Leadership, Reports & Analytics, Super Admin |
| `client_acquisition` | Marketing, Intake & Leads, Benefits / VOB / EOB, Payment Plans |
| `client_care_lifecycle` | Clients / Case Management, Authorizations, Progress Reports / Reauth, Scheduling, Staffing, Clinical, QA & Compliance |
| `people_operations` | HR, Recruiting, Training & Clinical Support, Payroll |
| `geographic_operations` | State Leadership, State Operations, Georgia Clinic Operations |
| `business_systems` | Finance, Billing / Revenue Cycle, Systems / Software / IT, Integrations / External Systems, Compliance / Legal / Credentialing |

## 2. Role levels

Ordered low → high:

`staff` < `lead` < `manager` < `director` < `executive` < `super_admin`

Manager-and-above automatically inherit:

- `view_department_workspace`
- `view_department_reports`
- `view_team_pipeline`
- `view_team_tasks`
- `manage_department_team`

Executive-and-above additionally inherit:

- `view_company_reports`
- `view_state_dashboards`

## 3. Scopes

`self` < `team` < `department` < `state` < `company`

- **self** — sees only their own records (RBT, trainee).
- **team** — sees their team / caseload (BCBA, clinic staff).
- **department** — sees the full department workspace.
- **state** — sees everything within their assigned state (State Director).
- **company** — sees everything (admin, exec, ops_manager).

## 4. Permission categories

| Permission | Purpose |
|---|---|
| `view_department_workspace` | Render the dept's primary workspace pages |
| `view_department_reports` | Department-scoped reports/scorecards |
| `manage_department_team` | Manage team members / assignments inside dept |
| `view_team_pipeline` | Pipeline/queue across the team |
| `view_team_tasks` | Aggregate tasks across the team |
| `view_state_dashboards` | State-level operational dashboards |
| `manage_state_operations` | Take operational action across a state |
| `view_company_reports` | Cross-company reports |
| `manage_company_settings` | Tenant-wide settings |
| `manage_permissions` | Edit roles + grants |
| `manage_integrations` | External system credentials/config |
| `view_payroll` / `manage_payroll` | Payroll access |
| `view_phi` | PHI-bearing surfaces |
| `manage_workflows` / `manage_automations` | Workflow + automation editing |

## 5. AppRole mapping (Pass 1)

| AppRole | Department | Level | Scope |
|---|---|---|---|
| `admin` | Super Admin | super_admin | company |
| `exec` | Executive Leadership | executive | company |
| `ops_manager` | Operations Leadership | director | company |
| `state_director` | State Leadership (+ state operations, intake, auth, sched, staffing, clients, recruiting) | director | state |
| `clinic_director` | Georgia Clinic Operations | director | team |
| `dept_manager` | Operations Leadership | manager | department |
| `intake` | Intake & Leads | staff | department |
| `auth_team` | Authorizations | staff | department |
| `qa` | QA & Compliance | staff | department |
| `scheduling` | Scheduling (+ Staffing) | staff | department |
| `staffing` | Staffing (+ Scheduling) | staff | department |
| `clinic` | Georgia Clinic Operations | staff | team |
| `finance` | Finance (+ VOB, Payment Plans, Billing) | manager | department |
| `payroll_admin` | Payroll | manager | department |
| `hr` | HR (+ Recruiting, Training) | staff | department |
| `hr_admin` | HR (+ Recruiting, Training) | director | department |
| `hr_manager` | HR (+ Recruiting, Training) | manager | department |
| `hr_admin_assistant` | HR | staff | self |
| `recruiting_assistant` | Recruiting | staff | department |
| `training_admin` | Training & Clinical Support | manager | department |
| `marketing` | Marketing | staff | department |
| `phone_support` | Intake & Leads | staff | team |
| `bcba` | Clinical (+ Training) | lead | team |
| `behavioral_support` | Clinical (+ Training) | lead | team |
| `rbt` | Clinical | staff | self |
| `staff` | HR | staff | self |
| `viewer` | Reports & Analytics | staff | self |

## 6. Example: staff vs manager vs director vs executive

### Recruiting

- **Staff (`recruiting_assistant`)** — sees the recruiting workspace only.
- **Manager (`hr_manager`)** — workspace + recruiting reports, team pipeline,
  candidate aging, team tasks.
- **Director (`hr_admin`)** — manager bundle + can manage department team.

### HR

- **Staff (`hr`)** — HR workspace, recruiting-adjacent onboarding, phone.
- **Manager (`hr_manager`)** — HR reports, evaluations, onboarding, compliance.
- **Director (`hr_admin`)** — same as manager plus team management.

### State Leadership

- **State Director** — state-scoped intake, authorizations, staffing,
  scheduling, clients, and recruiting dashboards for their assigned state.
  No cross-state access.

### Executive

- **Exec** — read-only across everything plus all reports / state dashboards.

## 7. Helpers (`src/lib/rbac.ts`)

- `getUserAccessProfile({ roles, state? })`
- `hasDepartmentAccess(profile, department)`
- `hasDepartmentGroupAccess(profile, layer)`
- `hasPermission(profile, permission)`
- `hasManagerAccess(profile)`
- `hasStateScope(profile, state)`
- `canAccessRoute(profile, path)` — returns `false` only when the path maps
  to a known department the profile cannot see. For unmapped paths it
  returns `true`, and callers should keep deferring to
  `navigationAccess.canAccessRouteForRoles` for backward compatibility.

## 8. Unresolved product decisions

- **Clinic operations for non-GA states** — `clinic` / `clinic_director` are
  currently mapped to `georgia_clinic_operations`. When other states add
  clinics this needs a generic `clinic_operations` department or per-state
  variants.
- **Billing vs Finance vs Payroll boundaries** — `finance` today spans
  Finance, VOB, Payment Plans, and Billing. May need a dedicated
  `billing_team` role before Pass 2.
- **Marketing scope** — currently `department`, but marketing data is
  effectively company-wide reporting. Revisit when marketing dashboards
  ship.
- **Compliance / Legal / Credentialing** — no AppRole maps here yet. Needs
  a `credentialing` or `compliance_officer` role.
- **Integrations / External Systems** — admin-only at the route level today;
  a dedicated `integrations_admin` role may be warranted.
- **`behavioral_support`** — placed in Clinical (lead) with training access;
  product should confirm whether they need any reporting beyond that.

## 9. Pass 1 scope (what changed, what didn't)

- **Added:** `src/lib/rbac.ts`, `src/lib/rbac.test.ts`, this doc.
- **Unchanged:** route declarations, `navigationAccess.ts` behavior, all
  `PermissionRoute` / `AdminRoute` gates, sidebar configs, placeholder route
  visibility. Pass 2 will start migrating gates to consult the RBAC profile.

---

## 10. Pass 2 Integration Notes

**Now enforced by RBAC** (via `navigationAccess.canAccessRouteForRoles`):

- Admin-only paths (`/admin`, `/integrations`, `/permissions`) are denied
  for any role whose RBAC profile lacks them, in addition to the existing
  legacy logic. `admin` role bypasses, and `/admin/training-*` is excluded
  so existing training-admin allowances keep working.
- `/payroll` and `/hr/payroll` consult the RBAC profile: roles with the
  `view_payroll` permission (`payroll_admin`, `admin`) are explicitly
  granted; everyone else is denied. Previously only full-nav `admin` could
  reach payroll through navigation gates.

**Still legacy / compatibility (unchanged in Pass 2):**

- Full-navigation roles (`admin`, `exec`, `ops_manager`) continue to use
  `hasFullNavigationAccess` for every non-sensitive path.
- Sidebar visibility (`getSidebarPreviewForRoles`) still uses the per-role
  exception map (`roleNavigationExceptions`) — not the RBAC profile.
- `PermissionRoute` and `AdminRoute` still consult
  `useAuth().hasPerm` / `isAdmin` directly. A TODO note in
  `PermissionRoute.tsx` records why migration is deferred (per-route
  permission mapping is not yet exhaustive).
- Per-feature permission strings (e.g. `clients.view`) remain the
  authoritative gate for in-page actions.

**Migrate later (Pass 3+):**

1. Move `getSidebarPreviewForRoles` to derive section/item visibility from
   the RBAC profile (`departments`, `permissions`) instead of the static
   `roleNavigationExceptions` map.
2. Replace `PermissionRoute`'s `allowedRoles` checks with
   `hasDepartmentAccess` / `hasPermission` once every route is mapped in
   `PATH_TO_DEPARTMENT`.
3. Fold `TRAINING_ADMIN_ROLES`, `ANALYTICS_ROLES`, `COURSE_AUTHOR_ROLES`,
   `AUTOMATIONS_ROLES` into RBAC permissions
   (`manage_workflows`, `view_company_reports`, etc.).
4. Thread the authenticated user's `state` through `getUserAccessProfile`
   so State Director scoping actually filters state-bound dashboards.