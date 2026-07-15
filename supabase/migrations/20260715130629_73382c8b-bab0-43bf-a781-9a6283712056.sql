
CREATE TABLE IF NOT EXISTS public.shared_report_datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_key text NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  notes text,
  uploaded_by uuid,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS shared_report_datasets_key_active_idx
  ON public.shared_report_datasets (report_key, is_active, uploaded_at DESC);

GRANT SELECT ON public.shared_report_datasets TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shared_report_datasets TO authenticated;
GRANT ALL ON public.shared_report_datasets TO service_role;

ALTER TABLE public.shared_report_datasets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read shared report datasets" ON public.shared_report_datasets;
CREATE POLICY "authenticated read shared report datasets"
  ON public.shared_report_datasets FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin insert shared report datasets" ON public.shared_report_datasets;
CREATE POLICY "admin insert shared report datasets"
  ON public.shared_report_datasets FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "admin update shared report datasets" ON public.shared_report_datasets;
CREATE POLICY "admin update shared report datasets"
  ON public.shared_report_datasets FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "admin delete shared report datasets" ON public.shared_report_datasets;
CREATE POLICY "admin delete shared report datasets"
  ON public.shared_report_datasets FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Authenticated read shared report dataset files" ON storage.objects;
CREATE POLICY "Authenticated read shared report dataset files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'data-uploads' AND name LIKE 'shared-report-datasets/%');

DROP POLICY IF EXISTS "Admins write shared report dataset files" ON storage.objects;
CREATE POLICY "Admins write shared report dataset files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'data-uploads'
    AND name LIKE 'shared-report-datasets/%'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "Admins delete shared report dataset files" ON storage.objects;
CREATE POLICY "Admins delete shared report dataset files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'data-uploads'
    AND name LIKE 'shared-report-datasets/%'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
