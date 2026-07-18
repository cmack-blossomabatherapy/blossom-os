
-- ============================================================
-- BCBA LIFECYCLE ENGINE (mirrors RBT engine)
-- ============================================================

-- 1) Stages configuration
CREATE TABLE public.bcba_lifecycle_stages (
  key                      text PRIMARY KEY,
  name                     text NOT NULL,
  description              text,
  sort_order               integer NOT NULL DEFAULT 0,
  employee_message         text,
  required_approver_role   text,
  is_terminal              boolean NOT NULL DEFAULT false,
  is_active                boolean NOT NULL DEFAULT true,
  allowed_next_keys        text[] NOT NULL DEFAULT '{}',
  required_gates           jsonb NOT NULL DEFAULT '[]'::jsonb,
  automatic_actions        jsonb NOT NULL DEFAULT '[]'::jsonb,
  notification_templates   jsonb NOT NULL DEFAULT '[]'::jsonb,
  dashboard_cards          jsonb NOT NULL DEFAULT '[]'::jsonb,
  menu_features            text[] NOT NULL DEFAULT '{}',
  training_assignments     jsonb NOT NULL DEFAULT '[]'::jsonb,
  task_assignments         jsonb NOT NULL DEFAULT '[]'::jsonb,
  checkin_schedule         jsonb NOT NULL DEFAULT '[]'::jsonb,
  access_rules             jsonb NOT NULL DEFAULT '{}'::jsonb,
  leadership_visibility    jsonb NOT NULL DEFAULT '{}'::jsonb,
  color                    text DEFAULT 'slate',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bcba_lifecycle_stages TO authenticated;
GRANT SELECT ON public.bcba_lifecycle_stages TO anon;
GRANT ALL ON public.bcba_lifecycle_stages TO service_role;
ALTER TABLE public.bcba_lifecycle_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bcba_stages_read" ON public.bcba_lifecycle_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "bcba_stages_admin_write" ON public.bcba_lifecycle_stages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));

-- 2) State per employee
CREATE TABLE public.bcba_lifecycle_state (
  employee_id  uuid PRIMARY KEY,
  stage        text NOT NULL DEFAULT 'offer_accepted' REFERENCES public.bcba_lifecycle_stages(key),
  pathway_id   uuid,
  entered_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   uuid,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bcba_lifecycle_state TO authenticated;
GRANT ALL ON public.bcba_lifecycle_state TO service_role;
ALTER TABLE public.bcba_lifecycle_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bcba_state_self_or_leadership_read" ON public.bcba_lifecycle_state FOR SELECT TO authenticated
  USING (employee_id = auth.uid()
      OR public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'hr')
      OR public.has_role(auth.uid(),'ops_manager')
      OR public.has_role(auth.uid(),'exec'));
CREATE POLICY "bcba_state_admin_write" ON public.bcba_lifecycle_state FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));

-- 3) Events (audit history)
CREATE TABLE public.bcba_lifecycle_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  uuid NOT NULL,
  from_stage   text,
  to_stage     text NOT NULL,
  reason       text,
  source       text NOT NULL DEFAULT 'manual',
  actor_id     uuid,
  occurred_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_bcba_lifecycle_events_emp ON public.bcba_lifecycle_events(employee_id, occurred_at DESC);
GRANT SELECT, INSERT ON public.bcba_lifecycle_events TO authenticated;
GRANT ALL ON public.bcba_lifecycle_events TO service_role;
ALTER TABLE public.bcba_lifecycle_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bcba_events_read" ON public.bcba_lifecycle_events FOR SELECT TO authenticated
  USING (employee_id = auth.uid()
      OR public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'hr')
      OR public.has_role(auth.uid(),'ops_manager')
      OR public.has_role(auth.uid(),'exec'));
CREATE POLICY "bcba_events_admin_insert" ON public.bcba_lifecycle_events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));

-- 4) Transition rules
CREATE TABLE public.bcba_lifecycle_rules (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_stage     text,
  to_stage       text NOT NULL,
  predicate_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  description    text,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bcba_lifecycle_rules TO authenticated;
GRANT ALL ON public.bcba_lifecycle_rules TO service_role;
ALTER TABLE public.bcba_lifecycle_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bcba_rules_read" ON public.bcba_lifecycle_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "bcba_rules_admin_write" ON public.bcba_lifecycle_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));

-- 5) Gate completions
CREATE TABLE public.bcba_lifecycle_gate_completions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   uuid NOT NULL,
  stage_key     text NOT NULL,
  gate_key      text NOT NULL,
  completed_at  timestamptz NOT NULL DEFAULT now(),
  completed_by  uuid,
  evidence      jsonb DEFAULT '{}'::jsonb,
  notes         text,
  UNIQUE (employee_id, stage_key, gate_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_lifecycle_gate_completions TO authenticated;
GRANT ALL ON public.bcba_lifecycle_gate_completions TO service_role;
ALTER TABLE public.bcba_lifecycle_gate_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bcba_gates_read" ON public.bcba_lifecycle_gate_completions FOR SELECT TO authenticated
  USING (employee_id = auth.uid()
      OR public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'hr')
      OR public.has_role(auth.uid(),'ops_manager'));
CREATE POLICY "bcba_gates_admin_write" ON public.bcba_lifecycle_gate_completions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));

-- 6) Synthetic test profiles
CREATE TABLE public.bcba_synthetic_test_profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name  text NOT NULL,
  stage_key     text NOT NULL REFERENCES public.bcba_lifecycle_stages(key),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bcba_synthetic_test_profiles TO authenticated;
GRANT ALL ON public.bcba_synthetic_test_profiles TO service_role;
ALTER TABLE public.bcba_synthetic_test_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bcba_synth_read" ON public.bcba_synthetic_test_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "bcba_synth_admin_write" ON public.bcba_synthetic_test_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));

-- ============================================================
-- Timestamp trigger (reuses generic touch if present)
-- ============================================================
CREATE OR REPLACE FUNCTION public.bcba_lifecycle_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER bcba_lifecycle_stages_touch BEFORE UPDATE ON public.bcba_lifecycle_stages
  FOR EACH ROW EXECUTE FUNCTION public.bcba_lifecycle_touch();
CREATE TRIGGER bcba_lifecycle_state_touch BEFORE UPDATE ON public.bcba_lifecycle_state
  FOR EACH ROW EXECUTE FUNCTION public.bcba_lifecycle_touch();
CREATE TRIGGER bcba_lifecycle_rules_touch BEFORE UPDATE ON public.bcba_lifecycle_rules
  FOR EACH ROW EXECUTE FUNCTION public.bcba_lifecycle_touch();

-- ============================================================
-- advance_bcba_lifecycle RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.advance_bcba_lifecycle(
  _employee_id uuid,
  _to_stage    text,
  _reason      text DEFAULT NULL,
  _override    boolean DEFAULT false,
  _source      text DEFAULT 'manual'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_current text;
  v_target_cfg public.bcba_lifecycle_stages%ROWTYPE;
  v_actor uuid := auth.uid();
  v_is_admin boolean := public.has_role(v_actor, 'admin');
  v_is_hr boolean := public.has_role(v_actor, 'hr');
  v_missing text[] := ARRAY[]::text[];
  v_gate jsonb;
BEGIN
  SELECT stage INTO v_current FROM public.bcba_lifecycle_state WHERE employee_id = _employee_id;

  SELECT * INTO v_target_cfg FROM public.bcba_lifecycle_stages WHERE key = _to_stage;
  IF v_target_cfg.key IS NULL THEN
    RAISE EXCEPTION 'Unknown stage: %', _to_stage USING ERRCODE = '22023';
  END IF;

  IF NOT (v_is_admin OR v_is_hr
          OR (v_target_cfg.required_approver_role IS NOT NULL
              AND public.has_role(v_actor, v_target_cfg.required_approver_role::app_role))) THEN
    RAISE EXCEPTION 'Not authorized to move employee into stage %', _to_stage USING ERRCODE = '42501';
  END IF;

  IF v_current IS NOT NULL AND NOT _override THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.bcba_lifecycle_stages
      WHERE key = v_current AND _to_stage = ANY(allowed_next_keys)
    ) THEN
      RAISE EXCEPTION 'Transition % -> % is not allowed', v_current, _to_stage USING ERRCODE = '22023';
    END IF;
  END IF;

  IF NOT _override THEN
    FOR v_gate IN SELECT * FROM jsonb_array_elements(v_target_cfg.required_gates) LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.bcba_lifecycle_gate_completions
        WHERE employee_id = _employee_id
          AND stage_key = _to_stage
          AND gate_key = v_gate->>'key'
      ) THEN
        v_missing := v_missing || (v_gate->>'key');
      END IF;
    END LOOP;
    IF array_length(v_missing, 1) > 0 THEN
      RAISE EXCEPTION 'Missing required gates: %', array_to_string(v_missing, ', ') USING ERRCODE = '23514';
    END IF;
  END IF;

  IF _override AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins may override lifecycle gates' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.bcba_lifecycle_state (employee_id, stage, entered_at, updated_by, updated_at)
  VALUES (_employee_id, _to_stage, now(), v_actor, now())
  ON CONFLICT (employee_id) DO UPDATE
    SET stage = EXCLUDED.stage, entered_at = now(), updated_by = v_actor, updated_at = now();

  INSERT INTO public.bcba_lifecycle_events
    (employee_id, from_stage, to_stage, actor_id, reason, source, occurred_at)
  VALUES
    (_employee_id, v_current, _to_stage, v_actor,
     COALESCE(_reason, CASE WHEN _override THEN 'override' ELSE NULL END),
     _source, now());

  INSERT INTO public.user_notifications (user_id, title, body, category, link)
  VALUES (
    _employee_id,
    'Lifecycle stage updated',
    COALESCE(v_target_cfg.employee_message, 'You have moved to ' || v_target_cfg.name || '.'),
    'lifecycle',
    '/me'
  );

  RETURN jsonb_build_object(
    'employee_id', _employee_id,
    'from_stage', v_current,
    'to_stage', _to_stage,
    'override', _override,
    'actor_id', v_actor
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.advance_bcba_lifecycle(uuid, text, text, boolean, text) TO authenticated;

-- ============================================================
-- Seed 18 stages
-- ============================================================
INSERT INTO public.bcba_lifecycle_stages
  (key, name, description, sort_order, employee_message, required_approver_role, is_terminal, allowed_next_keys, required_gates, menu_features, color)
VALUES
 ('offer_accepted','Offer Accepted','BCBA offer has been signed. Preparing for preboarding.',10,
   'Welcome! We are preparing your BCBA preboarding.','hr',false,
   ARRAY['preboarding','inactive'],
   '[{"key":"offer_signed","label":"Signed offer on file"}]'::jsonb,
   ARRAY['home','learn','support','me'],'blue'),

 ('preboarding','Preboarding','Pre-hire paperwork, welcome kit, orientation scheduling.',20,
   'Complete your preboarding items before Day 1.','hr',false,
   ARRAY['credentialing','inactive'],
   '[{"key":"i9_complete","label":"I-9 complete"},{"key":"policies_signed","label":"Policies signed"}]'::jsonb,
   ARRAY['home','preboarding','learn','support','me'],'blue'),

 ('credentialing','Credentialing','BCBA license verification, insurance panels, malpractice.',30,
   'We are verifying your credentials with each payer.','credentialing_lead',false,
   ARRAY['onboarding','inactive'],
   '[{"key":"license_verified","label":"BCBA license verified"},{"key":"npi_confirmed","label":"NPI confirmed"}]'::jsonb,
   ARRAY['home','credentials','learn','support','me'],'violet'),

 ('onboarding','Onboarding','Blossom OS training, SOPs, culture, tools walkthrough.',40,
   'Your BCBA onboarding is underway.','hr',false,
   ARRAY['systems_setup','inactive'],
   '[{"key":"orientation_complete","label":"Orientation complete"}]'::jsonb,
   ARRAY['home','learn','support','me'],'violet'),

 ('systems_setup','Systems Setup','CentralReach, email, calendar, phone system access.',50,
   'Your systems and access are being provisioned.','ops_manager',false,
   ARRAY['initial_caseload_setup','inactive'],
   '[{"key":"cr_access","label":"CentralReach access granted"},{"key":"email_setup","label":"Email configured"}]'::jsonb,
   ARRAY['home','learn','support','me'],'amber'),

 ('initial_caseload_setup','Initial Caseload Setup','First clients assigned, treatment plans reviewed.',60,
   'Your initial caseload is being assembled.','ops_manager',false,
   ARRAY['first_30_days','inactive'],
   '[{"key":"first_clients_assigned","label":"First clients assigned"}]'::jsonb,
   ARRAY['home','clients','schedule','learn','support','me'],'amber'),

 ('first_30_days','First 30 Days','Ramp-up, weekly check-ins, close mentor support.',70,
   'You are in your first 30 days. Weekly check-ins scheduled.','ops_manager',false,
   ARRAY['first_90_days','leave','inactive'],
   '[]'::jsonb,
   ARRAY['home','clients','schedule','supervision','learn','support','me'],'emerald'),

 ('first_90_days','First 90 Days','Full caseload, bi-weekly leadership check-ins.',80,
   'You are through your first month — 90-day check-ins are active.','ops_manager',false,
   ARRAY['active_bcba','leave','inactive'],
   '[]'::jsonb,
   ARRAY['home','clients','schedule','supervision','learn','support','me'],'emerald'),

 ('active_bcba','Active BCBA','Established caseload, standard operating rhythm.',90,
   'You are an active BCBA.',NULL,false,
   ARRAY['established_bcba','leave','inactive','offboarding'],
   '[]'::jsonb,
   ARRAY['home','clients','schedule','supervision','credentials','performance','learn','support','me','growth'],'green'),

 ('established_bcba','Established BCBA','12+ months, consistent metrics.',100,
   'Established BCBA — thanks for the impact.',NULL,false,
   ARRAY['senior_bcba_candidate','active_bcba','leave','inactive','offboarding'],
   '[]'::jsonb,
   ARRAY['home','clients','schedule','supervision','credentials','performance','growth','learn','support','me'],'green'),

 ('senior_bcba_candidate','Senior BCBA Candidate','Being evaluated for senior clinical responsibility.',110,
   'You are being considered for a Senior BCBA role.','ops_manager',false,
   ARRAY['lead_bcba','established_bcba','leave','inactive'],
   '[{"key":"clinical_review","label":"Clinical performance review passed"}]'::jsonb,
   ARRAY['home','clients','schedule','supervision','credentials','performance','growth','learn','support','me'],'teal'),

 ('lead_bcba','Lead BCBA','Leads a small BCBA pod, mentors newer BCBAs.','120',
   'Congratulations — you are now a Lead BCBA.','exec',false,
   ARRAY['clinical_director_candidate','established_bcba','leave','inactive'],
   '[]'::jsonb,
   ARRAY['home','clients','schedule','supervision','credentials','performance','growth','learn','support','me','team'],'teal'),

 ('clinical_director_candidate','Clinical Director Candidate','Evaluation for Clinical Director track.',130,
   'You are being considered for the Clinical Director track.','exec',false,
   ARRAY['fellowship_supervisor','lead_bcba','leave','inactive'],
   '[{"key":"leadership_panel","label":"Leadership panel completed"}]'::jsonb,
   ARRAY['home','clients','supervision','performance','growth','learn','support','me','team'],'indigo'),

 ('fellowship_supervisor','Fellowship Supervisor','Supervises BCBA fellows and mentorship programs.',140,
   'You are now a Fellowship Supervisor.','exec',false,
   ARRAY['clinical_director_candidate','lead_bcba','leave','inactive'],
   '[]'::jsonb,
   ARRAY['home','clients','supervision','performance','growth','learn','support','me','team','fellowship'],'indigo'),

 ('leave','Leave of Absence','Employee is on approved leave.',900,
   'You are currently on leave. Access is limited until you return.','hr',false,
   ARRAY['active_bcba','established_bcba','inactive','offboarding'],
   '[]'::jsonb,
   ARRAY['home','support','me'],'slate'),

 ('inactive','Inactive','Temporarily inactive — not scheduled.',910,
   'You are currently inactive. Contact HR to resume.','hr',false,
   ARRAY['active_bcba','offboarding','separated'],
   '[]'::jsonb,
   ARRAY['home','support','me'],'slate'),

 ('offboarding','Offboarding','Exit workflow in progress.',920,
   'Offboarding is in progress. Thank you for your service.','hr',false,
   ARRAY['separated'],
   '[{"key":"exit_interview","label":"Exit interview complete"},{"key":"access_revoked","label":"Access revoked"}]'::jsonb,
   ARRAY['home','support','me'],'rose'),

 ('separated','Separated','Employment ended.',930,
   'Employment ended.','hr',true,
   ARRAY[]::text[],
   '[]'::jsonb,
   ARRAY[]::text[],'rose');

-- ============================================================
-- Seed synthetic BCBA test cohort (one per stage)
-- ============================================================
INSERT INTO public.bcba_synthetic_test_profiles (display_name, stage_key, notes)
SELECT 'Test BCBA · ' || s.name, s.key, 'Synthetic test profile for ' || s.name
FROM public.bcba_lifecycle_stages s;
