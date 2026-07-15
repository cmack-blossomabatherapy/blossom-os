DROP POLICY IF EXISTS "Authenticated can read state-director-assistant-resources" ON storage.objects;
CREATE POLICY "Authenticated can read state-director-assistant-resources"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'state-director-assistant-resources');