-- Uploaders can insert files into their own folder (first path segment = auth.uid())
CREATE POLICY "Escalation attachments: upload own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'escalation-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Uploaders can read/delete their own files
CREATE POLICY "Escalation attachments: read own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'escalation-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Escalation attachments: delete own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'escalation-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Thread participants can read any file referenced in a message on a thread they belong to
CREATE POLICY "Escalation attachments: participants read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'escalation-attachments'
  AND EXISTS (
    SELECT 1
    FROM public.escalation_thread_messages m
    JOIN public.escalation_threads t ON t.id = m.thread_id
    WHERE (auth.uid() = t.from_user_id OR auth.uid() = t.to_user_id)
      AND m.attachments @> jsonb_build_array(jsonb_build_object('path', storage.objects.name))
  )
);