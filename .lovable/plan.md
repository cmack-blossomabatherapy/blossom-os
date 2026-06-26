## Goal

Add a real multi-hat model so a single staff member can hold multiple roles across multiple states and departments, managed from User Management, and drive Auth/menus/permissions/state filtering off the **active hat** — without breaking the existing `user_roles` path, Login Vault, NFC badges, Training Academy, Resource Library, Reports, BCBA Productivity, or the State Director training journey.

## Where things live today (so we don't reinvent or break it)

- `AuthContext` loads roles from `user_roles` and permissions from `role_permissions`. It does **not** know about state/department scope.
- `OSRoleContext` collapses all `user_roles` into one OS role via `mapAuthRoleToOS` and stores a single `activeState` in localStorage. State Directors are pinned to `profiles.state`.
- `EmployeeProfile.tsx` already renders a `PermissionsTab` (line 1976) and Login Vault / NFC sub-tabs inside User Management. We extend that tab; we do **not** add new pages.
- `OSShell.tsx` already has a Super-Admin "View As Role" preview. The new "Working As" selector for normal multi-hat users sits next to (not inside) it.
- `App.tsx` already redirects `/nfc-badges`, `/hr/nfc-badge-support`, `/admin/login-vault` → `/user-management`. Keep those redirects.

## 1. Database (one migration)

New table `public.employee_role_assignments` with the exact fields from the prompt: `id, employee_id, user_id, role_key, os_role_key, state_code, department_key, scope, is_primary, is_active, starts_at, ends_at, title_override, responsibility_notes, assigned_by, created_at, updated_at`.

Constraints / behavior:
- `scope` CHECK in `('company','state','department','assigned')`.
- `state_code` CHECK in `('GA','NC','VA','TN','MD','NJ')` when not null.
- Partial unique index so at most one `is_primary = true` per `user_id`.
- Unique index on `(user_id, role_key, coalesce(state_code,''), coalesce(department_key,''))` to prevent duplicate hats.
- Standard `updated_at` trigger.
- GRANTs to `authenticated` and `service_role`.
- RLS:
  - `select` your own active rows.
  - `select/insert/update/delete` for `admin`/`super_admin`/`systems_admin` and anyone with the existing `manage_users` permission (via `has_role` / a new security-definer `can_manage_role_assignments(uid)` to avoid recursion).
- Security-definer SQL functions (the helpers the prompt asks for):
  - `get_user_role_assignments(_user_id uuid)`
  - `user_allowed_states(_user_id uuid)`
  - `user_allowed_departments(_user_id uuid, _state_code text)`
  - `user_has_hat(_user_id uuid, _role_key text, _state_code text default null, _department_key text default null)`
  - `can_access_state_department(_user_id uuid, _state_code text, _department_key text)`

Backfill (in the same migration, idempotent):
- For every `(user_id, role)` in `user_roles`, insert a default assignment row keyed on the role with `is_active=true`. The first one becomes `is_primary=true`.
- For users whose `employees`/`profiles` has a `state`, set `state_code` on the new row(s).
- For roles `state_director` / `assistant_state_director`, force `department_key='state_operations'`, `scope='state'`.

After the migration runs and the generated types file refreshes, the rest is wired up.

## 2. Shared types + data layer

New `src/lib/access/roleAssignments.ts`:
- `RoleAssignment` TS type mirroring the DB row.
- `DEPARTMENT_KEYS` and `STATE_CODES` constants (the lists from the prompt).
- `ROLE_GROUPS` — array of `{ group, roles[] }` driving the grouped Role selector (Executive, State Operations, Growth & Marketing, Intake, Recruiting, Staffing, Scheduling, Authorizations, QA, Credentialing/RCM, HR/People, Clinical, Training, Systems).
- `GROWTH_STAGE_PRESETS` — three presets (New/Small, Growing, Mature) that return an array of draft assignments for a given state.
- `loadAssignments(userId | employeeId)`, `upsertAssignment`, `deactivateAssignment`, `setPrimary`, `applyPreset`.
- `mapRoleKeyToOSRole(roleKey)` — single source of truth (replaces the inline switch in `OSRoleContext`).

## 3. AuthContext

Extend `AuthContext` (additive — no removal):
- Load `employee_role_assignments` in parallel with `user_roles`.
- New context fields: `roleAssignments`, `activeAssignments` (is_active), `primaryAssignment`, `allowedStates: string[]`, `allowedDepartmentsByState: Record<state, string[]>`, `hasHat(roleKey, { state?, department? })`, `canAccessStateDepartment(state, department)`.
- Existing `roles` is derived as the **union** of `user_roles.role` ∪ `activeAssignments.role_key`, so legacy users keep working and new assignments instantly grant role access.
- Existing `permissions`, `isAdmin`, `hasPerm`, `ownsClientStage`, `ownsLeadStage` keep their current behavior.
- The visibility/refresh handlers stay; do **not** re-introduce the focus-reload bug fixed earlier.

## 4. OSRoleContext — multi-hat aware

Refactor without breaking single-role users:
- Build a `hats: OSHat[]` array from `activeAssignments` via `mapRoleKeyToOSRole`. Each hat: `{ id, roleKey, osRole, label, stateCode, departmentKey, scope, isPrimary }`.
- New state `activeHatId` persisted in localStorage (`os.activeHatId`). Default = primary hat, else first hat, else fallback to today's `derivedRole`.
- `role`, `scope`, `activeState`, `activeDepartment` are derived from the active hat (or from `derivedRole`/profile when no assignments exist — preserves current behavior).
- Super-Admin behavior unchanged: `View As Role` still wins for super admins; normal users never see it.
- Expose `hats`, `activeHat`, `setActiveHat(id)` in addition to the existing API.

## 5. OSShell

- Add a compact **"Working As"** dropdown in the shell header, only visible when `hats.length > 1` and the user is **not** super admin. It lists "{Role label} — {State}" entries. Selecting one calls `setActiveHat`, which flips menu/state/permissions in place. No app remount.
- Super-Admin "View As Role" stays exactly where it is.
- Menu source becomes `ROLE_MENUS[activeHat.osRole]` (with the existing `STAGED_ROLE_LIVE_PATHS` gating untouched). Single-role users see the same menu they see today.

## 6. User Management — Permissions tab upgrade

Inside `EmployeeProfile.tsx > PermissionsTab` (line 1976), add a top section **"Roles, Hats & State Department Access"**:
- Card list of the employee's assignments showing Role label, State, Department, Scope, Primary badge, Active toggle, dates, notes.
- "Add Hat" + per-card "Edit" / "Deactivate" / "Make Primary" actions.
- New `<HatEditorDialog>` with the grouped Role selector, State, Department, Scope, Primary toggle, Active toggle, Start/End dates, Title override, Responsibility notes.
- New `<GrowthStagePresets>` button group ("New / Small State", "Growing State", "Mature State"). Opens a preview dialog listing the assignments the preset would create for the chosen state, then commits on confirm.
- Login Vault and NFC sub-tabs stay exactly where they are today — no new pages, no moves.

## 7. Page filtering (foundation only)

We do **not** redesign pages this pass. We do:
- Update Intake / Recruiting / Staffing / Scheduling page-level data hooks that already read `useOSRole().activeState` to also respect `activeHat.departmentKey` and `canAccessStateDepartment` so an ASD switching to "Intake — GA" sees only GA intake.
- Authorizations route guard: visible only if `hasHat('authorization_*' | leadership | admin)`.
- Company-scope roles (COO, exec, super admin) keep the existing state selector and are not pinned.

## 8. Compatibility / regression guardrails

- Existing `user_roles` rows continue to drive access if a user has no `employee_role_assignments`.
- Login Vault, NFC Badge Management, Training Academy, Resource Library, Reports, BCBA Productivity Report routes untouched.
- The three legacy redirects in `App.tsx` (`/nfc-badges`, `/hr/nfc-badge-support`, `/admin/login-vault`) stay.
- State Director training journey (`STATE_TRAINING_AND_RESOURCES` in `roleMenus.ts`) untouched.

## 9. Tests

Add `src/test/multiHatAccessModel.test.ts` covering: backfill produces one assignment per legacy role; `mapRoleKeyToOSRole` round-trips; `OSRoleContext` exposes correct `hats` and switches `activeHat`; `hasHat`/`canAccessStateDepartment` return expected booleans for each example (New GA ASD, Virtual Assistant, COO, Super Admin). Run the existing suite + `tsgo` + production build before declaring done.

## Out of scope (explicit)

- Per-page UI redesigns beyond the data-filter touch-ups above.
- Moving Login Vault or NFC out of User Management.
- Removing `user_roles`, `role_permissions`, or any existing role enum.
- Touching the AuthContext focus/refresh behavior.
