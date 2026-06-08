ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS mentor_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_mentor ON public.employees(mentor_id);