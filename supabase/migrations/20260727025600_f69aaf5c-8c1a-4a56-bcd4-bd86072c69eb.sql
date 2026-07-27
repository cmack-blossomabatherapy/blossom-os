ALTER TYPE public.recruiting_role ADD VALUE IF NOT EXISTS 'Office Staff';
ALTER TYPE public.recruiting_role ADD VALUE IF NOT EXISTS 'Clinic Staff';
ALTER TABLE public.recruiting_candidates ADD COLUMN IF NOT EXISTS applied_title text;