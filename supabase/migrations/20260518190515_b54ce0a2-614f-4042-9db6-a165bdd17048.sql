DROP INDEX IF EXISTS public.bcba_billable_sessions_source_id_key;
ALTER TABLE public.bcba_billable_sessions
  ADD CONSTRAINT bcba_billable_sessions_source_id_key UNIQUE (source_id);
