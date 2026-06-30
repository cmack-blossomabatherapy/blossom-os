
ALTER TABLE public.credentialing_documents
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS credentialing_records_legacy_raw_unique
  ON public.credentialing_records(legacy_monday_raw_id)
  WHERE legacy_monday_raw_id IS NOT NULL;
