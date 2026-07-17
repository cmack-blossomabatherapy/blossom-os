
CREATE POLICY "cr-sync-source admin read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'cr-sync-source' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operations_leadership') OR public.has_role(auth.uid(),'super_admin')));
CREATE POLICY "cr-sync-source admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cr-sync-source' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operations_leadership') OR public.has_role(auth.uid(),'super_admin')));
CREATE POLICY "cr-sync-source admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'cr-sync-source' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')));
