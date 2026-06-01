## What's happening

Nicholas's record in `employees` has the updated address `nschlotterer@blossomabatherapy.com`, but the linked `auth.users` row still has the original `nicholas.schlotterer@blossomabatherapy.com`. The `admin-employee-magic-link` edge function uses the employee's email to generate the magic link and to send via Resend, without first updating the auth user. Two failure modes follow:

- Supabase's `generateLink({ type: "magiclink", email })` either auto-creates a brand-new auth user for the new address (leaving the employee's `user_id` pointing at the old account) or refuses, depending on signup settings.
- Even if a link is generated and Resend accepts the POST, the new auth user is disconnected from the employee, so the link doesn't sign them into the right account — and any failure in Resend isn't being surfaced (function logs only show boot/shutdown).

## Fix

1. In `supabase/functions/admin-employee-magic-link/index.ts`:
   - After resolving `userId`, fetch the auth user and, if its email differs from the employee email, call `admin.auth.admin.updateUserById(userId, { email, email_confirm: true })` before generating the link.
   - Add `console.log` lines for: resolved userId, email-sync action taken, Resend HTTP status, and Resend response id / error body, so the next attempt is debuggable from the function logs.
   - Return the Resend status code and error message in the response payload (already partially done — extend it).

2. In `src/pages/os/users/EmployeeProfile.tsx` (the `sendInvite` handler):
   - When `emailSent` is false, show the actual `emailError` from the response in the toast and (if present) copy the magic link to clipboard as a fallback. The current code already does this — just make sure the error toast wins over a generic "sent" message.

3. Verify via `supabase--curl_edge_functions` after deploy: invoke for Nicholas, confirm the response shows `emailSent: true` with a Resend message id, and check `auth.users.email` is now `nschlotterer@…`.

## Notes

- No DB migrations needed — `admin.auth.admin.updateUserById` handles the auth-side change.
- Resend domain (`welcome@blossom.abacommandcenter.com`) is unchanged; if Resend still rejects after the fix, the response will now contain the exact error so we can act on it.
- This also retroactively fixes any other employee whose email was edited after their account was created.