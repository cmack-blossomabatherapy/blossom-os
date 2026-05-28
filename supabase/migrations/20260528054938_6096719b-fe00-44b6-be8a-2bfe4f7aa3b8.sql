
CREATE OR REPLACE FUNCTION public.set_updated_at_evals()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.evaluation_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.evaluation_staff(id) ON DELETE CASCADE,
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Professional Development',
  assigned_by TEXT,
  due_date DATE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT NOT NULL DEFAULT 'Not Started',
  notes TEXT,
  completion_date TIMESTAMPTZ,
  carry_over BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_goals TO authenticated;
GRANT ALL ON public.evaluation_goals TO service_role;
ALTER TABLE public.evaluation_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all goals" ON public.evaluation_goals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.evaluation_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_evals();
CREATE INDEX idx_goals_staff ON public.evaluation_goals(staff_id);

CREATE TABLE public.evaluation_coaching_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.evaluation_staff(id) ON DELETE CASCADE,
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE SET NULL,
  concern_category TEXT NOT NULL,
  description TEXT,
  expectations TEXT,
  required_improvements TEXT,
  support_resources TEXT,
  check_in_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'Active',
  outcome TEXT,
  created_by TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_coaching_plans TO authenticated;
GRANT ALL ON public.evaluation_coaching_plans TO service_role;
ALTER TABLE public.evaluation_coaching_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all coaching" ON public.evaluation_coaching_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_coaching_updated BEFORE UPDATE ON public.evaluation_coaching_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_evals();
CREATE INDEX idx_coaching_staff ON public.evaluation_coaching_plans(staff_id);

CREATE TABLE public.evaluation_ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scope TEXT NOT NULL DEFAULT 'company',
  scope_id UUID,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  recommended_action TEXT,
  source_data JSONB,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_ai_insights TO authenticated;
GRANT ALL ON public.evaluation_ai_insights TO service_role;
ALTER TABLE public.evaluation_ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all insights" ON public.evaluation_ai_insights FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.evaluation_training_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.evaluation_staff(id) ON DELETE CASCADE,
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE SET NULL,
  training_topic TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'Assigned',
  assigned_by TEXT,
  due_date DATE,
  completion_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_training_assignments TO authenticated;
GRANT ALL ON public.evaluation_training_assignments TO service_role;
ALTER TABLE public.evaluation_training_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all training" ON public.evaluation_training_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_training_updated BEFORE UPDATE ON public.evaluation_training_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_evals();

CREATE TABLE public.evaluation_performance_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.evaluation_staff(id) ON DELETE CASCADE,
  self_score NUMERIC(5,2),
  leadership_score NUMERIC(5,2),
  goals_score NUMERIC(5,2),
  overall_score NUMERIC(5,2),
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_performance_scores TO authenticated;
GRANT ALL ON public.evaluation_performance_scores TO service_role;
ALTER TABLE public.evaluation_performance_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all perf" ON public.evaluation_performance_scores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_perf_staff ON public.evaluation_performance_scores(staff_id);

CREATE TABLE public.evaluation_risk_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.evaluation_staff(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  description TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_risk_flags TO authenticated;
GRANT ALL ON public.evaluation_risk_flags TO service_role;
ALTER TABLE public.evaluation_risk_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all flags" ON public.evaluation_risk_flags FOR ALL TO authenticated USING (true) WITH CHECK (true);
