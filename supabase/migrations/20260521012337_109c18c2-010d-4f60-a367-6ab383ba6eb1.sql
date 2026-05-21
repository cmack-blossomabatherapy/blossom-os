ALTER TABLE public.bcba_billable_sessions
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS service_location text,
  ADD COLUMN IF NOT EXISTS payor_name text,
  ADD COLUMN IF NOT EXISTS payor_type text,
  ADD COLUMN IF NOT EXISTS units numeric(10,2),
  ADD COLUMN IF NOT EXISTS charges_total numeric(12,2),
  ADD COLUMN IF NOT EXISTS amount_paid numeric(12,2),
  ADD COLUMN IF NOT EXISTS amount_owed numeric(12,2),
  ADD COLUMN IF NOT EXISTS is_billable boolean;

CREATE INDEX IF NOT EXISTS idx_bbs_state ON public.bcba_billable_sessions(state);
CREATE INDEX IF NOT EXISTS idx_bbs_state_date ON public.bcba_billable_sessions(state, date_of_service);