# Blossom OS 23 — Live Site Mapping + Real Lead Intake

This is a large, multi-area pass. I want to confirm the plan and a few scope calls before I start writing, because building everything end-to-end in one shot would otherwise mean ~40+ new/changed files, several migrations, and a lot of MVP pages I cannot validate together without your eyes.

## Goal

Stop describing the product as "Available Now / Coming Soon". Make every role menu open a real page in the current Blossom OS shell, fix Executive Leadership's old workspace leakage, and make Add Lead a real persistent intake workflow ready for CTM/LeadTrap/Ads/referral integrations.

## Approach (phased, sequenced for safety)

### Phase A — Menu shape + Executive shell leakage (foundation)
1. Refactor `src/lib/os/roleMenus.ts` to the new shape:
   ```ts
   interface RoleMenuSection { id; label; items: RoleMenuItem[] }
   interface RoleMenu { sections: RoleMenuSection[] }
   ```
   Remove `comingSoon`, `SOON`, and any `/coming-soon?module=` paths. Every item has a real path.
2. Rewrite `src/pages/os/OSShell.tsx` to render `sections[]` directly — no "Available Now" / "Coming Soon" / "Soon" copy or badges anywhere.
3. Update `src/lib/os/roleHome.ts` to the new role-home table you listed (executive_leadership → `/executive`, ops_leadership → `/operations/command-center`, etc.). Remove `/ws/executive` as a home.
4. Add redirects from `/ws/executive`, `/ws/operations`, `/ws/marketing`, `/ws/intake`, `/ws/finance` to their new homes.
5. Update `src/test/blossomOsAlignment.test.ts` + add a new `roleMenuLiveRoutes.test.ts` that asserts:
   - no menu item path starts with `/coming-soon`
   - no section label is "Available Now" or "Coming Soon"
   - every role home is one of the live routes
   - every menu path exists in `App.tsx` (or is a documented redirect).

### Phase B — Wire every role menu to real pages
For every role, set menu items exactly to the map in your prompt. Where the target route already exists, link to it. Where it doesn't, create an **MVP real page** mounted in `OSShell` with: page header, filter row, table/list with empty state, primary action button (if relevant), and a "Reports" link. New MVP pages I expect to create (each ~80–150 lines, mock/empty data, no `/coming-soon`):

- `/system/request-intake` (Operations Leadership)
- `/ops/state-escalations` (State Director / Assistant)
- `/ops/tasks` (Assistant State Director)
- `/intake/missing-information`, `/intake/parent-communication`, `/intake/benefits-cheat-sheets`, `/intake/lead-to-active`, `/intake/referral-queue`, `/intake/tasks` (only the ones not already real)
- `/ops/approved-authorizations`, `/ops/expiring-authorizations`, `/ops/denials`, `/ops/missing-docs`, `/ops/payer-requirements` (auth team)
- `/ops/make-up-sessions`, `/ops/rbt-match-queue`, `/ops/family-staffing-preferences` (scheduling/staffing)
- `/hr/requests`, `/hr/compliance` (HR)
- `/credentialing/providers`, `/credentialing/insurance`, `/credentialing/bcba`, `/credentialing/uncredentialed-bcbas`, `/credentialing/expiring`
- `/marketing/state-growth`, `/marketing/lead-sources`, `/marketing/campaigns`, `/marketing/call-tracking`, `/marketing/leadtrap`, `/marketing/facebook-ads`, `/marketing/google-ads`, `/marketing/seo`, `/marketing/web-analytics`, `/marketing/recruiting`, `/marketing/outreach`, `/marketing/reputation`, `/marketing/attribution` (only the ones not already real)

I'll first inventory which of these already exist in `App.tsx` and only create the missing ones. Each MVP page uses the existing shell + design tokens (no new design system).

`/coming-soon` route is kept in `App.tsx` only as a redirect → `/dashboard` so any bookmarked URLs don't 404, but it is removed from every menu and from `/ai/assistant`.

### Phase C — Reports protection
- Keep BCBA Productivity Report V3 visible to every role on `/reports`. Add a `reportsLiveCatalog.test.ts` to lock that in.
- No report card on `/reports` routes to `/coming-soon`; missing ones become empty-state MVP report pages.

### Phase D — Real Add Lead workflow (Supabase-backed)
1. **Migration** on `intake_leads` to add the missing columns you listed (`patient_first_name`, `patient_last_name`, `dob`, `parent_first_name`, `parent_last_name`, `parent_2_name`, `parent_2_email`, `parent_cell_phone`, `home_phone`, `preferred_contact_method`, `lead_type`, `utm_source`, `utm_medium`, `utm_campaign`, `referral_source`, `referral_partner`, `origination_date`, `last_contact_date`, `regular_call_log`, `et_call_log`, `message_comments`, `secondary_insurance`, `diagnosis_status`, `dx_needed`, `monday_item_id`, `monday_group`, `source_metadata jsonb`, `original_column_data jsonb`). Only ADD columns; never drop existing ones.
2. Rebuild `NewLeadDialog.tsx` as a tabbed drawer: Source & Ownership · Patient · Parent/Guardian · Insurance · Workflow Status · Communication · Documents · Notes & Tags. Zod validation. Required: child name, parent name, phone or email, state, lead source, pipeline stage.
3. On submit:
   - Insert `intake_leads` row.
   - If call log / message / SMS / email captured, insert `intake_communications` row.
   - Insert first `intake_tasks` row ("Contact Lead", due today or `next_task_due`).
   - Insert a timeline event into `client_timeline` or `intake_communications` (whichever already exists for leads — I'll confirm in code).
   - Toast + refresh list.
4. Refactor `LeadsContext` so `refresh()` loads from `intake_leads` first, then `monday_leads_raw`, deduping by `monday_item_id` / phone+email+child name. Source label: `Blossom OS` vs `Imported`. Manual creates persist through page refresh.
5. New lead appears in `/leads`, `/intake/dashboard`, `/intake/referral-queue`, `/intake/lead-to-active`, `/patient-journey`.
6. Test: `addLeadPersistsToSupabase.test.ts` with mocked supabase client asserting the insert payload + required-field validation.

### Phase E — Lead source integration readiness (structural only)
- `source_metadata` + `original_column_data` jsonb columns added (Phase D).
- Marketing source pages each get standard actions: **Add Lead**, **Import Leads** (stub), **View Leads From This Source** (filtered `/leads?source=…`), **Open Patient Journey**.
- No actual CTM/LeadTrap/Ads API calls in this build.

### Phase F — Activity tracking (lightweight)
Lead create / update / stage change / owner change / communication / task create / task complete / document link all write to `intake_communications` (or a `lead_timeline` view if simpler). No new global activity table this build. Patient Lifetime Journey reads from this.

## Out of scope for this build
- Real CTM/LeadTrap/Facebook/Google Ads API integration.
- Business Office / Finance pages.
- Redesigning any existing live page.
- Renaming or deleting current routes (`/resources` keeps redirecting to `/resource-library`, etc.).
- New global user/patient activity table.

## What I need from you before I start

1. **Scope confirmation.** This will touch ~30–40 files and add ~15–25 new MVP pages plus one migration. OK to proceed all in one pass, or do you want it split (Phase A+B first, then D, then the MVP pages)?
2. **MVP page bar.** For brand-new pages like `/ops/make-up-sessions` or `/credentialing/expiring`, my plan is: shell + header + filter row + empty-state table + "no data yet — connect source" CTA. No mock fake data. Confirm that bar is acceptable rather than fabricating mock rows.
3. **`intake_leads` migration safety.** I'll only ADD nullable columns and never touch existing data or policies. Confirm.
4. **Add Lead UX.** Drawer with tabs (desktop-first, ~720px wide) — OK? Or do you want a full-page `/leads/new` route instead?

Once you confirm (or say "all four — proceed"), I'll execute Phase A → F in order, with the migration submitted for your approval as its own step before any code depends on the new columns.
