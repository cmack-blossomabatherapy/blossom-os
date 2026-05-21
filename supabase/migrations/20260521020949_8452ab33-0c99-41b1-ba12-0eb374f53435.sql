ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS viventium_employee_id TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS hire_date DATE,
  ADD COLUMN IF NOT EXISTS employment_type TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_viventium ON public.profiles(viventium_employee_id) WHERE viventium_employee_id IS NOT NULL;