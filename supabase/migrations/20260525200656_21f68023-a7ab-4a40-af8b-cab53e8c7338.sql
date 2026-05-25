
CREATE TABLE public.interview_outcome_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  step_key TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT true,
  completed_by UUID,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, step_key)
);

ALTER TABLE public.interview_outcome_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view interview checks"
  ON public.interview_outcome_checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert interview checks"
  ON public.interview_outcome_checks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update interview checks"
  ON public.interview_outcome_checks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete interview checks"
  ON public.interview_outcome_checks FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_interview_outcome_checks_updated_at
  BEFORE UPDATE ON public.interview_outcome_checks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_interview_outcome_checks_candidate ON public.interview_outcome_checks(candidate_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.interview_outcome_checks;
