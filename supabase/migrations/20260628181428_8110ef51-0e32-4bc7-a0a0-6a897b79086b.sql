CREATE OR REPLACE FUNCTION public.can_manage_bcba_productivity_uploads(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role::text IN ('super_admin','admin','systems_admin')
  )
  OR EXISTS (
    SELECT 1
    FROM public.employee_role_assignments era
    WHERE era.user_id = _user_id
      AND era.is_active = true
      AND (era.starts_at IS NULL OR era.starts_at <= CURRENT_DATE)
      AND (era.ends_at IS NULL OR era.ends_at >= CURRENT_DATE)
      AND (
        era.role_key IN ('super_admin','admin','systems_admin')
        OR era.os_role_key IN ('super_admin','admin','systems_admin')
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_read_bcba_productivity(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.can_manage_bcba_productivity_uploads(_user_id)
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role::text IN (
        'exec','ops_manager','finance','auth_team','state_director',
        'clinic_director','hr_admin','hr_manager','bcba','qa'
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.employee_role_assignments era
    WHERE era.user_id = _user_id
      AND era.is_active = true
      AND (era.starts_at IS NULL OR era.starts_at <= CURRENT_DATE)
      AND (era.ends_at IS NULL OR era.ends_at >= CURRENT_DATE)
      AND (
        era.role_key IN (
          'executive','exec','coo','director_of_operations','operations_manager','ops_manager',
          'finance','billing_lead','finance_benefits_lead','finance_benefits_team',
          'auth_team','authorization_manager','authorization_coordinator',
          'state_director','assistant_state_director','clinic_director','clinical_lead',
          'hr_admin','hr_manager','bcba','qa','qa_director','qa_specialist'
        )
        OR era.os_role_key IN (
          'executive','exec','coo','director_of_operations','operations_manager','ops_manager',
          'finance','billing_lead','finance_benefits_lead','finance_benefits_team',
          'auth_team','authorization_manager','authorization_coordinator',
          'state_director','assistant_state_director','clinic_director','clinical_lead',
          'hr_admin','hr_manager','bcba','qa','qa_director','qa_specialist'
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_bcba_productivity_uploads(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_bcba_productivity(uuid) TO authenticated;

DROP POLICY IF EXISTS "Privileged roles can read bcba prod rows" ON public.bcba_productivity_billing_rows;
CREATE POLICY "Privileged roles can read bcba prod rows"
  ON public.bcba_productivity_billing_rows
  FOR SELECT
  TO authenticated
  USING (public.can_read_bcba_productivity(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert bcba prod rows" ON public.bcba_productivity_billing_rows;
CREATE POLICY "Admins can insert bcba prod rows"
  ON public.bcba_productivity_billing_rows
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_bcba_productivity_uploads(auth.uid()));

DROP POLICY IF EXISTS "Admins can update bcba prod rows" ON public.bcba_productivity_billing_rows;
CREATE POLICY "Admins can update bcba prod rows"
  ON public.bcba_productivity_billing_rows
  FOR UPDATE
  TO authenticated
  USING (public.can_manage_bcba_productivity_uploads(auth.uid()))
  WITH CHECK (public.can_manage_bcba_productivity_uploads(auth.uid()));

DROP POLICY IF EXISTS "Privileged roles can read bcba prod batches" ON public.bcba_productivity_upload_batches;
CREATE POLICY "Privileged roles can read bcba prod batches"
  ON public.bcba_productivity_upload_batches
  FOR SELECT
  TO authenticated
  USING (public.can_read_bcba_productivity(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert bcba prod batches" ON public.bcba_productivity_upload_batches;
CREATE POLICY "Admins can insert bcba prod batches"
  ON public.bcba_productivity_upload_batches
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_bcba_productivity_uploads(auth.uid()));

DROP POLICY IF EXISTS "Admins can update bcba prod batches" ON public.bcba_productivity_upload_batches;
CREATE POLICY "Admins can update bcba prod batches"
  ON public.bcba_productivity_upload_batches
  FOR UPDATE
  TO authenticated
  USING (public.can_manage_bcba_productivity_uploads(auth.uid()))
  WITH CHECK (public.can_manage_bcba_productivity_uploads(auth.uid()));