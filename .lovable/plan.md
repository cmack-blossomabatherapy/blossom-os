## Goal
Remove the Referral Queue entirely — it duplicates the Intake Dashboard. Referrals are already surfaced per-lead on the Lead Drawer and tracked centrally in the Referral CRM for marketing.

## Changes

### Routing & page
- Delete `src/pages/os/intake/ReferralQueue.tsx`.
- Remove the import and `<Route path="/intake/referral-queue" ...>` from `src/App.tsx`.
- Add a redirect: `/intake/referral-queue → /intake/dashboard` so any bookmarks/deep links keep working.

### Navigation
- Remove the "Referral Queue" entry from:
  - `src/lib/os/roleMenus.ts` (Intake menu)
  - `src/lib/os/superAdminMenu.ts`
- Remove `/intake/referral-queue` from live-path allow-lists in `src/pages/os/OSShell.tsx`.

### Cross-references
- `src/pages/os/intake/IntakeTasks.tsx`: change the follow-up deep link from `/intake/referral-queue?leadId=…` to `/intake/dashboard?leadId=…` (Intake Dashboard already handles the leadId param for opening the drawer). If it doesn't, route through the Leads page instead.
- `src/lib/os/moduleRegistry.ts` and `src/lib/os/phase3Reports.ts`: drop the "New Referral Queue" entries (report + module match name) — the same signal is already in the Intake Dashboard cards.
- `src/lib/os/integrations/integrationRegistry.ts`: remove "Referral Queue" from the two `surfaces` lists.
- `src/components/intake/LeadActionsButton.tsx`: remove Referral Queue from the doc comment.

### Training content
- `src/lib/training/academyData.ts`: delete the `intake-referral-queue-workflow` module and its resource, and remove its id from the intake journey array (line 1579). Merge any unique guidance ("first contact within 1 business hour") into the existing Intake Dashboard workflow module so nothing is lost.

### Tests
Update to reflect the removal:
- Delete Referral Queue assertions in: `sprint02Regression`, `sprint03Regression`, `sprint07LeadIntakeEngine`, `sprint08IntakeWorkflowActions`, `intakeSprint09`, `intakeExport83LeadsDocuments`, `intakeExport87UiCanonicalStageUsage`, `intakeExport88FullDepartmentLaunch`, `intakeShellHotfixSprint15A`, `intakeRoleMenuSprint15`.
- Add one small test asserting `/intake/referral-queue` redirects to `/intake/dashboard` and that the string "Referral Queue" no longer appears in `roleMenus.ts` / `superAdminMenu.ts`.

## Not changing
- Referral CRM (`/marketing/referral-crm/*`) — kept as the single source of truth for referral relationships.
- Per-lead referral linking inside `LeadDetailDrawer` (already wired via `useLeadReferralLink`) — kept.
