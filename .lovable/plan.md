## Diagnosis

The CentralReach Data Hub calls `listSharedReportDatasets(...)` and `listBcbaProductivityUploadBatches()` on page load. Both hit PostgREST with the authenticated role.

Verified against the live database:
- `public.shared_report_datasets` — RLS policies exist for authenticated SELECT/INSERT/UPDATE/DELETE, but **zero table GRANTs** to any role.
- `public.bcba_productivity_upload_batches` — same: policies present, **no GRANTs**.
- Data is still there: `shared_report_datasets` has 4 rows, `bcba_productivity_upload_batches` has 1 row.

Without explicit GRANTs, PostgREST returns `permission denied for table …`, the `Promise.all` in `refresh()` rejects, and the catch block shows `Failed to load upload history: [object Object]` (a `PostgrestError` doesn't stringify to a message via `String(e)`).

Nothing was deleted — the previous uploads are intact. Restoring the GRANTs makes the existing history reappear immediately; no re-import of the attached CSVs is required (they're already represented by these rows / their storage objects).

## Fix (single migration)

Restore Data-API grants for both tables, matching their policy audience (authenticated + service_role, no anon):

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_report_datasets TO authenticated;
GRANT ALL ON public.shared_report_datasets TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_productivity_upload_batches TO authenticated;
GRANT ALL ON public.bcba_productivity_upload_batches TO service_role;
```

Also audit sibling tables written by the same admin flows and grant them the same way if they're missing grants (checked in the same migration, only granting where absent):
- `bcba_productivity_upload_rows`
- `bcba_productivity_upload_row_errors`
- any other `bcba_productivity_*` table the hub reads via `getBcbaProductivityDatasetStatus`

## Small UX improvement

In `src/pages/os/system/CentralReachUploads.tsx`, improve the error surface so future PostgREST errors show a real message instead of `[object Object]`:

```ts
const msg =
  (e as { message?: string })?.message ??
  (typeof e === "string" ? e : JSON.stringify(e));
```

## Verification

1. Re-run `select count(*)` on both tables (already confirms rows exist).
2. Reload `/admin/centralreach-hub` (or wherever the hub is mounted) as an authenticated admin — the "Upload history" section should populate with the 4 shared datasets + 1 BCBA batch.
3. Confirm no red toast and no console PostgREST 401/403 for these tables.

## What is NOT changed

- No RLS policy changes (policies are correct; only grants were missing).
- No changes to storage buckets or uploaded files.
- No changes to the actual import/parse code paths.
