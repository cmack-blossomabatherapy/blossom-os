
-- =====================================================================
-- RBT Lifecycle Engine — configurable stages, gates, transitions, audit
-- =====================================================================

-- 1. Convert stage columns from enum to text so future stages need no code.
ALTER TABLE public.rbt_lifecycle_state
  ALTER COLUMN stage DROP DEFAULT,
  ALTER COLUMN stage TYPE text USING stage::text;
ALTER TABLE public.rbt_lifecycle_state
  ALTER COLUMN stage SET DEFAULT 'offer_accepted';

ALTER TABLE public.rbt_lifecycle_events
  ALTER COLUMN from_stage TYPE text USING from_stage::text,
  ALTER COLUMN to_stage TYPE text USING to_stage::text;

ALTER TABLE public.rbt_lifecycle_rules
  ALTER COLUMN from_stage TYPE text USING from_stage::text,
  ALTER COLUMN to_stage TYPE text USING to_stage::text;

-- 2. Stage configuration table (single source of truth).
CREATE TABLE IF NOT EXISTS public.rbt_lifecycle_stages (
  key text PRIMARY KEY,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  employee_message text,
  required_approver_role text,
  is_terminal boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  allowed_next_keys text[] NOT NULL DEFAULT '{}',
  required_gates jsonb NOT NULL DEFAULT '[]'::jsonb,
  automatic_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  notification_templates jsonb NOT NULL DEFAULT '[]'::jsonb,
  dashboard_cards jsonb NOT NULL DEFAULT '[]'::jsonb,
  menu_features text[] NOT NULL DEFAULT '{}',
  training_assignments jsonb NOT NULL DEFAULT '[]'::jsonb,
  task_assignments jsonb NOT NULL DEFAULT '[]'::jsonb,
  color text DEFAULT 'slate',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_lifecycle_stages TO authenticated;
GRANT ALL ON public.rbt_lifecycle_stages TO service_role;
ALTER TABLE public.rbt_lifecycle_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt_lifecycle_stages_read" ON public.rbt_lifecycle_stages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "rbt_lifecycle_stages_admin_write" ON public.rbt_lifecycle_stages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Gate completion tracking (per-employee, per-stage).
CREATE TABLE IF NOT EXISTS public.rbt_lifecycle_gate_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  stage_key text NOT NULL,
  gate_key text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  completed_by uuid,
  evidence jsonb DEFAULT '{}'::jsonb,
  notes text,
  UNIQUE (employee_id, stage_key, gate_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_lifecycle_gate_completions TO authenticated;
GRANT ALL ON public.rbt_lifecycle_gate_completions TO service_role;
ALTER TABLE public.rbt_lifecycle_gate_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gate_completions_read_own_or_admin" ON public.rbt_lifecycle_gate_completions
  FOR SELECT TO authenticated USING (
    employee_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr')
  );
CREATE POLICY "gate_completions_write_admin_hr" ON public.rbt_lifecycle_gate_completions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

-- 4. Synthetic test RBT profiles (safe fake data for lifecycle QA).
CREATE TABLE IF NOT EXISTS public.rbt_synthetic_test_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  stage_key text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_synthetic_test_profiles TO authenticated;
GRANT ALL ON public.rbt_synthetic_test_profiles TO service_role;
ALTER TABLE public.rbt_synthetic_test_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "synthetic_read_admin_hr" ON public.rbt_synthetic_test_profiles
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr')
  );
CREATE POLICY "synthetic_write_admin" ON public.rbt_synthetic_test_profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Foreign keys tying stage columns to config.
ALTER TABLE public.rbt_lifecycle_state
  ADD CONSTRAINT rbt_lifecycle_state_stage_fk
  FOREIGN KEY (stage) REFERENCES public.rbt_lifecycle_stages(key) DEFERRABLE INITIALLY DEFERRED;

-- 6. Seed all 24 stages.
INSERT INTO public.rbt_lifecycle_stages
  (key, name, description, sort_order, employee_message, required_approver_role,
   is_terminal, allowed_next_keys, required_gates, menu_features, color)
VALUES
  ('offer_accepted','Offer Accepted','Candidate has signed offer letter.',10,
    'Welcome aboard! Look for onboarding steps soon.','hr',false,
    ARRAY['preboarding','separated'],
    '[{"key":"offer_signed","label":"Signed offer on file"}]'::jsonb,
    ARRAY['home','learn','support'],'emerald'),
  ('preboarding','Preboarding',
    'I-9, background check, and paperwork in progress.',20,
    'Complete your preboarding paperwork to unlock orientation.','hr',false,
    ARRAY['orientation_scheduled','separated','inactive'],
    '[{"key":"i9_complete","label":"I-9 verified"},{"key":"background_clear","label":"Background check cleared"}]'::jsonb,
    ARRAY['home','learn','support'],'sky'),
  ('orientation_scheduled','Orientation Scheduled',
    'Orientation date confirmed.',30,
    'Your orientation is scheduled. See the Schedule tab.','hr',false,
    ARRAY['training','separated'],
    '[{"key":"orientation_booked","label":"Orientation slot booked"}]'::jsonb,
    ARRAY['home','schedule','learn','support'],'sky'),
  ('training','Training',
    'Completing 40-hour RBT training curriculum.',40,
    'Focus on completing your training modules.','training_admin',false,
    ARRAY['certification_in_progress','separated','leave'],
    '[{"key":"40hr_complete","label":"40-hour training complete"}]'::jsonb,
    ARRAY['home','learn','support'],'violet'),
  ('certification_in_progress','Certification In Progress',
    'BACB RBT exam and application in motion.',50,
    'Schedule and pass your RBT certification exam.','training_admin',false,
    ARRAY['competency_in_progress','separated','leave'],
    '[{"key":"rbt_exam_passed","label":"RBT exam passed"}]'::jsonb,
    ARRAY['home','learn','support'],'violet'),
  ('competency_in_progress','Competency In Progress',
    'RBT competency assessment underway with BCBA.',60,
    'Complete your competency assessment with your assigned BCBA.','training_admin',false,
    ARRAY['ready_for_staffing','separated','leave'],
    '[{"key":"competency_signed","label":"Competency assessment signed"}]'::jsonb,
    ARRAY['home','learn','support'],'violet'),
  ('ready_for_staffing','Ready for Staffing',
    'Fully credentialed and awaiting case assignment.',70,
    'You are ready for staffing — your first case is coming soon.','scheduling',false,
    ARRAY['potential_case_match','leave','inactive'],
    '[{"key":"credentialing_complete","label":"Credentialing complete"},{"key":"availability_on_file","label":"Availability submitted"}]'::jsonb,
    ARRAY['home','schedule','learn','support'],'amber'),
  ('potential_case_match','Potential Case Match',
    'A case has been identified but not yet confirmed.',80,
    'A potential case is being reviewed for you.','scheduling',false,
    ARRAY['first_case_scheduled','ready_for_staffing','leave'],
    '[]'::jsonb,
    ARRAY['home','schedule','learn','support'],'amber'),
  ('first_case_scheduled','First Case Scheduled',
    'First client session is scheduled.',90,
    'Your first session is on the calendar!','scheduling',false,
    ARRAY['first_case_active','ready_for_staffing','leave'],
    '[{"key":"first_shift_booked","label":"First shift on schedule"}]'::jsonb,
    ARRAY['home','schedule','learn','support'],'blue'),
  ('first_case_active','First Case Active',
    'First session delivered.',100,
    'Great work — track your first cases here.','scheduling',false,
    ARRAY['first_30_days','leave'],
    '[{"key":"first_session_delivered","label":"First session delivered"}]'::jsonb,
    ARRAY['home','schedule','learn','support'],'blue'),
  ('first_30_days','First 30 Days',
    'Ramp-up window with extra check-ins.',110,
    'Your first 30 days come with extra support.','operations',false,
    ARRAY['active_rbt','leave'],
    '[{"key":"first_30_survey","label":"30-day check-in complete"}]'::jsonb,
    ARRAY['home','schedule','learn','support'],'blue'),
  ('active_rbt','Active RBT',
    'Steady-state active RBT.',120,
    'You are fully active — keep up the great work.','operations',false,
    ARRAY['established_rbt','leave','inactive','offboarding'],
    '[]'::jsonb,
    ARRAY['home','schedule','learn','support','me'],'emerald'),
  ('established_rbt','Established RBT',
    '6+ months of consistent performance.',130,
    'You are an established RBT.','operations',false,
    ARRAY['advanced_rbt_candidate','active_rbt','leave','inactive','offboarding'],
    '[{"key":"months_active_6","label":"6+ months active"}]'::jsonb,
    ARRAY['home','schedule','learn','support','me'],'emerald'),
  ('advanced_rbt_candidate','Advanced RBT Candidate',
    'Nominated for advanced RBT track.',140,
    'You have been nominated for the advanced RBT track.','operations',false,
    ARRAY['lead_rbt','trainer_rbt','established_rbt','fellowship_interest'],
    '[{"key":"nomination_recorded","label":"Leadership nomination on file"}]'::jsonb,
    ARRAY['home','schedule','learn','support','me'],'indigo'),
  ('lead_rbt','Lead RBT',
    'Peer-lead responsibilities.',150,
    'You are a Lead RBT — thank you for supporting your peers.','operations',false,
    ARRAY['trainer_rbt','established_rbt','leave','offboarding'],
    '[]'::jsonb,
    ARRAY['home','schedule','learn','support','me'],'indigo'),
  ('trainer_rbt','Trainer RBT',
    'Approved to train new RBTs.',160,
    'You are approved as a Trainer RBT.','training_admin',false,
    ARRAY['lead_rbt','established_rbt','fellowship_interest','offboarding'],
    '[{"key":"trainer_certification","label":"Trainer certification complete"}]'::jsonb,
    ARRAY['home','schedule','learn','support','me'],'indigo'),
  ('fellowship_interest','Fellowship Interest',
    'Expressed interest in BCBA fellowship.',170,
    'We have received your interest in the fellowship.','training_admin',false,
    ARRAY['fellowship_applicant','established_rbt'],
    '[]'::jsonb,
    ARRAY['home','schedule','learn','support','me'],'fuchsia'),
  ('fellowship_applicant','Fellowship Applicant',
    'Formal application in review.',180,
    'Your fellowship application is under review.','training_admin',false,
    ARRAY['fellowship_participant','fellowship_interest','established_rbt'],
    '[{"key":"application_submitted","label":"Fellowship application submitted"}]'::jsonb,
    ARRAY['home','schedule','learn','support','me'],'fuchsia'),
  ('fellowship_participant','Fellowship Participant',
    'Active in BCBA fellowship program.',190,
    'You are in the fellowship — dedicated resources unlocked.','training_admin',false,
    ARRAY['bcba_transition','established_rbt','leave'],
    '[{"key":"fellowship_start_date","label":"Fellowship start date on file"}]'::jsonb,
    ARRAY['home','schedule','learn','support','me'],'fuchsia'),
  ('bcba_transition','BCBA Transition',
    'Preparing to move from RBT to BCBA.',200,
    'You are transitioning to a BCBA role.','hr',true,
    ARRAY['established_rbt'],
    '[{"key":"bcba_credentialed","label":"BCBA credential verified"}]'::jsonb,
    ARRAY['home','learn','support'],'purple'),
  ('leave','Leave','On approved leave of absence.',900,
    'You are on leave. Reach out when you are ready to return.','hr',false,
    ARRAY['active_rbt','established_rbt','ready_for_staffing','inactive','offboarding'],
    '[]'::jsonb,
    ARRAY['home','support'],'slate'),
  ('inactive','Inactive','Not currently working sessions.',910,
    'You are marked inactive.','hr',false,
    ARRAY['ready_for_staffing','offboarding','separated'],
    '[]'::jsonb,
    ARRAY['home','support'],'slate'),
  ('offboarding','Offboarding','Exit process in motion.',920,
    'Offboarding tasks in progress.','hr',false,
    ARRAY['separated'],
    '[{"key":"exit_checklist","label":"Exit checklist complete"}]'::jsonb,
    ARRAY['home','support'],'zinc'),
  ('separated','Separated','No longer employed.',999,
    NULL,'hr',true,
    ARRAY[]::text[],
    '[]'::jsonb,
    ARRAY[]::text[],'zinc')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  employee_message = EXCLUDED.employee_message,
  required_approver_role = EXCLUDED.required_approver_role,
  is_terminal = EXCLUDED.is_terminal,
  allowed_next_keys = EXCLUDED.allowed_next_keys,
  required_gates = EXCLUDED.required_gates,
  menu_features = EXCLUDED.menu_features,
  color = EXCLUDED.color,
  updated_at = now();

-- 7. Advance / transition function (security definer, gate-enforcing, audited).
CREATE OR REPLACE FUNCTION public.advance_rbt_lifecycle(
  _employee_id uuid,
  _to_stage text,
  _reason text DEFAULT NULL,
  _override boolean DEFAULT false,
  _source text DEFAULT 'manual'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_current text;
  v_target_cfg public.rbt_lifecycle_stages%ROWTYPE;
  v_actor uuid := auth.uid();
  v_is_admin boolean := public.has_role(v_actor, 'admin');
  v_is_hr boolean := public.has_role(v_actor, 'hr');
  v_missing text[] := ARRAY[]::text[];
  v_gate jsonb;
BEGIN
  SELECT stage INTO v_current FROM public.rbt_lifecycle_state WHERE employee_id = _employee_id;

  SELECT * INTO v_target_cfg FROM public.rbt_lifecycle_stages WHERE key = _to_stage;
  IF v_target_cfg.key IS NULL THEN
    RAISE EXCEPTION 'Unknown stage: %', _to_stage USING ERRCODE = '22023';
  END IF;

  -- Permission: admin/hr always; otherwise must hold required_approver_role of TARGET stage.
  IF NOT (v_is_admin OR v_is_hr
          OR (v_target_cfg.required_approver_role IS NOT NULL
              AND public.has_role(v_actor, v_target_cfg.required_approver_role::app_role))) THEN
    RAISE EXCEPTION 'Not authorized to move employee into stage %', _to_stage USING ERRCODE = '42501';
  END IF;

  -- Transition allow-list: from current stage's allowed_next_keys, unless admin override or no current stage.
  IF v_current IS NOT NULL AND NOT _override THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.rbt_lifecycle_stages
      WHERE key = v_current AND _to_stage = ANY(allowed_next_keys)
    ) THEN
      RAISE EXCEPTION 'Transition % -> % is not allowed', v_current, _to_stage USING ERRCODE = '22023';
    END IF;
  END IF;

  -- Gate enforcement: every required_gate on TARGET stage must have a completion row.
  IF NOT _override THEN
    FOR v_gate IN SELECT * FROM jsonb_array_elements(v_target_cfg.required_gates) LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.rbt_lifecycle_gate_completions
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

  -- Only admins may override.
  IF _override AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins may override lifecycle gates' USING ERRCODE = '42501';
  END IF;

  -- Upsert state.
  INSERT INTO public.rbt_lifecycle_state (employee_id, stage, entered_at, updated_by, updated_at)
  VALUES (_employee_id, _to_stage, now(), v_actor, now())
  ON CONFLICT (employee_id) DO UPDATE
    SET stage = EXCLUDED.stage,
        entered_at = now(),
        updated_by = v_actor,
        updated_at = now();

  -- Audit event.
  INSERT INTO public.rbt_lifecycle_events
    (employee_id, from_stage, to_stage, actor_id, reason, source, occurred_at)
  VALUES
    (_employee_id, v_current, _to_stage, v_actor,
     COALESCE(_reason, CASE WHEN _override THEN 'override' ELSE NULL END),
     _source, now());

  -- Fanout notification to the employee.
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

GRANT EXECUTE ON FUNCTION public.advance_rbt_lifecycle(uuid, text, text, boolean, text) TO authenticated;

-- 8. Seed synthetic RBT test profiles (one per stage).
INSERT INTO public.rbt_synthetic_test_profiles (display_name, stage_key, notes)
SELECT 'Test RBT — ' || name, key, 'Synthetic profile for lifecycle QA'
FROM public.rbt_lifecycle_stages
ON CONFLICT DO NOTHING;

-- Seed lifecycle_state rows for the synthetic profiles so cohort views populate.
INSERT INTO public.rbt_lifecycle_state (employee_id, stage, entered_at)
SELECT id, stage_key, now() FROM public.rbt_synthetic_test_profiles
ON CONFLICT (employee_id) DO NOTHING;

CREATE TRIGGER rbt_lifecycle_stages_updated
  BEFORE UPDATE ON public.rbt_lifecycle_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
