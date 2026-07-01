
## Scope

Connect the Marketing surface to the real Marketing tables added in export 96, eliminate mock data from production Marketing pages, standardize route protection, remove AI from Marketing permissions, and keep `/reports` as the single canonical Reports page. No new pages, no CentralReach integration work, no changes to Referral CRM behavior beyond deeper lead/source links.

## What changes

### 1. Access model in `App.tsx`

- Add shared constants at top of `App.tsx`:
  - `MARKETING_ROLES = ["admin","super_admin","marketing","marketing_team","marketing_growth_lead"]`
  - `MARKETING_ROLES_WITH_BD = [...MARKETING_ROLES,"business_development"]` (Referral CRM, Patient Journey, Phone, Reports)
- Wrap every `/marketing/*` route (and `/patient-journey`, `/phone`, `/reports` where used by marketing) with `PermissionRoute` using the shared constants. Guarantee consistency: Dashboard, Campaigns, Lead Sources, SEO, Web Analytics, Call Tracking, Attribution, State Growth, LeadTrap, Facebook Ads, Google Ads all use `MARKETING_ROLES`. Referral CRM, Outreach, Reputation, Recruiting Marketing, Email Marketing, Lead Source Inbox use `MARKETING_ROLES_WITH_BD`.
- Delete the `import MarketingReports` line if present; the `/marketing/reports` redirect stays but no component import.

### 2. Delete/hide `MarketingReports.tsx`

- Remove `src/pages/os/marketing/MarketingReports.tsx` (file is not routed).
- Confirm no menu points at `/marketing/reports` (only redirect).

### 3. Permissions cleanup

- `src/lib/os/permissions.ts`: drop `ai_assistant` from Marketing role modules; set `aiInsights: false` for Marketing roles. Keep the module list from the spec (dashboard, marketing_dashboard, campaigns, lead_sources, seo_content, web_analytics, call_tracking, referrals, recruiting_marketing, community_outreach, reputation, attribution_roi, state_growth, reports, training, sop/settings).
- Ensure Marketing menu builder does not surface `/marketing/reports`; single Reports item points to `/reports`.

### 4. Data layer — `useMarketingIntelligence.ts`

- Rewrite to read from Supabase only. No `mockLeads`, `mockPhoneCalls`, `mockCandidates`.
- Aggregate from: `intake_leads`, `recruiting_candidates`, `marketing_sources`, `marketing_campaigns`, `marketing_source_events`, `marketing_campaign_metrics`, `marketing_call_events`, `marketing_email_events`, plus referral CRM tables already surfaced by `useMarketingData`.
- Keep the exported shape stable (KPI names, counts, buckets) so existing pages keep rendering; missing data → zeroed/empty arrays. Reuse `useMarketingData` where it already covers a slice.

### 5. Page-by-page wiring (all live, honest empty states)

- **MarketingDashboard**: real KPIs only via updated `useMarketingIntelligence` + `useMarketingData`.
- **LeadSources**: CRUD (create/edit/activate/deactivate) against `marketing_sources`; filters by system/state/channel/status; row action opens Lead Source Inbox filtered by source id.
- **LeadSourceActions**: replace "coming soon" import toast with a real dialog that inserts into `marketing_source_events` (fields: source system, event type, name, phone, email, state, payload summary, campaign, occurred_at) and links to Lead Source Inbox with the source context.
- **Lead Source Inbox** (already live): confirm the create-lead / attach / mark-review / ignore actions write to `marketing_source_events` (set `lead_id`, `status`).
- **Campaigns**: full CRUD against `marketing_campaigns`; pause/archive via `status`; metrics tab pulls from `marketing_campaign_metrics`; linked events/leads/calls/emails via `campaign_id` joins. Remove any mock campaign derivation.
- **Call Tracking**: read from `marketing_call_events`; filters (system/state/status/date); manual create; link-to-lead; recording/transcript display when present. Drop `mockPhoneCalls`/`mockLeads` imports.
- **LeadTrap / Facebook Ads / Google Ads**: each becomes a source-scoped inbox: query `marketing_source_events` where `source_system` matches (`leadtrap`, `facebook_ads`/`meta_ads`, `google_ads`), show event table + campaign metrics from `marketing_campaign_metrics`, provide "Manual event" dialog reusing the LeadSourceActions dialog, and "Open in Inbox" link.
- **Email Marketing**: read from `marketing_email_events` + `marketing_campaigns` (channel=email). Create campaign placeholder, manual event import, aggregate sends/opens/clicks/bounces/unsub. No fake metrics.
- **SEO / Web Analytics**: derive from real leads + `marketing_campaign_metrics` + `marketing_source_events` (web/organic). Empty setup state when nothing present.
- **Community Outreach**: replace mock derivation with `useMarketingData` referrals + `marketing_source_events` (source_system in `provider`, `community`). Show follow-ups, referrals generated, linked leads, state.
- **Recruiting Marketing**: real recruiting candidates + `marketing_source_events` (career-related). Drop `mockCandidates`.
- **Reputation**: reuse `useReputationLeads`; add reputation-events feed via `marketing_source_events` where `source_system='reputation'` or `event_type='review'`. No new table needed.
- **Attribution & ROI**: real leads + campaigns + metrics + calls + email events + referral links. Show partial attribution when gaps exist.
- **State Growth**: aggregate by state from leads/campaigns/calls/emails/referral CRM/candidates.
- **Patient Lifetime Journey**: augment existing view with marketing touches (source events, call events, email events, referral CRM links) keyed off `lead_id`/`central_reach_client_id`. No relocation.

### 6. Tests

Add/refresh light unit tests under `src/__tests__/` (or nearest existing dir):

- Marketing menu snapshot: exactly one Reports item, target `/reports`.
- No menu entry references `/marketing/reports`.
- Every menu route resolves in `App.tsx`.
- Every marketing route accessible to `marketing`, `marketing_team`, `marketing_growth_lead`.
- BD-only routes constrained to BD menu list.
- `App.tsx` does not import `MarketingReports`.
- `rg` guard: `src/pages/os/marketing/**` + `useMarketingIntelligence.ts` do not import `mockLeads|mockPhoneCalls|mockCandidates`.
- `LeadSourceActions` source has no "coming soon" string.

### 7. Validation

- Type-check with `tsgo`.
- Run existing vitest suite.
- Manual sanity: confirm Marketing dashboard renders with empty tables (should show empty states, not crash).

## Technical details

- `marketing_source_events` insert shape (from schema): `source_id`, `campaign_id?`, `source_system`, `event_type`, `occurred_at`, `state?`, `parent_name?`, `phone?`, `email?`, `child_name?`, `payload_summary?`, `status='new'`, `lead_id?`. Confirm columns via `\d public.marketing_source_events` before writing insert.
- `marketing_campaigns` CRUD constrained to columns already present; `status` values reused (`active`, `paused`, `archived`).
- All Supabase writes go through `supabase.from(...).insert/update` — no edge functions needed for this pass.
- Manual-event dialog is a shared component under `src/components/os/marketing/ManualSourceEventDialog.tsx` used by LeadSourceActions, LeadTrap, Facebook Ads, Google Ads.
- Keep exported types stable in `useMarketingIntelligence` to minimize downstream churn.

## Out of scope

- Building CentralReach API sync.
- New Reports page or dashboard.
- Referral CRM behavioral rewrite.
- AI surfaces on Marketing.
- Any Coming Soon pages.

## Deliverables

Final report will list: pages now database-backed, tables each page uses, honest empty states remaining, any mock residue, confirmation `/reports` is the single Reports page.
