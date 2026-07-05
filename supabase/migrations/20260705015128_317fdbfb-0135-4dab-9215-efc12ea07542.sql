
-- Pass 5: expand leadership helper with canonical Blossom OS role names.
CREATE OR REPLACE FUNCTION public.bcba_workflow_leadership_can_read(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_uid, 'admin')
      OR public.has_role(_uid, 'super_admin')
      OR public.has_role(_uid, 'systems_admin')
      OR public.has_role(_uid, 'executive_leadership')
      OR public.has_role(_uid, 'operations_leadership')
      OR public.has_role(_uid, 'qa_team')
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
      OR public.has_role(_uid, 'assistant_state_director')
      OR public.has_role(_uid, 'behavioral_support');
$$;

-- Rebuild insert/update policies to close null-ownership loopholes.
DROP POLICY IF EXISTS "BCBA action tasks insert scoped" ON public.bcba_action_tasks;
DROP POLICY IF EXISTS "BCBA action tasks update scoped" ON public.bcba_action_tasks;
DROP POLICY IF EXISTS "BCBA action tasks insert v2"     ON public.bcba_action_tasks;
DROP POLICY IF EXISTS "BCBA action tasks update v2"     ON public.bcba_action_tasks;

CREATE POLICY "BCBA action tasks insert v2"
ON public.bcba_action_tasks
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.bcba_workflow_leadership_can_read(auth.uid())
    OR assigned_bcba = auth.uid()
    OR assigned_to   = auth.uid()
  )
);

CREATE POLICY "BCBA action tasks update v2"
ON public.bcba_action_tasks
FOR UPDATE TO authenticated
USING (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR created_by    = auth.uid()
  OR assigned_to   = auth.uid()
  OR assigned_bcba = auth.uid()
)
WITH CHECK (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR assigned_bcba = auth.uid()
  OR assigned_to   = auth.uid()
);

DROP POLICY IF EXISTS "BCBA supervision logs insert scoped" ON public.bcba_supervision_logs;
DROP POLICY IF EXISTS "BCBA supervision logs update scoped" ON public.bcba_supervision_logs;
DROP POLICY IF EXISTS "BCBA supervision logs insert v2"     ON public.bcba_supervision_logs;
DROP POLICY IF EXISTS "BCBA supervision logs update v2"     ON public.bcba_supervision_logs;

CREATE POLICY "BCBA supervision logs insert v2"
ON public.bcba_supervision_logs
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.bcba_workflow_leadership_can_read(auth.uid())
    OR bcba_id = auth.uid()
  )
);

CREATE POLICY "BCBA supervision logs update v2"
ON public.bcba_supervision_logs
FOR UPDATE TO authenticated
USING (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR created_by = auth.uid()
  OR bcba_id    = auth.uid()
)
WITH CHECK (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR bcba_id = auth.uid()
);

DROP POLICY IF EXISTS "BCBA PT logs insert scoped" ON public.bcba_parent_training_logs;
DROP POLICY IF EXISTS "BCBA PT logs update scoped" ON public.bcba_parent_training_logs;
DROP POLICY IF EXISTS "BCBA PT logs insert v2"     ON public.bcba_parent_training_logs;
DROP POLICY IF EXISTS "BCBA PT logs update v2"     ON public.bcba_parent_training_logs;

CREATE POLICY "BCBA PT logs insert v2"
ON public.bcba_parent_training_logs
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.bcba_workflow_leadership_can_read(auth.uid())
    OR bcba_id = auth.uid()
  )
);

CREATE POLICY "BCBA PT logs update v2"
ON public.bcba_parent_training_logs
FOR UPDATE TO authenticated
USING (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR created_by = auth.uid()
  OR bcba_id    = auth.uid()
)
WITH CHECK (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR bcba_id = auth.uid()
);

DROP POLICY IF EXISTS "BCBA TP items insert scoped" ON public.bcba_treatment_plan_items;
DROP POLICY IF EXISTS "BCBA TP items update scoped" ON public.bcba_treatment_plan_items;
DROP POLICY IF EXISTS "BCBA TP items insert v2"     ON public.bcba_treatment_plan_items;
DROP POLICY IF EXISTS "BCBA TP items update v2"     ON public.bcba_treatment_plan_items;

CREATE POLICY "BCBA TP items insert v2"
ON public.bcba_treatment_plan_items
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.bcba_workflow_leadership_can_read(auth.uid())
    OR bcba_id = auth.uid()
  )
);

CREATE POLICY "BCBA TP items update v2"
ON public.bcba_treatment_plan_items
FOR UPDATE TO authenticated
USING (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR created_by = auth.uid()
  OR bcba_id    = auth.uid()
)
WITH CHECK (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR bcba_id = auth.uid()
);

-- Activity events table for durable cross-table audit + future CR reconciliation.
CREATE TABLE IF NOT EXISTS public.bcba_workflow_activity_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id UUID,
  client_id UUID,
  client_name TEXT,
  client_name_key TEXT,
  centralreach_client_id TEXT,
  bcba_id UUID,
  source_table TEXT NOT NULL,
  source_record_id UUID,
  event_type TEXT NOT NULL,
  summary TEXT,
  metadata JSONB,
  centralreach_sync_status TEXT DEFAULT 'pending_review'
);

GRANT SELECT, INSERT ON public.bcba_workflow_activity_events TO authenticated;
GRANT ALL ON public.bcba_workflow_activity_events TO service_role;

ALTER TABLE public.bcba_workflow_activity_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "BCBA activity events read scoped"   ON public.bcba_workflow_activity_events;
DROP POLICY IF EXISTS "BCBA activity events insert scoped" ON public.bcba_workflow_activity_events;

CREATE POLICY "BCBA activity events read scoped"
ON public.bcba_workflow_activity_events
FOR SELECT TO authenticated
USING (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR actor_id = auth.uid()
  OR bcba_id  = auth.uid()
);

CREATE POLICY "BCBA activity events insert scoped"
ON public.bcba_workflow_activity_events
FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid());

CREATE INDEX IF NOT EXISTS bcba_workflow_activity_events_client_idx
  ON public.bcba_workflow_activity_events (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bcba_workflow_activity_events_name_key_idx
  ON public.bcba_workflow_activity_events (client_name_key, created_at DESC);
CREATE INDEX IF NOT EXISTS bcba_workflow_activity_events_cr_client_idx
  ON public.bcba_workflow_activity_events (centralreach_client_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.bcba_activity_set_client_name_key()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.client_name IS NOT NULL AND NEW.client_name_key IS NULL THEN
    NEW.client_name_key := public.bcba_normalize_client_name(NEW.client_name);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bcba_workflow_activity_events_name_key ON public.bcba_workflow_activity_events;
CREATE TRIGGER bcba_workflow_activity_events_name_key
  BEFORE INSERT OR UPDATE ON public.bcba_workflow_activity_events
  FOR EACH ROW EXECUTE FUNCTION public.bcba_activity_set_client_name_key();

-- Track who created each outbox row so RLS can scope inserts.
ALTER TABLE public.bcba_centralreach_outbox
  ADD COLUMN IF NOT EXISTS created_by UUID;
