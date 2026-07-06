
ALTER TABLE public.state_operational_tasks
  ADD COLUMN IF NOT EXISTS lead_ref TEXT,
  ADD COLUMN IF NOT EXISTS client_ref TEXT,
  ADD COLUMN IF NOT EXISTS candidate_ref TEXT,
  ADD COLUMN IF NOT EXISTS authorization_ref TEXT,
  ADD COLUMN IF NOT EXISTS scheduling_item_ref TEXT;

ALTER TABLE public.state_operational_escalations
  ADD COLUMN IF NOT EXISTS lead_ref TEXT,
  ADD COLUMN IF NOT EXISTS client_ref TEXT,
  ADD COLUMN IF NOT EXISTS candidate_ref TEXT,
  ADD COLUMN IF NOT EXISTS authorization_ref TEXT,
  ADD COLUMN IF NOT EXISTS scheduling_item_ref TEXT;

ALTER TABLE public.state_department_handoffs
  ADD COLUMN IF NOT EXISTS lead_ref TEXT,
  ADD COLUMN IF NOT EXISTS client_ref TEXT,
  ADD COLUMN IF NOT EXISTS candidate_ref TEXT,
  ADD COLUMN IF NOT EXISTS authorization_ref TEXT,
  ADD COLUMN IF NOT EXISTS scheduling_item_ref TEXT;
