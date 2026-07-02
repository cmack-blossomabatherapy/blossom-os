## Goal
Persist the Patient Pipeline drawer's `focusStage` (and the open lead) in the URL so reloading `/marketing/referral-crm` restores the drawer with the same stage highlighted.

## Changes (all in `src/pages/os/marketing/ReferralCRM.tsx`)

1. **Add two URL keys** via the existing `useUrlState` helper at the page-root level:
   - `lead` — the currently opened lead id (string, default `""`)
   - `stage` — the focused referral pipeline stage (string, default `""`)

2. **Replace local drawer state** (`drawerLeadId`, `drawerFocusStage`) with the URL-backed values:
   - Opening the drawer (from Referrals row, Patient Pipeline row, or Contacts click-through) writes `lead` and, when applicable, `stage` into the URL.
   - Closing the drawer clears both keys.
   - Clicking a patient name directly (no referral stage context) sets `lead` and clears `stage`.

3. **Hydrate on mount**: because the drawer already reads `drawerLeadId` / `drawerFocusStage` to decide visibility, sourcing them from URL params means a reload with `?lead=...&stage=...` reopens the drawer automatically on the focused stage — no extra effect needed.

4. **Share link compatibility**: the existing `CopyShareLinkButton` copies `window.location.href`, so the new params flow through unchanged. Verify by inspection.

## Out of scope
- No changes to `LeadDetailDrawer` internals; it already accepts `focusStage` and scrolls/opens the popover.
- No changes to other pages or hooks.

## Verification
- Typecheck.
- Manual: open a referral → drawer opens with stage highlighted → URL contains `lead` + `stage` → reload → drawer reopens on that stage → close → params removed.
