# Resource Library — Operational Upload Runbook (Pass 4)

## Purpose

Give Resource Library admins a calm, repeatable workflow for uploading the
**291 ready files** from the prepared manifest in safe batches, while keeping
the **52 held files** (privacy/business/conversion/vault/excluded) in their
review queues. This runbook assumes Pass 3 storage wiring is live:

- Private bucket `resource-library`
- `hr_resources` metadata persistence
- Short-lived signed URLs for opens
- Published-only visibility for normal users

## Pre-upload checklist

Before clicking **Publish ready resources**, confirm:

1. You are signed in as an admin / HR manager with `hr.resources.manage`.
2. Files have been classified by the bulk upload panel.
3. No `_Sensitive_Not_For_Shared_Context` material is in the picker.
4. Role assignments look right on each ready candidate.
5. State scope is correct (blank = all states).
6. No filled-in / signed / consent files are in the ready queue.
7. No credential, login, password, or portal files are in the ready queue.
8. File names are clean — no PII in the title.
9. Mime type / extension is supported (no `.heic`, `.pages`, `.numbers`, `.key`).
10. You have time to verify the batch after upload — don't upload and walk away.

## Batch order

Upload in this order so the highest-value, lowest-risk batches go first:

1. **HR handbooks, job descriptions, general HR policies** (low risk, high value).
2. **Training / SOP library** (most-referenced operational docs).
3. **Scheduling / CentralReach guides**.
4. **Recruiting materials** (non-offer-letter, non-I9).
5. **Authorization / payer references** (blank templates only).
6. **Intake / benefits references**.
7. **Phone system docs**.
8. **Finance / payroll / bonus restricted docs** (after extra business review).
9. **Reviewed videos and converted files** — only after labels and conversions
   are complete; never publish unlabeled video.

## First batch recommendation

Start with **10–20 low-risk files**:

- Employee Handbook
- RBT Handbook
- BCBA Handbook
- State Director Handbook
- Core RBT / BCBA / State Director job descriptions
- A handful of well-known operational SOPs / training one-pagers

Do **not** put these in the first batch:

- Payer forms with filled / completed examples
- Wage, payroll, or bonus documents
- Offer letters
- I-9 / E-Verify documents
- Generic unlabeled videos
- OneNote, `.msg`, `.zip`, `.url` files
- Anything marked `privacy_review`, `business_review`, `needs_conversion`,
  `vault_only`, or `excluded`

## How to upload ready files

1. Navigate to `/hr/resource-management`.
2. Open the **Bulk upload & import** panel.
3. Click **Choose files** and select the batch (10–20 files).
4. Review each candidate's category, roles, sensitivity, and tags.
5. Confirm the **Ready to publish** queue chip matches your batch size.
6. Click **Publish ready resources**.
7. Wait for the panel to finish; failed items stay in the queue with a calm
   error chip and never produce a visible Resource Library row.

## How to verify a successful upload

- Published count in the summary cards increased by your batch size.
- The files appear in the central Resource Management table with
  `status = Published`.
- Open `/resource-library` as a non-admin role and confirm the file appears.

## How to verify role visibility

- Switch the active role (top-right role switcher) to each role assigned to a
  resource and confirm it appears in their library.
- Switch to a role that should NOT see it and confirm it is hidden.
- HR / payroll / leadership resources should never appear for RBT or
  scheduling roles.

## How to verify state visibility

- For state-scoped resources, switch the active state and confirm the file
  shows only in matching states.
- Blank state scope = all states.

## How to test signed URL open / download

- Open a published resource in `/resource-library`.
- Click **Open resource** — a new tab should open the signed URL.
- The URL should expire after ~10 minutes; refresh by re-clicking.
- No `href="#"` fallback should appear.

## How to handle failed uploads

- The candidate stays in the queue with an **Upload failed** chip.
- Read the error chip:
  - Network / 5xx — wait and retry.
  - RLS denied — confirm your account has `hr.resources.manage`.
  - Duplicate file — see duplicate handling below.
- No partial DB row is created; the storage file is removed automatically on
  DB insert failure.
- After fixing, re-click **Publish ready resources**.

## How to handle duplicate uploads

- The bulk upload panel warns when a candidate's title + category already
  matches an existing published resource. The warning does **not** block
  upload, but you should:
  1. Open the existing resource and decide whether to replace, archive, or
     skip the new upload.
  2. If replacing, archive the old version first.
  3. If skipping, click **Exclude** on the candidate.
- Storage paths include the resource UUID, so the bucket never collides even
  if the file name repeats.

## How to process held queues

Process held queues at the end of each batch:

- **Privacy review** — strip PII / replace with a generic template, then
  **Mark ready**.
- **Business review** — ping the document owner; once approved,
  **Mark ready**.
- **Needs conversion** — convert to PDF/DOCX, re-add the converted file.
- **Vault only** — leave in queue; these go to the admin vault, not the
  Resource Library.
- **Excluded** — leave excluded; do not re-route to ready.

## When to mark files excluded / vault-only

- **Excluded**: anything from `_Sensitive_Not_For_Shared_Context`, anything
  with real PHI/PII, anything that should never reach internal users.
- **Vault only**: credential / login / password / portal-access material.
  These remain visible to super-admin only and never appear in the standard
  Resource Library.

## Post-upload QA checklist

After each batch:

1. Published count matches expected delta.
2. No `Upload failed` chips remain unresolved.
3. Spot-check 3 resources for correct role visibility.
4. Spot-check 1 resource for state visibility (if state-scoped).
5. Spot-check 1 signed URL open.
6. Confirm no credential / login / vault file leaked into the standard
   library (search "login", "password", "credential", "vault" — should be
   empty for non-admin roles).
7. Confirm Training Academy SOP references still resolve where the SOP was
   newly uploaded.
8. Review the held queues and re-route any obvious mis-classifications.
9. Log the batch (number of files, batch label, any failures) in the team
   channel so the next admin picks up cleanly.
10. Stop and re-read this runbook before starting a higher-risk batch
    (payroll, finance, videos).
