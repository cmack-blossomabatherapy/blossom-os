
DROP POLICY IF EXISTS "Read supervision escalations" ON public.bcba_supervision_escalations;
DROP POLICY IF EXISTS "Insert supervision escalations" ON public.bcba_supervision_escalations;
DROP POLICY IF EXISTS "Update supervision escalations" ON public.bcba_supervision_escalations;

CREATE POLICY "esc_select_scoped" ON public.bcba_supervision_escalations
FOR SELECT TO authenticated
USING (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR bcba_id IN (SELECT e.id FROM public.employees e WHERE e.user_id = auth.uid())
  OR rbt_employee_id IN (SELECT e.id FROM public.employees e WHERE e.user_id = auth.uid())
);

CREATE POLICY "esc_insert_scoped" ON public.bcba_supervision_escalations
FOR INSERT TO authenticated
WITH CHECK (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR bcba_id IN (SELECT e.id FROM public.employees e WHERE e.user_id = auth.uid())
);

CREATE POLICY "esc_update_scoped" ON public.bcba_supervision_escalations
FOR UPDATE TO authenticated
USING (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR bcba_id IN (SELECT e.id FROM public.employees e WHERE e.user_id = auth.uid())
)
WITH CHECK (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR bcba_id IN (SELECT e.id FROM public.employees e WHERE e.user_id = auth.uid())
);
