
-- Tighten RLS for BCBA workflow tables (Pass 2)
-- Replace broad SELECT USING (true) policies with role/ownership-aware policies.

DO $$ BEGIN
  -- bcba_action_tasks
  DROP POLICY IF EXISTS "BCBA action tasks readable by authed" ON public.bcba_action_tasks;
  -- bcba_supervision_logs
  DROP POLICY IF EXISTS "BCBA supervision logs readable" ON public.bcba_supervision_logs;
  -- bcba_parent_training_logs
  DROP POLICY IF EXISTS "BCBA PT logs readable" ON public.bcba_parent_training_logs;
  -- bcba_treatment_plan_items
  DROP POLICY IF EXISTS "BCBA TP items readable" ON public.bcba_treatment_plan_items;
  -- bcba_client_notes
  DROP POLICY IF EXISTS "BCBA notes readable" ON public.bcba_client_notes;
END $$;

-- Shared role-based read predicate helper (leadership + clinical oversight roles)
CREATE OR REPLACE FUNCTION public.bcba_workflow_leadership_can_read(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_uid, 'admin')
      OR public.has_role(_uid, 'super_admin')
      OR public.has_role(_uid, 'executive')
      OR public.has_role(_uid, 'exec')
      OR public.has_role(_uid, 'coo')
      OR public.has_role(_uid, 'director_of_operations')
      OR public.has_role(_uid, 'operations_manager')
      OR public.has_role(_uid, 'ops_manager')
      OR public.has_role(_uid, 'clinical_director')
      OR public.has_role(_uid, 'clinic_director')
      OR public.has_role(_uid, 'clinical_lead')
      OR public.has_role(_uid, 'qa')
      OR public.has_role(_uid, 'qa_director')
      OR public.has_role(_uid, 'qa_specialist')
      OR public.has_role(_uid, 'state_director')
      OR public.has_role(_uid, 'assistant_state_director');
$$;

-- bcba_action_tasks: readable by leadership OR the assigned/creating BCBA
CREATE POLICY "BCBA action tasks scoped read"
ON public.bcba_action_tasks
FOR SELECT
TO authenticated
USING (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR created_by = auth.uid()
  OR assigned_to = auth.uid()
  OR assigned_bcba = auth.uid()
);

-- bcba_supervision_logs
CREATE POLICY "BCBA supervision logs scoped read"
ON public.bcba_supervision_logs
FOR SELECT
TO authenticated
USING (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR created_by = auth.uid()
  OR bcba_id = auth.uid()
);

-- bcba_parent_training_logs
CREATE POLICY "BCBA PT logs scoped read"
ON public.bcba_parent_training_logs
FOR SELECT
TO authenticated
USING (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR created_by = auth.uid()
  OR bcba_id = auth.uid()
);

-- bcba_treatment_plan_items
CREATE POLICY "BCBA TP items scoped read"
ON public.bcba_treatment_plan_items
FOR SELECT
TO authenticated
USING (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR created_by = auth.uid()
  OR bcba_id = auth.uid()
);

-- bcba_client_notes
CREATE POLICY "BCBA notes scoped read"
ON public.bcba_client_notes
FOR SELECT
TO authenticated
USING (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR author_id = auth.uid()
  OR bcba_id = auth.uid()
);
