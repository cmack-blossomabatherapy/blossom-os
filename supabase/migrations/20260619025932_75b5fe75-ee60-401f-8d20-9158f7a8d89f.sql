
-- 1. Fix SECURITY DEFINER view
ALTER VIEW public.employee_directory SET (security_invoker = true);

-- 2. Restrict hr_departments anon read
DROP POLICY IF EXISTS "Public departments read" ON public.hr_departments;
REVOKE SELECT ON public.hr_departments FROM anon;

-- 3. Restrict bcba productivity billing reads to finance/admin roles
DROP POLICY IF EXISTS "Authenticated can read bcba prod batches" ON public.bcba_productivity_upload_batches;
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
  );

DROP POLICY IF EXISTS "Authenticated can read active bcba prod rows" ON public.bcba_productivity_billing_rows;
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
  );
