# Resource Library — Multi-Batch Import (Batches 01–08)

## Pipeline

1. **Manifest source of truth:** the per-role `00 - INDEX - *.csv` files inside each `UPLOAD BATCH NN/` bundle. Rows are deduplicated by `resource_id`; roles, departments, tags, and state scope are unioned across every index that mentions the resource.
2. **Metadata upsert:** the edge function `resource-library-ingest` (guarded by `RESOURCE_INGEST_SECRET`, service role internally) upserts each row into `public.hr_resources` keyed on `resource_id`.
3. **File bytes:** each batch that ships PDFs/videos flips matching rows from `attachment_status='pending_upload'` to `available` and `upload_status='pending_review'` to `published` once the file lands in the `resource-library` storage bucket at `<category>/<resource_id>/<safe-file-name>`.

## `hr_resources` fields added for the import

| Column | Purpose |
| --- | --- |
| `resource_id` (unique) | Stable manifest key (`RFO-#####`). Upsert target. |
| `manifest_upload_path` | Path recorded in the master manifest. |
| `import_batch` | 1–8. Which batch delivered/announced the row. |
| `pending_reason` | `awaiting_file_ingest` or `file_not_in_current_batch`. |
| `visibility_level`, `state_scope`, `topic_tags` | Manifest columns preserved verbatim. |
| `is_sensitive`, `requires_acknowledgement`, `training_related`, `sop_related` | Manifest booleans that gate visibility. |
| `owner`, `last_reviewed_date` | Manifest metadata surfaced in the detail view. |

## Role mapping (manifest label → `OSRole`)

```
Super Admin                → super_admin
Executive Leadership       → executive_leadership
Operations Leadership      → operations_leadership
State Director / Regional State Director / State VA → state_director
State Director Assistant   → assistant_state_director
Intake Team                → intake_coordinator
Authorizations Team        → authorization_coordinator
Scheduling Team            → scheduling_team
Staffing Team              → staffing_team
Recruiting Team            → recruiting_team
HR Team                    → hr_team
QA Team                    → qa_team
BCBA / RBT / Case Manager  → bcba / rbt / case_manager
Marketing Team             → marketing_team
Behavioral Support         → behavioral_support
Business Development       → business_development
Clinical Director          → clinical_director
Credentialing Team         → credentialing_team
Payroll / Billing / Finance → payroll_coordinator / billing_finance
```

Unmapped labels are logged by the aggregation script and rejected — no silent drops.

## Batch 01 result (metadata only, files ship in Batches 02–08 for most rows)

- 42,892 role-index rows scanned across 132 `00 - INDEX` CSVs.
- **8,723 unique resources upserted** into `hr_resources` with `import_batch = 1`.
- 1,310 files physically present in Batch 01 (their storage_path is pre-computed; awaiting file ingest).
- 7,413 rows marked `pending_reason='file_not_in_current_batch'` — they will flip to available as later batches land.
- 2,947 rows flagged `is_sensitive=true`; those inherit `sensitivity='role_restricted'` or `admin_only` from the manifest's `visibility_level`.

## Running the ingest for a later batch

```sh
# 1. Extract the batch zip somewhere on the sandbox
unzip UPLOAD_BATCH_0N.zip -d /tmp/bN

# 2. Aggregate INDEX csvs → /tmp/batchN_hr_resources.csv (same script pattern as Batch 01)
# 3. POST rows in ~400-row chunks to:
#      $VITE_SUPABASE_URL/functions/v1/resource-library-ingest
#    with header  x-ingest-secret: $RESOURCE_INGEST_SECRET
# 4. For files present, upload to the `resource-library` bucket at
#      <category>/<resource_id>/<safe-file-name>
#    then flip attachment_status='available', upload_status='published' on those rows.
```

## QA checks the Library must run after every batch

- Missing file / duplicate title / missing role visibility.
- Sensitive resource visible too broadly (any `is_sensitive=true` row with `visibility_roles` beyond leadership/admin/HR/finance/payroll should be flagged).
- Unknown role, unsupported file type, video with no playable file.
- Any row still `ready_for_upload` in the manifest but not imported after all 8 batches complete.

## Access

- **Super Admin** always sees every row plus import status (via `useAdminResources`).
- **Regular roles** only see rows with `upload_status='published'` AND their role in `visibility_roles`. Pending rows are hidden until their file lands.