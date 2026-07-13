
DROP POLICY IF EXISTS "Resource Library role-scoped read" ON storage.objects;

CREATE POLICY "Resource Library role-scoped read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('resource-library','resource-videos','knowledge-documents','bcba-imports','data-uploads')
  AND EXISTS (
    SELECT 1
    FROM public.hr_resources h
    WHERE h.storage_bucket = storage.objects.bucket_id
      AND h.storage_path   = storage.objects.name
      AND public.hr_resource_visible(
            auth.uid(),
            h.visibility_level,
            h.visibility_roles,
            h.tags,
            h.is_sensitive
          )
  )
);
