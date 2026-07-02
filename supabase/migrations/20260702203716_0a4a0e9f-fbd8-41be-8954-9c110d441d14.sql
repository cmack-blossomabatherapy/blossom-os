
-- 1. Explicit Data API grants (policies remain the authorization layer)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_qa_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qa_note_monitoring TO authenticated;
GRANT ALL ON public.client_qa_reviews TO service_role;
GRANT ALL ON public.qa_note_monitoring TO service_role;

-- 2. CentralReach-ready source fields on client_qa_reviews
ALTER TABLE public.client_qa_reviews
  ADD COLUMN IF NOT EXISTS source_system text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_record_id text,
  ADD COLUMN IF NOT EXISTS source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS centralreach_sync_status text NOT NULL DEFAULT 'not_connected',
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

ALTER TABLE public.qa_note_monitoring
  ADD COLUMN IF NOT EXISTS source_system text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_record_id text,
  ADD COLUMN IF NOT EXISTS source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS centralreach_sync_status text NOT NULL DEFAULT 'not_connected',
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

-- 3. Lookup + partial unique indexes for source records
CREATE INDEX IF NOT EXISTS idx_client_qa_reviews_source
  ON public.client_qa_reviews (source_system, source_record_id);
CREATE INDEX IF NOT EXISTS idx_qa_note_monitoring_source
  ON public.qa_note_monitoring (source_system, source_record_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_client_qa_reviews_source_record
  ON public.client_qa_reviews (source_system, source_record_id)
  WHERE source_record_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_qa_note_monitoring_source_record
  ON public.qa_note_monitoring (source_system, source_record_id)
  WHERE source_record_id IS NOT NULL;
