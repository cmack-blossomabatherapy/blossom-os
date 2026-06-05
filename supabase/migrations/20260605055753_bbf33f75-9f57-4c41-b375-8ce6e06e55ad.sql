
-- Extend hr_resources with bulk-upload metadata fields used by Resource Library Pass 3
ALTER TABLE public.hr_resources
  ADD COLUMN IF NOT EXISTS upload_status      text NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS attachment_status  text NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS sensitivity        text NOT NULL DEFAULT 'public_internal',
  ADD COLUMN IF NOT EXISTS resource_type      text,
  ADD COLUMN IF NOT EXISTS source_note        text,
  ADD COLUMN IF NOT EXISTS tags               text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS departments        text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS file_name          text,
  ADD COLUMN IF NOT EXISTS file_size          bigint,
  ADD COLUMN IF NOT EXISTS mime_type          text,
  ADD COLUMN IF NOT EXISTS storage_bucket     text;

CREATE INDEX IF NOT EXISTS idx_hr_resources_upload_status ON public.hr_resources(upload_status);

-- Storage policies for the resource-library bucket.
-- Admins / users with hr.resources.manage can upload, update, delete.
-- Users with hr.resources.view (or hr.view) can read.
DROP POLICY IF EXISTS "resource-library admins manage" ON storage.objects;
CREATE POLICY "resource-library admins manage"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'resource-library' AND public.has_permission(auth.uid(), 'hr.resources.manage'))
  WITH CHECK (bucket_id = 'resource-library' AND public.has_permission(auth.uid(), 'hr.resources.manage'));

DROP POLICY IF EXISTS "resource-library viewers read" ON storage.objects;
CREATE POLICY "resource-library viewers read"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resource-library' AND (
      public.has_permission(auth.uid(), 'hr.resources.view') OR
      public.has_permission(auth.uid(), 'hr.view')
    )
  );
