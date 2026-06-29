## Plan: make BCBA Productivity Uploads actually persist and show data

### What I found
- The backend tables for BCBA upload batches and billing rows currently have **0 rows**, so the report and uploads page are correctly showing no dataset.
- The browser network trace shows the file parsed and duplicate checks ran (`check_hashes`), but I do **not** see the later upload steps (`create_batch`, `append_rows`, `finalize_batch`) completing.
- The upload UI currently treats “Parsed 46,305 rows” as success even though that is only the preview step, not a committed upload.
- The Data API grants for the two BCBA upload tables are missing in the current database grant inspection, which can break client visibility even when policies exist.

### Fixes to implement
1. **Restore backend table access grants**
   - Add a database migration to explicitly grant authenticated users and backend service access to:
     - `bcba_productivity_upload_batches`
     - `bcba_productivity_billing_rows`
   - Keep the existing role-based row access policies intact.

2. **Make the upload flow impossible to mistake for saved data**
   - Change the preview toast from “Parsed…” success to a clear preview message: “Ready to append…”.
   - Only show a success toast after the backend confirms rows landed.
   - Add a clear warning/confirmation state if a file was parsed but not appended.

3. **Harden upload persistence for 46k+ rows**
   - Reduce upload chunk size to avoid edge function/request instability.
   - Add retry with backoff for row chunk inserts.
   - Refresh auth token during long uploads before retrying chunks.
   - Treat missing/invalid `inserted` counts as a hard error, not success.
   - Ensure `finalize_batch` verifies the actual backend row count before the UI says it worked.

4. **Improve admin upload page visibility**
   - Add an “Upload progress” panel that shows phases: parsing, duplicate check, creating batch, uploading rows, finalizing, verified.
   - After upload, reload the dataset status and show the verified active row count.
   - If active rows are still `0` after append, show an error explaining that nothing saved.

5. **Improve report loading feedback**
   - On `/reports/bcba-productivity-report-v3`, show a clear empty state when the shared admin dataset has no rows.
   - Add a “Refresh shared dataset” action so the report can reload immediately after an admin upload.

6. **Validate after changes**
   - Query the backend counts after the migration/fix.
   - Test the upload service with a small synthetic payload first.
   - Confirm rows appear in upload history and load in the report.

### Technical notes
- Files to update:
  - `src/lib/os/bcbaProductivityV3/adminUploadStore.ts`
  - `src/pages/os/system/BcbaProductivityUploads.tsx`
  - `src/pages/os/reports/BcbaProductivityReportV3.tsx`
  - `supabase/functions/bcba-productivity-upload/index.ts` if chunk response handling needs extra diagnostics
- Backend migration will only adjust permissions/grants and preserve existing role visibility rules.