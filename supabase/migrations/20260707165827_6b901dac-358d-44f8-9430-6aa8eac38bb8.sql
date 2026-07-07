-- Operations Leadership Pass: extend system_issues for Request Intake
-- Adds Operations-oriented request metadata + link to Work Queue.
ALTER TABLE public.system_issues
  ADD COLUMN IF NOT EXISTS request_type text,
  ADD COLUMN IF NOT EXISTS affected_department text,
  ADD COLUMN IF NOT EXISTS affected_role text,
  ADD COLUMN IF NOT EXISTS affected_state text,
  ADD COLUMN IF NOT EXISTS affected_route text,
  ADD COLUMN IF NOT EXISTS impact text,
  ADD COLUMN IF NOT EXISTS desired_outcome text,
  ADD COLUMN IF NOT EXISTS due_date timestamptz,
  ADD COLUMN IF NOT EXISTS linked_work_item_id uuid REFERENCES public.operations_work_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_system_issues_linked_work_item ON public.system_issues(linked_work_item_id);
CREATE INDEX IF NOT EXISTS idx_system_issues_affected_department ON public.system_issues(affected_department);
CREATE INDEX IF NOT EXISTS idx_system_issues_affected_state ON public.system_issues(affected_state);
CREATE INDEX IF NOT EXISTS idx_system_issues_status ON public.system_issues(status);
CREATE INDEX IF NOT EXISTS idx_system_issues_priority ON public.system_issues(priority);