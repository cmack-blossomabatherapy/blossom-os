
ALTER TABLE public.system_workflows ADD COLUMN IF NOT EXISTS verified_by_name text;
ALTER TABLE public.system_issues ADD COLUMN IF NOT EXISTS closed_by_name text;
COMMENT ON COLUMN public.system_workflows.verified_by IS 'auth.users id of the verifier';
COMMENT ON COLUMN public.system_workflows.verified_by_name IS 'display name captured at verification time for audit UI';
COMMENT ON COLUMN public.system_issues.closed_by IS 'auth.users id of the person who resolved';
COMMENT ON COLUMN public.system_issues.closed_by_name IS 'display name captured at resolution time for audit UI';
