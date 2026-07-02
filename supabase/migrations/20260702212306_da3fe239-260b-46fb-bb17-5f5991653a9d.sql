
-- Behavioral Support workflow tables
CREATE TABLE public.behavioral_support_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NULL,
  client_name text NOT NULL,
  family_name text NULL,
  state text NULL,
  centralreach_client_id text NULL,
  centralreach_case_id text NULL,
  bcba_name text NULL,
  rbt_name text NULL,
  assigned_to uuid NULL,
  assigned_to_name text NULL,
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  primary_concern text NULL,
  risk_flags text[] NOT NULL DEFAULT '{}',
  last_contact_at timestamptz NULL,
  next_follow_up_at timestamptz NULL,
  source_system text NOT NULL DEFAULT 'manual',
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz NULL
);

CREATE TABLE public.behavioral_support_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NULL REFERENCES public.behavioral_support_cases(id) ON DELETE SET NULL,
  client_id uuid NULL,
  client_name text NOT NULL,
  state text NULL,
  escalation_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'new',
  description text NOT NULL,
  immediate_action text NULL,
  assigned_to uuid NULL,
  assigned_to_name text NULL,
  bcba_name text NULL,
  due_at timestamptz NULL,
  resolved_at timestamptz NULL,
  centralreach_reference_id text NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.behavioral_support_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NULL REFERENCES public.behavioral_support_cases(id) ON DELETE SET NULL,
  client_id uuid NULL,
  client_name text NOT NULL,
  plan_title text NOT NULL,
  plan_status text NOT NULL DEFAULT 'draft',
  reason_for_plan text NULL,
  goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  strategies jsonb NOT NULL DEFAULT '[]'::jsonb,
  replacement_behaviors jsonb NOT NULL DEFAULT '[]'::jsonb,
  family_guidance text NULL,
  rbt_guidance text NULL,
  bcba_owner text NULL,
  review_due_at timestamptz NULL,
  centralreach_reference_id text NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.behavioral_support_plan_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.behavioral_support_plans(id) ON DELETE CASCADE,
  case_id uuid NULL REFERENCES public.behavioral_support_cases(id) ON DELETE SET NULL,
  task_title text NOT NULL,
  task_description text NULL,
  assigned_to uuid NULL,
  assigned_to_name text NULL,
  status text NOT NULL DEFAULT 'open',
  due_at timestamptz NULL,
  completed_at timestamptz NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.behavioral_support_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NULL REFERENCES public.behavioral_support_cases(id) ON DELETE SET NULL,
  escalation_id uuid NULL REFERENCES public.behavioral_support_escalations(id) ON DELETE SET NULL,
  client_id uuid NULL,
  client_name text NOT NULL,
  followup_type text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  assigned_to uuid NULL,
  assigned_to_name text NULL,
  due_at timestamptz NOT NULL,
  completed_at timestamptz NULL,
  outcome text NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.behavioral_support_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NULL REFERENCES public.behavioral_support_cases(id) ON DELETE SET NULL,
  escalation_id uuid NULL REFERENCES public.behavioral_support_escalations(id) ON DELETE SET NULL,
  plan_id uuid NULL REFERENCES public.behavioral_support_plans(id) ON DELETE SET NULL,
  followup_id uuid NULL REFERENCES public.behavioral_support_followups(id) ON DELETE SET NULL,
  activity_type text NOT NULL,
  title text NOT NULL,
  body text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NULL,
  created_by_name text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bs_cases_status ON public.behavioral_support_cases(status);
CREATE INDEX idx_bs_cases_severity ON public.behavioral_support_cases(severity);
CREATE INDEX idx_bs_cases_state ON public.behavioral_support_cases(state);
CREATE INDEX idx_bs_cases_assigned ON public.behavioral_support_cases(assigned_to);
CREATE INDEX idx_bs_cases_client ON public.behavioral_support_cases(client_id);
CREATE INDEX idx_bs_cases_cr_client ON public.behavioral_support_cases(centralreach_client_id);
CREATE INDEX idx_bs_cases_next_followup ON public.behavioral_support_cases(next_follow_up_at);

CREATE INDEX idx_bs_esc_status ON public.behavioral_support_escalations(status);
CREATE INDEX idx_bs_esc_severity ON public.behavioral_support_escalations(severity);
CREATE INDEX idx_bs_esc_state ON public.behavioral_support_escalations(state);
CREATE INDEX idx_bs_esc_assigned ON public.behavioral_support_escalations(assigned_to);
CREATE INDEX idx_bs_esc_due ON public.behavioral_support_escalations(due_at);
CREATE INDEX idx_bs_esc_case ON public.behavioral_support_escalations(case_id);

CREATE INDEX idx_bs_plans_status ON public.behavioral_support_plans(plan_status);
CREATE INDEX idx_bs_plans_case ON public.behavioral_support_plans(case_id);
CREATE INDEX idx_bs_plans_review_due ON public.behavioral_support_plans(review_due_at);

CREATE INDEX idx_bs_tasks_plan ON public.behavioral_support_plan_tasks(plan_id);
CREATE INDEX idx_bs_tasks_status ON public.behavioral_support_plan_tasks(status);
CREATE INDEX idx_bs_tasks_due ON public.behavioral_support_plan_tasks(due_at);

CREATE INDEX idx_bs_followups_status ON public.behavioral_support_followups(status);
CREATE INDEX idx_bs_followups_due ON public.behavioral_support_followups(due_at);
CREATE INDEX idx_bs_followups_case ON public.behavioral_support_followups(case_id);
CREATE INDEX idx_bs_followups_assigned ON public.behavioral_support_followups(assigned_to);

CREATE INDEX idx_bs_activity_case ON public.behavioral_support_activity_log(case_id);
CREATE INDEX idx_bs_activity_type ON public.behavioral_support_activity_log(activity_type);
CREATE INDEX idx_bs_activity_created ON public.behavioral_support_activity_log(created_at DESC);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.behavioral_support_cases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.behavioral_support_escalations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.behavioral_support_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.behavioral_support_plan_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.behavioral_support_followups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.behavioral_support_activity_log TO authenticated;
GRANT ALL ON public.behavioral_support_cases TO service_role;
GRANT ALL ON public.behavioral_support_escalations TO service_role;
GRANT ALL ON public.behavioral_support_plans TO service_role;
GRANT ALL ON public.behavioral_support_plan_tasks TO service_role;
GRANT ALL ON public.behavioral_support_followups TO service_role;
GRANT ALL ON public.behavioral_support_activity_log TO service_role;

-- RLS
ALTER TABLE public.behavioral_support_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_support_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_support_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_support_plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_support_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_support_activity_log ENABLE ROW LEVEL SECURITY;

-- Helper: can view (super_admin, exec, ops_manager, clinic_director, behavioral_support)
-- Helper: can write (super_admin, ops_manager, clinic_director, behavioral_support)

-- Cases
CREATE POLICY "bs_cases_select" ON public.behavioral_support_cases FOR SELECT
  USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'exec') OR public.has_role(auth.uid(),'ops_manager')
    OR public.has_role(auth.uid(),'clinic_director') OR public.has_role(auth.uid(),'behavioral_support')
  );
CREATE POLICY "bs_cases_write" ON public.behavioral_support_cases FOR ALL
  USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'ops_manager') OR public.has_role(auth.uid(),'clinic_director')
    OR public.has_role(auth.uid(),'behavioral_support')
  ) WITH CHECK (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'ops_manager') OR public.has_role(auth.uid(),'clinic_director')
    OR public.has_role(auth.uid(),'behavioral_support')
  );

-- Escalations
CREATE POLICY "bs_esc_select" ON public.behavioral_support_escalations FOR SELECT
  USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'exec') OR public.has_role(auth.uid(),'ops_manager')
    OR public.has_role(auth.uid(),'clinic_director') OR public.has_role(auth.uid(),'behavioral_support')
  );
CREATE POLICY "bs_esc_write" ON public.behavioral_support_escalations FOR ALL
  USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'ops_manager') OR public.has_role(auth.uid(),'clinic_director')
    OR public.has_role(auth.uid(),'behavioral_support')
  ) WITH CHECK (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'ops_manager') OR public.has_role(auth.uid(),'clinic_director')
    OR public.has_role(auth.uid(),'behavioral_support')
  );

-- Plans
CREATE POLICY "bs_plans_select" ON public.behavioral_support_plans FOR SELECT
  USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'exec') OR public.has_role(auth.uid(),'ops_manager')
    OR public.has_role(auth.uid(),'clinic_director') OR public.has_role(auth.uid(),'behavioral_support')
    OR public.has_role(auth.uid(),'bcba')
  );
CREATE POLICY "bs_plans_write" ON public.behavioral_support_plans FOR ALL
  USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'ops_manager') OR public.has_role(auth.uid(),'clinic_director')
    OR public.has_role(auth.uid(),'behavioral_support')
  ) WITH CHECK (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'ops_manager') OR public.has_role(auth.uid(),'clinic_director')
    OR public.has_role(auth.uid(),'behavioral_support')
  );

-- Plan tasks
CREATE POLICY "bs_tasks_select" ON public.behavioral_support_plan_tasks FOR SELECT
  USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'exec') OR public.has_role(auth.uid(),'ops_manager')
    OR public.has_role(auth.uid(),'clinic_director') OR public.has_role(auth.uid(),'behavioral_support')
    OR public.has_role(auth.uid(),'bcba')
  );
CREATE POLICY "bs_tasks_write" ON public.behavioral_support_plan_tasks FOR ALL
  USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'ops_manager') OR public.has_role(auth.uid(),'clinic_director')
    OR public.has_role(auth.uid(),'behavioral_support')
  ) WITH CHECK (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'ops_manager') OR public.has_role(auth.uid(),'clinic_director')
    OR public.has_role(auth.uid(),'behavioral_support')
  );

-- Followups
CREATE POLICY "bs_fu_select" ON public.behavioral_support_followups FOR SELECT
  USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'exec') OR public.has_role(auth.uid(),'ops_manager')
    OR public.has_role(auth.uid(),'clinic_director') OR public.has_role(auth.uid(),'behavioral_support')
  );
CREATE POLICY "bs_fu_write" ON public.behavioral_support_followups FOR ALL
  USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'ops_manager') OR public.has_role(auth.uid(),'clinic_director')
    OR public.has_role(auth.uid(),'behavioral_support')
  ) WITH CHECK (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'ops_manager') OR public.has_role(auth.uid(),'clinic_director')
    OR public.has_role(auth.uid(),'behavioral_support')
  );

-- Activity log
CREATE POLICY "bs_log_select" ON public.behavioral_support_activity_log FOR SELECT
  USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'exec') OR public.has_role(auth.uid(),'ops_manager')
    OR public.has_role(auth.uid(),'clinic_director') OR public.has_role(auth.uid(),'behavioral_support')
  );
CREATE POLICY "bs_log_insert" ON public.behavioral_support_activity_log FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'ops_manager') OR public.has_role(auth.uid(),'clinic_director')
    OR public.has_role(auth.uid(),'behavioral_support')
  );

-- updated_at triggers
CREATE TRIGGER trg_bs_cases_updated BEFORE UPDATE ON public.behavioral_support_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_bs_esc_updated BEFORE UPDATE ON public.behavioral_support_escalations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_bs_plans_updated BEFORE UPDATE ON public.behavioral_support_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_bs_tasks_updated BEFORE UPDATE ON public.behavioral_support_plan_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_bs_fu_updated BEFORE UPDATE ON public.behavioral_support_followups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
