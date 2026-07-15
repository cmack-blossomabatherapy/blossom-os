
-- Allow authenticated users to read Credentialing resource files (same pattern as other department buckets)
CREATE POLICY "Authenticated can read credentialing-resources"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'credentialing-resources');
