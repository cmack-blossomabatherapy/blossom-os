
ALTER TABLE public.marketing_call_events
  ADD COLUMN IF NOT EXISTS direction text,
  ADD COLUMN IF NOT EXISTS call_category text,
  ADD COLUMN IF NOT EXISTS disposition text,
  ADD COLUMN IF NOT EXISTS assigned_owner_id uuid,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_mce_direction ON public.marketing_call_events(direction);
CREATE INDEX IF NOT EXISTS idx_mce_call_category ON public.marketing_call_events(call_category);
CREATE INDEX IF NOT EXISTS idx_mce_disposition ON public.marketing_call_events(disposition);
