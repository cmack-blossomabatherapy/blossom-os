ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS responsibilities text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.employees.responsibilities IS
  'Free-form list of role responsibilities, edited from the Org Chart settings page.';