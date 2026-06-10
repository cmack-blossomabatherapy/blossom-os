-- Tighten referral-crm-files storage policies to require CRM access
DROP POLICY IF EXISTS "referral_crm_files_select" ON storage.objects;
DROP POLICY IF EXISTS "referral_crm_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "referral_crm_files_update" ON storage.objects;
DROP POLICY IF EXISTS "referral_crm_files_delete" ON storage.objects;

CREATE POLICY "referral_crm_files_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'referral-crm-files' AND public.can_access_referral_crm(auth.uid()));

CREATE POLICY "referral_crm_files_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'referral-crm-files' AND public.can_access_referral_crm(auth.uid()));

CREATE POLICY "referral_crm_files_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'referral-crm-files' AND public.can_access_referral_crm(auth.uid()))
  WITH CHECK (bucket_id = 'referral-crm-files' AND public.can_access_referral_crm(auth.uid()));

CREATE POLICY "referral_crm_files_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'referral-crm-files' AND public.can_access_referral_crm(auth.uid()));