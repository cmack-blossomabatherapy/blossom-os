DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='referral_crm_files_select') THEN
    CREATE POLICY "referral_crm_files_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'referral-crm-files');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='referral_crm_files_insert') THEN
    CREATE POLICY "referral_crm_files_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'referral-crm-files');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='referral_crm_files_update') THEN
    CREATE POLICY "referral_crm_files_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'referral-crm-files') WITH CHECK (bucket_id = 'referral-crm-files');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='referral_crm_files_delete') THEN
    CREATE POLICY "referral_crm_files_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'referral-crm-files');
  END IF;
END $$;
