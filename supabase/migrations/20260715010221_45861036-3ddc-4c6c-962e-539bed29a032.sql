CREATE POLICY "Authenticated read behavioral-support-resources"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'behavioral-support-resources');