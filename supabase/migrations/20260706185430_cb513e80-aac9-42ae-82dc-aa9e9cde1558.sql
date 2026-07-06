
DROP POLICY IF EXISTS academy_runtime_progress_admin_update ON public.academy_runtime_progress;

CREATE POLICY academy_runtime_progress_admin_update
  ON public.academy_runtime_progress FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'training_admin')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'coo')
    OR public.has_role(auth.uid(), 'operations_leadership')
    OR public.has_role(auth.uid(), 'bcba')
    OR public.has_role(auth.uid(), 'clinical_director')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'training_admin')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'coo')
    OR public.has_role(auth.uid(), 'operations_leadership')
    OR public.has_role(auth.uid(), 'bcba')
    OR public.has_role(auth.uid(), 'clinical_director')
  );
