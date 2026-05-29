## Problem

On the user-management profile (`/user-management/:employeeId`):

1. **Smart Badge readiness** shows Corey Mack with missing email/phone (DB confirmed: phone is `null`).
2. Clicking the "Fix" button next to those readiness items calls `openHr()` which navigates to `/hr/directory/${uuid}` — a route that does not exist (it should be `/hr/employees/:id`), producing a 404.
3. The **Employment tab** itself renders Email and Phone as read-only `FieldWithSource` cells with no way to update them.

## Fix

### 1. Make Email and Phone editable in the Employment tab
File: `src/pages/os/users/EmployeeProfile.tsx` (`EmploymentTab`)

- Replace the read-only Email and Phone `FieldWithSource` cells with small inline editors (label + input + Save). Local state seeded from `m.email` / `m.phone` / the loaded `employees` row.
- On Save, `supabase.from("employees").update({ email, phone }).eq("id", m.uuid)`, toast success, and refresh the directory hook so the readiness checklist re-evaluates.
- Add `id="employment-email"` / `id="employment-phone"` anchors on those fields for deep-scroll.

### 2. Fix the broken Smart Badge "Fix" links
Same file, `NfcTab` → readiness items.

- Replace `openHr` (which goes to the dead `/hr/directory/:uuid` route) with a `jumpToEmployment(field)` helper that:
  - Calls the parent `setTab("employment")`.
  - After tab mount, scrolls to `#employment-email` or `#employment-phone` and focuses the input.
- Apply to: Work email, Work phone, Job title, Department, States served, Credential, Pronouns rows.
- For fields that live on the HR record but aren't yet on this page (credential/pronouns), keep them pointing at the Employment tab for now — at minimum they must not 404.

### 3. Verify
- Reload `/user-management/{coreyUuid}` → Employment tab → enter phone → Save → Smart Badge readiness for "Work phone" flips to green automatically.
- Click any readiness "Fix" → lands on Employment tab with the right field focused, no 404.

No DB migration needed (email/phone columns already exist on `employees`).