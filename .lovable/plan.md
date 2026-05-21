## Goal

Make state-scoped views (State Director dashboard, etc.) automatically reflect the signed-in user's assigned state from `profiles.state`. Right now the VA test user still sees FL because `activeState` is hardcoded/localStorage-only.

## Changes

### 1. Unify the canonical state list
- `src/contexts/OSRoleContext.tsx`: change `OS_STATES` from `["FL","GA","NC","TX","VA"]` to `["GA","NC","VA","TN","MD"]` (matches the User Management dropdown).
- `OSState` type stays derived from `OS_STATES`.

### 2. Seed `activeState` from the user's profile
- In `OSRoleContext`, pull `user` from `useAuth` and fetch `profiles.state` (or read it from an existing profile hook if available) on mount / when `user.id` changes.
- Initial `activeState` resolution order:
  1. Profile state (if it's in `OS_STATES`)
  2. localStorage value (if still valid)
  3. Fallback to first state (`GA`)
- For non–super-admins, lock `activeState` to their profile state and ignore the state switcher (similar to how role override is gated to super_admin).
- Super admins can still switch freely (current behavior).

### 3. Cleanup
- Remove any stale `FL`/`TX` references that assume the old list (quick grep across `src/lib/os` and `src/pages/os`).
- No DB changes — `profiles.state` already holds `VA` for the test user.

## Result

Signing in as `teststatedirector@blossomabatherapy.com` lands on the State Director dashboard scoped to VA automatically; the state switcher is hidden/locked for non-admins; super admins keep the dropdown with the new 5-state list.
