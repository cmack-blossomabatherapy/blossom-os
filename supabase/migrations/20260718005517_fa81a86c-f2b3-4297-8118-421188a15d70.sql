
CREATE TABLE IF NOT EXISTS public.bcba_progress_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_identifier TEXT NOT NULL,
  assigned_bcba_id UUID,
  assigned_bcba_name TEXT,
  authorization_id UUID REFERENCES public.client_authorizations(id) ON DELETE SET NULL,
  authorization_owner_id UUID,
  authorization_owner_name TEXT,
  authorization_period_start DATE,
  authorization_period_end DATE,
  authorization_expiration DATE NOT NULL,
  progress_report_due_date DATE NOT NULL,
  payer TEXT,
  state TEXT,
  report_status TEXT NOT NULL DEFAULT 'upcoming',
  parent_input_status TEXT NOT NULL DEFAULT 'not_needed',
  parent_signature_status TEXT NOT NULL DEFAULT 'not_needed',
  qa_status TEXT NOT NULL DEFAULT 'not_started',
  submission_status TEXT NOT NULL DEFAULT 'not_submitted',
  authorization_status TEXT NOT NULL DEFAULT 'pending',
  current_risk TEXT NOT NULL DEFAULT 'none',
  centralreach_source_date TIMESTAMPTZ,
  centralreach_url TEXT,
  last_update_note TEXT,
  last_update_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bcba_pr_report_status_check CHECK (report_status IN (
    'upcoming','not_started','in_progress','parent_input_needed','parent_signature_needed',
    'submitted','qa_review','changes_requested','ready','sent_to_authorization',
    'authorization_submitted','approved','delayed','at_risk'
  )),
  CONSTRAINT bcba_pr_parent_input_check CHECK (parent_input_status IN ('not_needed','requested','received')),
  CONSTRAINT bcba_pr_parent_sig_check CHECK (parent_signature_status IN ('not_needed','requested','received')),
  CONSTRAINT bcba_pr_qa_check CHECK (qa_status IN ('not_started','in_review','changes_requested','approved')),
  CONSTRAINT bcba_pr_submission_check CHECK (submission_status IN ('not_submitted','submitted','resubmitted','accepted','rejected')),
  CONSTRAINT bcba_pr_auth_check CHECK (authorization_status IN ('pending','submitted','approved','denied','expired')),
  CONSTRAINT bcba_pr_risk_check CHECK (current_risk IN ('none','watch','elevated','critical'))
);
CREATE INDEX IF NOT EXISTS bcba_pr_due_idx ON public.bcba_progress_reports(progress_report_due_date);
CREATE INDEX IF NOT EXISTS bcba_pr_bcba_idx ON public.bcba_progress_reports(assigned_bcba_id);
CREATE INDEX IF NOT EXISTS bcba_pr_owner_idx ON public.bcba_progress_reports(authorization_owner_id);
CREATE INDEX IF NOT EXISTS bcba_pr_status_idx ON public.bcba_progress_reports(report_status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_progress_reports TO authenticated;
GRANT ALL ON public.bcba_progress_reports TO service_role;
ALTER TABLE public.bcba_progress_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_pr_select" ON public.bcba_progress_reports FOR SELECT TO authenticated USING (
  assigned_bcba_id = auth.uid()
  OR authorization_owner_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'authorization_manager'::public.app_role)
  OR public.has_role(auth.uid(), 'auth_team'::public.app_role)
  OR public.has_role(auth.uid(), 'qa'::public.app_role)
  OR public.has_role(auth.uid(), 'qa_director'::public.app_role)
  OR public.has_role(auth.uid(), 'state_director'::public.app_role)
);
CREATE POLICY "bcba_pr_insert" ON public.bcba_progress_reports FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'authorization_manager'::public.app_role)
  OR public.has_role(auth.uid(), 'auth_team'::public.app_role)
  OR public.has_role(auth.uid(), 'bcba'::public.app_role)
);
CREATE POLICY "bcba_pr_update" ON public.bcba_progress_reports FOR UPDATE TO authenticated USING (
  assigned_bcba_id = auth.uid()
  OR authorization_owner_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'authorization_manager'::public.app_role)
  OR public.has_role(auth.uid(), 'auth_team'::public.app_role)
  OR public.has_role(auth.uid(), 'qa'::public.app_role)
);
CREATE POLICY "bcba_pr_delete" ON public.bcba_progress_reports FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE TABLE IF NOT EXISTS public.bcba_progress_report_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  days_before_expiration INT NOT NULL,
  payer TEXT,
  state TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  show_on_dashboard BOOLEAN NOT NULL DEFAULT true,
  notify_bcba BOOLEAN NOT NULL DEFAULT true,
  create_task BOOLEAN NOT NULL DEFAULT false,
  visible_to_authorization_team BOOLEAN NOT NULL DEFAULT true,
  visible_to_state_leadership BOOLEAN NOT NULL DEFAULT false,
  escalate_to_clinical_leadership BOOLEAN NOT NULL DEFAULT false,
  offer_support BOOLEAN NOT NULL DEFAULT true,
  risk_level TEXT NOT NULL DEFAULT 'watch',
  employee_message TEXT NOT NULL,
  due_date_language TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bcba_pr_milestone_risk_check CHECK (risk_level IN ('none','watch','elevated','critical'))
);
CREATE INDEX IF NOT EXISTS bcba_pr_milestones_days_idx ON public.bcba_progress_report_milestones(days_before_expiration);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_progress_report_milestones TO authenticated;
GRANT ALL ON public.bcba_progress_report_milestones TO service_role;
ALTER TABLE public.bcba_progress_report_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_pr_milestones_select" ON public.bcba_progress_report_milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "bcba_pr_milestones_manage" ON public.bcba_progress_report_milestones FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'authorization_manager'::public.app_role)
) WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'authorization_manager'::public.app_role)
);

CREATE TABLE IF NOT EXISTS public.bcba_progress_report_support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_report_id UUID NOT NULL REFERENCES public.bcba_progress_reports(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  detail TEXT,
  requested_by_id UUID,
  requested_by_name TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  task_id UUID REFERENCES public.user_tasks(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bcba_pr_support_category_check CHECK (category IN (
    'authorization_help','parent_signature_barrier','scheduling_barrier','qa_clarification','centralreach_link','status_update','other'
  )),
  CONSTRAINT bcba_pr_support_status_check CHECK (status IN ('open','in_progress','resolved','cancelled'))
);
CREATE INDEX IF NOT EXISTS bcba_pr_support_report_idx ON public.bcba_progress_report_support_requests(progress_report_id);

GRANT SELECT, INSERT, UPDATE ON public.bcba_progress_report_support_requests TO authenticated;
GRANT ALL ON public.bcba_progress_report_support_requests TO service_role;
ALTER TABLE public.bcba_progress_report_support_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_pr_support_select" ON public.bcba_progress_report_support_requests FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.bcba_progress_reports p WHERE p.id = progress_report_id AND (
    p.assigned_bcba_id = auth.uid() OR p.authorization_owner_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
    OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
    OR public.has_role(auth.uid(), 'authorization_manager'::public.app_role)
    OR public.has_role(auth.uid(), 'auth_team'::public.app_role)
    OR public.has_role(auth.uid(), 'qa'::public.app_role)
    OR public.has_role(auth.uid(), 'state_director'::public.app_role)
  ))
);
CREATE POLICY "bcba_pr_support_write" ON public.bcba_progress_report_support_requests FOR INSERT TO authenticated WITH CHECK (
  requested_by_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);
CREATE POLICY "bcba_pr_support_update" ON public.bcba_progress_report_support_requests FOR UPDATE TO authenticated USING (
  requested_by_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'authorization_manager'::public.app_role)
  OR public.has_role(auth.uid(), 'auth_team'::public.app_role)
);

CREATE TABLE IF NOT EXISTS public.bcba_progress_report_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_report_id UUID NOT NULL REFERENCES public.bcba_progress_reports(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id UUID,
  actor_name TEXT,
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bcba_pr_activity_idx ON public.bcba_progress_report_activity(progress_report_id, created_at DESC);

GRANT SELECT, INSERT ON public.bcba_progress_report_activity TO authenticated;
GRANT ALL ON public.bcba_progress_report_activity TO service_role;
ALTER TABLE public.bcba_progress_report_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_pr_activity_select" ON public.bcba_progress_report_activity FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.bcba_progress_reports p WHERE p.id = progress_report_id AND (
    p.assigned_bcba_id = auth.uid() OR p.authorization_owner_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
    OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
    OR public.has_role(auth.uid(), 'authorization_manager'::public.app_role)
    OR public.has_role(auth.uid(), 'auth_team'::public.app_role)
    OR public.has_role(auth.uid(), 'qa'::public.app_role)
    OR public.has_role(auth.uid(), 'state_director'::public.app_role)
  ))
);
CREATE POLICY "bcba_pr_activity_insert" ON public.bcba_progress_report_activity FOR INSERT TO authenticated WITH CHECK (
  actor_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE OR REPLACE FUNCTION public.bcba_pr_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS bcba_pr_touch ON public.bcba_progress_reports;
CREATE TRIGGER bcba_pr_touch BEFORE UPDATE ON public.bcba_progress_reports
FOR EACH ROW EXECUTE FUNCTION public.bcba_pr_touch_updated_at();
DROP TRIGGER IF EXISTS bcba_pr_milestones_touch ON public.bcba_progress_report_milestones;
CREATE TRIGGER bcba_pr_milestones_touch BEFORE UPDATE ON public.bcba_progress_report_milestones
FOR EACH ROW EXECUTE FUNCTION public.bcba_pr_touch_updated_at();
DROP TRIGGER IF EXISTS bcba_pr_support_touch ON public.bcba_progress_report_support_requests;
CREATE TRIGGER bcba_pr_support_touch BEFORE UPDATE ON public.bcba_progress_report_support_requests
FOR EACH ROW EXECUTE FUNCTION public.bcba_pr_touch_updated_at();

CREATE OR REPLACE FUNCTION public.bcba_pr_log_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.bcba_progress_report_activity(progress_report_id, event_type, actor_id, message)
    VALUES (NEW.id, 'created', auth.uid(), 'Progress report created');
    RETURN NEW;
  END IF;
  IF NEW.report_status IS DISTINCT FROM OLD.report_status THEN
    NEW.last_update_at := now();
    INSERT INTO public.bcba_progress_report_activity(progress_report_id, event_type, actor_id, message)
    VALUES (NEW.id, 'status_change', auth.uid(),
            'Status changed: ' || OLD.report_status || ' → ' || NEW.report_status);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS bcba_pr_status_trg ON public.bcba_progress_reports;
CREATE TRIGGER bcba_pr_status_trg
BEFORE INSERT OR UPDATE ON public.bcba_progress_reports
FOR EACH ROW EXECUTE FUNCTION public.bcba_pr_log_status();

INSERT INTO public.bcba_progress_report_milestones
  (name, days_before_expiration, is_active, show_on_dashboard, notify_bcba, create_task,
   visible_to_authorization_team, visible_to_state_leadership, escalate_to_clinical_leadership,
   offer_support, risk_level, employee_message, due_date_language, sort_order)
SELECT * FROM (VALUES
  ('90 days out', 90, true, true, true, false, true, false, false, true, 'watch',
    'Progress report is due in about 90 days. Nice runway — no action required yet.',
    'Due in ~90 days', 10),
  ('9 weeks out', 63, true, true, true, true, true, false, false, true, 'watch',
    'Progress report is due in 9 weeks. A good time to gather data and schedule parent input.',
    'Due in 9 weeks', 20),
  ('6 weeks out', 42, true, true, true, true, true, true, false, true, 'elevated',
    'Progress report is due in 6 weeks. Please start drafting to protect authorization continuity.',
    'Due in 6 weeks', 30),
  ('3 weeks out', 21, true, true, true, true, true, true, false, true, 'elevated',
    'Progress report due in 21 days. Let us know if anything is blocking progress.',
    'Due in 3 weeks', 40),
  ('Critical window', 7, true, true, true, true, true, true, true, true, 'critical',
    'Authorization continuity may be at risk. Please prioritize this report — we are here to help.',
    'Due within a week', 50)
) AS v(name, days_before_expiration, is_active, show_on_dashboard, notify_bcba, create_task,
       visible_to_authorization_team, visible_to_state_leadership, escalate_to_clinical_leadership,
       offer_support, risk_level, employee_message, due_date_language, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.bcba_progress_report_milestones m WHERE m.name = v.name AND m.payer IS NULL AND m.state IS NULL
);
