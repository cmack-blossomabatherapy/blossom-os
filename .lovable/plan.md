## What we missed

The purge only emptied the storage buckets. The database rows that back the Resource Library were never deleted, so the UI still lists them (their signed-URL clicks would now 404).

Current state:
- `resource-library` bucket: empty ✓
- `knowledge-documents` bucket: empty ✓
- `public.hr_resources`: **3,309 active/published rows still present** (4,323 total)
- `public.knowledge_documents`: 0 rows ✓
- `public.knowledge_chunks`: **4,323 rows still present** (orphaned — parent docs gone)

## Plan

Run one migration that clears the metadata to match the empty buckets:

1. `TRUNCATE public.hr_resources RESTART IDENTITY CASCADE;` — removes every Resource Library row (matches the "fully remove all data" intent that motivated the bucket purge).
2. `TRUNCATE public.knowledge_chunks RESTART IDENTITY;` — clears the orphaned embedding chunks left behind after `knowledge_documents` was emptied.
3. Leave tables, RLS policies, buckets, and the `purge-buckets` edge function in place so future uploads work normally.

No code changes needed — `useLibraryResources` will naturally return `[]` and the library renders its empty state.

### Confirm before I run it
This is destructive and irreversible. Want me to also:
- (a) keep any `is_pinned` / admin-curated rows, or wipe everything? (default: wipe everything, matching the bucket purge)
- (b) also clear related tables like `hr_document_acknowledgements`, `academy_module_resources`, or `department_resources` that may reference resources? (default: leave them; CASCADE on `hr_resources` will handle FK-linked rows automatically)
