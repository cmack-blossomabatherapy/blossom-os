## Problem

Creating a new contact in the Referral CRM fails with:

> null value in column "relationship_stage" of relation "referral_contacts" violates not-null constraint

The `relationship_stage` column on `referral_contacts` (and `referral_companies`) is `NOT NULL` with a default of `'New Contact'` / `'New'`. The CRM bridge insert path (`src/lib/os/referralCrm/bridge.ts`) explicitly sends `relationship_stage: c.referralPartnerStatus || null` — when the user doesn't pick a stage, it sends `null`, which overrides the DB default and fails.

The same issue exists for companies created through this bridge, and the same null-collapse pattern is used for `status` and a couple of other fields that have NOT NULL defaults.

## Fix

In `src/lib/os/referralCrm/bridge.ts`:

1. `contactToRow(c)`: drop `relationship_stage` from the payload when `c.referralPartnerStatus` is falsy (let DB default `'New Contact'` apply). Same treatment for `status` (default exists) so we never insert null there either.
2. `companyToRow(c)`: drop `relationship_stage` when `c.referralPartnerStatus` is falsy (DB default `'New'`).
3. Leave `contactPatchToRow` / `companyPatchToRow` alone — those only run on explicit user edits, where sending the chosen value (or null when intentionally cleared) is correct, except we'll guard against writing `null` to `relationship_stage` on update (skip the key instead of writing null).

No schema changes, no UI changes — purely the insert payload builder.

## Verification

- Re-open the CRM, add a new contact without touching the stage field → insert succeeds, row shows default `New Contact`.
- Add a new company the same way → default `New` applied.
- Existing edit flows still update stage when the user picks one.
