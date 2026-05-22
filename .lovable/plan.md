
# Leads Page (Blossom OS)

Goal: Replace the `/leads` "coming soon" route with a calm, operational Leads workspace built on the real Monday Leads export already in Lovable Cloud — 4,739 lead records and 33,506 update/comment rows previously uploaded via Admin → Data Uploads → Monday.com → Leads.

No new uploader. No giant spreadsheet clone. Familiar to a Monday user, but cleaner.

---

## 1. Data — use what's already there

Tables already populated from the uploader + parse-monday-export edge function:

- `monday_leads_raw` — one row per Monday lead. Columns: `monday_item_id`, `monday_group`, `name`, `state`, `status`, `owner`, `data` (jsonb with all 60+ Monday fields), `imported_at`, `updated_at`.
- `monday_updates_raw` — one row per Monday comment/update. Columns: `parent_board`, `parent_item_name`, `author`, `posted_at`, `body`.
- `monday_subitems_raw` — Monday subitems (sparse, 137 rows).

Existing helpers we will reuse:
- `src/lib/leads/mondayMapper.ts` — `mondayRowToLead(row)` already maps `monday_leads_raw` → the canonical `Lead` type, including status, owner, state, form/VOB statuses, insurance, missing info, last contact, origination date, etc.
- `src/contexts/LeadsContext.tsx` — already loads from `monday_leads_raw` and exposes `leads`, `loading`, `refresh`, `updateLead`, etc.

Comments link: `monday_updates_raw.parent_item_name` matches `monday_leads_raw.name` (the export doesn't carry Item ID on updates). We'll join by normalized name. A small helper `useLeadUpdates(leadName)` will fetch matching updates ordered by `posted_at desc`.

No schema changes required. (If we later want first-class write-back, we can introduce `lead_notes` / `lead_activity` tables — out of scope for v1.)

---

## 2. Route & navigation

- `src/App.tsx`: replace the `/leads` `<OSComingSoon …>` route with a `<PermissionRoute permission="leads.view"><OSLeadsV2 /></PermissionRoute>`.
- Sidebar entry already exists in `OSShell` under Intake — points at `/leads`.
- Keep the old `pages/Leads.tsx` and `pages/os/OSLeads.tsx` files in place (untouched) so existing demo routes don't break. New page lives at `src/pages/os/OSLeadsV2.tsx`.

---

## 3. Page structure (`src/pages/os/OSLeadsV2.tsx`)

Single `OSShell`-wrapped page. Layout: main column + 320px right rail (AI). On <1280px the rail collapses behind an "AI" button.

### a. Header
- Title "Leads", subtitle "Track new family inquiries, intake progress, forms, insurance, and VOB readiness."
- Right-aligned: `Filters`, `Export CSV`, `Import` (opens link to `/admin/data-uploads`), `+ Add Lead` (primary).
- Below: full-width search input with leading icon — "Search patient, parent, phone, email, insurance…". Debounced filter across `name`, parent name, phone, email, primary insurance.

### b. KPI strip (8 quiet pill cards, single row, horizontal scroll on small)
Each pill = label + count, computed live from the loaded leads. Click = applies the matching filter.
- New Leads (status = New Lead)
- Needs Contact (no last_contact_date or > 2 days)
- Form Sent
- Form Completed
- Missing Info
- Sent to VOB
- VOB Completed
- Cannot Reach

### c. View switcher
Segmented control: **List · Pipeline · Follow-Up**. Default = List.

### d. List view (default)
Clean table, only operationally relevant columns:
`Patient · Parent · State · Intake Person · Status · Last Contact · Call Attempt · Form Status · Primary Insurance · VOB Status · Missing Info · Next Action`

Row hover reveals quick actions: Open · Call · Email · Add Note · Send Form · Escalate.
Click row → opens detail drawer.
Pagination: 50 / page (server-side, ordered by `updated_at desc`).

### e. Pipeline view
Horizontal kanban (overflow-x) with these columns (mapping uses `mondayMapper` enum):
New Lead → Contact Attempted → Connected → Form Sent → Form Received → Missing Information → Sent to VOB → VOB Completed → Ready for Client Setup → Cannot Reach → Non Qualified.

Each card shows: patient, state badge, intake person, last contact, next action. Click → drawer. v1 is read-only drag (no persistence yet — leads source is still Monday export).

### f. Follow-Up view
Action queues rendered as horizontally scrollable column groups:
Due Today · Overdue · Attempt 1 · Attempt 2 · Attempt 3 · Attempt 4 · Final Attempt · Cannot Reach · Waiting on Parent.

Heuristics derived from `Last Contact Date`, `Reg Call Log`, `E/T Call Log`, `Can't Reach Date`, `Status` fields in the JSON blob.

### g. Lead Detail Drawer (right side, ~520px, glass over content)
Tabs across top: **Overview · Insurance / VOB · Documents · Activity · Actions**.

- **Overview** — patient name/DOB/age/gender, parent name + cell + home phone + email, address + zip, state, lead type, source, UTM source, intake person, status, last contact, next action, origination date, call logs.
- **Insurance / VOB** — primary, secondary, insurance ID, insurance type, VOB status, payment plan needed, DX, missing info, non-qualified reason.
- **Documents** — chips for: insurance card front/back, intake packet, consent form, VOB. Pulled from the JSON keys "Primary Insurance Card - Front/Back", "Secondary Insurance Card - …", "Intake Packet", "Consent Form Link", "VOB".
- **Activity** — comment feed from `monday_updates_raw` joined by name, newest first; each item shows author, relative time, body (sanitized).
- **Actions** — buttons: Add Note · Send Intake Packet · Send Consent Forms · Request Missing Info · Move to VOB · Mark Cannot Reach · Mark Non Qualified · Create Task. All wired to `useLeads().updateLead(...)` and a `sonner` toast. (Writes update the local `Lead` cache; underlying `monday_leads_raw` remains read-only for v1.)

### h. AI rail (right)
Compact glass card "Ask Blossom". Pre-canned prompts as ghost buttons:
- Summarize this lead
- Find missing information
- Show leads needing follow-up
- Which leads are stuck?
- Draft parent follow-up

For v1 these dispatch to a stub `askBlossom(prompt, context)` that opens the existing global AI panel pre-filled — no new backend call.

---

## 4. Filters

Filter popover (triggered by header `Filters` button) with multi-select chips:
State · Intake Person · Status · Form Status · VOB Status · Insurance · Lead Type · Source · Missing Info (Yes/No) · Date Range (origination).

Active filters render as removable chips below the KPI row.

---

## 5. Role-based visibility (`src/lib/os/permissions.ts`)

Reuse the existing permission system. The route already gates on `leads.view`. Inside the page we also filter the loaded `leads` array:

- **RBT** → no access (no `leads.view`).
- **Intake Coordinator** → only rows where `lead.owner === currentUser.displayName`.
- **Intake Leadership / Operations Leadership / Super Admin** → all rows.
- **State Director** → only rows where `lead.state === currentUser.state` (uses existing `profiles.state`).

These restrictions apply to KPI counts, all views, and the drawer.

---

## 6. New files

- `src/pages/os/OSLeadsV2.tsx` — page shell, view switcher, KPI strip, search, filters, AI rail.
- `src/components/leads/LeadsListView.tsx`
- `src/components/leads/LeadsPipelineView.tsx`
- `src/components/leads/LeadsFollowUpView.tsx`
- `src/components/leads/LeadDetailDrawer.tsx`
- `src/components/leads/LeadFiltersPopover.tsx`
- `src/hooks/useLeadUpdates.ts` — fetches `monday_updates_raw` by `parent_item_name`.
- `src/lib/leads/scoping.ts` — `scopeLeadsForUser(leads, user, roles)`.

## 7. Files changed

- `src/App.tsx` — swap `/leads` route to `OSLeadsV2`.
- (Light) `src/contexts/LeadsContext.tsx` — only if a small selector helper is needed; no breaking changes.

## 8. Design adherence (Blossom OS)
- White/`bg-background` page, hairline borders, `rounded-2xl` cards, glass drawer + AI rail.
- One primary CTA per view (`Add Lead`).
- Accent (primary pink) used only on primary CTA, active view chip, focus rings.
- No `shadow-lg`, no marketing tropes, no rainbow status colors — status chips are muted with one accent and red/amber/green only for true urgency.
- Empty states: "No leads match these filters." with a single ghost reset action.

## 9. Out of scope (call out to user, not built in v1)
- Writing changes back to Monday/Lovable Cloud as a new "leads" table. Edits today live in the in-memory `LeadsContext` cache and reset on reload. We can add a `lead_overrides` table in a follow-up if you want persistence before CentralReach becomes source of truth.
- Real Ask-Blossom calls — the rail prefills prompts only.
- Drag-and-drop persistence in Pipeline view.
