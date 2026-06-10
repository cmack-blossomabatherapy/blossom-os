DROP POLICY IF EXISTS "Authenticated users can read BCBA assignment history" ON public.bcba_assignment_history;

CREATE POLICY "Operational roles can read BCBA assignment history"
ON public.bcba_assignment_history
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'exec'::public.app_role)
  OR public.has_role(auth.uid(), 'ops_manager'::public.app_role)
  OR public.has_role(auth.uid(), 'finance'::public.app_role)
  OR public.has_role(auth.uid(), 'state_director'::public.app_role)
  OR public.has_role(auth.uid(), 'bcba'::public.app_role)
  OR public.has_role(auth.uid(), 'qa'::public.app_role)
);