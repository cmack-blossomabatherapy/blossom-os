DROP POLICY IF EXISTS "ctm_sync_runs_leadership_read" ON public.ctm_sync_runs;

CREATE POLICY "ctm_sync_runs_ops_read"
ON public.ctm_sync_runs
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'executive_leadership'::app_role)
  OR has_role(auth.uid(), 'operations_leadership'::app_role)
  OR has_role(auth.uid(), 'intake'::app_role)
  OR has_role(auth.uid(), 'intake_lead'::app_role)
  OR has_role(auth.uid(), 'intake_coordinator'::app_role)
  OR has_role(auth.uid(), 'state_director'::app_role)
  OR has_role(auth.uid(), 'marketing'::app_role)
  OR has_role(auth.uid(), 'marketing_growth_lead'::app_role)
  OR has_role(auth.uid(), 'marketing_team'::app_role)
);