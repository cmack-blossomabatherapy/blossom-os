ALTER TABLE public.onboarding_state
ADD COLUMN IF NOT EXISTS reset_count integer NOT NULL DEFAULT 0;