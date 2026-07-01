## Problem

`src/pages/os/marketing/ReferralCRM.tsx` (lines 4678–4696) renders an "Acting as:" impersonation switcher unconditionally. Every user hitting `/marketing/referral-crm` sees it and can reassign the CRM's current user, which was intended as a Super Admin–only preview tool.

## Fix

Gate the block behind the same Super Admin check the rest of the OS uses (`useAuth().isAdmin`), honoring the loading state so it doesn't flash for non-admins.

1. Import `useAuth` from `@/contexts/AuthContext` in `ReferralCRM.tsx`.
2. Inside the component, read `const { isAdmin, loading: authLoading } = useAuth();`.
3. Wrap the impersonation `<div className="mb-3 ...">…</div>` (lines 4678–4696) in `{!authLoading && isAdmin && ( … )}` so it renders only for Super Admins after auth resolves. The trailing `me` badge stays inside that block (it's only meaningful in the impersonation context).

No other logic, styling, or CRM behavior changes.

## Files touched

- `src/pages/os/marketing/ReferralCRM.tsx` — add `useAuth` import + Super Admin gate around the Acting-as block. No other files.

## Verification

- Signed in as a non–Super Admin (Marketing Team, Intake, etc.) at `/marketing/referral-crm`: no "Acting as" bar renders, no flash on load.
- Signed in as Super Admin: bar renders as before and the role/user switcher still works.
