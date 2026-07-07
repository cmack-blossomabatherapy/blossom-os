
CREATE OR REPLACE FUNCTION public.user_can_manage_all_ops_work()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'systems_admin'::app_role)
    OR public.has_role(auth.uid(), 'executive_leadership'::app_role)
    OR public.has_role(auth.uid(), 'executive'::app_role)
    OR public.has_role(auth.uid(), 'operations_leadership'::app_role)
    OR public.has_role(auth.uid(), 'director_of_operations'::app_role)
    OR public.has_role(auth.uid(), 'coo'::app_role);
$$;

REVOKE ALL ON FUNCTION public.user_can_manage_all_ops_work() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_manage_all_ops_work() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.user_is_state_director_for(_state text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _state IS NOT NULL
    AND _state = public.user_state_code()
    AND (
      public.has_role(auth.uid(), 'state_director'::app_role)
      OR public.has_role(auth.uid(), 'assistant_state_director'::app_role)
    );
$$;

REVOKE ALL ON FUNCTION public.user_is_state_director_for(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_state_director_for(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.user_matches_assigned_role(_assigned text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _assigned IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text = _assigned
    );
$$;

REVOKE ALL ON FUNCTION public.user_matches_assigned_role(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_matches_assigned_role(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "Authenticated can view work items" ON public.operations_work_items;
DROP POLICY IF EXISTS "Authenticated can update work items" ON public.operations_work_items;
DROP POLICY IF EXISTS "Authenticated can create work items" ON public.operations_work_items;
DROP POLICY IF EXISTS "ops_work_items_select_scoped" ON public.operations_work_items;
DROP POLICY IF EXISTS "ops_work_items_insert_authenticated" ON public.operations_work_items;
DROP POLICY IF EXISTS "ops_work_items_update_scoped" ON public.operations_work_items;

CREATE POLICY "ops_work_items_select_scoped"
ON public.operations_work_items
FOR SELECT
TO authenticated
USING (
  public.user_can_manage_all_ops_work()
  OR owner_id = auth.uid()
  OR created_by = auth.uid()
  OR public.user_is_state_director_for(state)
  OR public.user_matches_assigned_role(assigned_role)
);

CREATE POLICY "ops_work_items_insert_authenticated"
ON public.operations_work_items
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    public.user_can_manage_all_ops_work()
    OR created_by IS NULL
    OR created_by = auth.uid()
  )
);

CREATE POLICY "ops_work_items_update_scoped"
ON public.operations_work_items
FOR UPDATE
TO authenticated
USING (
  public.user_can_manage_all_ops_work()
  OR owner_id = auth.uid()
  OR created_by = auth.uid()
  OR public.user_is_state_director_for(state)
  OR public.user_matches_assigned_role(assigned_role)
)
WITH CHECK (
  public.user_can_manage_all_ops_work()
  OR owner_id = auth.uid()
  OR created_by = auth.uid()
  OR public.user_is_state_director_for(state)
  OR public.user_matches_assigned_role(assigned_role)
);

DROP POLICY IF EXISTS "Admins can delete work items" ON public.operations_work_items;
CREATE POLICY "ops_work_items_delete_admin"
ON public.operations_work_items
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'systems_admin'::app_role)
);

DROP POLICY IF EXISTS "Authenticated can view work item events" ON public.operations_work_item_events;
DROP POLICY IF EXISTS "Authenticated can log work item events" ON public.operations_work_item_events;
DROP POLICY IF EXISTS "ops_work_item_events_select_scoped" ON public.operations_work_item_events;
DROP POLICY IF EXISTS "ops_work_item_events_insert_scoped" ON public.operations_work_item_events;

CREATE POLICY "ops_work_item_events_select_scoped"
ON public.operations_work_item_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.operations_work_items wi
    WHERE wi.id = operations_work_item_events.work_item_id
      AND (
        public.user_can_manage_all_ops_work()
        OR wi.owner_id = auth.uid()
        OR wi.created_by = auth.uid()
        OR public.user_is_state_director_for(wi.state)
        OR public.user_matches_assigned_role(wi.assigned_role)
      )
  )
);

CREATE POLICY "ops_work_item_events_insert_scoped"
ON public.operations_work_item_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.operations_work_items wi
    WHERE wi.id = operations_work_item_events.work_item_id
      AND (
        public.user_can_manage_all_ops_work()
        OR wi.owner_id = auth.uid()
        OR wi.created_by = auth.uid()
        OR public.user_is_state_director_for(wi.state)
        OR public.user_matches_assigned_role(wi.assigned_role)
      )
  )
);

CREATE INDEX IF NOT EXISTS idx_ops_work_items_owner_id      ON public.operations_work_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_ops_work_items_created_by    ON public.operations_work_items(created_by);
CREATE INDEX IF NOT EXISTS idx_ops_work_items_state         ON public.operations_work_items(state);
CREATE INDEX IF NOT EXISTS idx_ops_work_items_department    ON public.operations_work_items(department);
CREATE INDEX IF NOT EXISTS idx_ops_work_items_assigned_role ON public.operations_work_items(assigned_role);
CREATE INDEX IF NOT EXISTS idx_ops_work_items_status        ON public.operations_work_items(status);
CREATE INDEX IF NOT EXISTS idx_ops_work_items_priority      ON public.operations_work_items(priority);
CREATE INDEX IF NOT EXISTS idx_ops_work_items_due_date      ON public.operations_work_items(due_date);
CREATE INDEX IF NOT EXISTS idx_ops_work_items_escalated_at  ON public.operations_work_items(escalated_at);
CREATE INDEX IF NOT EXISTS idx_ops_work_item_events_work_item_id ON public.operations_work_item_events(work_item_id);
CREATE INDEX IF NOT EXISTS idx_ops_work_item_events_created_at   ON public.operations_work_item_events(created_at);
