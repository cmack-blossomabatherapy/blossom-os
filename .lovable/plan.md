# Device Inventory + NFC Button Cleanup

## 1. Remove "Generate NFC" button
In `src/pages/os/users/EmployeeProfile.tsx` (~line 1914), remove only the quick-action "Generate NFC" button in the profile header. The NFC tab and its generation flow inside the profile stay intact.

## 2. New Device Inventory page
Create `src/pages/admin/DeviceInventory.tsx`:
- Reads/writes the existing `device_inventory` table via Supabase
- Joins `employee_devices` to show current assignee per device
- KPI tiles: Total / Assigned / Available / Retired
- Searchable + filterable table (status, type, location)
- Actions: Add device, Edit, Assign to employee, Unassign, Retire, Delete
- Apple-style calm UI, semantic tokens only

## 3. Role-gated route
In `src/App.tsx`, add `/admin/device-inventory` gated to `super_admin` and `hr_team` only.

## 4. Sidebar navigation
In `src/pages/os/OSShell.tsx`, add a "Device Inventory" entry (icon: `MonitorSmartphone`) under **HR Operations** in:
- `NAV_SECTIONS` (super_admin view)
- `HR_TEAM_SECTIONS` (hr_team view)

Hidden from all other roles.

## 5. Connect it all
- **Assign Device button** in user management (`DevicesTab`) → already writes to `device_inventory` + `employee_devices`; verify the dialog pulls from the same `device_inventory` rows the new page manages (single source of truth)
- **Devices tab** in user profile → already reads `employee_devices` joined to `device_inventory`; any add/retire on the new page immediately reflects there
- New page's "Assign" action reuses the same assignment write path as the user-management Assign Device button

## Out of scope
- No schema changes (tables already exist)
- No changes to the NFC tab itself or NFC generation logic
- No changes to the Assign Device dialog's UX beyond pointing at the shared inventory source

## Technical notes
- Module key for navigation gating: `user_management` (or add `device_inventory` if you'd prefer a dedicated key — let me know)
- All inventory mutations go through Supabase client with RLS; HR Team + Super Admin policies on `device_inventory` should already allow full CRUD — will verify and flag if a migration is needed
