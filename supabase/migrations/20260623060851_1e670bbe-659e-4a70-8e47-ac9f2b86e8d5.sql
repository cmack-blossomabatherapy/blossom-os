ALTER TABLE public.intake_leads
  ADD COLUMN IF NOT EXISTS assigned_intake_coordinator_user_id uuid NULL
    REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_intake_coordinator_employee_id uuid NULL
    REFERENCES public.employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_intake_leads_assigned_coord_user
  ON public.intake_leads (assigned_intake_coordinator_user_id);

CREATE INDEX IF NOT EXISTS idx_intake_leads_assigned_coord_employee
  ON public.intake_leads (assigned_intake_coordinator_employee_id);

COMMENT ON COLUMN public.intake_leads.assigned_intake_coordinator IS
  'Display name of the assigned intake coordinator. Kept for backward compatibility; use assigned_intake_coordinator_user_id / _employee_id for joins.';
COMMENT ON COLUMN public.intake_leads.assigned_intake_coordinator_user_id IS
  'Auth user id of the assigned intake coordinator (links to user management).';
COMMENT ON COLUMN public.intake_leads.assigned_intake_coordinator_employee_id IS
  'Employee record id of the assigned intake coordinator (links to HR / user management).';