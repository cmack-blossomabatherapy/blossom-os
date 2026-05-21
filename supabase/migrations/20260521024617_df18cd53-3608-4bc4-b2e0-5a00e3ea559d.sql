CREATE POLICY "state_directors read imports"
ON public.bcba_billable_imports FOR SELECT
USING (
  has_role(auth.uid(), 'state_director'::app_role)
  OR has_role(auth.uid(), 'ops_manager'::app_role)
  OR has_role(auth.uid(), 'qa'::app_role)
  OR has_role(auth.uid(), 'auth_team'::app_role)
  OR has_role(auth.uid(), 'scheduling'::app_role)
);

CREATE POLICY "state_directors read sessions"
ON public.bcba_billable_sessions FOR SELECT
USING (
  has_role(auth.uid(), 'state_director'::app_role)
  OR has_role(auth.uid(), 'ops_manager'::app_role)
  OR has_role(auth.uid(), 'qa'::app_role)
  OR has_role(auth.uid(), 'auth_team'::app_role)
  OR has_role(auth.uid(), 'scheduling'::app_role)
);