-- QA reconciliation pass on hr_resources: flag rows whose storage_path does not resolve
-- to an actual object in the configured bucket, and default safe values for rows that
-- were imported without a bucket / visibility_level.

-- 1) Records that claim to be uploaded but the storage object is missing.
UPDATE public.hr_resources h
SET
  upload_status = 'missing_file',
  attachment_status = 'pending_upload',
  is_active = false
WHERE h.storage_bucket IS NOT NULL
  AND h.storage_path   IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM storage.objects o
    WHERE o.bucket_id = h.storage_bucket AND o.name = h.storage_path
  )
  AND (h.upload_status IS DISTINCT FROM 'missing_file');

-- 2) Records with no bucket at all: mark as missing_file too so Super Admin can triage.
UPDATE public.hr_resources
SET upload_status = 'missing_file', attachment_status = 'pending_upload', is_active = false
WHERE (storage_bucket IS NULL OR storage_bucket = '')
  AND upload_status <> 'missing_file';

-- 3) Records with no visibility_level default to the safest scope (admin_only) so no
--    private/manifest row can accidentally leak to general staff.
UPDATE public.hr_resources
SET visibility_level = 'admin_only'
WHERE visibility_level IS NULL OR visibility_level = '';

-- 4) Sanity: any record still without departments and marked all_staff should be scoped
--    back to admin_only until curated (defense-in-depth).
UPDATE public.hr_resources
SET visibility_level = 'admin_only'
WHERE visibility_level = 'all_staff'
  AND (departments IS NULL OR array_length(departments,1) IS NULL)
  AND (visibility_roles IS NULL OR array_length(visibility_roles,1) IS NULL);
