## Why this is broken right now

Three independent gaps stack into the experience you saw:

1. **The "Assign training" modal in Training Management writes nothing.** `src/components/training/AssignTrainingModal.tsx` is mock-only — trainee/mentor are free-text inputs, "Confirm assignment" just toggles a local `confirmed` state with the comment "Persistence is intentionally pending integration — no fake DB writes". That's why your SD-journey assignment for `cmack@blossomabatherapy.com` never landed in the database.

2. **There is no `academy_tracks` row for "State Director Journey".** The modal lists journeys from the in-code `academyData` mock (e.g. `j-state` State Director Journey). Real persistence lives in `academy_enrollments` keyed by `academy_tracks.id`. Today the only active tracks are `Office Operations Academy`, `HR Admin Assistant`, `Payroll Coordinator` — so even if the modal wrote, the SD journey id has no matching track.

3. **`/blossom/users` ("People & training records") is fully mock.** It renders `blossomUsers` from `src/data/blossomOS` — not a single Supabase call. That's why your assignment doesn't show up there.

There's also a real-data side-issue I'll flag inline: the `Corey Mack` employee row in `employees` has no `user_id` link, so even a correct enrollment wouldn't appear in your own learner view until that login is linked.

## Scope

End-to-end: the Assign Training flow must persist real rows, only target real employees (with department / state / role scoping), and show up correctly in the user-management page. Nothing free-text. Nothing mock.

## Plan

### 1. Rebuild `AssignTrainingModal` against real data (`src/components/training/AssignTrainingModal.tsx`)

Replace the mock fields with a real, persisted form:

- **Training path**: Select sourced from `academy_tracks` (active, non-archived) — not the in-code journey list.
- **Assignment scope** segmented control: `Employee` (default) · `Department` · `State` · `Role`.
  - `Employee`: searchable multi-select picker over `employees` (active only). Same pattern already used in `StaffAssignDialog.tsx` — reuse the list + search + "Already enrolled" badge logic.
  - `Department`: select over distinct `employees.department_id` (joined to `hr_departments` for labels). Expands to all active employees in that department at confirm time.
  - `State`: select over distinct `employees.state`. Expands to active employees in that state.
  - `Role`: select over `ROLE_META` (from `@/lib/roles`), expanded via `user_roles` joined on `employees.user_id`.
- **Mentor**: searchable employee picker (optional) — writes `mentor_employee_id`.
- **Assigned state**: select from US states (optional) — writes `assigned_state`.
- **Path**: `New state` / `Existing state` segmented (defaults `new_state`), writes `academy_enrollments.path`.
- **Start date** (optional): writes `start_date` if the column exists.
- Remove the trainee free-text input entirely. No emails. No mentor free-text.

On confirm:
- Resolve the scope into a unique `employee_id[]` (filter out anyone already enrolled in the chosen track to avoid the unique-violation on `(employee_id, track_id)`).
- Insert into `academy_enrollments` with `{ employee_id, track_id, path, assigned_state, mentor_employee_id, status: "active" }`.
- Surface a real toast: "Assigned N employees to <track>" or the actual Postgres error.
- Show a per-employee inline warning for any selected employee whose `user_id` is null: "Not linked to a Blossom login — assignment is saved but they won't see it until login is linked." This is exactly Corey Mack's situation.

### 2. Seed the State Director Journey track (migration)

There is no SD track today. Add a migration that idempotently inserts an `academy_tracks` row named `State Director Journey` (active) if one doesn't already exist. No schema change — just a guarded `INSERT … WHERE NOT EXISTS`. This is the persistence target the SD-shaped academyData journey maps onto.

### 3. Wire `/blossom/users` ("People & training records") to live data (`src/pages/blossom/Users.tsx`)

Replace `blossomUsers` with live Supabase queries:

- `employees` (active) joined to `user_roles` for role, `hr_departments` for department, `profiles` for email/avatar.
- `academy_enrollments` count per employee → "Tracks".
- `employee_trainings` (assigned vs completed) per employee → "Courses".
- Status logic: `Behind` if any `employee_trainings.status = "overdue"`, `Complete` if all assigned tracks/courses completed, else `In Progress`.
- The detail Sheet's `Assign Track` / `Assign Course` buttons open the new `AssignTrainingModal` and `StaffAssignDialog` respectively, pre-scoped to the selected employee. `View Certificates` and `Course Activity` link to existing pages (`/training/certificates`, `/training/statistics`).

### 4. Audit Training Management action buttons (`src/pages/hr/TrainingManagementCenter.tsx` + `TrainingControlRoom.tsx`)

Walk every CTA in those two surfaces, confirm each lands somewhere real, and replace any remaining stubs with either a working action or a route to an existing screen. Focus areas:
- "Assign training" → opens the rebuilt modal (already wired).
- Per-track "Assign staff" → keeps using `StaffAssignDialog` (already real).
- Any quick-action card whose `to` is `#` or whose `onClick` is a no-op.

### 5. Tests

- `src/test/assignTrainingModalWiring.test.ts`: asserts the modal has no free-text trainee/mentor inputs, has the four scope chips, sources tracks from `academy_tracks`, and inserts into `academy_enrollments` on confirm.
- `src/test/blossomUsersLiveData.test.ts`: asserts `Users.tsx` no longer imports `blossomUsers` mock and reads `employees`, `academy_enrollments`, `employee_trainings`.
- Run the full Vitest suite — must stay green.

### Out of scope (will not touch in this pass)

- `employee_trainings` (course-level) flow on `/hr/training-assign` — that's already real and works; not touching it.
- The Welcome to Blossom page — last pass.
- Auto-linking auth users to employees. I'll surface the "no login linked" warning so admins can act, but the fix for Corey Mack's specific record is a one-line `UPDATE employees SET user_id = '<auth uid>' WHERE id = '0f7e72d1…'` that should be done explicitly (and I'd rather confirm the right auth user before writing it).

## One clarifying question before I implement

Two reasonable ways to handle the missing State Director track — which do you want?

- **A. Seed a new `academy_tracks` row "State Director Journey"** (recommended; matches the in-code journey id) — the SD content stays where it is, and enrollments persist against this new track.
- **B. Reuse the existing "Office Operations Academy" track** as the SD persistence target — fewer rows, but the track name in your DB will not match the journey name learners see in the UI.

If you don't have a preference I'll go with A.
