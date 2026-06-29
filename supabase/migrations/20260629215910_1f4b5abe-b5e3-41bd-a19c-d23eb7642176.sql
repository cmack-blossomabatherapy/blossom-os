
-- shared trigger function in public (storage. version exists but we keep public clean)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1. scheduling_actions
CREATE TABLE public.scheduling_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID,
  action_type TEXT NOT NULL,
  title TEXT,
  note TEXT,
  state TEXT,
  owner_role TEXT,
  owner_user_id UUID,
  assigned_to_user_id UUID,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduling_actions TO authenticated;
GRANT ALL ON public.scheduling_actions TO service_role;
ALTER TABLE public.scheduling_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scheduling_actions_read_auth" ON public.scheduling_actions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "scheduling_actions_insert_auth" ON public.scheduling_actions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "scheduling_actions_update_auth" ON public.scheduling_actions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "scheduling_actions_delete_admin" ON public.scheduling_actions
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );
CREATE INDEX scheduling_actions_client_idx ON public.scheduling_actions(client_id);
CREATE INDEX scheduling_actions_status_idx ON public.scheduling_actions(status);
CREATE INDEX scheduling_actions_created_idx ON public.scheduling_actions(created_at DESC);
CREATE TRIGGER scheduling_actions_set_updated_at
  BEFORE UPDATE ON public.scheduling_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. scheduling_coverage_cases
CREATE TABLE public.scheduling_coverage_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID,
  state TEXT,
  case_type TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  rbt_name TEXT,
  bcba_name TEXT,
  approved_hours NUMERIC,
  scheduled_hours NUMERIC,
  delivered_hours NUMERIC,
  gap_hours NUMERIC,
  reason TEXT,
  next_action TEXT,
  owner_user_id UUID,
  escalation_level INT NOT NULL DEFAULT 0,
  resolved_at TIMESTAMPTZ,
  centralreach_reference_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduling_coverage_cases TO authenticated;
GRANT ALL ON public.scheduling_coverage_cases TO service_role;
ALTER TABLE public.scheduling_coverage_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scheduling_coverage_read_auth" ON public.scheduling_coverage_cases
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "scheduling_coverage_insert_auth" ON public.scheduling_coverage_cases
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "scheduling_coverage_update_auth" ON public.scheduling_coverage_cases
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "scheduling_coverage_delete_admin" ON public.scheduling_coverage_cases
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );
CREATE INDEX scheduling_coverage_client_idx ON public.scheduling_coverage_cases(client_id);
CREATE INDEX scheduling_coverage_status_idx ON public.scheduling_coverage_cases(status);
CREATE INDEX scheduling_coverage_risk_idx ON public.scheduling_coverage_cases(risk_level);
CREATE TRIGGER scheduling_coverage_set_updated_at
  BEFORE UPDATE ON public.scheduling_coverage_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. scheduling_cancellations
CREATE TABLE public.scheduling_cancellations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID,
  session_date DATE,
  start_time TIME,
  end_time TIME,
  duration_hours NUMERIC,
  state TEXT,
  location TEXT,
  rbt_name TEXT,
  bcba_name TEXT,
  cancelled_by TEXT,
  reason TEXT,
  make_up_required BOOLEAN NOT NULL DEFAULT false,
  make_up_status TEXT NOT NULL DEFAULT 'not_required',
  make_up_date TIMESTAMPTZ,
  family_notified BOOLEAN NOT NULL DEFAULT false,
  bcba_notified BOOLEAN NOT NULL DEFAULT false,
  state_director_notified BOOLEAN NOT NULL DEFAULT false,
  centralreach_sync_status TEXT NOT NULL DEFAULT 'not_ready',
  centralreach_reference_id TEXT,
  created_by UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduling_cancellations TO authenticated;
GRANT ALL ON public.scheduling_cancellations TO service_role;
ALTER TABLE public.scheduling_cancellations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scheduling_cancellations_read_auth" ON public.scheduling_cancellations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "scheduling_cancellations_insert_auth" ON public.scheduling_cancellations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "scheduling_cancellations_update_auth" ON public.scheduling_cancellations
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "scheduling_cancellations_delete_admin" ON public.scheduling_cancellations
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );
CREATE INDEX scheduling_cancellations_client_idx ON public.scheduling_cancellations(client_id);
CREATE INDEX scheduling_cancellations_date_idx ON public.scheduling_cancellations(session_date DESC);
CREATE INDEX scheduling_cancellations_makeup_status_idx ON public.scheduling_cancellations(make_up_status);
CREATE TRIGGER scheduling_cancellations_set_updated_at
  BEFORE UPDATE ON public.scheduling_cancellations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. scheduling_session_adjustments
CREATE TABLE public.scheduling_session_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID,
  adjustment_type TEXT NOT NULL,
  day_of_week TEXT,
  session_date DATE,
  old_start_time TIME,
  old_end_time TIME,
  new_start_time TIME,
  new_end_time TIME,
  old_rbt_name TEXT,
  new_rbt_name TEXT,
  old_location TEXT,
  new_location TEXT,
  reason TEXT,
  approval_status TEXT NOT NULL DEFAULT 'draft',
  centralreach_sync_status TEXT NOT NULL DEFAULT 'not_ready',
  centralreach_reference_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduling_session_adjustments TO authenticated;
GRANT ALL ON public.scheduling_session_adjustments TO service_role;
ALTER TABLE public.scheduling_session_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scheduling_adjustments_read_auth" ON public.scheduling_session_adjustments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "scheduling_adjustments_insert_auth" ON public.scheduling_session_adjustments
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "scheduling_adjustments_update_auth" ON public.scheduling_session_adjustments
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "scheduling_adjustments_delete_admin" ON public.scheduling_session_adjustments
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );
CREATE INDEX scheduling_adjustments_client_idx ON public.scheduling_session_adjustments(client_id);
CREATE INDEX scheduling_adjustments_status_idx ON public.scheduling_session_adjustments(approval_status);
CREATE INDEX scheduling_adjustments_sync_idx ON public.scheduling_session_adjustments(centralreach_sync_status);
CREATE TRIGGER scheduling_adjustments_set_updated_at
  BEFORE UPDATE ON public.scheduling_session_adjustments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
