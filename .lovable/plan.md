## Goal
Audit every clickable control (buttons, icon buttons, row actions, quick-action tiles) across the 15 Marketing team pages and make sure each one either performs a real, wired-up action or is removed. No dead buttons, no silent no-ops, no "coming soon" toasts left standing.

## Scope — pages covered
`src/pages/os/marketing/`:
1. MarketingDashboard
2. Campaigns
3. LeadSources
4. CallTracking
5. AttributionROI
6. WebAnalytics
7. SEOContent
8. EmailMarketing
9. Reputation
10. CommunityOutreach
11. StateGrowth
12. RecruitingMarketing
13. Referrals
14. ReferralCRM (all sub-modules — Dashboard, Contacts, Companies, Referrals, Tasks, Lists, Workflows, Reports, Imports, Exports, Duplicates, Settings, Users, Deleted, Files, Audit, Activities, Search, Patient Pipeline)
15. MarketingTraining

## Audit method (per page)
For each page:
1. Grep every `<Button`, `<button`, `onClick=`, and row-level clickable tile.
2. Classify each control as:
   - **OK** — already opens dialog / navigates / mutates / exports correctly.
   - **No-op** — handler missing, empty arrow, or only fires a placeholder toast.
   - **Broken** — handler exists but throws, targets wrong ID/route, or dialog never opens.
   - **Vestigial** — leftover from an earlier design with no purpose.
3. Fix path per class:
   - **No-op / Broken** → wire to the existing hook/store action (`crm.*`, `useMarketing*`, `supabase` insert/update, or navigate) using the same patterns already in the codebase.
   - **Vestigial** → remove the control (and its unused imports).
   - **Real work missing a backend** → replace with a working local action (e.g. filter, CSV export, mark-as-done) rather than a stub — no new tables added in this pass.

## Deliverable per page
- A short in-code comment block at the top of each touched file listing the audited actions (so the fix is traceable) is NOT added — keep files clean.
- Every previously dead control now: opens the right dialog, updates the right record, navigates the right route, exports the right CSV, or is removed.
- No toast that says "coming soon", "not implemented", "TODO", or an empty `() => {}` handler remains in `src/pages/os/marketing/`.

## Reusable patterns
- CRUD actions on referral/contact/company data → `crm.*` in `src/lib/os/referralCrm/store.ts`.
- Live marketing tables (sources, calls, web metrics, work items, reputation) → the existing `useMarketing*` hooks under `src/hooks/`.
- Bulk / CSV export → existing `downloadCsv` + `rowsToCsv` helpers.
- Navigation → `react-router-dom` `useNavigate` with routes already registered.
- Dialogs → mount using the same `Dialog` / `Sheet` pattern already in each page; do not invent new modal frameworks.

## Out of scope
- No new pages, no new database tables, no schema migrations.
- No visual redesign — only wiring existing controls or removing dead ones. Minor label tweaks allowed when a button label lied about its behavior.
- Non-marketing role pages are not touched.

## Verification
- After each page's fixes: click every button in preview (via a Playwright pass on `/marketing/*` routes) and confirm each one either opens the intended UI, mutates state, navigates, exports, or is gone.
- Final grep confirms zero occurrences of `TODO`, `Coming soon`, `Not implemented`, or empty `onClick={() => {}}` in `src/pages/os/marketing/`.
- Typecheck (`tsgo`) passes.

## Estimated size
~15 files touched, primarily small handler additions and a handful of removals. ReferralCRM (94 buttons) is the largest surface and gets the most attention.
