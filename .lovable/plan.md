## Goal
In the Referrals list (`/marketing/referral-crm` → Referrals tab), surface each referral's linked patient pipeline stage as its own column (in addition to the existing referral Status column), let users filter the list by both, and make clicking a patient/pipeline cell open the same `LeadDetailDrawer` used everywhere else in the app.

## Scope
Only `src/pages/os/marketing/ReferralCRM.tsx` — the `ReferralsModule` component. No schema changes; referrals already carry `leadId` (from `referral_lead_links` + native rows) and `useLeads()` exposes the pipeline stage per lead.

## Changes

1. **New "Patient Pipeline" column** in the Referrals table, placed right after the existing "Status" column.
   - Resolve each row's linked lead via `useLeads().leads.find(l => l.id === r.leadId)`.
   - Render a colored pipeline-stage pill (reuse existing stage color helper from `LeadDetailDrawer`/intake visuals; fall back to a neutral pill).
   - If no linked lead: show a muted "— Not linked" label (no click).

2. **Click-through to the patient pipeline drawer.**
   - Track `const [drawerLeadId, setDrawerLeadId] = useState<string | null>(null)` in `ReferralsModule`.
   - Pipeline pill + patient name become buttons that call `setDrawerLeadId(r.leadId)` when a linked lead exists.
   - Render `<LeadDetailDrawer leadId={drawerLeadId} onClose={() => setDrawerLeadId(null)} />` at the bottom of the module.
   - Keep the existing "edit referral" behavior for referrals that have no linked lead (unchanged fallback).

3. **Filter bar above the table** with two dropdowns:
   - **Referral Status** — options: All, New, In Review, Intake Form Sent, Scheduled, Active, Closed, Lost.
   - **Pipeline Stage** — options: All, Not Linked, plus the canonical intake pipeline stages pulled from the same source `LeadDetailDrawer`/Kanban already uses.
   - Both persist in local component state and combine with the existing `scopedReferrals(s)` result via a `useMemo` filter.
   - Small "Clear filters" ghost button appears when either filter is active.

4. **Header colspan / empty-state** updated to reflect the new column count (12 instead of 11).

## Out of scope
- No changes to Contacts, Companies, Reports tabs.
- No new DB fields, migrations, or bridge changes — `leadId` is already surfaced.
- No changes to bulk-action bar behavior.

## Verification
- Load `/marketing/referral-crm` → Referrals tab: new "Patient Pipeline" column renders, existing Status column unchanged.
- Filter by Referral Status and by Pipeline Stage independently and combined; row count updates.
- Click a linked pipeline pill → `LeadDetailDrawer` opens with correct lead, pipeline visible; close returns to list with filters preserved.
- Referrals without a linked lead show "Not linked" and are not clickable to the drawer.
