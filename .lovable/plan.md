## Why the button is missing

The "Copy invite link" button was added to the **admin roster page** at `/user-management/admin` (`src/pages/os/OSUserManagement.tsx`), not to the **per-user details page** at `/user-management/:employeeId` (`src/pages/os/users/EmployeeProfile.tsx`).

On the user details page today, the header only has:
- Edit
- Assign training
- **Invite to Blossom OS** (sends a magic-link email via `admin-employee-magic-link`)
- Assign device

There's no button that generates a shareable temp-password + sign-in link with copy rows. That's what's missing.

## Plan — add "Copy invite link" to the user details page

Surface the same invite-link flow that already works on the admin tab, scoped to the currently viewed employee. No new edge functions or DB changes — `admin-create-invite-link` already exists and is used by `OSUserManagement.tsx`.

### Changes

1. **`src/pages/os/users/EmployeeProfile.tsx`**
   - Add state: `creatingLink`, `inviteLink ({ loginUrl, tempPassword, email })`.
   - Add `createInviteLink()` that calls `supabase.functions.invoke("admin-create-invite-link", { body: { email: member.email } })`, mirroring the implementation in `OSUserManagement.tsx`. Toast on error, set `inviteLink` on success.
   - Add a header button next to "Invite to Blossom OS":
     - Label: **Copy invite link**
     - Icon: `Link2`
     - Disabled when no email, no uuid, or while creating.
   - When `inviteLink` is set, render a result panel below the header card with:
     - Sign-in link (copy)
     - Email (copy)
     - Temporary password (copy, mono)
     - "Copy all" button that copies a formatted credentials block (same template as `OSUserManagement.copyCredentialsBlock`).
   - Reuse a small `CopyRow` helper inside this file (same shape as the one in `OSUserManagement.tsx`).
   - Restrict the button to admin/super_admin via the existing auth context (match the gating used elsewhere on this page; if no gating is enforced in the header today, gate only this new button with `isAdmin`).

2. **No backend changes.** `admin-create-invite-link` already enforces admin-only access server-side.

3. **Test** — extend `src/test/userManagementInviteDelivery.test.ts` (or add a small new test file) to assert that `EmployeeProfile.tsx`:
   - imports/uses `admin-create-invite-link`
   - renders a "Copy invite link" button
   - renders the three copy rows (Sign-in link / Email / Temporary password) when an invite link is present.

### Out of scope

- No changes to the admin roster page (already has this button).
- No changes to `admin-create-invite-link` edge function.
- No styling overhaul of the header — just an additional outline button matching the existing ones.
