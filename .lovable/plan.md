# Keep existing staff, prepare for Viventium sync

## What's already true (no work needed)
- All current office staff live in the `employees` table and surface through the `v_employee_directory` view.
- The new User Management module (`/user-management` + `/user-management/:employeeId`) reads from `useEmployeeDirectory`, which queries that same view in realtime.
- That means **every employee you've already entered is automatically visible** in the new directory, profile tabs, and NFC public page. Nothing migrates, nothing is dropped.

## What I'll add so Viventium can append cleanly later

1. **Confirm the Viventium-ready fields exist on `employees`**
   - `viventium_employee_id` (text, unique, nullable)
   - `viventium_last_synced_at` (timestamptz, nullable)
   - `viventium_sync_source` (text: `manual` | `viventium`, default `manual`)
   - Add any missing columns via migration; existing rows stay intact.

2. **Surface "source of truth" badge in the Employment tab**
   - Each field (hire date, job title, department, status, pay group, etc.) shows a small badge: `Manual` or `Viventium`.
   - Until Viventium is connected, everything reads `Manual`. After sync, Viventium-owned fields flip to `Viventium` and become read-only in the UI.

3. **Define the append/merge rule (documented, not enforced yet)**
   - Match key: `viventium_employee_id` first, then `email` (case-insensitive), then `first_name + last_name + hire_date` fallback.
   - On match: Viventium fields **append/overwrite** payroll-owned fields only (employment status, hire date, job title, department, pay group, employee #). Manual-only fields (photo, bio, NFC code, permissions, training, evaluations, devices, logins) are **never touched**.
   - On no match: create a new `employees` row sourced from Viventium.
   - No deletes — Viventium terminations only flip `status` to `Inactive`.

4. **Tiny UI affordances now**
   - "Add Employee" button on `/user-management` for manual entry before Viventium is live.
   - Empty-state hint on Employment tab: "Payroll details will populate automatically once Viventium is connected."

## Out of scope for this pass
- Building the actual Viventium edge function / OAuth (separate task once credentials are ready).
- Changing Training, Evaluations, Devices, Logins, NFC, Permissions, or Activity tabs.
- Touching `v_employee_directory` shape.

## Files touched
- `supabase/migrations/<new>.sql` — add the 3 Viventium columns if missing.
- `src/pages/os/users/EmployeeProfile.tsx` — Employment tab source badges + empty-state hint.
- `src/pages/os/users/UsersHome.tsx` — "Add Employee" entry point (opens existing employee create flow).

## Technical notes
- No data migration script needed; existing rows already conform.
- `useEmployeeDirectory` and the view need no changes — new columns are additive.
- When Viventium is wired up later, the edge function will use the match rules above and write through `service_role` so RLS stays strict for the app.
