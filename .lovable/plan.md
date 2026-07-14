
## Goal
Turn `LeadDetailDrawer` into a fully working intake mini-CRM: assign owner, edit lead fields inline, upload documents, and wire every Action button to real persistence (except Send Intake Packet / Send Consent Forms, which stay as stubs by request).

## 1. Assign lead to intake staff (from the drawer)

- In the drawer header, replace the static "owner" line with an inline **Assign** control powered by the existing `IntakeCoordinatorPicker`.
- On select, call `assignOwner([lead.id], staff.name)` and also write `assigned_user_id` (and `owner`) to `intake_leads` via `updateLead`, then log an `intake_communications` note ("Assigned to {name}") so it shows on Activity.
- Show the owner avatar + "Change" affordance; unassigned state renders a prominent "Assign intake coordinator" chip.

## 2. Editable lead information

- Add an **Edit** toggle on the Overview and Insurance/Benefits tabs. When editing, `Field` components render as inputs (text/select/date) bound to local form state.
- On Save, persist through `updateLead(lead.id, patch)` which already writes to `intake_leads`. Show inline validation (required: parent name, phone or email, state).
- Editable fields: child name, DOB, gender, parent name/relationship, phone(s), email, address/zip, state, source, next action, primary/secondary insurance, insurance ID, insurance type, policyholder, diagnosis status.
- Improve spacing in Overview and Insurance/Benefits: convert the current 2-col grid to a card-per-section layout (Patient, Parent/Guardian, Contact, Intake, Attribution, Insurance, Benefits) with `space-y-6`, `gap-5`, larger section headers and consistent padding.

## 3. Documents — upload

- Create a Supabase Storage bucket `lead-documents` (private) via `supabase--storage_create_bucket`, with RLS on `storage.objects` scoped to authenticated intake staff.
- Add an **Upload document** button on the Documents tab. Uses `<input type="file" multiple>`, uploads to `lead-documents/{lead_id}/{uuid}-{filename}`, then inserts a row into a new `lead_documents` table `(id, lead_id, label, storage_path, mime_type, size, uploaded_by, uploaded_at)`.
- Documents tab merges Monday URL docs, `lead.documents`, and rows from `lead_documents` (signed URLs for viewing). Each row supports View / Rename / Delete for the uploader or intake leads.

## 4. Actions tab — make everything work

- Reorder so **Create Task** and **Create Follow-Up** are at the top.
- **Add Note** → opens a small dialog; on save inserts `intake_communications` (`communication_type: "note"`), appears in Activity immediately. Also adds a "Notes" section on Overview showing the 3 most recent notes from `intake_communications`.
- **Create Task / Create Follow-Up** → shared dialog `CreateLeadTaskDialog` with fields: type (`task` | `follow_up`), title, owner (IntakeCoordinatorPicker), due date, notes. Inserts into `intake_tasks` with `task_type = 'follow_up'` for the follow-up flow.
- **Flag Packet Follow Up / Missing Info** → keep existing status update, but also open a small prompt for the missing-info reason and store it in `intake_communications` + set `intake_leads.form_review_status`.
- **Move to Benefits Verification**, **Mark Cannot Reach**, **Mark Non-Qualified** → keep existing `updateLead` calls, and log an activity note for each so the timeline shows the transition.
- **Send Intake Packet** and **Send Consent Forms** → keep as stubs with "Coming soon" toast (per user).

## 5. Referral CRM linking

- New drawer section (bottom of Overview) **Referral Source** using `referral_lead_links`:
  - Shows current linked referral company + contact (name, org, phone/email) if a row exists for `lead_id`.
  - "Link referral source" button opens a picker (autocomplete over `referral_companies` and `referral_contacts`) with a "Create new" shortcut into the Referral CRM.
  - On save, upsert into `referral_lead_links` with `referral_company_id`, `referral_contact_id`, `referral_date`, `notes`. Support unlink.
- Deep-link the linked company/contact to `/referrals/companies/:id` / `/referrals/contacts/:id`.

## 6. Data & migrations

- New table `lead_documents` with GRANTs + RLS (authenticated intake/executive roles can select/insert/update/delete their org's docs; scoped by `has_role`).
- Storage bucket `lead-documents` (private) with RLS policies on `storage.objects` restricting to same set of roles.
- No schema changes needed for `intake_tasks`, `intake_communications`, `referral_lead_links` (already exist).

## 7. New / changed files

- `src/components/leads/LeadDetailDrawer.tsx` — reorganize tabs, add edit mode, upload, referral section, wire actions.
- `src/components/leads/LeadEditForm.tsx` — extracted edit form.
- `src/components/leads/LeadAssignInline.tsx` — thin wrapper around `IntakeCoordinatorPicker` for the header.
- `src/components/leads/CreateLeadTaskDialog.tsx` — shared task/follow-up dialog.
- `src/components/leads/AddLeadNoteDialog.tsx` — note dialog.
- `src/components/leads/LeadDocumentsPanel.tsx` — upload + list.
- `src/components/leads/LeadReferralLinkPanel.tsx` — referral picker/link.
- `src/hooks/useLeadDocuments.ts`, `src/hooks/useLeadReferralLink.ts` — data hooks.
- Migration for `lead_documents` + storage bucket creation.

## 8. QA

- Tests in `src/test/leadDrawerCrm.test.ts` covering: assign, inline edit save, note insert, task/follow-up create, document upload path builder, referral link upsert.
- Manual: open a lead, assign, edit fields, upload a PDF, add note, create task + follow-up, link a referral contact — confirm each appears in Activity / correct tab and persists after refresh.

## Out of scope (kept as stubs)

- Actual outbound send for Intake Packet & Consent Forms.
