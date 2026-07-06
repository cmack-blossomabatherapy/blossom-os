
-- Fix: phone_ai_calls PII exposure — restrict SELECT to roles that legitimately need caller data
DROP POLICY IF EXISTS "Authenticated can read phone_ai_calls" ON public.phone_ai_calls;

CREATE POLICY "Privileged roles read phone_ai_calls"
ON public.phone_ai_calls
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'systems_admin'::app_role)
  OR has_role(auth.uid(), 'executive'::app_role)
  OR has_role(auth.uid(), 'executive_leadership'::app_role)
  OR has_role(auth.uid(), 'exec'::app_role)
  OR has_role(auth.uid(), 'coo'::app_role)
  OR has_role(auth.uid(), 'director_of_operations'::app_role)
  OR has_role(auth.uid(), 'operations_leadership'::app_role)
  OR has_role(auth.uid(), 'operations_manager'::app_role)
  OR has_role(auth.uid(), 'ops_manager'::app_role)
  OR has_role(auth.uid(), 'state_director'::app_role)
  OR has_role(auth.uid(), 'phone_support'::app_role)
  OR has_role(auth.uid(), 'intake'::app_role)
  OR has_role(auth.uid(), 'intake_lead'::app_role)
  OR has_role(auth.uid(), 'intake_coordinator'::app_role)
  OR has_role(auth.uid(), 'marketing'::app_role)
  OR has_role(auth.uid(), 'marketing_team'::app_role)
  OR has_role(auth.uid(), 'marketing_growth_lead'::app_role)
  OR has_role(auth.uid(), 'hr'::app_role)
  OR has_role(auth.uid(), 'hr_lead'::app_role)
  OR has_role(auth.uid(), 'hr_admin'::app_role)
  OR has_role(auth.uid(), 'hr_manager'::app_role)
);

-- Fix: scheduling operational tables — restrict INSERT/UPDATE to scheduling/staffing/ops/admin roles
-- Helper: create a SECURITY DEFINER function that returns true if user has a scheduling-write role
CREATE OR REPLACE FUNCTION public.can_write_scheduling_ops(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN (
        'super_admin','admin','systems_admin',
        'executive','executive_leadership','exec','coo',
        'director_of_operations','operations_leadership','operations_manager','ops_manager',
        'state_director','assistant_state_director',
        'scheduling','scheduling_lead','scheduling_coordinator',
        'staffing','staffing_lead','staffing_coordinator',
        'clinic_director','clinical_director','clinical_lead',
        'dept_manager','case_manager'
      )
  )
$$;

GRANT EXECUTE ON FUNCTION public.can_write_scheduling_ops(uuid) TO authenticated, service_role;

-- scheduling_actions
DROP POLICY IF EXISTS scheduling_actions_insert_auth ON public.scheduling_actions;
DROP POLICY IF EXISTS scheduling_actions_update_auth ON public.scheduling_actions;
CREATE POLICY scheduling_actions_insert_scoped ON public.scheduling_actions
  FOR INSERT TO authenticated WITH CHECK (public.can_write_scheduling_ops(auth.uid()));
CREATE POLICY scheduling_actions_update_scoped ON public.scheduling_actions
  FOR UPDATE TO authenticated
  USING (public.can_write_scheduling_ops(auth.uid()))
  WITH CHECK (public.can_write_scheduling_ops(auth.uid()));

-- scheduling_cancellations
DROP POLICY IF EXISTS scheduling_cancellations_insert_auth ON public.scheduling_cancellations;
DROP POLICY IF EXISTS scheduling_cancellations_update_auth ON public.scheduling_cancellations;
CREATE POLICY scheduling_cancellations_insert_scoped ON public.scheduling_cancellations
  FOR INSERT TO authenticated WITH CHECK (public.can_write_scheduling_ops(auth.uid()));
CREATE POLICY scheduling_cancellations_update_scoped ON public.scheduling_cancellations
  FOR UPDATE TO authenticated
  USING (public.can_write_scheduling_ops(auth.uid()))
  WITH CHECK (public.can_write_scheduling_ops(auth.uid()));

-- scheduling_contact_attempts
DROP POLICY IF EXISTS scheduling_contact_attempts_insert_auth ON public.scheduling_contact_attempts;
DROP POLICY IF EXISTS scheduling_contact_attempts_update_auth ON public.scheduling_contact_attempts;
CREATE POLICY scheduling_contact_attempts_insert_scoped ON public.scheduling_contact_attempts
  FOR INSERT TO authenticated WITH CHECK (public.can_write_scheduling_ops(auth.uid()));
CREATE POLICY scheduling_contact_attempts_update_scoped ON public.scheduling_contact_attempts
  FOR UPDATE TO authenticated
  USING (public.can_write_scheduling_ops(auth.uid()))
  WITH CHECK (public.can_write_scheduling_ops(auth.uid()));

-- scheduling_coverage_cases
DROP POLICY IF EXISTS scheduling_coverage_insert_auth ON public.scheduling_coverage_cases;
DROP POLICY IF EXISTS scheduling_coverage_update_auth ON public.scheduling_coverage_cases;
CREATE POLICY scheduling_coverage_insert_scoped ON public.scheduling_coverage_cases
  FOR INSERT TO authenticated WITH CHECK (public.can_write_scheduling_ops(auth.uid()));
CREATE POLICY scheduling_coverage_update_scoped ON public.scheduling_coverage_cases
  FOR UPDATE TO authenticated
  USING (public.can_write_scheduling_ops(auth.uid()))
  WITH CHECK (public.can_write_scheduling_ops(auth.uid()));

-- scheduling_session_adjustments
DROP POLICY IF EXISTS scheduling_adjustments_insert_auth ON public.scheduling_session_adjustments;
DROP POLICY IF EXISTS scheduling_adjustments_update_auth ON public.scheduling_session_adjustments;
CREATE POLICY scheduling_adjustments_insert_scoped ON public.scheduling_session_adjustments
  FOR INSERT TO authenticated WITH CHECK (public.can_write_scheduling_ops(auth.uid()));
CREATE POLICY scheduling_adjustments_update_scoped ON public.scheduling_session_adjustments
  FOR UPDATE TO authenticated
  USING (public.can_write_scheduling_ops(auth.uid()))
  WITH CHECK (public.can_write_scheduling_ops(auth.uid()));
