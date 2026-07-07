ALTER TABLE public.system_workflows
  ADD COLUMN IF NOT EXISTS related_route text,
  ADD COLUMN IF NOT EXISTS related_integration_id uuid,
  ADD COLUMN IF NOT EXISTS risk_level text,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid;

ALTER TABLE public.system_issues
  ADD COLUMN IF NOT EXISTS severity text,
  ADD COLUMN IF NOT EXISTS reproduction_steps text,
  ADD COLUMN IF NOT EXISTS resolution_notes text,
  ADD COLUMN IF NOT EXISTS related_route text,
  ADD COLUMN IF NOT EXISTS related_integration_id uuid,
  ADD COLUMN IF NOT EXISTS closed_by uuid;

CREATE INDEX IF NOT EXISTS idx_system_workflows_status ON public.system_workflows(status);
CREATE INDEX IF NOT EXISTS idx_system_workflows_department ON public.system_workflows(department);
CREATE INDEX IF NOT EXISTS idx_system_workflows_risk_level ON public.system_workflows(risk_level);
CREATE INDEX IF NOT EXISTS idx_system_issues_severity ON public.system_issues(severity);