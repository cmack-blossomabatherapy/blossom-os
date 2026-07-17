
CREATE POLICY "preb docs read own or internal" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'rbt-preboarding-docs' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_preboarding_internal_access(auth.uid())
  ));
CREATE POLICY "preb docs insert own or internal" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'rbt-preboarding-docs' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_preboarding_internal_access(auth.uid())
  ));
CREATE POLICY "preb docs update own or internal" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'rbt-preboarding-docs' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_preboarding_internal_access(auth.uid())
  ));
CREATE POLICY "preb docs delete internal" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'rbt-preboarding-docs' AND public.has_preboarding_internal_access(auth.uid()));
