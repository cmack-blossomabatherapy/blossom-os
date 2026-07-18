# Enable RBT Experience for All RBTs (No Pilot Gate)

## Goal
Stop treating the RBT app as a Georgia-only pilot. Every user with the RBT role gets the full mobile RBT experience immediately, and every admin with the right role sees the 9 RBT command centers.

## What "Pilot cohort selected and briefed" was
A rollout recommendation from the QA audit — pick a small Georgia group, brief them, watch for issues, then expand. It is **not** a feature, not a toggle in the code, and not blocking anything technically. The app is already built and routed.

## Changes

1. **Access confirmation (read-only verification, no code change expected)**
   - Confirm `/rbt/app/*` routes are gated only by the `rbt` role (not by state, not by a pilot flag).
   - Confirm `/admin/rbt/*` hub is gated by `canAccessAdminHub` only.
   - If any state filter or `pilot`/`cohort` flag is found, remove it.

2. **Landing redirect for RBTs**
   - On login, if the user's primary role is `rbt`, land them on `/rbt/app/home` instead of `/home`.
   - Add a persistent "Open RBT App" entry point in the top nav for users who also hold non-RBT roles.

3. **Announcement banner (one-time, dismissible)**
   - Show a small in-app banner on `/rbt/app/home` for the first visit: "Welcome to the new Blossom RBT app." Dismissal stored per-user.
   - No cohort logic, no allow-list.

4. **Admin visibility**
   - Ensure the `/admin/rbt` hub tile is surfaced in the admin left nav for Super Admin, Executive, Operations, HR, and State Director roles so they can actually run the dashboards day one.

5. **Docs**
   - Update the QA audit doc to mark the pilot recommendation as **superseded — launched to all RBTs**. Keep the remaining non-blocking technical-debt items listed (permissive RLS, pgvector location) as follow-ups.

## Out of scope
- No new features, no schema changes, no notification rule changes.
- No changes to the lifecycle engine or gates — those already work per-employee, not per-cohort.

## Verification
- Log in as an RBT test user → lands on `/rbt/app/home`, bottom nav works, all 5 tabs render.
- Log in as an admin → `/admin/rbt` hub loads and every tile opens.
- Grep confirms no remaining `pilot`, `cohort`, or Georgia-only gates in RBT routes.
