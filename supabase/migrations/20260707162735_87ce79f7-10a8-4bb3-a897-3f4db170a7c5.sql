
-- ==========================================================================
-- 1) case_manager_community_resources: restrict SELECT to case managers /
--    case-management oversight (was: USING(true) for all authenticated).
-- ==========================================================================
DROP POLICY IF EXISTS "cm_community_select_all" ON public.case_manager_community_resources;

CREATE POLICY "cm_community_select_scoped"
ON public.case_manager_community_resources
FOR SELECT
TO authenticated
USING (
  public.is_active_case_manager()
  OR public.is_cm_oversight()
);


-- ==========================================================================
-- 2) phone_ai_calls: narrow the SELECT policy. Remove Marketing and HR
--    roles from caller PII / transcript access. Keep leadership, operations,
--    phone support, intake (for after-hours callback follow-up), and state
--    directors, plus systems admin / super admin.
-- ==========================================================================
DROP POLICY IF EXISTS "Privileged roles read phone_ai_calls" ON public.phone_ai_calls;

CREATE POLICY "phone_ai_calls_scoped_read"
ON public.phone_ai_calls
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'systems_admin')
  OR public.has_role(auth.uid(), 'executive')
  OR public.has_role(auth.uid(), 'executive_leadership')
  OR public.has_role(auth.uid(), 'exec')
  OR public.has_role(auth.uid(), 'coo')
  OR public.has_role(auth.uid(), 'director_of_operations')
  OR public.has_role(auth.uid(), 'operations_leadership')
  OR public.has_role(auth.uid(), 'operations_manager')
  OR public.has_role(auth.uid(), 'ops_manager')
  OR public.has_role(auth.uid(), 'state_director')
  OR public.has_role(auth.uid(), 'assistant_state_director')
  OR public.has_role(auth.uid(), 'phone_support')
  OR public.has_role(auth.uid(), 'intake')
  OR public.has_role(auth.uid(), 'intake_lead')
  OR public.has_role(auth.uid(), 'intake_coordinator')
);


-- ==========================================================================
-- 3) Scheduling operational tables: replace USING(true) SELECT policies with
--    the same operational role set already trusted for writes. Marketing,
--    recruiting, HR, RBTs, etc. lose the broad read on scheduling ops.
-- ==========================================================================

DROP POLICY IF EXISTS "scheduling_actions_read_auth" ON public.scheduling_actions;
CREATE POLICY "scheduling_actions_read_scoped"
ON public.scheduling_actions
FOR SELECT
TO authenticated
USING (public.can_write_scheduling_ops(auth.uid()));

DROP POLICY IF EXISTS "scheduling_cancellations_read_auth" ON public.scheduling_cancellations;
CREATE POLICY "scheduling_cancellations_read_scoped"
ON public.scheduling_cancellations
FOR SELECT
TO authenticated
USING (public.can_write_scheduling_ops(auth.uid()));

DROP POLICY IF EXISTS "scheduling_coverage_read_auth" ON public.scheduling_coverage_cases;
CREATE POLICY "scheduling_coverage_read_scoped"
ON public.scheduling_coverage_cases
FOR SELECT
TO authenticated
USING (public.can_write_scheduling_ops(auth.uid()));

DROP POLICY IF EXISTS "scheduling_contact_attempts_read_auth" ON public.scheduling_contact_attempts;
CREATE POLICY "scheduling_contact_attempts_read_scoped"
ON public.scheduling_contact_attempts
FOR SELECT
TO authenticated
USING (public.can_write_scheduling_ops(auth.uid()));

DROP POLICY IF EXISTS "scheduling_adjustments_read_auth" ON public.scheduling_session_adjustments;
CREATE POLICY "scheduling_adjustments_read_scoped"
ON public.scheduling_session_adjustments
FOR SELECT
TO authenticated
USING (public.can_write_scheduling_ops(auth.uid()));
