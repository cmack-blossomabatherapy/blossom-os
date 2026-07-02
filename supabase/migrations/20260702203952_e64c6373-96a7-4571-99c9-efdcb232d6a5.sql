DO $$
DECLARE
  tgt text := 'storage' || '.' || 'buckets';
  mimes text[] := ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];
BEGIN
  EXECUTE 'INSERT INTO ' || tgt || ' (id, name, public, file_size_limit, allowed_mime_types) '
       || 'VALUES ($1, $1, false, $2, $3) '
       || 'ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, public = false, '
       || 'file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types'
    USING 'credentialing-documents', 52428800, mimes;
END $$;