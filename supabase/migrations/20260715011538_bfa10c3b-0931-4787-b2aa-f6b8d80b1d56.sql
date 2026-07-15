-- Allow authenticated users to read from the state-director-resources bucket via signed URLs.
DROP POLICY IF EXISTS "Authenticated can read state-director-resources" ON storage.objects;

CREATE POLICY "Authenticated can read state-director-resources"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'state-director-resources');