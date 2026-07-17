
-- Extend pathway steps with richer component metadata
ALTER TABLE public.rbt_pathway_steps
  ADD COLUMN IF NOT EXISTS component_type text,
  ADD COLUMN IF NOT EXISTS estimated_days integer,
  ADD COLUMN IF NOT EXISTS week_number integer,
  ADD COLUMN IF NOT EXISTS delivery_mode text DEFAULT 'self_paced',
  ADD COLUMN IF NOT EXISTS capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS certificate_key text,
  ADD COLUMN IF NOT EXISTS blocks_readiness_gate text;

-- Per-employee pathway assignment (a shell around eligibility)
CREATE TABLE IF NOT EXISTS public.rbt_pathway_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  pathway_id uuid NOT NULL REFERENCES public.rbt_pathways(id) ON DELETE CASCADE,
  assignment_source text NOT NULL DEFAULT 'manual', -- manual | eligibility | recruiter
  assigned_by uuid,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, pathway_id, active)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_pathway_assignments TO authenticated;
GRANT ALL ON public.rbt_pathway_assignments TO service_role;
ALTER TABLE public.rbt_pathway_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt_pathway_assignments_owner_read" ON public.rbt_pathway_assignments
  FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr')
    OR public.has_role(auth.uid(), 'training_admin')
  );
CREATE POLICY "rbt_pathway_assignments_admin_write" ON public.rbt_pathway_assignments
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr')
    OR public.has_role(auth.uid(), 'training_admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr')
    OR public.has_role(auth.uid(), 'training_admin')
  );

-- Eligibility rules (configurable — evaluated by app or edge function)
CREATE TABLE IF NOT EXISTS public.rbt_pathway_eligibility_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id uuid NOT NULL REFERENCES public.rbt_pathways(id) ON DELETE CASCADE,
  name text NOT NULL,
  priority integer NOT NULL DEFAULT 100,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_pathway_eligibility_rules TO authenticated;
GRANT ALL ON public.rbt_pathway_eligibility_rules TO service_role;
ALTER TABLE public.rbt_pathway_eligibility_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt_eligibility_read" ON public.rbt_pathway_eligibility_rules
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "rbt_eligibility_admin_write" ON public.rbt_pathway_eligibility_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'training_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'training_admin'));

-- Remediation assignments (extra work that doesn't reset the pathway)
CREATE TABLE IF NOT EXISTS public.rbt_remediation_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  pathway_step_id uuid REFERENCES public.rbt_pathway_steps(id) ON DELETE SET NULL,
  skill_key text,
  title text NOT NULL,
  reason text,
  assigned_by uuid,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz,
  status text NOT NULL DEFAULT 'assigned', -- assigned | in_progress | submitted | complete | cancelled
  resource_url text,
  notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_remediation_assignments TO authenticated;
GRANT ALL ON public.rbt_remediation_assignments TO service_role;
ALTER TABLE public.rbt_remediation_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt_remediation_owner_read" ON public.rbt_remediation_assignments
  FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR assigned_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'training_admin')
    OR public.has_role(auth.uid(), 'bcba')
  );
CREATE POLICY "rbt_remediation_owner_update" ON public.rbt_remediation_assignments
  FOR UPDATE TO authenticated
  USING (
    employee_id = auth.uid()
    OR assigned_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'training_admin')
    OR public.has_role(auth.uid(), 'bcba')
  );
CREATE POLICY "rbt_remediation_evaluator_insert" ON public.rbt_remediation_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'training_admin')
    OR public.has_role(auth.uid(), 'bcba')
  );

-- Skill Passport
CREATE TABLE IF NOT EXISTS public.rbt_skill_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  category text NOT NULL,
  label text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_skill_definitions TO authenticated;
GRANT ALL ON public.rbt_skill_definitions TO service_role;
ALTER TABLE public.rbt_skill_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt_skill_defs_read" ON public.rbt_skill_definitions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "rbt_skill_defs_admin_write" ON public.rbt_skill_definitions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'training_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'training_admin'));

-- Per-employee current state (derived from latest evaluation, but cached here for fast reads)
CREATE TABLE IF NOT EXISTS public.rbt_skill_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  skill_key text NOT NULL,
  state text NOT NULL DEFAULT 'introduced',
    -- introduced | practiced | observed | demonstrated | needs_reinforcement | competent
  last_evaluation_id uuid,
  last_evaluator_id uuid,
  last_updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, skill_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_skill_status TO authenticated;
GRANT ALL ON public.rbt_skill_status TO service_role;
ALTER TABLE public.rbt_skill_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt_skill_status_read" ON public.rbt_skill_status
  FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'training_admin')
    OR public.has_role(auth.uid(), 'bcba')
  );
CREATE POLICY "rbt_skill_status_write" ON public.rbt_skill_status
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'training_admin')
    OR public.has_role(auth.uid(), 'bcba')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'training_admin')
    OR public.has_role(auth.uid(), 'bcba')
  );

-- Skill evaluations (immutable from RBT perspective)
CREATE TABLE IF NOT EXISTS public.rbt_skill_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  skill_key text NOT NULL,
  evaluator_id uuid NOT NULL,
  evaluator_role text,
  evaluated_at timestamptz NOT NULL DEFAULT now(),
  context text, -- session | roleplay | shadow | competency | signoff | remediation
  rating text NOT NULL, -- introduced | practiced | observed | demonstrated | needs_reinforcement | competent
  notes text,
  follow_up_action text,
  related_training_id uuid,
  related_pathway_step_id uuid REFERENCES public.rbt_pathway_steps(id) ON DELETE SET NULL,
  attachment_url text,
  employee_acknowledged_at timestamptz,
  employee_acknowledgment_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rbt_skill_eval_employee ON public.rbt_skill_evaluations(employee_id, evaluated_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.rbt_skill_evaluations TO authenticated;
GRANT ALL ON public.rbt_skill_evaluations TO service_role;
ALTER TABLE public.rbt_skill_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt_skill_eval_read" ON public.rbt_skill_evaluations
  FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR evaluator_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'training_admin')
    OR public.has_role(auth.uid(), 'bcba')
  );
CREATE POLICY "rbt_skill_eval_evaluator_insert" ON public.rbt_skill_evaluations
  FOR INSERT TO authenticated
  WITH CHECK (
    evaluator_id = auth.uid() AND (
      public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
      OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'training_admin')
      OR public.has_role(auth.uid(), 'bcba')
    )
  );
-- RBTs may ONLY update the acknowledgment fields on their own eval; evaluator can update their own eval
CREATE POLICY "rbt_skill_eval_owner_ack" ON public.rbt_skill_evaluations
  FOR UPDATE TO authenticated
  USING (employee_id = auth.uid() OR evaluator_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'training_admin'))
  WITH CHECK (employee_id = auth.uid() OR evaluator_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'training_admin'));

-- Trigger: RBT cannot modify evaluator conclusions
CREATE OR REPLACE FUNCTION public.rbt_skill_eval_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_owner boolean := NEW.employee_id = auth.uid();
  is_evaluator boolean := NEW.evaluator_id = auth.uid();
  is_admin boolean := public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'training_admin');
BEGIN
  IF is_owner AND NOT is_evaluator AND NOT is_admin THEN
    -- restrict RBT to acknowledgment-only updates
    IF NEW.rating IS DISTINCT FROM OLD.rating
       OR NEW.notes IS DISTINCT FROM OLD.notes
       OR NEW.follow_up_action IS DISTINCT FROM OLD.follow_up_action
       OR NEW.context IS DISTINCT FROM OLD.context
       OR NEW.evaluator_id IS DISTINCT FROM OLD.evaluator_id
       OR NEW.related_pathway_step_id IS DISTINCT FROM OLD.related_pathway_step_id
       OR NEW.related_training_id IS DISTINCT FROM OLD.related_training_id
       OR NEW.attachment_url IS DISTINCT FROM OLD.attachment_url
    THEN
      RAISE EXCEPTION 'RBTs may not edit evaluator conclusions.';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rbt_skill_eval_guard_trg ON public.rbt_skill_evaluations;
CREATE TRIGGER rbt_skill_eval_guard_trg
  BEFORE UPDATE ON public.rbt_skill_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.rbt_skill_eval_guard();

-- Sync skill_status when a new evaluation is added or updated
CREATE OR REPLACE FUNCTION public.rbt_skill_status_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.rbt_skill_status (employee_id, skill_key, state, last_evaluation_id, last_evaluator_id, last_updated_at)
  VALUES (NEW.employee_id, NEW.skill_key, NEW.rating, NEW.id, NEW.evaluator_id, NEW.evaluated_at)
  ON CONFLICT (employee_id, skill_key)
  DO UPDATE SET state = EXCLUDED.state,
                last_evaluation_id = EXCLUDED.last_evaluation_id,
                last_evaluator_id = EXCLUDED.last_evaluator_id,
                last_updated_at = EXCLUDED.last_updated_at
  WHERE public.rbt_skill_status.last_updated_at <= EXCLUDED.last_updated_at;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rbt_skill_status_sync_trg ON public.rbt_skill_evaluations;
CREATE TRIGGER rbt_skill_status_sync_trg
  AFTER INSERT OR UPDATE ON public.rbt_skill_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.rbt_skill_status_sync();

-- Unified training audit log
CREATE TABLE IF NOT EXISTS public.rbt_training_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  actor_id uuid,
  actor_role text,
  action text NOT NULL,
  entity_type text NOT NULL, -- pathway | step | evaluation | remediation | skill_status | assignment
  entity_id uuid,
  from_value text,
  to_value text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rbt_training_audit_employee ON public.rbt_training_audit(employee_id, created_at DESC);
GRANT SELECT, INSERT ON public.rbt_training_audit TO authenticated;
GRANT ALL ON public.rbt_training_audit TO service_role;
ALTER TABLE public.rbt_training_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt_training_audit_read" ON public.rbt_training_audit
  FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR actor_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'training_admin')
    OR public.has_role(auth.uid(), 'bcba')
  );
CREATE POLICY "rbt_training_audit_insert" ON public.rbt_training_audit
  FOR INSERT TO authenticated WITH CHECK (true);

-- Auto-audit triggers
CREATE OR REPLACE FUNCTION public.rbt_audit_pathway_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.rbt_training_audit (employee_id, actor_id, action, entity_type, entity_id, from_value, to_value, details)
  VALUES (NEW.employee_id, auth.uid(),
          CASE WHEN TG_OP = 'INSERT' THEN 'progress.create' ELSE 'progress.update' END,
          'pathway_step', NEW.pathway_step_id,
          CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
          NEW.status,
          jsonb_build_object('notes', NEW.notes));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rbt_audit_pathway_progress_trg ON public.rbt_pathway_progress;
CREATE TRIGGER rbt_audit_pathway_progress_trg
  AFTER INSERT OR UPDATE ON public.rbt_pathway_progress
  FOR EACH ROW EXECUTE FUNCTION public.rbt_audit_pathway_progress();

CREATE OR REPLACE FUNCTION public.rbt_audit_skill_evaluation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.rbt_training_audit (employee_id, actor_id, actor_role, action, entity_type, entity_id, to_value, details)
  VALUES (NEW.employee_id, auth.uid(), NEW.evaluator_role,
          CASE WHEN TG_OP = 'INSERT' THEN 'evaluation.create' ELSE 'evaluation.update' END,
          'evaluation', NEW.id, NEW.rating,
          jsonb_build_object('skill', NEW.skill_key, 'context', NEW.context,
                             'follow_up', NEW.follow_up_action,
                             'acknowledged', NEW.employee_acknowledged_at IS NOT NULL));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rbt_audit_skill_evaluation_trg ON public.rbt_skill_evaluations;
CREATE TRIGGER rbt_audit_skill_evaluation_trg
  AFTER INSERT OR UPDATE ON public.rbt_skill_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.rbt_audit_skill_evaluation();

CREATE OR REPLACE FUNCTION public.rbt_audit_remediation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.rbt_training_audit (employee_id, actor_id, action, entity_type, entity_id, from_value, to_value, details)
  VALUES (NEW.employee_id, auth.uid(),
          CASE WHEN TG_OP = 'INSERT' THEN 'remediation.create' ELSE 'remediation.update' END,
          'remediation', NEW.id,
          CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
          NEW.status,
          jsonb_build_object('title', NEW.title, 'skill', NEW.skill_key, 'pathway_step_id', NEW.pathway_step_id));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rbt_audit_remediation_trg ON public.rbt_remediation_assignments;
CREATE TRIGGER rbt_audit_remediation_trg
  AFTER INSERT OR UPDATE ON public.rbt_remediation_assignments
  FOR EACH ROW EXECUTE FUNCTION public.rbt_audit_remediation();

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.rbt_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS rbt_touch_pathway_assignments ON public.rbt_pathway_assignments;
CREATE TRIGGER rbt_touch_pathway_assignments BEFORE UPDATE ON public.rbt_pathway_assignments
  FOR EACH ROW EXECUTE FUNCTION public.rbt_touch_updated_at();
DROP TRIGGER IF EXISTS rbt_touch_remediation ON public.rbt_remediation_assignments;
CREATE TRIGGER rbt_touch_remediation BEFORE UPDATE ON public.rbt_remediation_assignments
  FOR EACH ROW EXECUTE FUNCTION public.rbt_touch_updated_at();
DROP TRIGGER IF EXISTS rbt_touch_skill_defs ON public.rbt_skill_definitions;
CREATE TRIGGER rbt_touch_skill_defs BEFORE UPDATE ON public.rbt_skill_definitions
  FOR EACH ROW EXECUTE FUNCTION public.rbt_touch_updated_at();
DROP TRIGGER IF EXISTS rbt_touch_eval ON public.rbt_skill_evaluations;
CREATE TRIGGER rbt_touch_eval BEFORE UPDATE ON public.rbt_skill_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.rbt_touch_updated_at();
DROP TRIGGER IF EXISTS rbt_touch_eligibility ON public.rbt_pathway_eligibility_rules;
CREATE TRIGGER rbt_touch_eligibility BEFORE UPDATE ON public.rbt_pathway_eligibility_rules
  FOR EACH ROW EXECUTE FUNCTION public.rbt_touch_updated_at();

-- ============================================================
-- SEED: Skill definitions (core learning topics)
-- ============================================================
INSERT INTO public.rbt_skill_definitions (key, category, label, sort_order) VALUES
  ('pairing',                    'foundations',     'Pairing',                              10),
  ('preference_assessments',     'assessment',      'Preference assessments',               20),
  ('reinforcement',              'foundations',     'Reinforcement',                        30),
  ('verbal_operants',            'aba_theory',      'Verbal operants',                      40),
  ('functions_of_behavior',      'aba_theory',      'Functions of behavior',                50),
  ('responding_to_functions',    'aba_theory',      'Responding to functions',              60),
  ('differential_reinforcement', 'aba_theory',      'Differential reinforcement',           70),
  ('assent_body_language',       'ethics',          'Assent and body language',             80),
  ('prompting',                  'teaching',        'Prompting',                            90),
  ('dtt',                        'teaching',        'DTT',                                 100),
  ('net',                        'teaching',        'NET',                                 110),
  ('chaining',                   'teaching',        'Chaining',                            120),
  ('shaping',                    'teaching',        'Shaping',                             130),
  ('data_collection',            'documentation',   'Data collection',                     140),
  ('session_notes',              'documentation',   'Session notes',                       150),
  ('caregiver_interaction',      'professionalism', 'Caregiver interaction',               160),
  ('professional_boundaries',    'professionalism', 'Professional boundaries',             170),
  ('centralreach_basics',        'systems',         'CentralReach basics',                 180),
  ('incident_escalation',        'safety',          'Incident and escalation procedures',  190)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SEED: Pathway steps for the three primary pathways
-- ============================================================

-- Helper: build steps for a pathway
DO $$
DECLARE
  fast_id uuid;
  dev_id uuid;
  cert_id uuid;
BEGIN
  SELECT id INTO fast_id  FROM public.rbt_pathways WHERE key = 'fast_track';
  SELECT id INTO dev_id   FROM public.rbt_pathways WHERE key = 'developing';
  SELECT id INTO cert_id  FROM public.rbt_pathways WHERE key = 'certification';

  -- Fast Track: certified RBTs — skip 40hr / exam, focus on Blossom + competency
  IF fast_id IS NOT NULL THEN
    INSERT INTO public.rbt_pathway_steps
      (pathway_id, key, title, kind, order_index, required, component_type, estimated_days, delivery_mode, capabilities, description)
    VALUES
      (fast_id, 'orientation',            'Orientation & Welcome',           'event',       10, true, 'orientation',            1, 'live',       '["video","acknowledgment"]'::jsonb, 'Blossom orientation for experienced RBTs.'),
      (fast_id, 'zoom_learning_day',      'Zoom Learning Day',               'event',       20, true, 'zoom_learning_day',      1, 'live',       '["live_event","attendance","quiz"]'::jsonb, 'Live overview of Blossom clinical workflows.'),
      (fast_id, 'cr_basics',              'CentralReach Basics',             'lesson',      30, true, 'aba_fundamentals',       1, 'self_paced', '["video","quiz","acknowledgment"]'::jsonb, null),
      (fast_id, 'session_note_practice',  'Session-Note Practice',           'submission',  40, true, 'session_note_practice',  1, 'self_paced', '["file_submission","trainer_feedback"]'::jsonb, null),
      (fast_id, 'session_note_review',    'Session-Note Review',             'evaluation',  50, true, 'session_note_review',    1, 'live',       '["trainer_feedback"]'::jsonb, null),
      (fast_id, 'shadow_session',         'Lead RBT Shadow Session',         'event',       60, true, 'lead_shadow',            1, 'live',       '["attendance","reflection"]'::jsonb, null),
      (fast_id, 'competency_prep',        'Competency Preparation',          'lesson',      70, true, 'competency_prep',        1, 'self_paced', '["written_lesson","reflection"]'::jsonb, null),
      (fast_id, 'competency_assessment',  'Competency Assessment',           'evaluation',  80, true, 'competency_assessment',  1, 'live',       '["live_event","attendance"]'::jsonb, null),
      (fast_id, 'bcba_signoff',           'BCBA Competency Signoff',         'signoff',     90, true, 'bcba_signoff',           1, 'live',       '["acknowledgment"]'::jsonb, null),
      (fast_id, 'readiness_eval',         'Readiness Evaluation',            'evaluation', 100, true, 'readiness_eval',         1, 'live',       '["trainer_feedback"]'::jsonb, null),
      (fast_id, 'first_session_support',  'First-Session Support',           'coaching',   110, true, 'first_session_support',  1, 'live',       '["live_event"]'::jsonb, null),
      (fast_id, 'follow_up_coaching',     'Follow-Up Coaching',              'coaching',   120, true, 'follow_up_coaching',     7, 'live',       '["live_event","reflection"]'::jsonb, null)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Developing: some ABA experience, working toward RBT
  IF dev_id IS NOT NULL THEN
    INSERT INTO public.rbt_pathway_steps
      (pathway_id, key, title, kind, order_index, required, component_type, estimated_days, delivery_mode, capabilities, description)
    VALUES
      (dev_id, 'orientation',            'Orientation & Welcome',           'event',       10, true, 'orientation',            1,  'live',       '["video","acknowledgment"]'::jsonb, null),
      (dev_id, 'zoom_learning_day',      'Zoom Learning Day',               'event',       20, true, 'zoom_learning_day',      1,  'live',       '["live_event","attendance","quiz"]'::jsonb, null),
      (dev_id, 'aba_fundamentals',       'ABA Fundamentals',                'lesson',      30, true, 'aba_fundamentals',       5,  'self_paced', '["video","written_lesson","quiz","reflection"]'::jsonb, null),
      (dev_id, 'roleplay_day',           'Role-Play Day',                   'event',       40, true, 'roleplay',               1,  'live',       '["live_event","attendance","trainer_feedback"]'::jsonb, null),
      (dev_id, 'shadow_session',         'Lead RBT Shadow Session',         'event',       50, true, 'lead_shadow',            2,  'live',       '["attendance","reflection"]'::jsonb, null),
      (dev_id, 'session_note_practice',  'Session-Note Practice',           'submission',  60, true, 'session_note_practice',  2,  'self_paced', '["file_submission","trainer_feedback","remediation"]'::jsonb, null),
      (dev_id, 'session_note_review',    'Session-Note Review',             'evaluation',  70, true, 'session_note_review',    1,  'live',       '["trainer_feedback"]'::jsonb, null),
      (dev_id, 'competency_prep',        'Competency Preparation',          'lesson',      80, true, 'competency_prep',        2,  'self_paced', '["written_lesson","scenario","reflection"]'::jsonb, null),
      (dev_id, 'competency_assessment',  'Competency Assessment',           'evaluation',  90, true, 'competency_assessment',  1,  'live',       '["live_event","attendance"]'::jsonb, null),
      (dev_id, 'bcba_signoff',           'BCBA Competency Signoff',         'signoff',    100, true, 'bcba_signoff',           1,  'live',       '["acknowledgment"]'::jsonb, null),
      (dev_id, 'exam_prep',              'Exam Preparation',                'lesson',     110, true, 'exam_prep',              3,  'self_paced', '["written_lesson","quiz"]'::jsonb, null),
      (dev_id, 'exam_scheduling',        'Exam Scheduling',                 'task',       120, true, 'exam_scheduling',        1,  'self_paced', '["acknowledgment"]'::jsonb, null),
      (dev_id, 'exam_completion',        'Exam Completion',                 'milestone',  130, true, 'exam_completion',        1,  'live',       '["certificate"]'::jsonb, null),
      (dev_id, 'readiness_eval',         'Readiness Evaluation',            'evaluation', 140, true, 'readiness_eval',         1,  'live',       '["trainer_feedback"]'::jsonb, null),
      (dev_id, 'first_session_support',  'First-Session Support',           'coaching',   150, true, 'first_session_support',  1,  'live',       '["live_event"]'::jsonb, null),
      (dev_id, 'follow_up_coaching',     'Follow-Up Coaching',              'coaching',   160, true, 'follow_up_coaching',    14,  'live',       '["live_event","reflection"]'::jsonb, null)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Certification Journey: full 40-hr + exam
  IF cert_id IS NOT NULL THEN
    INSERT INTO public.rbt_pathway_steps
      (pathway_id, key, title, kind, order_index, required, component_type, estimated_days, delivery_mode, capabilities, description)
    VALUES
      (cert_id, 'orientation',            'Orientation & Welcome',           'event',       10, true, 'orientation',            1, 'live',       '["video","acknowledgment"]'::jsonb, null),
      (cert_id, 'zoom_learning_day',      'Zoom Learning Day',               'event',       20, true, 'zoom_learning_day',      1, 'live',       '["live_event","attendance","quiz"]'::jsonb, null),
      (cert_id, 'aba_fundamentals',       'ABA Fundamentals (40 hr)',        'lesson',      30, true, 'aba_fundamentals',      10, 'self_paced', '["video","written_lesson","quiz","reflection","downloadable"]'::jsonb, '40-hour BACB curriculum.'),
      (cert_id, 'roleplay_day',           'Role-Play Day',                   'event',       40, true, 'roleplay',               1, 'live',       '["live_event","attendance","trainer_feedback"]'::jsonb, null),
      (cert_id, 'shadow_session',         'Lead RBT Shadow Session',         'event',       50, true, 'lead_shadow',            2, 'live',       '["attendance","reflection"]'::jsonb, null),
      (cert_id, 'session_note_practice',  'Session-Note Practice',           'submission',  60, true, 'session_note_practice',  2, 'self_paced', '["file_submission","trainer_feedback","remediation"]'::jsonb, null),
      (cert_id, 'session_note_review',    'Session-Note Review',             'evaluation',  70, true, 'session_note_review',    1, 'live',       '["trainer_feedback"]'::jsonb, null),
      (cert_id, 'competency_prep',        'Competency Preparation',          'lesson',      80, true, 'competency_prep',        3, 'self_paced', '["written_lesson","scenario","reflection"]'::jsonb, null),
      (cert_id, 'competency_assessment',  'Competency Assessment',           'evaluation',  90, true, 'competency_assessment',  1, 'live',       '["live_event","attendance"]'::jsonb, null),
      (cert_id, 'bcba_signoff',           'BCBA Competency Signoff',         'signoff',    100, true, 'bcba_signoff',           1, 'live',       '["acknowledgment"]'::jsonb, null),
      (cert_id, 'exam_prep',              'Exam Preparation',                'lesson',     110, true, 'exam_prep',              5, 'self_paced', '["written_lesson","quiz"]'::jsonb, null),
      (cert_id, 'exam_scheduling',        'Exam Scheduling',                 'task',       120, true, 'exam_scheduling',        2, 'self_paced', '["acknowledgment"]'::jsonb, null),
      (cert_id, 'exam_completion',        'Exam Completion',                 'milestone',  130, true, 'exam_completion',        1, 'live',       '["certificate"]'::jsonb, null),
      (cert_id, 'readiness_eval',         'Readiness Evaluation',            'evaluation', 140, true, 'readiness_eval',         1, 'live',       '["trainer_feedback"]'::jsonb, null),
      (cert_id, 'first_session_support',  'First-Session Support',           'coaching',   150, true, 'first_session_support',  1, 'live',       '["live_event"]'::jsonb, null),
      (cert_id, 'follow_up_coaching',     'Follow-Up Coaching',              'coaching',   160, true, 'follow_up_coaching',    21, 'live',       '["live_event","reflection"]'::jsonb, null)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Default eligibility rules
INSERT INTO public.rbt_pathway_eligibility_rules (pathway_id, name, priority, criteria)
SELECT p.id, 'Holds active RBT credential', 10, '{"has_active_rbt": true}'::jsonb
FROM public.rbt_pathways p WHERE p.key = 'fast_track'
ON CONFLICT DO NOTHING;

INSERT INTO public.rbt_pathway_eligibility_rules (pathway_id, name, priority, criteria)
SELECT p.id, 'Has prior ABA experience', 20, '{"has_prior_aba_experience": true}'::jsonb
FROM public.rbt_pathways p WHERE p.key = 'developing'
ON CONFLICT DO NOTHING;

INSERT INTO public.rbt_pathway_eligibility_rules (pathway_id, name, priority, criteria)
SELECT p.id, 'Default — new hire without ABA experience', 100, '{}'::jsonb
FROM public.rbt_pathways p WHERE p.key = 'certification'
ON CONFLICT DO NOTHING;
