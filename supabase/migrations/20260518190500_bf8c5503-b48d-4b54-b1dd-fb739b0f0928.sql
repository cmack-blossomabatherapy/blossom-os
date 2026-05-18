-- Remove any duplicate source_id rows (keep the earliest) before adding the unique constraint
DELETE FROM public.bcba_billable_sessions a
USING public.bcba_billable_sessions b
WHERE a.source_id IS NOT NULL
  AND a.source_id = b.source_id
  AND a.ctid > b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS bcba_billable_sessions_source_id_key
  ON public.bcba_billable_sessions (source_id)
  WHERE source_id IS NOT NULL;
