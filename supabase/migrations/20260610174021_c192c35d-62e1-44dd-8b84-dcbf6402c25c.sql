DROP POLICY IF EXISTS "Authenticated users can maintain BCBA assignment history" ON public.bcba_assignment_history;

CREATE POLICY "Leadership can create BCBA assignment history"
ON public.bcba_assignment_history
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'exec'::public.app_role)
  OR public.has_role(auth.uid(), 'ops_manager'::public.app_role)
  OR public.has_role(auth.uid(), 'finance'::public.app_role)
);

CREATE POLICY "Leadership can update BCBA assignment history"
ON public.bcba_assignment_history
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'exec'::public.app_role)
  OR public.has_role(auth.uid(), 'ops_manager'::public.app_role)
  OR public.has_role(auth.uid(), 'finance'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'exec'::public.app_role)
  OR public.has_role(auth.uid(), 'ops_manager'::public.app_role)
  OR public.has_role(auth.uid(), 'finance'::public.app_role)
);

CREATE POLICY "Leadership can delete BCBA assignment history"
ON public.bcba_assignment_history
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'exec'::public.app_role)
  OR public.has_role(auth.uid(), 'ops_manager'::public.app_role)
  OR public.has_role(auth.uid(), 'finance'::public.app_role)
);