
-- =========================================================================
-- RBT First 90 Days Journey
-- =========================================================================

-- Enum-style topics used across responses (kept as text keys for flexibility)
-- Configurable per checkpoint via questionnaire_topics text[].

CREATE TABLE public.rbt_journey_checkpoints (
  key text PRIMARY KEY,
  label text NOT NULL,
  supportive_intro text,
  trigger_type text NOT NULL CHECK (trigger_type IN ('after_first_session','offset_days')),
  offset_days integer NOT NULL DEFAULT 0,
  due_within_days integer NOT NULL DEFAULT 3,
  questionnaire_topics text[] NOT NULL DEFAULT ARRAY[]::text[],
  default_owner_role text,
  is_celebration boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_journey_checkpoints TO authenticated;
GRANT ALL ON public.rbt_journey_checkpoints TO service_role;
ALTER TABLE public.rbt_journey_checkpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "journey_ckpt_read" ON public.rbt_journey_checkpoints FOR SELECT TO authenticated USING (true);
CREATE POLICY "journey_ckpt_admin" ON public.rbt_journey_checkpoints FOR ALL TO authenticated
  USING (public.can_oversee_rbt()) WITH CHECK (public.can_oversee_rbt());

INSERT INTO public.rbt_journey_checkpoints
  (key, label, supportive_intro, trigger_type, offset_days, due_within_days, questionnaire_topics, default_owner_role, is_celebration, order_index) VALUES
 ('after_first_session','After your first session','A quick check-in — how did it feel?','after_first_session',0,2,
    ARRAY['confidence','case_fit','schedule_accuracy','centralreach_access','bcba_support','safety_concerns','training_needs'],
    'lead_rbt', false, 10),
 ('day_3','Day 3','Small check-in — how are the first few sessions landing?','offset_days',3,2,
    ARRAY['confidence','case_fit','schedule_accuracy','travel_burden','centralreach_access','bcba_direction_clarity','bcba_support','family_barriers','documentation_confidence','safety_concerns'],
    'lead_rbt', false, 20),
 ('day_7','Day 7','First week complete — well done.','offset_days',7,3,
    ARRAY['confidence','case_fit','schedule_accuracy','travel_burden','centralreach_access','bcba_direction_clarity','bcba_support','family_barriers','training_needs','documentation_confidence','supervision_received','safety_concerns','payroll_concerns','sense_of_belonging'],
    'bcba', false, 30),
 ('day_14','Day 14','Two weeks in — a moment to reflect.','offset_days',14,3,
    ARRAY['confidence','case_fit','schedule_accuracy','travel_burden','centralreach_access','bcba_direction_clarity','bcba_support','family_barriers','training_needs','documentation_confidence','supervision_received','safety_concerns','payroll_concerns','sense_of_belonging','intent_to_stay'],
    'bcba', false, 40),
 ('day_30','Day 30 — First month','Celebrating one month with Blossom.','offset_days',30,5,
    ARRAY['confidence','case_fit','schedule_accuracy','travel_burden','bcba_direction_clarity','bcba_support','family_barriers','training_needs','documentation_confidence','supervision_received','payroll_concerns','sense_of_belonging','intent_to_stay','career_interest'],
    'bcba', true, 50),
 ('day_60','Day 60','Two months in — how are you doing?','offset_days',60,5,
    ARRAY['confidence','case_fit','schedule_accuracy','bcba_direction_clarity','bcba_support','training_needs','documentation_confidence','supervision_received','sense_of_belonging','intent_to_stay','career_interest'],
    'bcba', false, 60),
 ('day_90','Day 90 — Milestone','A major milestone — welcome to your growth path.','offset_days',90,7,
    ARRAY['confidence','case_fit','bcba_support','training_needs','supervision_received','sense_of_belonging','intent_to_stay','career_interest'],
    'clinical_director', true, 70);

-- Per-employee generated instances
CREATE TABLE public.rbt_journey_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  first_case_id uuid REFERENCES public.rbt_first_case(id) ON DELETE SET NULL,
  checkpoint_key text NOT NULL REFERENCES public.rbt_journey_checkpoints(key) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  due_date date NOT NULL,
  opened_at timestamptz,
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','open','completed','skipped','overdue')),
  risk_level text NOT NULL DEFAULT 'normal'
    CHECK (risk_level IN ('normal','watch','support_needed','urgent_review')),
  risk_score integer NOT NULL DEFAULT 0,
  owner_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  owner_role text,
  followup_action text,
  followup_due_date date,
  resolution_status text NOT NULL DEFAULT 'none'
    CHECK (resolution_status IN ('none','in_progress','resolved')),
  resolution_note text,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, first_case_id, checkpoint_key)
);
CREATE INDEX rji_employee_idx ON public.rbt_journey_instances(employee_id);
CREATE INDEX rji_risk_idx ON public.rbt_journey_instances(risk_level) WHERE risk_level <> 'normal';
CREATE INDEX rji_status_idx ON public.rbt_journey_instances(status);
CREATE INDEX rji_owner_idx ON public.rbt_journey_instances(owner_employee_id);
GRANT SELECT, INSERT, UPDATE ON public.rbt_journey_instances TO authenticated;
GRANT ALL ON public.rbt_journey_instances TO service_role;
ALTER TABLE public.rbt_journey_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rji_read" ON public.rbt_journey_instances FOR SELECT TO authenticated
  USING (public.is_employee_self(employee_id) OR owner_employee_id = auth.uid() OR public.can_oversee_rbt());
CREATE POLICY "rji_admin_all" ON public.rbt_journey_instances FOR ALL TO authenticated
  USING (public.can_oversee_rbt()) WITH CHECK (public.can_oversee_rbt());
CREATE POLICY "rji_self_open" ON public.rbt_journey_instances FOR UPDATE TO authenticated
  USING (public.is_employee_self(employee_id)) WITH CHECK (public.is_employee_self(employee_id));

-- Employee questionnaire responses
CREATE TABLE public.rbt_journey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.rbt_journey_instances(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  topic_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  safety_concern boolean NOT NULL DEFAULT false,
  safety_concern_note text,
  family_barrier_note text,
  training_need_note text,
  payroll_concern_note text,
  reflection text,
  career_interest text[] NOT NULL DEFAULT ARRAY[]::text[],
  free_text text,
  UNIQUE (instance_id)
);
CREATE INDEX rjr_instance_idx ON public.rbt_journey_responses(instance_id);
GRANT SELECT, INSERT ON public.rbt_journey_responses TO authenticated;
GRANT ALL ON public.rbt_journey_responses TO service_role;
ALTER TABLE public.rbt_journey_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rjr_insert_self" ON public.rbt_journey_responses FOR INSERT TO authenticated
  WITH CHECK (public.is_employee_self(employee_id));
CREATE POLICY "rjr_read" ON public.rbt_journey_responses FOR SELECT TO authenticated
  USING (public.is_employee_self(employee_id) OR public.can_oversee_rbt());

-- Internal reviews (Lead RBT, BCBA, HR)
CREATE TABLE public.rbt_journey_internal_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.rbt_journey_instances(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE SET NULL,
  reviewer_role text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  strengths text,
  development_goal text,
  assigned_refresher boolean NOT NULL DEFAULT false,
  refresher_topic text,
  performance_summary text,
  growth_plan text,
  fellowship_mentioned boolean NOT NULL DEFAULT false,
  risk_recommendation text CHECK (risk_recommendation IN ('normal','watch','support_needed','urgent_review')),
  notes text
);
CREATE INDEX rjir_instance_idx ON public.rbt_journey_internal_reviews(instance_id);
GRANT SELECT, INSERT, UPDATE ON public.rbt_journey_internal_reviews TO authenticated;
GRANT ALL ON public.rbt_journey_internal_reviews TO service_role;
ALTER TABLE public.rbt_journey_internal_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rjir_read" ON public.rbt_journey_internal_reviews FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid() OR public.can_oversee_rbt()
    OR EXISTS (SELECT 1 FROM public.rbt_journey_instances i WHERE i.id = instance_id AND i.owner_employee_id = auth.uid()));
CREATE POLICY "rjir_insert" ON public.rbt_journey_internal_reviews FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid() OR public.can_oversee_rbt());
CREATE POLICY "rjir_update" ON public.rbt_journey_internal_reviews FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid() OR public.can_oversee_rbt())
  WITH CHECK (reviewer_id = auth.uid() OR public.can_oversee_rbt());

-- Risk signals (computed + manual)
CREATE TABLE public.rbt_journey_risk_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.rbt_journey_instances(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  signal_key text NOT NULL,
  severity text NOT NULL DEFAULT 'watch' CHECK (severity IN ('watch','support_needed','urgent_review')),
  weight integer NOT NULL DEFAULT 1,
  source text NOT NULL DEFAULT 'auto' CHECK (source IN ('auto','manual','review','system')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rjrs_instance_idx ON public.rbt_journey_risk_signals(instance_id);
CREATE INDEX rjrs_employee_idx ON public.rbt_journey_risk_signals(employee_id);
GRANT SELECT, INSERT ON public.rbt_journey_risk_signals TO authenticated;
GRANT ALL ON public.rbt_journey_risk_signals TO service_role;
ALTER TABLE public.rbt_journey_risk_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rjrs_read" ON public.rbt_journey_risk_signals FOR SELECT TO authenticated
  USING (public.can_oversee_rbt()
    OR EXISTS (SELECT 1 FROM public.rbt_journey_instances i WHERE i.id = instance_id AND i.owner_employee_id = auth.uid()));
CREATE POLICY "rjrs_insert_oversight" ON public.rbt_journey_risk_signals FOR INSERT TO authenticated
  WITH CHECK (public.can_oversee_rbt());

-- Outreach log
CREATE TABLE public.rbt_journey_outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.rbt_journey_instances(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE SET NULL,
  channel text CHECK (channel IN ('call','text','email','in_person','other')),
  outcome text CHECK (outcome IN ('reached','left_message','no_answer','follow_up_scheduled','resolved')),
  note text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rjo_instance_idx ON public.rbt_journey_outreach(instance_id);
GRANT SELECT, INSERT ON public.rbt_journey_outreach TO authenticated;
GRANT ALL ON public.rbt_journey_outreach TO service_role;
ALTER TABLE public.rbt_journey_outreach ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rjo_read" ON public.rbt_journey_outreach FOR SELECT TO authenticated
  USING (public.can_oversee_rbt()
    OR EXISTS (SELECT 1 FROM public.rbt_journey_instances i WHERE i.id = instance_id AND i.owner_employee_id = auth.uid()));
CREATE POLICY "rjo_insert" ON public.rbt_journey_outreach FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() AND (public.can_oversee_rbt()
    OR EXISTS (SELECT 1 FROM public.rbt_journey_instances i WHERE i.id = instance_id AND i.owner_employee_id = auth.uid())));

-- Audit history
CREATE TABLE public.rbt_journey_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.rbt_journey_instances(id) ON DELETE CASCADE,
  actor_id uuid,
  event text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rja_instance_idx ON public.rbt_journey_audit(instance_id);
GRANT SELECT, INSERT ON public.rbt_journey_audit TO authenticated;
GRANT ALL ON public.rbt_journey_audit TO service_role;
ALTER TABLE public.rbt_journey_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rja_read" ON public.rbt_journey_audit FOR SELECT TO authenticated
  USING (public.can_oversee_rbt()
    OR EXISTS (SELECT 1 FROM public.rbt_journey_instances i WHERE i.id = instance_id AND (i.employee_id = auth.uid() OR i.owner_employee_id = auth.uid())));
CREATE POLICY "rja_insert_oversight" ON public.rbt_journey_audit FOR INSERT TO authenticated
  WITH CHECK (public.can_oversee_rbt() OR actor_id = auth.uid());

-- =========================================================================
-- Touch triggers
-- =========================================================================
CREATE OR REPLACE FUNCTION public.rbt_journey_touch()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_rji_touch BEFORE UPDATE ON public.rbt_journey_instances
FOR EACH ROW EXECUTE FUNCTION public.rbt_journey_touch();
CREATE TRIGGER trg_rjc_touch BEFORE UPDATE ON public.rbt_journey_checkpoints
FOR EACH ROW EXECUTE FUNCTION public.rbt_journey_touch();

-- =========================================================================
-- Owner enforcement + audit + resolution stamping
-- =========================================================================
CREATE OR REPLACE FUNCTION public.rbt_journey_instance_guard()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  -- Elevated risk requires an owner
  IF NEW.risk_level IN ('watch','support_needed','urgent_review')
     AND NEW.owner_employee_id IS NULL
     AND NEW.resolution_status <> 'resolved' THEN
    RAISE EXCEPTION 'Elevated risk (%) on this checkpoint requires an assigned owner.', NEW.risk_level;
  END IF;

  -- Stamp resolution
  IF NEW.resolution_status = 'resolved' AND OLD.resolution_status IS DISTINCT FROM 'resolved' THEN
    NEW.resolved_at := COALESCE(NEW.resolved_at, now());
    NEW.resolved_by := COALESCE(NEW.resolved_by, auth.uid());
  END IF;

  -- Overdue auto-status
  IF NEW.status IN ('scheduled','open') AND NEW.due_date < CURRENT_DATE AND NEW.completed_at IS NULL THEN
    NEW.status := 'overdue';
  END IF;

  RETURN NEW;
END; $$;
CREATE TRIGGER trg_rji_guard BEFORE UPDATE ON public.rbt_journey_instances
FOR EACH ROW EXECUTE FUNCTION public.rbt_journey_instance_guard();

CREATE OR REPLACE FUNCTION public.rbt_journey_instance_audit()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.rbt_journey_audit(instance_id, actor_id, event, payload)
    VALUES (NEW.id, auth.uid(), 'created',
      jsonb_build_object('checkpoint', NEW.checkpoint_key, 'scheduled_date', NEW.scheduled_date));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.risk_level <> OLD.risk_level THEN
      INSERT INTO public.rbt_journey_audit(instance_id, actor_id, event, payload)
      VALUES (NEW.id, auth.uid(), 'risk_changed',
        jsonb_build_object('from', OLD.risk_level, 'to', NEW.risk_level));
    END IF;
    IF NEW.owner_employee_id IS DISTINCT FROM OLD.owner_employee_id THEN
      INSERT INTO public.rbt_journey_audit(instance_id, actor_id, event, payload)
      VALUES (NEW.id, auth.uid(), 'owner_changed',
        jsonb_build_object('from', OLD.owner_employee_id, 'to', NEW.owner_employee_id));
    END IF;
    IF NEW.resolution_status <> OLD.resolution_status THEN
      INSERT INTO public.rbt_journey_audit(instance_id, actor_id, event, payload)
      VALUES (NEW.id, auth.uid(), 'resolution_changed',
        jsonb_build_object('from', OLD.resolution_status, 'to', NEW.resolution_status, 'note', NEW.resolution_note));
    END IF;
    IF NEW.status <> OLD.status THEN
      INSERT INTO public.rbt_journey_audit(instance_id, actor_id, event, payload)
      VALUES (NEW.id, auth.uid(), 'status_changed',
        jsonb_build_object('from', OLD.status, 'to', NEW.status));
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_rji_audit AFTER INSERT OR UPDATE ON public.rbt_journey_instances
FOR EACH ROW EXECUTE FUNCTION public.rbt_journey_instance_audit();

-- =========================================================================
-- Generation function — creates instances from an employee's first_case
-- =========================================================================
CREATE OR REPLACE FUNCTION public.rbt_journey_generate(_first_case_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_employee_id uuid; v_start date; c record;
BEGIN
  SELECT employee_id, start_date INTO v_employee_id, v_start
    FROM public.rbt_first_case WHERE id = _first_case_id;
  IF v_start IS NULL OR v_employee_id IS NULL THEN RETURN; END IF;

  FOR c IN
    SELECT * FROM public.rbt_journey_checkpoints WHERE is_active ORDER BY order_index
  LOOP
    INSERT INTO public.rbt_journey_instances
      (employee_id, first_case_id, checkpoint_key, scheduled_date, due_date, status, owner_role)
    VALUES
      (v_employee_id, _first_case_id, c.key,
       (v_start + (c.offset_days || ' days')::interval)::date,
       (v_start + ((c.offset_days + c.due_within_days) || ' days')::interval)::date,
       CASE WHEN (v_start + (c.offset_days || ' days')::interval)::date <= CURRENT_DATE
            THEN 'open' ELSE 'scheduled' END,
       c.default_owner_role)
    ON CONFLICT (employee_id, first_case_id, checkpoint_key) DO UPDATE
      SET scheduled_date = EXCLUDED.scheduled_date,
          due_date = CASE WHEN public.rbt_journey_instances.completed_at IS NULL
                          THEN EXCLUDED.due_date ELSE public.rbt_journey_instances.due_date END;
  END LOOP;
END; $$;
GRANT EXECUTE ON FUNCTION public.rbt_journey_generate(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.rbt_journey_from_first_case()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.start_date IS NOT NULL THEN
    PERFORM public.rbt_journey_generate(NEW.id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_rbt_journey_from_first_case
AFTER INSERT OR UPDATE OF start_date ON public.rbt_first_case
FOR EACH ROW EXECUTE FUNCTION public.rbt_journey_from_first_case();

-- =========================================================================
-- Response ingestion: compute risk, create signals, update instance
-- Owner assignment stays with the internal team (not auto-assigned).
-- =========================================================================
CREATE OR REPLACE FUNCTION public.rbt_journey_score_response()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_score int := 0;
  v_level text := 'normal';
  v_topics jsonb := NEW.topic_scores;
  v_conf int := COALESCE((v_topics->>'confidence')::int, NULL);
  v_case int := COALESCE((v_topics->>'case_fit')::int, NULL);
  v_sched int := COALESCE((v_topics->>'schedule_accuracy')::int, NULL);
  v_travel int := COALESCE((v_topics->>'travel_burden')::int, NULL);
  v_cr int := COALESCE((v_topics->>'centralreach_access')::int, NULL);
  v_dir int := COALESCE((v_topics->>'bcba_direction_clarity')::int, NULL);
  v_bcba int := COALESCE((v_topics->>'bcba_support')::int, NULL);
  v_family int := COALESCE((v_topics->>'family_barriers')::int, NULL);
  v_train int := COALESCE((v_topics->>'training_needs')::int, NULL);
  v_doc int := COALESCE((v_topics->>'documentation_confidence')::int, NULL);
  v_sup int := COALESCE((v_topics->>'supervision_received')::int, NULL);
  v_pay int := COALESCE((v_topics->>'payroll_concerns')::int, NULL);
  v_belong int := COALESCE((v_topics->>'sense_of_belonging')::int, NULL);
  v_stay int := COALESCE((v_topics->>'intent_to_stay')::int, NULL);
BEGIN
  -- Signals: (low = 1-2, high burden = 4-5)
  IF v_conf IS NOT NULL AND v_conf <= 2 THEN
    v_score := v_score + 2;
    INSERT INTO public.rbt_journey_risk_signals(instance_id, employee_id, signal_key, severity, weight)
      VALUES (NEW.instance_id, NEW.employee_id, 'low_confidence', 'watch', 2);
  END IF;
  IF v_case IS NOT NULL AND v_case <= 2 THEN
    v_score := v_score + 2;
    INSERT INTO public.rbt_journey_risk_signals(instance_id, employee_id, signal_key, severity, weight)
      VALUES (NEW.instance_id, NEW.employee_id, 'case_fit_low', 'support_needed', 2);
  END IF;
  IF v_sched IS NOT NULL AND v_sched <= 2 THEN
    v_score := v_score + 1;
    INSERT INTO public.rbt_journey_risk_signals(instance_id, employee_id, signal_key, severity, weight)
      VALUES (NEW.instance_id, NEW.employee_id, 'schedule_mismatch', 'watch', 1);
  END IF;
  IF v_travel IS NOT NULL AND v_travel >= 4 THEN
    v_score := v_score + 1;
    INSERT INTO public.rbt_journey_risk_signals(instance_id, employee_id, signal_key, severity, weight)
      VALUES (NEW.instance_id, NEW.employee_id, 'travel_burden', 'watch', 1);
  END IF;
  IF v_cr IS NOT NULL AND v_cr <= 2 THEN
    v_score := v_score + 1;
    INSERT INTO public.rbt_journey_risk_signals(instance_id, employee_id, signal_key, severity, weight)
      VALUES (NEW.instance_id, NEW.employee_id, 'centralreach_access', 'watch', 1);
  END IF;
  IF v_dir IS NOT NULL AND v_dir <= 2 THEN
    v_score := v_score + 1;
    INSERT INTO public.rbt_journey_risk_signals(instance_id, employee_id, signal_key, severity, weight)
      VALUES (NEW.instance_id, NEW.employee_id, 'unclear_bcba_direction', 'support_needed', 1);
  END IF;
  IF v_bcba IS NOT NULL AND v_bcba <= 2 THEN
    v_score := v_score + 2;
    INSERT INTO public.rbt_journey_risk_signals(instance_id, employee_id, signal_key, severity, weight)
      VALUES (NEW.instance_id, NEW.employee_id, 'no_bcba_support', 'support_needed', 2);
  END IF;
  IF v_family IS NOT NULL AND v_family >= 4 THEN
    v_score := v_score + 1;
    INSERT INTO public.rbt_journey_risk_signals(instance_id, employee_id, signal_key, severity, weight)
      VALUES (NEW.instance_id, NEW.employee_id, 'family_barriers', 'watch', 1);
  END IF;
  IF v_train IS NOT NULL AND v_train >= 4 THEN
    v_score := v_score + 1;
    INSERT INTO public.rbt_journey_risk_signals(instance_id, employee_id, signal_key, severity, weight)
      VALUES (NEW.instance_id, NEW.employee_id, 'training_remediation', 'watch', 1);
  END IF;
  IF v_sup IS NOT NULL AND v_sup <= 2 THEN
    v_score := v_score + 1;
    INSERT INTO public.rbt_journey_risk_signals(instance_id, employee_id, signal_key, severity, weight)
      VALUES (NEW.instance_id, NEW.employee_id, 'low_supervision', 'watch', 1);
  END IF;
  IF v_pay IS NOT NULL AND v_pay >= 4 THEN
    v_score := v_score + 1;
    INSERT INTO public.rbt_journey_risk_signals(instance_id, employee_id, signal_key, severity, weight)
      VALUES (NEW.instance_id, NEW.employee_id, 'payroll_concerns', 'watch', 1);
  END IF;
  IF v_belong IS NOT NULL AND v_belong <= 2 THEN
    v_score := v_score + 1;
    INSERT INTO public.rbt_journey_risk_signals(instance_id, employee_id, signal_key, severity, weight)
      VALUES (NEW.instance_id, NEW.employee_id, 'low_belonging', 'watch', 1);
  END IF;
  IF v_stay IS NOT NULL AND v_stay <= 2 THEN
    v_score := v_score + 3;
    INSERT INTO public.rbt_journey_risk_signals(instance_id, employee_id, signal_key, severity, weight)
      VALUES (NEW.instance_id, NEW.employee_id, 'intent_to_leave', 'urgent_review', 3);
  END IF;
  IF NEW.safety_concern THEN
    v_score := v_score + 5;
    INSERT INTO public.rbt_journey_risk_signals(instance_id, employee_id, signal_key, severity, weight, note)
      VALUES (NEW.instance_id, NEW.employee_id, 'safety_concern', 'urgent_review', 5, NEW.safety_concern_note);
  END IF;

  -- Bucket
  IF v_score >= 5 THEN v_level := 'urgent_review';
  ELSIF v_score >= 3 THEN v_level := 'support_needed';
  ELSIF v_score >= 1 THEN v_level := 'watch';
  ELSE v_level := 'normal';
  END IF;

  UPDATE public.rbt_journey_instances SET
    risk_score = GREATEST(risk_score, v_score),
    risk_level = CASE
      WHEN v_level = 'urgent_review' THEN 'urgent_review'
      WHEN v_level = 'support_needed' AND risk_level <> 'urgent_review' THEN 'support_needed'
      WHEN v_level = 'watch' AND risk_level NOT IN ('urgent_review','support_needed') THEN 'watch'
      ELSE risk_level END,
    status = 'completed',
    completed_at = COALESCE(completed_at, now()),
    opened_at = COALESCE(opened_at, now())
  WHERE id = NEW.instance_id;

  RETURN NEW;
END; $$;
CREATE TRIGGER trg_rjr_score AFTER INSERT ON public.rbt_journey_responses
FOR EACH ROW EXECUTE FUNCTION public.rbt_journey_score_response();

-- Backfill existing first cases
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT id FROM public.rbt_first_case WHERE start_date IS NOT NULL LOOP
    PERFORM public.rbt_journey_generate(r.id);
  END LOOP;
END $$;
