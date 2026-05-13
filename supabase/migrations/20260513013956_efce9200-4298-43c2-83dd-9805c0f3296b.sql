CREATE UNIQUE INDEX IF NOT EXISTS idx_bbs_source_unique
  ON public.bcba_billable_sessions (source_id)
  WHERE source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bbs_import_date
  ON public.bcba_billable_sessions (import_id, date_of_service);