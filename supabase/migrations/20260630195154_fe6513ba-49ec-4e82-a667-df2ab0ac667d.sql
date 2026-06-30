
CREATE OR REPLACE FUNCTION public.has_credentialing_write_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN (
        'admin','super_admin','systems_admin',
        'credentialing_lead','credentialing_team',
        'credentialing','credentialing_coordinator'
      )
  );
$$;

DROP POLICY IF EXISTS cred_docs_select ON storage.objects;
DROP POLICY IF EXISTS cred_docs_insert ON storage.objects;
DROP POLICY IF EXISTS cred_docs_update ON storage.objects;
DROP POLICY IF EXISTS cred_docs_delete ON storage.objects;
DROP POLICY IF EXISTS cred_docs_service_all ON storage.objects;

CREATE POLICY cred_docs_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'credentialing-documents'
         AND public.has_credentialing_write_access(auth.uid()));

CREATE POLICY cred_docs_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'credentialing-documents'
              AND public.has_credentialing_write_access(auth.uid()));

CREATE POLICY cred_docs_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'credentialing-documents'
         AND public.has_credentialing_write_access(auth.uid()))
  WITH CHECK (bucket_id = 'credentialing-documents'
              AND public.has_credentialing_write_access(auth.uid()));

CREATE POLICY cred_docs_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'credentialing-documents'
         AND public.has_credentialing_write_access(auth.uid()));

CREATE POLICY cred_docs_service_all ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'credentialing-documents')
  WITH CHECK (bucket_id = 'credentialing-documents');

ALTER TABLE public.credentialing_activity
  ALTER COLUMN credentialing_record_id DROP NOT NULL;

ALTER TABLE public.credentialing_activity
  ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.credentialing_providers(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_cred_activity_provider
  ON public.credentialing_activity(provider_id, created_at DESC);

ALTER TABLE public.credentialing_records
  ADD COLUMN IF NOT EXISTS centralreach_sync_error TEXT,
  ADD COLUMN IF NOT EXISTS centralreach_last_readiness_at TIMESTAMPTZ;
