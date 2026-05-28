
## Goal
Whenever an evaluation is marked complete, automatically save a PDF copy of the evaluation summary to a SharePoint document library, so the team has an offline/archived copy outside the app.

## How it will work

```text
Evaluation completed
   │
   ▼
Client builds summary HTML (existing pdf.ts)
   │
   ▼
Client renders HTML → PDF (html2pdf.js in browser)
   │
   ▼
POST PDF (base64) + metadata to edge function
   │
   ▼
Edge function → Microsoft Graph (via Lovable connector gateway)
   │
   ▼
File lands in SharePoint:
  /sites/{BlossomSite}/Shared Documents/Evaluations/{State}/{Employee} - {Type} - {Date}.pdf
```

We will also store a small `evaluation_archives` row (path, sharepoint URL, uploaded_at, status) so the UI can show "Archived to SharePoint ✓" and we can retry failures.

## Steps

1. **Connect SharePoint**
   - Link the Microsoft SharePoint connector to the project (OAuth as a Blossom admin account that has write access to the target site).
   - Ask the user which SharePoint **site** and **folder path** to use (e.g. `HR / Evaluations`). Store as edge-function secrets: `SHAREPOINT_SITE_ID`, `SHAREPOINT_FOLDER_PATH`.

2. **PDF generation (client)**
   - Add `html2pdf.js` (or `jspdf` + `html2canvas`).
   - Refactor `pdf.ts`:
     - Keep `buildEvaluationSummaryHtml` as-is.
     - Add `renderEvaluationPdfBlob(html)` that returns a `Blob`.
     - Keep `openPrintableSummary` for the manual "Print" action.

3. **New edge function: `archive-evaluation-pdf`**
   - Validates JWT + caller role (HR/admin/exec).
   - Input (Zod): `{ evaluation_id, staff_id, filename, pdf_base64 }`.
   - Calls Microsoft Graph via gateway:
     `PUT https://connector-gateway.lovable.dev/microsoft_sharepoint/sites/{SITE_ID}/drive/root:/{FOLDER}/{filename}:/content`
     with headers `Authorization: Bearer $LOVABLE_API_KEY`, `X-Connection-Api-Key: $MICROSOFT_SHAREPOINT_API_KEY`, `Content-Type: application/pdf`.
   - On success, inserts an `evaluation_archives` row with the returned `webUrl` + `driveItem.id`.
   - Returns `{ url, archived_at }`.

4. **Trigger on completion**
   - In `StaffProfileDrawer.tsx` (and any other place that sets `final_status = 'Complete'`), after the status update succeeds:
     - Build HTML → render PDF blob → base64 → invoke `archive-evaluation-pdf`.
     - Show toast: "Saved to SharePoint" or "Saved locally — SharePoint upload failed, will retry".
   - Add a small "Re-archive to SharePoint" button on completed evaluations for manual retry.

5. **Database migration**
   - New table `evaluation_archives` (`evaluation_id`, `staff_id`, `sharepoint_url`, `sharepoint_item_id`, `filename`, `status`, `error`, `uploaded_by`, timestamps).
   - GRANTs + RLS scoped via existing `eval_can_access()` helper. Service role full access (used by the edge function).

6. **Backfill (optional, ask user)**
   - Optional script/button to upload PDFs for already-completed evaluations.

## What I need from you before building

1. Which SharePoint **site** should we use? (e.g. `https://blossomaba.sharepoint.com/sites/HR`)
2. Which **folder** inside that site? (suggested: `Shared Documents/Evaluations/{State}/{Employee}`)
3. Confirm you want me to link the **Microsoft SharePoint** connector now (you'll be prompted to sign in with a Blossom admin Microsoft account that has write access to that site).
4. Should we **backfill** PDFs for evaluations already marked complete, or only new ones from this point forward?

Once you answer those, I'll connect SharePoint, run the migration, ship the edge function, and wire the auto-upload into the completion flow.
