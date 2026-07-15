CREATE POLICY "Authenticated can read case-manager-resources"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'case-manager-resources');