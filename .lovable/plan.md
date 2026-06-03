# Marketing Referrals — Functional CRM

Convert `/marketing/referrals` from a visual shell into a working referral CRM (companies + contacts + activities + CSV import + future lead attribution). Keep the existing Blossom OS look — calm, Apple-style, no Salesforce overload.

## 1. Database (Lovable Cloud migration)

Five new tables in `public`, all with RLS + GRANTs. Standard `id`, `created_at`, `updated_at` on each.

**`referral_companies`** — company_name, normalized_name (generated lowercase), company_type, website_url, domain, main_phone, main_email, address_line_1/2, city, state, zip_code, full_address, service_area, notes, status, relationship_stage, relationship_owner, referral_count, last_referral_date, last_contacted_at, next_follow_up_at, source, import_batch_id.

**`referral_contacts`** — company_id (FK, nullable), first_name, last_name, full_name, title, role_type, email (unique-ish), phone, mobile_phone, direct_phone, website_url, linkedin_url, address fields, state, contact_owner, status, relationship_stage, preferred_contact_method, last_contacted_at, next_follow_up_at, number_of_referrals_sent, number_of_sales_activities, number_of_times_contacted, last_activity_date, recent_email_opened_at, last_meeting_booked_at, notes, source, original_record_id, import_batch_id.

**`referral_import_batches`** — file_name, uploaded_by, uploaded_at, total_rows, successful_rows, failed_rows, duplicate_contacts, duplicate_companies, status, error_log (jsonb).

**`referral_activities`** — contact_id, company_id, activity_type, activity_date, subject, notes, outcome, created_by, next_follow_up_at.

**`referral_lead_links`** — lead_id (uuid, no FK yet — leads table not finalized), referral_contact_id, referral_company_id, referral_source_type, referral_date, attribution_confidence, notes.

Enums kept loose as `text` with CHECK constraints so we can extend without migrations. Indexes on company_id, normalized_name + state, email, owner, next_follow_up_at, import_batch_id.

**RLS:** `marketing`, `exec`, `ops_manager`, `admin` can read/write via `has_role`. `service_role` full access. No `anon`.

**Trigger:** on `referral_contacts` insert/update, roll up `referral_count`, `last_referral_date`, `last_contacted_at`, `next_follow_up_at` onto the parent company.

## 2. Data layer

`src/lib/os/referrals/` —
- `types.ts` — TS types + enum option arrays for dropdowns.
- `api.ts` — supabase queries: list/get/create/update/archive contact & company, list activities, list batches, link company-by-name-or-domain.
- `csvImport.ts` — parse with existing `parseCSVText`, HubSpot field map, normalize domain from email/website, company match (normalized_name + domain + state fallback), contact dedupe (email → first+last+company → phone → original_record_id), produce a preview + commit step that writes a batch and bulk-inserts via a single edge function call.
- `hooks.ts` — `useReferralContacts`, `useReferralCompanies`, `useFollowUps`, `useImportBatches`.

## 3. Edge function

`supabase/functions/referrals-import/index.ts` — accepts parsed rows + batch metadata, runs company-match + contact-dedupe server-side (so RLS + service_role can do bulk upserts atomically), writes batch, returns `{ createdContacts, createdCompanies, updatedContacts, duplicates, failed[] }`. Validates with zod. Marketing role JWT required.

## 4. UI — keep `Referrals.tsx` shell, add working surfaces

Top of page action bar: **Add Referral**, **Import Referrals**, **Add Company**, **Export**, **Import History**.

Tabs under the existing intelligence summary:
- **Contacts** — table/card hybrid (name, company, role, email, phone, state, stage, referrals sent, last contacted, owner, actions). Row click opens detail drawer.
- **Companies** — name, type, website/domain, state, contact count, referral count, stage, last contacted, owner. Row click opens company drawer.
- **Follow-Ups** — Overdue / Due Today / Upcoming groupings.
- **Import History** — batch list with drill-in.

Intelligence summary tiles become live counts (total contacts, total companies, active sources, needs follow-up, strong partners, referrals sent, upcoming follow-ups) — empty states when zero.

Search + filter bar (state, company type, role type, stage, status, owner, has referrals, batch).

## 5. Modals / drawers

- `AddReferralDialog` — contact fields + inline company picker ("select existing" combobox with create-new option). Single screen, not a wizard.
- `AddCompanyDialog` — company-only.
- `ImportReferralsDialog` — three steps: upload → preview first 10 rows with mapping confirmation → result screen (created/updated/duplicates/failed + download-failed-CSV).
- `ContactDetailDrawer` — header, contact info, relationship intelligence, linked company, activity timeline, actions (edit, log activity, schedule follow-up, link company, archive).
- `CompanyDetailDrawer` — header, company info, attached contacts list, combined activity timeline, referral intelligence, actions.
- `LogActivityDialog` — used from both drawers.

All built with existing shadcn primitives + Blossom OS glass styling. No new design tokens.

## 6. Permissions

In `src/lib/os/permissions.ts`, ensure `marketing` (already has referrals access) plus `exec`, `ops_manager`, `admin` get `referrals` module view+manage. Other roles: no access. AI panel on the page stays, but when data is empty it returns the "still being built" copy — no fake numbers.

## 7. Out of scope (explicitly deferred)

- Real lead ingestion + attribution dashboards (table is created and ready; UI shows "Lead attribution ready" empty state).
- Undo-import (logged as nice-to-have; skipped unless trivial).
- Email/calendar integrations beyond storing what's in the CSV.
- Rebuilding the existing visual shell or intelligence section layout.

## Technical notes

- CSV parsing reuses `src/lib/os/reportEngine/csv.ts` — no new dependency.
- Domain normalization: lowercase, strip `www.`, take host only.
- Company match key: `lower(regexp_replace(company_name, '[^a-z0-9]', '', 'gi'))` stored as generated column for fast lookup.
- All writes go through the edge function for import; manual add/edit uses Supabase client directly under RLS.
- No changes to existing leads schema; `referral_lead_links.lead_id` is a plain uuid for now and we'll add the FK in a later migration when leads land.

```text
Referrals page
├── Action bar (Add / Import / Export / History)
├── Intelligence tiles (live counts)
├── Tabs: Contacts | Companies | Follow-Ups | Import History
│     └── Search + filters
└── Drawers: Contact detail · Company detail · Log activity
        ↑
        └── Edge fn: referrals-import  →  companies / contacts / batches / activities
```
