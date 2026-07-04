
CREATE OR REPLACE FUNCTION public.bcba_normalize_client_name(_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(regexp_replace(coalesce(_name, ''), '\s+', ' ', 'g'));
$$;

ALTER TABLE public.bcba_action_tasks         ADD COLUMN IF NOT EXISTS client_name_key text;
ALTER TABLE public.bcba_supervision_logs     ADD COLUMN IF NOT EXISTS client_name_key text;
ALTER TABLE public.bcba_parent_training_logs ADD COLUMN IF NOT EXISTS client_name_key text;
ALTER TABLE public.bcba_treatment_plan_items ADD COLUMN IF NOT EXISTS client_name_key text;
ALTER TABLE public.bcba_client_notes         ADD COLUMN IF NOT EXISTS client_name_key text;

UPDATE public.bcba_action_tasks         SET client_name_key = public.bcba_normalize_client_name(client_name) WHERE client_name_key IS NULL AND client_name IS NOT NULL;
UPDATE public.bcba_supervision_logs     SET client_name_key = public.bcba_normalize_client_name(client_name) WHERE client_name_key IS NULL AND client_name IS NOT NULL;
UPDATE public.bcba_parent_training_logs SET client_name_key = public.bcba_normalize_client_name(client_name) WHERE client_name_key IS NULL AND client_name IS NOT NULL;
UPDATE public.bcba_treatment_plan_items SET client_name_key = public.bcba_normalize_client_name(client_name) WHERE client_name_key IS NULL AND client_name IS NOT NULL;
UPDATE public.bcba_client_notes         SET client_name_key = public.bcba_normalize_client_name(client_name) WHERE client_name_key IS NULL AND client_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS bcba_action_tasks_name_key_idx         ON public.bcba_action_tasks (client_name_key);
CREATE INDEX IF NOT EXISTS bcba_supervision_logs_name_key_idx     ON public.bcba_supervision_logs (client_name_key);
CREATE INDEX IF NOT EXISTS bcba_parent_training_logs_name_key_idx ON public.bcba_parent_training_logs (client_name_key);
CREATE INDEX IF NOT EXISTS bcba_treatment_plan_items_name_key_idx ON public.bcba_treatment_plan_items (client_name_key);
CREATE INDEX IF NOT EXISTS bcba_client_notes_name_key_idx         ON public.bcba_client_notes (client_name_key);

CREATE INDEX IF NOT EXISTS bcba_action_tasks_cr_client_idx         ON public.bcba_action_tasks (centralreach_client_id);
CREATE INDEX IF NOT EXISTS bcba_supervision_logs_cr_client_idx     ON public.bcba_supervision_logs (centralreach_client_id);
CREATE INDEX IF NOT EXISTS bcba_parent_training_logs_cr_client_idx ON public.bcba_parent_training_logs (centralreach_client_id);
CREATE INDEX IF NOT EXISTS bcba_treatment_plan_items_cr_client_idx ON public.bcba_treatment_plan_items (centralreach_client_id);
CREATE INDEX IF NOT EXISTS bcba_client_notes_cr_client_idx         ON public.bcba_client_notes (centralreach_client_id);

CREATE OR REPLACE FUNCTION public.bcba_set_client_name_key()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.client_name IS NOT NULL THEN
    NEW.client_name_key := public.bcba_normalize_client_name(NEW.client_name);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bcba_action_tasks_name_key         ON public.bcba_action_tasks;
DROP TRIGGER IF EXISTS bcba_supervision_logs_name_key     ON public.bcba_supervision_logs;
DROP TRIGGER IF EXISTS bcba_parent_training_logs_name_key ON public.bcba_parent_training_logs;
DROP TRIGGER IF EXISTS bcba_treatment_plan_items_name_key ON public.bcba_treatment_plan_items;
DROP TRIGGER IF EXISTS bcba_client_notes_name_key         ON public.bcba_client_notes;

CREATE TRIGGER bcba_action_tasks_name_key         BEFORE INSERT OR UPDATE ON public.bcba_action_tasks         FOR EACH ROW EXECUTE FUNCTION public.bcba_set_client_name_key();
CREATE TRIGGER bcba_supervision_logs_name_key     BEFORE INSERT OR UPDATE ON public.bcba_supervision_logs     FOR EACH ROW EXECUTE FUNCTION public.bcba_set_client_name_key();
CREATE TRIGGER bcba_parent_training_logs_name_key BEFORE INSERT OR UPDATE ON public.bcba_parent_training_logs FOR EACH ROW EXECUTE FUNCTION public.bcba_set_client_name_key();
CREATE TRIGGER bcba_treatment_plan_items_name_key BEFORE INSERT OR UPDATE ON public.bcba_treatment_plan_items FOR EACH ROW EXECUTE FUNCTION public.bcba_set_client_name_key();
CREATE TRIGGER bcba_client_notes_name_key         BEFORE INSERT OR UPDATE ON public.bcba_client_notes         FOR EACH ROW EXECUTE FUNCTION public.bcba_set_client_name_key();

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

DROP POLICY IF EXISTS "BCBA action tasks insert by owner"             ON public.bcba_action_tasks;
DROP POLICY IF EXISTS "BCBA action tasks update by owner or assignee" ON public.bcba_action_tasks;
DROP POLICY IF EXISTS "BCBA action tasks insert scoped"               ON public.bcba_action_tasks;
DROP POLICY IF EXISTS "BCBA action tasks update scoped"               ON public.bcba_action_tasks;

CREATE POLICY "BCBA action tasks insert scoped"
ON public.bcba_action_tasks
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.bcba_workflow_leadership_can_read(auth.uid())
    OR assigned_bcba = auth.uid()
    OR assigned_to   = auth.uid()
    OR assigned_bcba IS NULL
  )
);

CREATE POLICY "BCBA action tasks update scoped"
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
  OR created_by    = auth.uid()
  OR assigned_to   = auth.uid()
  OR assigned_bcba = auth.uid()
);

DROP POLICY IF EXISTS "BCBA supervision logs insert"          ON public.bcba_supervision_logs;
DROP POLICY IF EXISTS "BCBA supervision logs update by owner" ON public.bcba_supervision_logs;
DROP POLICY IF EXISTS "BCBA supervision logs insert scoped"   ON public.bcba_supervision_logs;
DROP POLICY IF EXISTS "BCBA supervision logs update scoped"   ON public.bcba_supervision_logs;

CREATE POLICY "BCBA supervision logs insert scoped"
ON public.bcba_supervision_logs
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.bcba_workflow_leadership_can_read(auth.uid())
    OR bcba_id = auth.uid()
    OR bcba_id IS NULL
  )
);

CREATE POLICY "BCBA supervision logs update scoped"
ON public.bcba_supervision_logs
FOR UPDATE TO authenticated
USING (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR created_by = auth.uid()
  OR bcba_id    = auth.uid()
)
WITH CHECK (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR created_by = auth.uid()
  OR bcba_id    = auth.uid()
);

DROP POLICY IF EXISTS "BCBA PT logs insert"          ON public.bcba_parent_training_logs;
DROP POLICY IF EXISTS "BCBA PT logs update by owner" ON public.bcba_parent_training_logs;
DROP POLICY IF EXISTS "BCBA PT logs insert scoped"   ON public.bcba_parent_training_logs;
DROP POLICY IF EXISTS "BCBA PT logs update scoped"   ON public.bcba_parent_training_logs;

CREATE POLICY "BCBA PT logs insert scoped"
ON public.bcba_parent_training_logs
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.bcba_workflow_leadership_can_read(auth.uid())
    OR bcba_id = auth.uid()
    OR bcba_id IS NULL
  )
);

CREATE POLICY "BCBA PT logs update scoped"
ON public.bcba_parent_training_logs
FOR UPDATE TO authenticated
USING (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR created_by = auth.uid()
  OR bcba_id    = auth.uid()
)
WITH CHECK (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR created_by = auth.uid()
  OR bcba_id    = auth.uid()
);

DROP POLICY IF EXISTS "BCBA TP items insert"        ON public.bcba_treatment_plan_items;
DROP POLICY IF EXISTS "BCBA TP items update"        ON public.bcba_treatment_plan_items;
DROP POLICY IF EXISTS "BCBA TP items insert scoped" ON public.bcba_treatment_plan_items;
DROP POLICY IF EXISTS "BCBA TP items update scoped" ON public.bcba_treatment_plan_items;

CREATE POLICY "BCBA TP items insert scoped"
ON public.bcba_treatment_plan_items
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.bcba_workflow_leadership_can_read(auth.uid())
    OR bcba_id = auth.uid()
    OR bcba_id IS NULL
  )
);

CREATE POLICY "BCBA TP items update scoped"
ON public.bcba_treatment_plan_items
FOR UPDATE TO authenticated
USING (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR created_by = auth.uid()
  OR bcba_id    = auth.uid()
)
WITH CHECK (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR created_by = auth.uid()
  OR bcba_id    = auth.uid()
);

DROP POLICY IF EXISTS "BCBA notes insert"           ON public.bcba_client_notes;
DROP POLICY IF EXISTS "BCBA notes update by author" ON public.bcba_client_notes;
DROP POLICY IF EXISTS "BCBA notes insert scoped"    ON public.bcba_client_notes;
DROP POLICY IF EXISTS "BCBA notes update scoped"    ON public.bcba_client_notes;

CREATE POLICY "BCBA notes insert scoped"
ON public.bcba_client_notes
FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid());

CREATE POLICY "BCBA notes update scoped"
ON public.bcba_client_notes
FOR UPDATE TO authenticated
USING (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR author_id = auth.uid()
  OR bcba_id   = auth.uid()
)
WITH CHECK (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR author_id = auth.uid()
  OR bcba_id   = auth.uid()
);

CREATE TABLE IF NOT EXISTS public.bcba_centralreach_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  source_table TEXT NOT NULL,
  source_record_id UUID NOT NULL,
  client_id UUID NULL,
  client_name TEXT NULL,
  client_name_key TEXT NULL,
  centralreach_client_id TEXT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  sync_status TEXT NOT NULL DEFAULT 'pending_review',
  last_error TEXT NULL,
  reviewed_by UUID NULL,
  reviewed_at TIMESTAMPTZ NULL
);
GRANT SELECT, INSERT, UPDATE ON public.bcba_centralreach_outbox TO authenticated;
GRANT ALL ON public.bcba_centralreach_outbox TO service_role;
ALTER TABLE public.bcba_centralreach_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "BCBA CR outbox read"   ON public.bcba_centralreach_outbox;
DROP POLICY IF EXISTS "BCBA CR outbox insert" ON public.bcba_centralreach_outbox;
DROP POLICY IF EXISTS "BCBA CR outbox update" ON public.bcba_centralreach_outbox;

CREATE POLICY "BCBA CR outbox read"
ON public.bcba_centralreach_outbox
FOR SELECT TO authenticated
USING (
  public.bcba_workflow_leadership_can_read(auth.uid())
  OR created_by = auth.uid()
);

CREATE POLICY "BCBA CR outbox insert"
ON public.bcba_centralreach_outbox
FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "BCBA CR outbox update"
ON public.bcba_centralreach_outbox
FOR UPDATE TO authenticated
USING (public.bcba_workflow_leadership_can_read(auth.uid()))
WITH CHECK (public.bcba_workflow_leadership_can_read(auth.uid()));

CREATE INDEX IF NOT EXISTS bcba_cr_outbox_status_idx ON public.bcba_centralreach_outbox (sync_status, created_at DESC);
CREATE INDEX IF NOT EXISTS bcba_cr_outbox_client_idx ON public.bcba_centralreach_outbox (client_name_key);

DROP TRIGGER IF EXISTS bcba_cr_outbox_name_key ON public.bcba_centralreach_outbox;
DROP TRIGGER IF EXISTS bcba_cr_outbox_touch    ON public.bcba_centralreach_outbox;
CREATE TRIGGER bcba_cr_outbox_name_key
  BEFORE INSERT OR UPDATE ON public.bcba_centralreach_outbox
  FOR EACH ROW EXECUTE FUNCTION public.bcba_set_client_name_key();
CREATE TRIGGER bcba_cr_outbox_touch
  BEFORE UPDATE ON public.bcba_centralreach_outbox
  FOR EACH ROW EXECUTE FUNCTION public.bcba_touch_updated_at();
