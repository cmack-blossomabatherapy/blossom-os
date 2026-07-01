## Problem

`TRAINING_AND_RESOURCES` (and `STATE_TRAINING_AND_RESOURCES`) already appends a **Reports → `/reports`** entry to every non–super-admin menu in `src/lib/os/roleMenus.ts`. Several role sections also declare their own generic "Reports → `/reports`" item, so those roles see Reports twice (e.g. Marketing Team lists it under *Growth & Marketing* and again under *Training & Resources*).

## Fix

In `src/lib/os/roleMenus.ts`, remove every item whose **label is exactly "Reports"** and whose **path is exactly `/reports`** from role-specific sections. Keep the two entries inside `TRAINING_AND_RESOURCES` / `STATE_TRAINING_AND_RESOURCES` as the single canonical location.

Rows to remove (all currently `{ label: "Reports", path: "/reports", ... }`):

- Line 124 — Executive Leadership → Executive Command
- Line 196 — Marketing Team → Growth & Marketing
- Line 223 — Marketing Growth Lead → Growth Command
- Line 244 — Business Development → Business Development
- Line 382 — (role section, `Reports` → `/reports`)
- Line 401 — (role section, `Reports` → `/reports`)
- Line 459, 476, 595, 660 — same pattern in remaining role sections

### Explicitly **kept** (not duplicates — role-specific labels)

- "Authorization Reports" (line 362)
- "HR Reports" (lines 420, 440)
- "Clinical Reports" (line 572)
- "Progress Reports" → `/progress-reports` (different route entirely)

These aren't the same as the generic Reports entry the user is asking to consolidate; removing them would silently strip role-specific report labels. I'll leave them and can remove them in a follow-up if the user wants full consolidation.

## Files touched

- `src/lib/os/roleMenus.ts` — delete the duplicate `Reports → /reports` lines listed above. No other files.

## Verification

- Sign in as Marketing Team: "Reports" appears only once, under *Training & Resources*.
- Spot-check Executive Leadership, Marketing Growth Lead, Business Development, and the other affected roles: exactly one "Reports" entry in the sidebar, under *Training & Resources*.
- Role-specific report labels ("Authorization Reports", "HR Reports", "Clinical Reports", "Progress Reports") still appear where they did before.
