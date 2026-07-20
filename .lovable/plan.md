## Diagnosis

The CentralReach Upload Hub is still failing because the involved upload-history tables have RLS policies but no Data API grants at all. I verified this directly in the database:

- `shared_report_datasets`: 4 existing uploaded datasets are still present, but zero grants exist.
- `bcba_productivity_upload_batches`: 1 existing batch is still present, but zero grants exist.
- `bcba_productivity_billing_rows`: 47,533 existing rows are still present, but zero grants exist.
- The hub also touches `cr_sync_runs` and `cr_data_quality_exceptions`, which likewise have policies but no grants.
- The helper functions used by those policies (`has_role`, `can_read_bcba_productivity`, `can_manage_bcba_productivity_uploads`, `cr_sync_freshness`) also currently show no explicit execute grants for app roles.

So the data was not deleted; the app is being blocked from reading it.

## Fix plan

1. **Run one backend migration to restore app access**
   - Grant authenticated app users access to the upload hub tables according to their existing RLS policies.
   - Grant backend service access for admin/import jobs.
   - Do not grant anonymous access.

2. **Restore function execution permissions used by RLS**
   - Grant authenticated users permission to execute the role/access helper functions required by these policies.
   - Include backend service execution access as well.

3. **Harden the hub UI so one failing source does not break the whole hub**
   - Update `CentralReachUploads.tsx` so upload history loads sources independently.
   - If one dataset source fails, show the real error message and still display the other available upload history.

4. **Harden Unified Import History**
   - Update `CentralReachHub.tsx` so the unified history tab handles per-source query errors instead of silently staying stuck on “Loading…” or blanking out.
   - Surface clear source-specific messages for future permission/column issues.

5. **Verify after approval**
   - Confirm grants exist for the affected tables/functions.
   - Confirm existing row counts remain visible.
   - Reload the CentralReach Hub and verify upload history renders without the “Failed to load upload history” toast.