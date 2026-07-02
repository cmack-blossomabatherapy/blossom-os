
-- BCBA workflow tables

-- 1) BCBA actions / tasks
CREATE TABLE public.bcba_action_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NULL,
  client_name TEXT NULL,
  assigned_bcba UUID NULL,
  assigned_to UUID NULL,
  created_by UUID NULL,
  source_area TEXT NOT NULL DEFAULT 'caseload',
  title TEXT NOT NULL,
  description TEXT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  due_date DATE NULL,
  completed_at TIMESTAMPTZ NULL,
  related_authorization_id UUID NULL,
  related_schedule_id UUID NULL,
  related_report_id UUID NULL,
  source_system TEXT NULL,
  centralreach_client_id TEXT NULL,
  centralreach_provider_id TEXT NULL,
  centralreach_session_id TEXT NULL,
  centralreach_authorization_id TEXT NULL,
  centralreach_reference JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_action_tasks TO authenticated;
GRANT ALL ON public.bcba_action_tasks TO service_role;
ALTER TABLE public.bcba_action_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "BCBA action tasks readable by authed" ON public.bcba_action_tasks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "BCBA action tasks insert by owner" ON public.bcba_action_tasks
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() OR created_by IS NULL);
CREATE POLICY "BCBA action tasks update by owner or assignee" ON public.bcba_action_tasks
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid() OR assigned_to = auth.uid() OR assigned_bcba = auth.uid()
  ) WITH CHECK (true);
CREATE POLICY "BCBA action tasks delete by creator" ON public.bcba_action_tasks
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- 2) BCBA supervision logs
CREATE TABLE public.bcba_supervision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NULL,
  client_name TEXT NULL,
  provider_id UUID NULL,
  provider_name TEXT NULL,
  bcba_id UUID NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  modality TEXT NOT NULL DEFAULT 'overlap',
  service_code TEXT NULL,
  minutes INTEGER NULL,
  notes TEXT NULL,
  barriers TEXT NULL,
  next_action TEXT NULL,
  centralreach_session_id TEXT NULL,
  centralreach_reference JSONB NULL,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_supervision_logs TO authenticated;
GRANT ALL ON public.bcba_supervision_logs TO service_role;
ALTER TABLE public.bcba_supervision_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "BCBA supervision logs readable" ON public.bcba_supervision_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "BCBA supervision logs insert" ON public.bcba_supervision_logs
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() OR created_by IS NULL);
CREATE POLICY "BCBA supervision logs update by owner" ON public.bcba_supervision_logs
  FOR UPDATE TO authenticated USING (created_by = auth.uid() OR bcba_id = auth.uid())
  WITH CHECK (true);
CREATE POLICY "BCBA supervision logs delete by owner" ON public.bcba_supervision_logs
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- 3) BCBA parent training logs
CREATE TABLE public.bcba_parent_training_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NULL,
  client_name TEXT NULL,
  caregiver_name TEXT NULL,
  bcba_id UUID NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  service_code TEXT NULL DEFAULT '97156',
  goal TEXT NULL,
  participation_level TEXT NULL,
  barriers TEXT NULL,
  notes TEXT NULL,
  next_session_plan TEXT NULL,
  next_due_date DATE NULL,
  centralreach_session_id TEXT NULL,
  centralreach_reference JSONB NULL,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_parent_training_logs TO authenticated;
GRANT ALL ON public.bcba_parent_training_logs TO service_role;
ALTER TABLE public.bcba_parent_training_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "BCBA PT logs readable" ON public.bcba_parent_training_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "BCBA PT logs insert" ON public.bcba_parent_training_logs
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() OR created_by IS NULL);
CREATE POLICY "BCBA PT logs update by owner" ON public.bcba_parent_training_logs
  FOR UPDATE TO authenticated USING (created_by = auth.uid() OR bcba_id = auth.uid())
  WITH CHECK (true);
CREATE POLICY "BCBA PT logs delete by owner" ON public.bcba_parent_training_logs
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- 4) BCBA treatment plan / PR work items
CREATE TABLE public.bcba_treatment_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NULL,
  client_name TEXT NULL,
  bcba_id UUID NULL,
  authorization_id UUID NULL,
  reauth_cycle_id UUID NULL,
  due_date DATE NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  missing_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  qa_notes TEXT NULL,
  document_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_touched_at TIMESTAMPTZ NULL,
  centralreach_client_id TEXT NULL,
  centralreach_authorization_id TEXT NULL,
  centralreach_reference JSONB NULL,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_treatment_plan_items TO authenticated;
GRANT ALL ON public.bcba_treatment_plan_items TO service_role;
ALTER TABLE public.bcba_treatment_plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "BCBA TP items readable" ON public.bcba_treatment_plan_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "BCBA TP items insert" ON public.bcba_treatment_plan_items
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() OR created_by IS NULL);
CREATE POLICY "BCBA TP items update" ON public.bcba_treatment_plan_items
  FOR UPDATE TO authenticated USING (created_by = auth.uid() OR bcba_id = auth.uid())
  WITH CHECK (true);
CREATE POLICY "BCBA TP items delete" ON public.bcba_treatment_plan_items
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- 5) BCBA client notes / timeline events
CREATE TABLE public.bcba_client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NULL,
  client_name TEXT NULL,
  bcba_id UUID NULL,
  author_id UUID NULL,
  note_type TEXT NOT NULL DEFAULT 'general',
  body TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'clinical',
  related_work_item_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_client_notes TO authenticated;
GRANT ALL ON public.bcba_client_notes TO service_role;
ALTER TABLE public.bcba_client_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "BCBA notes readable" ON public.bcba_client_notes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "BCBA notes insert" ON public.bcba_client_notes
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() OR author_id IS NULL);
CREATE POLICY "BCBA notes update by author" ON public.bcba_client_notes
  FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (true);
CREATE POLICY "BCBA notes delete by author" ON public.bcba_client_notes
  FOR DELETE TO authenticated USING (author_id = auth.uid());

-- Shared updated_at trigger
CREATE OR REPLACE FUNCTION public.bcba_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER bcba_action_tasks_touch BEFORE UPDATE ON public.bcba_action_tasks
  FOR EACH ROW EXECUTE FUNCTION public.bcba_touch_updated_at();
CREATE TRIGGER bcba_supervision_logs_touch BEFORE UPDATE ON public.bcba_supervision_logs
  FOR EACH ROW EXECUTE FUNCTION public.bcba_touch_updated_at();
CREATE TRIGGER bcba_parent_training_logs_touch BEFORE UPDATE ON public.bcba_parent_training_logs
  FOR EACH ROW EXECUTE FUNCTION public.bcba_touch_updated_at();
CREATE TRIGGER bcba_treatment_plan_items_touch BEFORE UPDATE ON public.bcba_treatment_plan_items
  FOR EACH ROW EXECUTE FUNCTION public.bcba_touch_updated_at();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS bcba_action_tasks_bcba_idx ON public.bcba_action_tasks (assigned_bcba, status);
CREATE INDEX IF NOT EXISTS bcba_action_tasks_client_idx ON public.bcba_action_tasks (client_id);
CREATE INDEX IF NOT EXISTS bcba_supervision_logs_client_idx ON public.bcba_supervision_logs (client_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS bcba_parent_training_logs_client_idx ON public.bcba_parent_training_logs (client_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS bcba_treatment_plan_items_bcba_idx ON public.bcba_treatment_plan_items (bcba_id, status);
CREATE INDEX IF NOT EXISTS bcba_client_notes_client_idx ON public.bcba_client_notes (client_id, created_at DESC);
