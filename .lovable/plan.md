## Goal

Tighten the "New Lead" experience and stand up real document storage + a clean home for automated emails on the admin side. No workflow-area automation buttons yet (per your note), and no new unrelated department pages.

## 1. New Lead → Workflow tab makes sense

In `src/components/leads/NewLeadDialog.tsx`:

- Add a `STAGE_NEXT_ACTIONS` map (one recommended next action per canonical pipeline stage, e.g. `Lead Captured → "Log first contact attempt"`, `Intake Packet Sent → "Follow up on intake packet"`, etc. — driven from the same `intakeWorkflow.ts` helpers, so it stays consistent with the rest of intake).
- When the user changes **Pipeline Stage**:
  - Auto-set **Next Action** to the recommended action for that stage (only overwrites if the field is empty or still equals the previous stage's recommendation — so manual edits are preserved).
  - Auto-set **Next Task Due** to `today + getStageSlaDays(stage)` using the same SLA the rest of intake uses (only overwrites if empty or still equals previous stage's auto value).
- **Last Contact Date** on creation is forced to today and rendered **disabled / grayed out** with a small helper line: *"Set automatically — this is the contact being created."* The value is still persisted.
- Small "Auto" badge next to Next Action / Next Task Due so the user understands those were filled by the pipeline stage and can be overridden.

No new schema, no API changes. Pure UI logic on top of `FAMILY_LEAD_PIPELINE_STAGES`, `getStageSlaDays`, and a small per-stage next-action map colocated with the workflow helpers.

## 2. Docs section: real storage + human follow-up requests

### 2a. Stop saying "pending storage connection"

- Migration: create a private `lead-documents` storage bucket with RLS so only authenticated users in roles that already see intake leads can read/write objects under `lead-documents/{lead_id}/...`. Service role keeps full access.
- New helper `src/lib/leads/leadDocumentStorage.ts` with `uploadLeadDocument(file, { leadId, type })` that uploads to the bucket and returns `{ path, publicUrl?, size }`.
- Update the `DocumentsTab` (used in New Lead dialog) and the Docs section of `LeadDetailDrawer.tsx`:
  - When a file is added, upload immediately (with a small spinner per row).
  - On success: `storageStatus: "uploaded"` + store `storagePath`.
  - On failure: `storageStatus: "failed"` with retry button.
  - The "pending storage connection" banner is removed; replaced with a tiny "Stored securely in Blossom" line.
- `intake_documents` rows already exist for created leads — extend the persisted shape to include `storage_path` so the file can be opened later (signed URL on click).

### 2b. "Request document" follow-up button on each missing/expected doc

In `LeadDetailDrawer.tsx` Docs section (the drawer is now the canonical lead surface after Export 89):

- Per document type chip (Insurance Card, Diagnosis, Intake Packet, Consent Form, …), if the lead does not have one yet, render a **"Request from parent"** button.
- Clicking it opens a small confirmation popover that previews a human-sounding email pulled from a named template (e.g. `document-request-insurance-card`), e.g.:

  > Hi {{parent_first_name}},
  >
  > It was great connecting about {{patient_first_name}}. To keep the intake moving, could you send over a quick photo or PDF of your insurance card when you get a moment? You can reply directly to this email with it attached.
  >
  > Thanks so much — let me know if anything else comes up.
  > {{intake_coordinator_name}}, Blossom ABA Therapy

- Send goes through the existing `sendLeadEmail(lead, templateKey)` adapter (the email integration is already wired; if Mailchimp isn't configured the existing toast tells the admin to finish setup — same behavior as the rest of intake).
- Each send logs to `intake_communications` so the activity timeline shows "Requested Insurance Card from parent."

No new "Send Welcome" / generic workflow automation buttons yet — only document follow-up requests, per your instructions.

## 3. Admin home for automated emails

New admin-only page **Admin → Automated Emails** at `/admin/automated-emails` (added under the existing Admin section in the role menu, not Super Admin and not a new department):

- Lists every email/SMS template the system can send (intake packet, missing-info reminder, benefits update, document-request-*, general follow-up, etc.), pulled from a single registry file `src/lib/integrations/communications/templateRegistry.ts`.
- Each row shows: template key, channel (Email / SMS), where it's used (e.g. "Lead drawer → Request Insurance Card"), provider (Mailchimp Email / Mailchimp SMS), and current status (Configured / Needs setup).
- Clicking a row opens a drawer with the full subject + body in a read/edit view. Edits save to a new `email_templates` table (admins only, RLS via existing `has_role(_, 'admin')`). The send adapters read from that table first and fall back to the in-code defaults.
- No automation engine UI yet — this page is purely "see, understand, edit the messages we send to parents."

## 4. Tests

- `intakeNewLeadWorkflowAutofill.test.tsx` — changing pipeline stage updates Next Action + Next Task Due; manual edits are preserved; Last Contact Date is disabled and equals today.
- `leadDocumentStorage.test.ts` — uploads route through the `lead-documents` bucket; storage status flips from pending → uploaded.
- `leadDocumentRequestEmails.test.ts` — clicking "Request from parent" calls `sendLeadEmail` with the correct `document-request-*` template and logs to `intake_communications`.
- `adminAutomatedEmailsPage.test.tsx` — page is gated to admin, renders the registry, allows edit + save.

## Technical notes

- All canonical stage logic continues to flow through `src/lib/intake/intakeWorkflow.ts` — the new `STAGE_NEXT_ACTIONS` map and any "auto" detection live there so other surfaces (drawer quick actions, dashboards) can reuse it later.
- New tables/buckets ship with explicit `GRANT`s and RLS:
  - `email_templates`: `SELECT` to authenticated, `INSERT/UPDATE/DELETE` only via `has_role(auth.uid(), 'admin')`.
  - `lead-documents` bucket: object policies restrict to authenticated users on rows where the parent `intake_leads` row is visible to them (matches existing intake RLS).
- No edits to auto-generated files (`src/integrations/supabase/client.ts`, `types.ts`, `.env`).

## Out of scope (explicitly not in this run)

- Workflow-area automation buttons ("Resend welcome", etc.) — deferred per your note.
- Active patient workflows.
- A general automations engine UI (only the email-templates view ships now).
- Touching unrelated departments.
