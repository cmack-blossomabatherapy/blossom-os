ALTER TABLE public.journey_phase_overrides
  ADD COLUMN IF NOT EXISTS eyebrow text,
  ADD COLUMN IF NOT EXISTS title_highlight text;