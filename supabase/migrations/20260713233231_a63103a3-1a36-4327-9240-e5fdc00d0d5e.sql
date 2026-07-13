
ALTER TABLE public.company_calendar_events
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS related_record_type text,
  ADD COLUMN IF NOT EXISTS related_record_id text,
  ADD COLUMN IF NOT EXISTS related_record_label text,
  ADD COLUMN IF NOT EXISTS related_url text,
  ADD COLUMN IF NOT EXISTS next_step text;
