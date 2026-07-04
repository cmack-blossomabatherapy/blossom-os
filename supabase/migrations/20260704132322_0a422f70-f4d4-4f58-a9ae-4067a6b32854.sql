-- State Operations workflow tables for State Director / Assistant State Director

-- Helper: does the current user share this state via profile OR active leadership role?
CREATE OR REPLACE FUNCTION public.user_is_leadership()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'exec')
    OR public.has_role(auth.uid(), 'executive')
    OR public.has_role(auth.uid(), 'coo')
    OR public.has_role(auth.uid(), 'director_of_operations')
    OR public.has_role(auth.uid(), 'operations_manager')
    OR public.has_role(auth.uid(), 'ops_manager')
$$;

CREATE OR REPLACE FUNCTION public.user_state_code()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.state FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.user_is_state_scoped_role()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'state_director')
      OR public.has_role(auth.uid(), 'assistant_state_director')
$$;

-- 1. state_operational_tasks
CREATE TABLE public.state_operational_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code text NOT NULL,
  title text NOT NULL,
  description text,
  department text NOT NULL,
  category text,
  source_module text,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  owner_role text,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to_name text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_at timestamptz,
  completed_at timestamptz,
  escalated_at timestamptz,
  related_escalation_id uuid,
  lead_id uuid,
  client_id uuid,
  candidate_id uuid,
  provider_id uuid,
  authorization_id uuid,
  scheduling_item_id uuid,
  centralreach_reference_id text,
  centralreach_sync_status text NOT NULL DEFAULT 'not_connected',
  external_source text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.state_operational_tasks TO authenticated;
GRANT ALL ON public.state_operational_tasks TO service_role;
ALTER TABLE public.state_operational_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "state_tasks_read" ON public.state_operational_tasks
  FOR SELECT TO authenticated USING (
    public.user_is_leadership()
    OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
  );

CREATE POLICY "state_tasks_insert" ON public.state_operational_tasks
  FOR INSERT TO authenticated WITH CHECK (
    public.user_is_leadership()
    OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
  );

CREATE POLICY "state_tasks_update" ON public.state_operational_tasks
  FOR UPDATE TO authenticated USING (
    public.user_is_leadership()
    OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
  ) WITH CHECK (
    public.user_is_leadership()
    OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
  );

CREATE POLICY "state_tasks_delete" ON public.state_operational_tasks
  FOR DELETE TO authenticated USING (public.user_is_leadership());

-- 2. state_operational_escalations
CREATE TABLE public.state_operational_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code text NOT NULL,
  title text NOT NULL,
  description text,
  department text NOT NULL,
  category text,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  assigned_to_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to_name text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_at timestamptz,
  resolved_at timestamptz,
  resolution text,
  lead_id uuid,
  client_id uuid,
  candidate_id uuid,
  provider_id uuid,
  authorization_id uuid,
  scheduling_item_id uuid,
  centralreach_reference_id text,
  centralreach_sync_status text NOT NULL DEFAULT 'not_connected',
  external_source text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.state_operational_escalations TO authenticated;
GRANT ALL ON public.state_operational_escalations TO service_role;
ALTER TABLE public.state_operational_escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "state_esc_read" ON public.state_operational_escalations
  FOR SELECT TO authenticated USING (
    public.user_is_leadership()
    OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
  );
CREATE POLICY "state_esc_insert" ON public.state_operational_escalations
  FOR INSERT TO authenticated WITH CHECK (
    public.user_is_leadership()
    OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
  );
CREATE POLICY "state_esc_update" ON public.state_operational_escalations
  FOR UPDATE TO authenticated USING (
    public.user_is_leadership()
    OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
  ) WITH CHECK (
    public.user_is_leadership()
    OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
  );
CREATE POLICY "state_esc_delete" ON public.state_operational_escalations
  FOR DELETE TO authenticated USING (public.user_is_leadership());

-- 3. state_operational_notes
CREATE TABLE public.state_operational_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code text NOT NULL,
  parent_type text NOT NULL CHECK (parent_type IN ('task','escalation')),
  parent_id uuid NOT NULL,
  body text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.state_operational_notes TO authenticated;
GRANT ALL ON public.state_operational_notes TO service_role;
ALTER TABLE public.state_operational_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "state_notes_read" ON public.state_operational_notes
  FOR SELECT TO authenticated USING (
    public.user_is_leadership()
    OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
  );
CREATE POLICY "state_notes_insert" ON public.state_operational_notes
  FOR INSERT TO authenticated WITH CHECK (
    public.user_is_leadership()
    OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
  );
CREATE POLICY "state_notes_delete" ON public.state_operational_notes
  FOR DELETE TO authenticated USING (public.user_is_leadership());

-- 4. state_operational_activity
CREATE TABLE public.state_operational_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code text,
  event_kind text NOT NULL,
  message text NOT NULL,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text,
  related_type text,
  related_id uuid,
  lead_id uuid,
  client_id uuid,
  candidate_id uuid,
  provider_id uuid,
  authorization_id uuid,
  scheduling_item_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.state_operational_activity TO authenticated;
GRANT ALL ON public.state_operational_activity TO service_role;
ALTER TABLE public.state_operational_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "state_activity_read" ON public.state_operational_activity
  FOR SELECT TO authenticated USING (
    public.user_is_leadership()
    OR (state_code IS NOT NULL AND public.user_is_state_scoped_role() AND state_code = public.user_state_code())
  );
CREATE POLICY "state_activity_insert" ON public.state_operational_activity
  FOR INSERT TO authenticated WITH CHECK (
    public.user_is_leadership()
    OR (state_code IS NULL)
    OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
  );

-- 5. state_department_handoffs (optional, lightweight)
CREATE TABLE public.state_department_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code text NOT NULL,
  from_role text,
  to_department text NOT NULL,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  related_task_id uuid,
  related_escalation_id uuid,
  lead_id uuid,
  client_id uuid,
  candidate_id uuid,
  provider_id uuid,
  authorization_id uuid,
  scheduling_item_id uuid,
  centralreach_reference_id text,
  centralreach_sync_status text NOT NULL DEFAULT 'not_connected',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.state_department_handoffs TO authenticated;
GRANT ALL ON public.state_department_handoffs TO service_role;
ALTER TABLE public.state_department_handoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "state_handoffs_read" ON public.state_department_handoffs
  FOR SELECT TO authenticated USING (
    public.user_is_leadership()
    OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
  );
CREATE POLICY "state_handoffs_insert" ON public.state_department_handoffs
  FOR INSERT TO authenticated WITH CHECK (
    public.user_is_leadership()
    OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
  );
CREATE POLICY "state_handoffs_update" ON public.state_department_handoffs
  FOR UPDATE TO authenticated USING (
    public.user_is_leadership()
    OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
  ) WITH CHECK (
    public.user_is_leadership()
    OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_state_ops_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_state_ops_tasks_updated_at
  BEFORE UPDATE ON public.state_operational_tasks
  FOR EACH ROW EXECUTE FUNCTION public.tg_state_ops_updated_at();

CREATE TRIGGER trg_state_ops_esc_updated_at
  BEFORE UPDATE ON public.state_operational_escalations
  FOR EACH ROW EXECUTE FUNCTION public.tg_state_ops_updated_at();

CREATE TRIGGER trg_state_handoffs_updated_at
  BEFORE UPDATE ON public.state_department_handoffs
  FOR EACH ROW EXECUTE FUNCTION public.tg_state_ops_updated_at();

-- Indexes for common filters
CREATE INDEX idx_state_tasks_state ON public.state_operational_tasks(state_code, status);
CREATE INDEX idx_state_esc_state ON public.state_operational_escalations(state_code, status);
CREATE INDEX idx_state_notes_parent ON public.state_operational_notes(parent_type, parent_id);
CREATE INDEX idx_state_activity_state ON public.state_operational_activity(state_code, created_at DESC);
CREATE INDEX idx_state_handoffs_state ON public.state_department_handoffs(state_code, status);
