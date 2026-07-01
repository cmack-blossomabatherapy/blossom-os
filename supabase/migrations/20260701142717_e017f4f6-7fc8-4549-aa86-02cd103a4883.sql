ALTER TABLE public.marketing_source_events
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_marketing_source_events_assigned_to
  ON public.marketing_source_events (assigned_to);