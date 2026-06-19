-- Expand read access to BCBA productivity dataset for reporting roles
DROP POLICY IF EXISTS "Privileged roles can read bcba prod rows" ON public.bcba_productivity_billing_rows;
CREATE POLICY "Privileged roles can read bcba prod rows"
  ON public.bcba_productivity_billing_rows
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'systems_admin'::app_role)
    OR has_role(auth.uid(), 'exec'::app_role)
    OR has_role(auth.uid(), 'ops_manager'::app_role)
    OR has_role(auth.uid(), 'finance'::app_role)
    OR has_role(auth.uid(), 'auth_team'::app_role)
    OR has_role(auth.uid(), 'state_director'::app_role)
    OR has_role(auth.uid(), 'clinic_director'::app_role)
    OR has_role(auth.uid(), 'hr_admin'::app_role)
    OR has_role(auth.uid(), 'hr_manager'::app_role)
    OR has_role(auth.uid(), 'bcba'::app_role)
    OR has_role(auth.uid(), 'qa'::app_role)
  );

DROP POLICY IF EXISTS "Privileged roles can read bcba prod batches" ON public.bcba_productivity_upload_batches;
CREATE POLICY "Privileged roles can read bcba prod batches"
  ON public.bcba_productivity_upload_batches
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'systems_admin'::app_role)
    OR has_role(auth.uid(), 'exec'::app_role)
    OR has_role(auth.uid(), 'ops_manager'::app_role)
    OR has_role(auth.uid(), 'finance'::app_role)
    OR has_role(auth.uid(), 'auth_team'::app_role)
    OR has_role(auth.uid(), 'state_director'::app_role)
    OR has_role(auth.uid(), 'clinic_director'::app_role)
    OR has_role(auth.uid(), 'hr_admin'::app_role)
    OR has_role(auth.uid(), 'hr_manager'::app_role)
    OR has_role(auth.uid(), 'bcba'::app_role)
    OR has_role(auth.uid(), 'qa'::app_role)
  );
