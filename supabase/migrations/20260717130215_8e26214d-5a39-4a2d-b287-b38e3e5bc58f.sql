
-- ==== Career stage catalog ====================================================
CREATE TABLE public.rbt_career_stages (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  description TEXT,
  employee_summary TEXT,
  is_fellowship BOOLEAN NOT NULL DEFAULT false,
  requires_application BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_career_stages TO authenticated;
GRANT ALL ON public.rbt_career_stages TO service_role;
ALTER TABLE public.rbt_career_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career stages read" ON public.rbt_career_stages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "career stages admin write" ON public.rbt_career_stages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'));
CREATE TRIGGER trg_rbt_career_stages_updated BEFORE UPDATE ON public.rbt_career_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==== Requirements per stage =================================================
CREATE TABLE public.rbt_career_stage_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_key TEXT NOT NULL REFERENCES public.rbt_career_stages(key) ON DELETE CASCADE,
  requirement_key TEXT NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_index INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (stage_key, requirement_key)
);
GRANT SELECT ON public.rbt_career_stage_requirements TO authenticated;
GRANT ALL ON public.rbt_career_stage_requirements TO service_role;
ALTER TABLE public.rbt_career_stage_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career reqs read" ON public.rbt_career_stage_requirements
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "career reqs admin write" ON public.rbt_career_stage_requirements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'));
CREATE TRIGGER trg_rbt_career_stage_reqs_updated BEFORE UPDATE ON public.rbt_career_stage_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==== Per-employee evaluation of requirements ================================
CREATE TABLE public.rbt_career_stage_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  stage_key TEXT NOT NULL REFERENCES public.rbt_career_stages(key) ON DELETE CASCADE,
  requirement_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | met | not_met | waived
  evidence TEXT,
  notes TEXT,
  evaluated_at TIMESTAMPTZ,
  evaluated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, stage_key, requirement_key)
);
CREATE INDEX idx_rbt_stage_evals_emp ON public.rbt_career_stage_evaluations(employee_id, stage_key);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_career_stage_evaluations TO authenticated;
GRANT ALL ON public.rbt_career_stage_evaluations TO service_role;
ALTER TABLE public.rbt_career_stage_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eval own read" ON public.rbt_career_stage_evaluations
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'hr')
    OR public.has_role(auth.uid(),'training_admin')
    OR public.has_role(auth.uid(),'executive')
    OR public.has_role(auth.uid(),'bcba'));
CREATE POLICY "eval admin write" ON public.rbt_career_stage_evaluations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin') OR public.has_role(auth.uid(),'bcba'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin') OR public.has_role(auth.uid(),'bcba'));
CREATE TRIGGER trg_rbt_stage_evals_updated BEFORE UPDATE ON public.rbt_career_stage_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==== Extend rbt_career_interests ============================================
ALTER TABLE public.rbt_career_interests
  ADD COLUMN IF NOT EXISTS primary_interest TEXT,
  ADD COLUMN IF NOT EXISTS secondary_interests TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS mentor_requested BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mentor_request_notes TEXT,
  ADD COLUMN IF NOT EXISTS open_to_internal_opportunities BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_by UUID;

-- ==== Mentor requests ========================================================
CREATE TABLE public.rbt_mentor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  focus_area TEXT,
  preferred_mentor TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted | reviewing | matched | closed
  assigned_mentor_id UUID,
  admin_notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rbt_mentor_emp ON public.rbt_mentor_requests(employee_id, status);
GRANT SELECT, INSERT, UPDATE ON public.rbt_mentor_requests TO authenticated;
GRANT ALL ON public.rbt_mentor_requests TO service_role;
ALTER TABLE public.rbt_mentor_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mentor req own read" ON public.rbt_mentor_requests
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'));
CREATE POLICY "mentor req own insert" ON public.rbt_mentor_requests
  FOR INSERT TO authenticated WITH CHECK (employee_id = auth.uid());
CREATE POLICY "mentor req admin update" ON public.rbt_mentor_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'));
CREATE TRIGGER trg_rbt_mentor_updated BEFORE UPDATE ON public.rbt_mentor_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==== Internal opportunity interest ==========================================
CREATE TABLE public.rbt_internal_opportunity_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  opportunity_type TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted | reviewed | contacted | closed
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rbt_opp_emp ON public.rbt_internal_opportunity_interest(employee_id);
GRANT SELECT, INSERT, UPDATE ON public.rbt_internal_opportunity_interest TO authenticated;
GRANT ALL ON public.rbt_internal_opportunity_interest TO service_role;
ALTER TABLE public.rbt_internal_opportunity_interest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opp own read" ON public.rbt_internal_opportunity_interest
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'));
CREATE POLICY "opp own insert" ON public.rbt_internal_opportunity_interest
  FOR INSERT TO authenticated WITH CHECK (employee_id = auth.uid());
CREATE POLICY "opp admin update" ON public.rbt_internal_opportunity_interest
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'));
CREATE TRIGGER trg_rbt_opp_updated BEFORE UPDATE ON public.rbt_internal_opportunity_interest
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==== Development plans ======================================================
CREATE TABLE public.rbt_development_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  target_stage_key TEXT REFERENCES public.rbt_career_stages(key),
  focus_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  next_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  owner_id UUID,
  status TEXT NOT NULL DEFAULT 'active', -- active | paused | complete | archived
  summary TEXT,
  last_reviewed_at TIMESTAMPTZ,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rbt_devplan_emp ON public.rbt_development_plans(employee_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_development_plans TO authenticated;
GRANT ALL ON public.rbt_development_plans TO service_role;
ALTER TABLE public.rbt_development_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "devplan own read" ON public.rbt_development_plans
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin') OR public.has_role(auth.uid(),'bcba'));
CREATE POLICY "devplan admin write" ON public.rbt_development_plans
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin') OR public.has_role(auth.uid(),'bcba'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin') OR public.has_role(auth.uid(),'bcba'));
CREATE TRIGGER trg_rbt_devplan_updated BEFORE UPDATE ON public.rbt_development_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==== Fellowship Explorer content ============================================
CREATE TABLE public.rbt_fellowship_content (
  section_key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,
  order_index INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  published_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_fellowship_content TO authenticated;
GRANT ALL ON public.rbt_fellowship_content TO service_role;
ALTER TABLE public.rbt_fellowship_content ENABLE ROW LEVEL SECURITY;
-- Employees see only published sections; admins see all
CREATE POLICY "fellow content read" ON public.rbt_fellowship_content
  FOR SELECT TO authenticated
  USING (published = true
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'hr')
    OR public.has_role(auth.uid(),'training_admin')
    OR public.has_role(auth.uid(),'executive'));
CREATE POLICY "fellow content admin write" ON public.rbt_fellowship_content
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'));
CREATE TRIGGER trg_rbt_fellow_content_updated BEFORE UPDATE ON public.rbt_fellowship_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==== Fellowship lifecycle stages catalog ====================================
CREATE TABLE public.rbt_fellowship_stages (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- interest | review | enrollment | active | exit
  order_index INT NOT NULL DEFAULT 0,
  description TEXT,
  employee_visible BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_fellowship_stages TO authenticated;
GRANT ALL ON public.rbt_fellowship_stages TO service_role;
ALTER TABLE public.rbt_fellowship_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fellow stage read" ON public.rbt_fellowship_stages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "fellow stage admin write" ON public.rbt_fellowship_stages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'));
CREATE TRIGGER trg_rbt_fellow_stages_updated BEFORE UPDATE ON public.rbt_fellowship_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==== Fellowship participants ================================================
CREATE TABLE public.rbt_fellowship_participants (
  employee_id UUID PRIMARY KEY,
  stage_key TEXT NOT NULL REFERENCES public.rbt_fellowship_stages(key),
  cohort_label TEXT,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.rbt_fellowship_participants TO authenticated;
GRANT ALL ON public.rbt_fellowship_participants TO service_role;
ALTER TABLE public.rbt_fellowship_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fellow part own read" ON public.rbt_fellowship_participants
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin') OR public.has_role(auth.uid(),'executive'));
CREATE POLICY "fellow part admin write" ON public.rbt_fellowship_participants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'));
CREATE TRIGGER trg_rbt_fellow_part_updated BEFORE UPDATE ON public.rbt_fellowship_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==== Fellowship applications ================================================
CREATE TABLE public.rbt_fellowship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'started', -- started | submitted | under_review | accepted | waitlisted | not_selected | deferred | withdrawn
  application_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  decision TEXT,
  decision_at TIMESTAMPTZ,
  decision_by UUID,
  decision_notes TEXT,
  cohort_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rbt_fellow_app_emp ON public.rbt_fellowship_applications(employee_id, status);
GRANT SELECT, INSERT, UPDATE ON public.rbt_fellowship_applications TO authenticated;
GRANT ALL ON public.rbt_fellowship_applications TO service_role;
ALTER TABLE public.rbt_fellowship_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fellow app own read" ON public.rbt_fellowship_applications
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin') OR public.has_role(auth.uid(),'executive'));
CREATE POLICY "fellow app own insert" ON public.rbt_fellowship_applications
  FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid()
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'));
CREATE POLICY "fellow app update" ON public.rbt_fellowship_applications
  FOR UPDATE TO authenticated
  USING (
    (employee_id = auth.uid() AND status IN ('started'))
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'))
  WITH CHECK (
    (employee_id = auth.uid() AND status IN ('started','submitted','withdrawn'))
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin'));
CREATE TRIGGER trg_rbt_fellow_app_updated BEFORE UPDATE ON public.rbt_fellowship_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==== Audit log ==============================================================
CREATE TABLE public.rbt_growth_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID,
  actor_id UUID,
  event_type TEXT NOT NULL,
  entity_table TEXT,
  entity_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rbt_growth_audit_emp ON public.rbt_growth_audit(employee_id, created_at DESC);
GRANT SELECT, INSERT ON public.rbt_growth_audit TO authenticated;
GRANT ALL ON public.rbt_growth_audit TO service_role;
ALTER TABLE public.rbt_growth_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "growth audit read" ON public.rbt_growth_audit
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'training_admin') OR public.has_role(auth.uid(),'executive'));
CREATE POLICY "growth audit insert" ON public.rbt_growth_audit
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- ==== Seed: career stages ====================================================
INSERT INTO public.rbt_career_stages (key, name, order_index, description, employee_summary, is_fellowship, requires_application) VALUES
 ('new_rbt', 'New RBT', 10, 'RBTs in their first months getting established on cases.',
  'You are building your foundation as an RBT. Focus on reliability, feedback, and consistent sessions.', false, false),
 ('established_rbt', 'Established RBT', 20, 'RBTs consistently delivering strong sessions across their caseload.',
  'You are a trusted RBT. Keep growing your skills — new opportunities open from here.', false, false),
 ('advanced_rbt', 'Advanced RBT', 30, 'RBTs demonstrating advanced technical and clinical support skills.',
  'You are ready to take on higher-complexity cases and deeper skill work.', false, true),
 ('lead_rbt', 'Lead RBT', 40, 'RBTs supporting peers, onboarding new hires, and modeling excellence.',
  'You help other RBTs succeed while continuing to deliver sessions.', false, true),
 ('trainer_floater_lead_rbt', 'Trainer / Floater Lead RBT', 50, 'RBTs who train new hires, cover complex cases, and support operations.',
  'You are a flexible, senior RBT trusted for training and coverage.', false, true),
 ('fellowship_candidate', 'Fellowship Candidate', 60, 'RBTs actively exploring or applying for the Fellowship.',
  'You are exploring the BCBA Fellowship pathway. Nothing is guaranteed yet — details are still being finalized.', true, true),
 ('fellowship_participant', 'Fellowship Participant', 70, 'RBTs active in the Fellowship program.',
  'You are in the Fellowship. Program specifics come from your Fellowship team.', true, false),
 ('bcba_transition', 'BCBA Transition', 80, 'Employees transitioning from RBT/Fellow into BCBA roles.',
  'You are transitioning into a BCBA role. Your Fellowship and HR team will guide next steps.', true, false)
ON CONFLICT (key) DO NOTHING;

-- ==== Seed: sample requirements (configurable placeholders) ==================
INSERT INTO public.rbt_career_stage_requirements (stage_key, requirement_key, label, category, description, order_index) VALUES
 ('established_rbt','tenure_90','Complete 90 days as an RBT','tenure','Configurable tenure threshold.',10),
 ('established_rbt','training_core','Complete core training pathway','training','Configurable training completion rule.',20),
 ('established_rbt','credential_active','RBT credential in good standing','credential','',30),
 ('established_rbt','attendance_reliable','Reliable attendance record','attendance','Configurable attendance rule.',40),
 ('established_rbt','documentation_current','Session notes submitted on time','documentation','',50),
 ('established_rbt','supervision_participation','Consistent supervision participation','supervision','',60),
 ('advanced_rbt','performance_review','Positive performance review','performance','Configurable review threshold.',10),
 ('advanced_rbt','bcba_recommendation','BCBA recommendation on file','recommendation','',20),
 ('advanced_rbt','application_submitted','Advanced RBT application submitted','application','',30),
 ('lead_rbt','tenure_lead','Meets tenure threshold for Lead','tenure','',10),
 ('lead_rbt','manager_recommendation','Manager and BCBA recommendation','recommendation','',20),
 ('lead_rbt','application_submitted','Lead RBT application submitted','application','',30),
 ('lead_rbt','capacity_available','Open Lead capacity in state','capacity','Program capacity gate.',40),
 ('trainer_floater_lead_rbt','training_delivery','Demonstrated ability to train new RBTs','training','',10),
 ('trainer_floater_lead_rbt','coverage_flexibility','Available for flexible coverage','attendance','',20),
 ('trainer_floater_lead_rbt','application_submitted','Trainer/Floater Lead application submitted','application','',30),
 ('fellowship_candidate','tenure_fellowship','Meets Fellowship tenure requirement','tenure','',10),
 ('fellowship_candidate','education_prereq','Meets Fellowship education prerequisites','documentation','Placeholder — administrator configures.',20),
 ('fellowship_candidate','manager_recommendation','Manager and BCBA recommendation','recommendation','',30),
 ('fellowship_candidate','application_submitted','Fellowship application submitted','application','',40),
 ('fellowship_candidate','capacity_available','Fellowship cohort capacity','capacity','',50)
ON CONFLICT (stage_key, requirement_key) DO NOTHING;

-- ==== Seed: fellowship lifecycle stages ======================================
INSERT INTO public.rbt_fellowship_stages (key, name, category, order_index, description) VALUES
 ('interest_expressed','Interest expressed','interest',10,'Employee has expressed interest in the Fellowship.'),
 ('information_session','Information session','interest',20,'Employee attended or registered for an information session.'),
 ('eligibility_review','Eligibility review','review',30,'Eligibility is being reviewed.'),
 ('application_started','Application started','review',40,'Application in progress.'),
 ('application_submitted','Application submitted','review',50,'Application submitted for review.'),
 ('under_review','Under review','review',60,'Application under formal review.'),
 ('accepted','Accepted','enrollment',70,'Application accepted.'),
 ('waitlisted','Waitlisted','enrollment',80,'Placed on waitlist.'),
 ('not_selected','Not selected','exit',90,'Not selected this cycle.'),
 ('deferred','Deferred','enrollment',100,'Start deferred to a future cohort.'),
 ('active_fellow','Active fellow','active',110,'Active in the Fellowship.'),
 ('paused','Paused','active',120,'Fellowship participation paused.'),
 ('withdrawn','Withdrawn','exit',130,'Withdrawn from the Fellowship.'),
 ('completed','Completed','exit',140,'Completed the Fellowship program.'),
 ('bcba_transition','BCBA transition','exit',150,'Transitioned into a BCBA role.')
ON CONFLICT (key) DO NOTHING;

-- ==== Seed: fellowship content placeholders (unpublished) ====================
INSERT INTO public.rbt_fellowship_content (section_key, title, order_index, published) VALUES
 ('program_overview','Program overview',10,false),
 ('two_year_roadmap','Two-year roadmap',20,false),
 ('eligibility','Eligibility',30,false),
 ('education_requirements','Education requirements',40,false),
 ('what_blossom_provides','What Blossom provides',50,false),
 ('employee_responsibilities','Employee responsibilities',60,false),
 ('fieldwork_structure','Fieldwork structure',70,false),
 ('supervision','Supervision',80,false),
 ('application_windows','Application windows',90,false),
 ('financial_terms','Financial terms',100,false),
 ('employment_commitment','Employment commitment',110,false),
 ('faq','Frequently asked questions',120,false),
 ('information_sessions','Information sessions',130,false),
 ('interest_form','Interest form',140,false)
ON CONFLICT (section_key) DO NOTHING;
