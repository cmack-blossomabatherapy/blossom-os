
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.evaluation_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('BCBA','RBT')),
  state TEXT,
  supervisor_id UUID REFERENCES public.evaluation_staff(id) ON DELETE SET NULL,
  supervisor_name TEXT,
  hire_date DATE,
  active_status BOOLEAN NOT NULL DEFAULT true,
  evaluation_frequency TEXT NOT NULL DEFAULT 'Both' CHECK (evaluation_frequency IN ('Quarterly','Annual','Both')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.evaluation_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('Quarterly','Annual')),
  staff_type TEXT NOT NULL CHECK (staff_type IN ('BCBA','RBT','Both')),
  start_date DATE,
  self_due_date DATE,
  leadership_due_date DATE,
  meeting_due_date DATE,
  final_due_date DATE,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Active','Complete','Archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.evaluation_staff(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES public.evaluation_cycles(id) ON DELETE SET NULL,
  evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('Quarterly','Annual')),
  self_status TEXT NOT NULL DEFAULT 'Not Sent' CHECK (self_status IN ('Not Sent','Sent','Opened','Completed','Overdue')),
  leadership_status TEXT NOT NULL DEFAULT 'Not Started' CHECK (leadership_status IN ('Not Started','In Progress','Completed')),
  meeting_status TEXT NOT NULL DEFAULT 'Not Scheduled' CHECK (meeting_status IN ('Not Scheduled','Scheduled','Completed')),
  final_status TEXT NOT NULL DEFAULT 'Not Started' CHECK (final_status IN ('Not Started','In Progress','Needs Meeting','Complete','Overdue')),
  next_review_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_evaluations_staff ON public.evaluations(staff_id);
CREATE INDEX idx_evaluations_cycle ON public.evaluations(cycle_id);

CREATE TABLE public.evaluation_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  meeting_date TIMESTAMPTZ,
  meeting_status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (meeting_status IN ('Scheduled','Completed','Cancelled')),
  notes TEXT,
  completed_by UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.evaluation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.evaluation_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  staff_role TEXT NOT NULL CHECK (staff_role IN ('BCBA','RBT')),
  evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('Quarterly','Annual')),
  form_type TEXT NOT NULL CHECK (form_type IN ('Self','Leadership')),
  questions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_status BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.evaluation_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  form_id UUID REFERENCES public.evaluation_forms(id) ON DELETE SET NULL,
  respondent_id UUID,
  respondent_email TEXT,
  response_type TEXT NOT NULL CHECK (response_type IN ('Self','Leadership')),
  answers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.evaluation_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.evaluation_staff(id) ON DELETE SET NULL,
  cycle_id UUID REFERENCES public.evaluation_cycles(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'Queued' CHECK (status IN ('Draft','Queued','Sent','Failed')),
  sent_at TIMESTAMPTZ,
  last_reminder_at TIMESTAMPTZ,
  failed_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_staff TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_cycles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_meetings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_forms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_responses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_emails TO authenticated;
GRANT ALL ON public.evaluation_staff, public.evaluation_cycles, public.evaluations,
  public.evaluation_meetings, public.evaluation_notes, public.evaluation_forms,
  public.evaluation_responses, public.evaluation_emails TO service_role;

ALTER TABLE public.evaluation_staff      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_cycles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_meetings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_notes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_forms      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_responses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_emails     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth full evaluation_staff"      ON public.evaluation_staff      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth full evaluation_cycles"     ON public.evaluation_cycles     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth full evaluations"           ON public.evaluations           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth full evaluation_meetings"   ON public.evaluation_meetings   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth full evaluation_notes"      ON public.evaluation_notes      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth full evaluation_forms"      ON public.evaluation_forms      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth full evaluation_responses"  ON public.evaluation_responses  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth full evaluation_emails"     ON public.evaluation_emails     FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_evaluation_staff_updated   BEFORE UPDATE ON public.evaluation_staff   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_evaluation_cycles_updated  BEFORE UPDATE ON public.evaluation_cycles  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_evaluations_updated        BEFORE UPDATE ON public.evaluations        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_evaluation_forms_updated   BEFORE UPDATE ON public.evaluation_forms   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
