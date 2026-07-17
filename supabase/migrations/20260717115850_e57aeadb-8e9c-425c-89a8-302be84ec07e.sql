
DO $$ BEGIN
  CREATE TYPE public.rbt_lifecycle_stage AS ENUM (
    'offer_accepted','preboarding','training','certification_in_progress',
    'ready_for_staffing','first_case_pending','first_case_active','first_30_days',
    'active','established','advanced_candidate','lead','trainer_floater_lead',
    'fellowship_applicant','fellowship_participant','bcba_transition',
    'leave_inactive','offboarding'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.rbt_pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_pathways TO authenticated;
GRANT ALL ON public.rbt_pathways TO service_role;
ALTER TABLE public.rbt_pathways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read active pathways" ON public.rbt_pathways
  FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage pathways" ON public.rbt_pathways
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_rbt_pathways_updated BEFORE UPDATE ON public.rbt_pathways
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.rbt_pathways (key,name,description) VALUES
  ('fast_track','Experienced RBT Fast Track','For candidates who already hold an active RBT credential.'),
  ('developing','Developing RBT Path','For candidates with some ABA experience working toward certification.'),
  ('certification','RBT Certification Journey','Full 40-hour training + BACB certification pathway.'),
  ('fellowship','BCBA Fellowship (2-Year)','Long-term pathway for RBTs progressing toward BCBA.')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE public.rbt_pathway_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id UUID NOT NULL REFERENCES public.rbt_pathways(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  required BOOLEAN NOT NULL DEFAULT true,
  kind TEXT NOT NULL DEFAULT 'task',
  ref_id TEXT,
  gate_stage public.rbt_lifecycle_stage,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pathway_id, key)
);
GRANT SELECT ON public.rbt_pathway_steps TO authenticated;
GRANT ALL ON public.rbt_pathway_steps TO service_role;
ALTER TABLE public.rbt_pathway_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read steps" ON public.rbt_pathway_steps
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage steps" ON public.rbt_pathway_steps
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_rbt_pathway_steps_updated BEFORE UPDATE ON public.rbt_pathway_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.rbt_pathway_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  pathway_step_id UUID NOT NULL REFERENCES public.rbt_pathway_steps(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started',
  completed_at TIMESTAMPTZ,
  evidence_url TEXT,
  notes TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, pathway_step_id)
);
GRANT SELECT, INSERT, UPDATE ON public.rbt_pathway_progress TO authenticated;
GRANT ALL ON public.rbt_pathway_progress TO service_role;
ALTER TABLE public.rbt_pathway_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt own progress read" ON public.rbt_pathway_progress
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_admin') OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "rbt own progress write" ON public.rbt_pathway_progress
  FOR INSERT TO authenticated WITH CHECK (employee_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "rbt own progress update" ON public.rbt_pathway_progress
  FOR UPDATE TO authenticated
  USING (employee_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (employee_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_rbt_pathway_progress_updated BEFORE UPDATE ON public.rbt_pathway_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.rbt_lifecycle_state (
  employee_id UUID PRIMARY KEY,
  stage public.rbt_lifecycle_stage NOT NULL DEFAULT 'offer_accepted',
  pathway_id UUID REFERENCES public.rbt_pathways(id),
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_lifecycle_state TO authenticated;
GRANT ALL ON public.rbt_lifecycle_state TO service_role;
ALTER TABLE public.rbt_lifecycle_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt own lifecycle read" ON public.rbt_lifecycle_state
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'));
CREATE POLICY "admin manage lifecycle" ON public.rbt_lifecycle_state
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));
CREATE TRIGGER trg_rbt_lifecycle_state_updated BEFORE UPDATE ON public.rbt_lifecycle_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.rbt_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  from_stage public.rbt_lifecycle_stage,
  to_stage public.rbt_lifecycle_stage NOT NULL,
  reason TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  actor_id UUID REFERENCES auth.users(id),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.rbt_lifecycle_events TO authenticated;
GRANT ALL ON public.rbt_lifecycle_events TO service_role;
ALTER TABLE public.rbt_lifecycle_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt own events read" ON public.rbt_lifecycle_events
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'));
CREATE POLICY "admin insert events" ON public.rbt_lifecycle_events
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR actor_id = auth.uid());

CREATE OR REPLACE FUNCTION public.log_rbt_lifecycle_change()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.stage IS DISTINCT FROM NEW.stage) THEN
    INSERT INTO public.rbt_lifecycle_events (employee_id, from_stage, to_stage, source, actor_id)
    VALUES (NEW.employee_id, CASE WHEN TG_OP='INSERT' THEN NULL ELSE OLD.stage END, NEW.stage, 'manual', auth.uid());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_rbt_lifecycle_state_audit
  AFTER INSERT OR UPDATE ON public.rbt_lifecycle_state
  FOR EACH ROW EXECUTE FUNCTION public.log_rbt_lifecycle_change();

CREATE TABLE public.rbt_lifecycle_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_stage public.rbt_lifecycle_stage,
  to_stage public.rbt_lifecycle_stage NOT NULL,
  predicate_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_lifecycle_rules TO authenticated;
GRANT ALL ON public.rbt_lifecycle_rules TO service_role;
ALTER TABLE public.rbt_lifecycle_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read active rules" ON public.rbt_lifecycle_rules
  FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage rules" ON public.rbt_lifecycle_rules
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_rbt_lifecycle_rules_updated BEFORE UPDATE ON public.rbt_lifecycle_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.rbt_career_interests (
  employee_id UUID PRIMARY KEY,
  interested_in_lead BOOLEAN NOT NULL DEFAULT false,
  interested_in_fellowship BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.rbt_career_interests TO authenticated;
GRANT ALL ON public.rbt_career_interests TO service_role;
ALTER TABLE public.rbt_career_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt own career read" ON public.rbt_career_interests
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'));
CREATE POLICY "rbt own career upsert" ON public.rbt_career_interests
  FOR INSERT TO authenticated WITH CHECK (employee_id = auth.uid());
CREATE POLICY "rbt own career update" ON public.rbt_career_interests
  FOR UPDATE TO authenticated
  USING (employee_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (employee_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_rbt_career_interests_updated BEFORE UPDATE ON public.rbt_career_interests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.rbt_data_sync_status (
  source TEXT PRIMARY KEY,
  last_success_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'unknown',
  message TEXT,
  stale_after_hours INT NOT NULL DEFAULT 36,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_data_sync_status TO authenticated;
GRANT ALL ON public.rbt_data_sync_status TO service_role;
ALTER TABLE public.rbt_data_sync_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read sync status" ON public.rbt_data_sync_status
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage sync status" ON public.rbt_data_sync_status
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_rbt_data_sync_status_updated BEFORE UPDATE ON public.rbt_data_sync_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.rbt_data_sync_status (source, status) VALUES
  ('centralreach_schedule','unknown'),
  ('centralreach_clients','unknown'),
  ('viventium_employees','unknown')
ON CONFLICT (source) DO NOTHING;

CREATE TABLE public.rbt_shift_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  file_name TEXT,
  imported_by UUID REFERENCES auth.users(id),
  row_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'complete',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_shift_import_batches TO authenticated;
GRANT ALL ON public.rbt_shift_import_batches TO service_role;
ALTER TABLE public.rbt_shift_import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage import batches" ON public.rbt_shift_import_batches
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'scheduling'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'scheduling'));

CREATE TABLE public.rbt_shift_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.rbt_shift_import_batches(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  employee_id UUID,
  client_external_id TEXT,
  client_initials TEXT,
  service_code TEXT,
  location_type TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  bcba_first_name TEXT,
  bcba_last_initial TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);
CREATE INDEX idx_rbt_shift_events_employee_time ON public.rbt_shift_events (employee_id, starts_at);
GRANT SELECT ON public.rbt_shift_events TO authenticated;
GRANT ALL ON public.rbt_shift_events TO service_role;
ALTER TABLE public.rbt_shift_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt own shifts read" ON public.rbt_shift_events
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid()
         OR public.has_role(auth.uid(),'admin')
         OR public.has_role(auth.uid(),'scheduling')
         OR public.has_role(auth.uid(),'state_director'));

-- Minimum-necessary assigned clients view (initials + minimal metadata only)
CREATE OR REPLACE VIEW public.rbt_assigned_clients_min_v AS
SELECT
  a.rbt_employee_id AS employee_id,
  a.client_id,
  COALESCE(
    NULLIF(
      regexp_replace(
        upper(
          array_to_string(
            ARRAY(
              SELECT LEFT(part, 1)
              FROM regexp_split_to_table(coalesce(c.child_name, a.client_name, ''), '\s+') AS part
              WHERE length(part) > 0
            ),
            ''
          )
        ),
        '[^A-Z]', '', 'g'
      ),
      ''
    ),
    'C'
  ) AS client_initials,
  a.authorized_service_codes,
  a.clinic,
  a.state,
  a.start_date,
  a.status,
  a.assigned_bcba_id
FROM public.rbt_client_assignments a
LEFT JOIN public.clients c ON c.id = a.client_id;

GRANT SELECT ON public.rbt_assigned_clients_min_v TO authenticated;
