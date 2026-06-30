
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='cred_docs_select') THEN
    CREATE POLICY cred_docs_select ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'credentialing-documents');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='cred_docs_insert') THEN
    CREATE POLICY cred_docs_insert ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'credentialing-documents');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='cred_docs_update') THEN
    CREATE POLICY cred_docs_update ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'credentialing-documents') WITH CHECK (bucket_id = 'credentialing-documents');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='cred_docs_delete') THEN
    CREATE POLICY cred_docs_delete ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'credentialing-documents');
  END IF;
END $$;
