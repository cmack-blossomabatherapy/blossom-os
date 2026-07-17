
CREATE TABLE public.rbt_first_case (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL UNIQUE REFERENCES public.rbt_client_assignments(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  bcba_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  support_contact_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  lead_rbt_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  lead_rbt_attending boolean NOT NULL DEFAULT false,
  start_date date,
  session_window_local text,
  location_type text CHECK (location_type IN ('home','clinic','school','community','telehealth','other')),
  cr_access_status text NOT NULL DEFAULT 'pending'
    CHECK (cr_access_status IN ('pending','active','blocked','unknown')),
  last_schedule_sync_at timestamptz,
  centralreach_url text,
  client_display text,
  status text NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming','prepping','first_session_done','closed')),
  readiness_acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rbt_first_case_employee_idx ON public.rbt_first_case(employee_id);
CREATE INDEX rbt_first_case_bcba_idx ON public.rbt_first_case(bcba_id);
CREATE INDEX rbt_first_case_status_idx ON public.rbt_first_case(status);
GRANT SELECT, INSERT, UPDATE ON public.rbt_first_case TO authenticated;
GRANT ALL ON public.rbt_first_case TO service_role;
ALTER TABLE public.rbt_first_case ENABLE ROW LEVEL SECURITY;
CREATE POLICY "first_case_read" ON public.rbt_first_case FOR SELECT TO authenticated
USING (public.is_employee_self(employee_id) OR public.can_oversee_rbt()
  OR bcba_id = auth.uid() OR lead_rbt_id = auth.uid() OR support_contact_id = auth.uid());
CREATE POLICY "first_case_write_oversight" ON public.rbt_first_case FOR ALL TO authenticated
USING (public.can_oversee_rbt()) WITH CHECK (public.can_oversee_rbt());
CREATE POLICY "first_case_ack_self" ON public.rbt_first_case FOR UPDATE TO authenticated
USING (public.is_employee_self(employee_id)) WITH CHECK (public.is_employee_self(employee_id));

CREATE TABLE public.rbt_first_session_checklist_items (
  key text PRIMARY KEY, label text NOT NULL, description text,
  order_index int NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_first_session_checklist_items TO authenticated;
GRANT ALL ON public.rbt_first_session_checklist_items TO service_role;
ALTER TABLE public.rbt_first_session_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "first_session_items_read" ON public.rbt_first_session_checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "first_session_items_admin" ON public.rbt_first_session_checklist_items FOR ALL TO authenticated
USING (public.can_oversee_rbt()) WITH CHECK (public.can_oversee_rbt());

INSERT INTO public.rbt_first_session_checklist_items (key, label, order_index, description) VALUES
  ('confirm_schedule','Confirm schedule',10,'Check the date, time, and duration in your app and CentralReach.'),
  ('confirm_location','Confirm location',20,'Confirm address or clinic room, parking, and entry instructions.'),
  ('confirm_cr_access','Confirm CentralReach access',30,'Log in and verify you can view the client and start a session.'),
  ('review_pairing','Review pairing refresher',40,'Quick review of pairing goals and strategies for a first session.'),
  ('review_caregiver_comms','Review caregiver communication',50,'Approach, tone, and boundaries with families.'),
  ('review_boundaries','Review professional boundaries',60,'Confidentiality, dress, phone use, and personal conversations.'),
  ('review_data_collection','Review data-collection expectations',70,'Which programs to run and how to record data.'),
  ('confirm_support','Confirm support team',80,'Know who to call for clinical, schedule, or safety questions.'),
  ('submit_questions','Submit questions',90,'Send any open questions to your BCBA or Lead RBT.'),
  ('acknowledge_readiness','Acknowledge readiness',100,'Confirm you feel ready — this does not skip supervision.');

CREATE TABLE public.rbt_first_session_checklist_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_case_id uuid NOT NULL REFERENCES public.rbt_first_case(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  item_key text NOT NULL REFERENCES public.rbt_first_session_checklist_items(key) ON DELETE CASCADE,
  done boolean NOT NULL DEFAULT false,
  done_at timestamptz, notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (first_case_id, item_key)
);
CREATE INDEX first_session_checklist_state_case_idx ON public.rbt_first_session_checklist_state(first_case_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_first_session_checklist_state TO authenticated;
GRANT ALL ON public.rbt_first_session_checklist_state TO service_role;
ALTER TABLE public.rbt_first_session_checklist_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "first_checklist_self" ON public.rbt_first_session_checklist_state FOR ALL TO authenticated
USING (public.is_employee_self(employee_id) OR public.can_oversee_rbt())
WITH CHECK (public.is_employee_self(employee_id) OR public.can_oversee_rbt());

CREATE TABLE public.rbt_first_session_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_case_id uuid NOT NULL REFERENCES public.rbt_first_case(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  confidence smallint CHECK (confidence BETWEEN 1 AND 5),
  clarity smallint CHECK (clarity BETWEEN 1 AND 5),
  support_received smallint CHECK (support_received BETWEEN 1 AND 5),
  schedule_accuracy smallint CHECK (schedule_accuracy BETWEEN 1 AND 5),
  centralreach_worked boolean,
  family_concern boolean NOT NULL DEFAULT false, family_concern_note text,
  safety_concern boolean NOT NULL DEFAULT false, safety_concern_note text,
  additional_support_requested boolean NOT NULL DEFAULT false, additional_support_note text,
  free_text text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX first_checkin_case_idx ON public.rbt_first_session_checkins(first_case_id);
GRANT SELECT, INSERT ON public.rbt_first_session_checkins TO authenticated;
GRANT ALL ON public.rbt_first_session_checkins TO service_role;
ALTER TABLE public.rbt_first_session_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "first_checkin_insert_self" ON public.rbt_first_session_checkins FOR INSERT TO authenticated
WITH CHECK (public.is_employee_self(employee_id));
CREATE POLICY "first_checkin_read" ON public.rbt_first_session_checkins FOR SELECT TO authenticated
USING (public.is_employee_self(employee_id) OR public.can_oversee_rbt());

CREATE TABLE public.rbt_first_session_lead_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_case_id uuid NOT NULL REFERENCES public.rbt_first_case(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  evaluator_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE SET NULL,
  evaluated_at timestamptz NOT NULL DEFAULT now(),
  pairing smallint CHECK (pairing BETWEEN 1 AND 5),
  data_collection smallint CHECK (data_collection BETWEEN 1 AND 5),
  preference_assessment smallint CHECK (preference_assessment BETWEEN 1 AND 5),
  caregiver_interaction smallint CHECK (caregiver_interaction BETWEEN 1 AND 5),
  routine_establishment smallint CHECK (routine_establishment BETWEEN 1 AND 5),
  net smallint CHECK (net BETWEEN 1 AND 5),
  prompting smallint CHECK (prompting BETWEEN 1 AND 5),
  professional_conduct smallint CHECK (professional_conduct BETWEEN 1 AND 5),
  preparedness smallint CHECK (preparedness BETWEEN 1 AND 5),
  support_recommendation text NOT NULL DEFAULT 'continue'
    CHECK (support_recommendation IN ('continue','supported_session','refresher','trainer_followup','bcba_followup','staffing_review')),
  notes text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX first_lead_eval_case_idx ON public.rbt_first_session_lead_evaluations(first_case_id);
GRANT SELECT, INSERT ON public.rbt_first_session_lead_evaluations TO authenticated;
GRANT ALL ON public.rbt_first_session_lead_evaluations TO service_role;
ALTER TABLE public.rbt_first_session_lead_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "first_lead_eval_read" ON public.rbt_first_session_lead_evaluations FOR SELECT TO authenticated
USING (public.is_employee_self(employee_id) OR evaluator_id = auth.uid() OR public.can_oversee_rbt());
CREATE POLICY "first_lead_eval_insert" ON public.rbt_first_session_lead_evaluations FOR INSERT TO authenticated
WITH CHECK (evaluator_id = auth.uid());

CREATE TABLE public.rbt_first_session_bcba_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_case_id uuid NOT NULL REFERENCES public.rbt_first_case(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  bcba_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  clinical_direction_provided boolean NOT NULL DEFAULT false,
  rbt_readiness text CHECK (rbt_readiness IN ('ready','near','needs_support','not_ready')),
  additional_supervision_required boolean NOT NULL DEFAULT false,
  training_required boolean NOT NULL DEFAULT false,
  case_fit_concern boolean NOT NULL DEFAULT false,
  followup_date date, notes text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX first_bcba_case_idx ON public.rbt_first_session_bcba_followups(first_case_id);
GRANT SELECT, INSERT ON public.rbt_first_session_bcba_followups TO authenticated;
GRANT ALL ON public.rbt_first_session_bcba_followups TO service_role;
ALTER TABLE public.rbt_first_session_bcba_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "first_bcba_read" ON public.rbt_first_session_bcba_followups FOR SELECT TO authenticated
USING (public.is_employee_self(employee_id) OR bcba_id = auth.uid() OR public.can_oversee_rbt());
CREATE POLICY "first_bcba_insert" ON public.rbt_first_session_bcba_followups FOR INSERT TO authenticated
WITH CHECK (bcba_id = auth.uid() OR public.can_oversee_rbt());

CREATE TABLE public.rbt_first_session_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_case_id uuid NOT NULL REFERENCES public.rbt_first_case(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('checkin','lead_eval','bcba','manual')),
  source_row_id uuid,
  category text NOT NULL CHECK (category IN
    ('continue','refresher','supported_session','trainer_followup','bcba_followup','staffing_review','safety_escalation')),
  severity text NOT NULL DEFAULT 'attention' CHECK (severity IN ('info','attention','urgent')),
  owner_role text, owner_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  title text NOT NULL, details text, due_date date,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  resolution_note text, resolved_at timestamptz,
  resolved_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX first_outcome_case_idx ON public.rbt_first_session_outcomes(first_case_id);
CREATE INDEX first_outcome_status_idx ON public.rbt_first_session_outcomes(status);
CREATE INDEX first_outcome_owner_idx ON public.rbt_first_session_outcomes(owner_employee_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_first_session_outcomes TO authenticated;
GRANT ALL ON public.rbt_first_session_outcomes TO service_role;
ALTER TABLE public.rbt_first_session_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "first_outcome_read" ON public.rbt_first_session_outcomes FOR SELECT TO authenticated
USING (public.is_employee_self(employee_id) OR owner_employee_id = auth.uid() OR public.can_oversee_rbt());
CREATE POLICY "first_outcome_write" ON public.rbt_first_session_outcomes FOR INSERT TO authenticated
WITH CHECK (public.can_oversee_rbt() OR owner_employee_id = auth.uid());
CREATE POLICY "first_outcome_update" ON public.rbt_first_session_outcomes FOR UPDATE TO authenticated
USING (public.can_oversee_rbt() OR owner_employee_id = auth.uid())
WITH CHECK (public.can_oversee_rbt() OR owner_employee_id = auth.uid());
CREATE POLICY "first_outcome_delete_resolved" ON public.rbt_first_session_outcomes FOR DELETE TO authenticated
USING (public.can_oversee_rbt() AND status = 'resolved');

CREATE OR REPLACE FUNCTION public.rbt_first_outcome_guard_delete()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status <> 'resolved' THEN
    RAISE EXCEPTION 'Cannot delete an unresolved first-session outcome (%). Resolve it first.', OLD.title;
  END IF;
  RETURN OLD;
END; $$;
CREATE TRIGGER trg_first_outcome_guard_delete BEFORE DELETE ON public.rbt_first_session_outcomes
FOR EACH ROW EXECUTE FUNCTION public.rbt_first_outcome_guard_delete();

CREATE OR REPLACE FUNCTION public.rbt_first_outcome_touch()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status = 'resolved' AND (OLD.status IS DISTINCT FROM 'resolved') THEN
    NEW.resolved_at = COALESCE(NEW.resolved_at, now());
    NEW.resolved_by = COALESCE(NEW.resolved_by, auth.uid());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_first_outcome_touch BEFORE UPDATE ON public.rbt_first_session_outcomes
FOR EACH ROW EXECUTE FUNCTION public.rbt_first_outcome_touch();

CREATE OR REPLACE FUNCTION public.rbt_first_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_first_case_touch BEFORE UPDATE ON public.rbt_first_case
FOR EACH ROW EXECUTE FUNCTION public.rbt_first_touch_updated_at();
CREATE TRIGGER trg_first_checklist_state_touch BEFORE UPDATE ON public.rbt_first_session_checklist_state
FOR EACH ROW EXECUTE FUNCTION public.rbt_first_touch_updated_at();
CREATE TRIGGER trg_first_checklist_items_touch BEFORE UPDATE ON public.rbt_first_session_checklist_items
FOR EACH ROW EXECUTE FUNCTION public.rbt_first_touch_updated_at();

CREATE OR REPLACE FUNCTION public.rbt_ensure_first_case()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_display text; v_cr_status text;
BEGIN
  IF NEW.start_date IS NULL THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('active','approved','confirmed') THEN RETURN NEW; END IF;
  v_display := CASE WHEN NEW.client_name IS NULL THEN 'Client'
    ELSE regexp_replace(NEW.client_name, '(?:^|\s)(\S)\S*', '\1', 'g') END;
  v_cr_status := CASE
    WHEN NEW.centralreach_sync_status IN ('active','synced','completed') THEN 'active'
    WHEN NEW.centralreach_sync_status IN ('error','blocked','failed') THEN 'blocked'
    WHEN NEW.centralreach_sync_status IS NULL THEN 'unknown'
    ELSE 'pending' END;
  INSERT INTO public.rbt_first_case
    (assignment_id, employee_id, bcba_id, support_contact_id, start_date,
     cr_access_status, last_schedule_sync_at, client_display)
  VALUES (NEW.id, NEW.rbt_employee_id, NEW.assigned_bcba_id, NEW.case_manager_id,
          NEW.start_date, v_cr_status, NEW.centralreach_last_synced_at, left(v_display, 6))
  ON CONFLICT (assignment_id) DO UPDATE SET
    start_date = EXCLUDED.start_date, bcba_id = EXCLUDED.bcba_id,
    support_contact_id = EXCLUDED.support_contact_id,
    cr_access_status = EXCLUDED.cr_access_status,
    last_schedule_sync_at = EXCLUDED.last_schedule_sync_at,
    client_display = EXCLUDED.client_display, updated_at = now();
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_rbt_ensure_first_case
AFTER INSERT OR UPDATE OF start_date, status, assigned_bcba_id, case_manager_id, centralreach_sync_status, centralreach_last_synced_at
ON public.rbt_client_assignments
FOR EACH ROW EXECUTE FUNCTION public.rbt_ensure_first_case();

CREATE OR REPLACE FUNCTION public.rbt_first_checkin_outcomes()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.safety_concern THEN
    INSERT INTO public.rbt_first_session_outcomes
      (first_case_id, employee_id, source, source_row_id, category, severity, owner_role, title, details)
    VALUES (NEW.first_case_id, NEW.employee_id, 'checkin', NEW.id, 'safety_escalation', 'urgent',
      'clinical_director','Safety concern reported after first session',
      COALESCE(NEW.safety_concern_note, 'RBT flagged a safety concern in their post-session check-in.'));
  END IF;
  IF NEW.family_concern THEN
    INSERT INTO public.rbt_first_session_outcomes
      (first_case_id, employee_id, source, source_row_id, category, severity, owner_role, title, details)
    VALUES (NEW.first_case_id, NEW.employee_id, 'checkin', NEW.id, 'bcba_followup', 'attention',
      'bcba','Family / caregiver concern reported',
      COALESCE(NEW.family_concern_note, 'RBT flagged a family or caregiver concern.'));
  END IF;
  IF NEW.additional_support_requested THEN
    INSERT INTO public.rbt_first_session_outcomes
      (first_case_id, employee_id, source, source_row_id, category, severity, owner_role, title, details)
    VALUES (NEW.first_case_id, NEW.employee_id, 'checkin', NEW.id, 'trainer_followup', 'attention',
      'trainer','RBT requested additional support',
      COALESCE(NEW.additional_support_note, 'RBT requested additional support after first session.'));
  END IF;
  IF NEW.centralreach_worked IS FALSE THEN
    INSERT INTO public.rbt_first_session_outcomes
      (first_case_id, employee_id, source, source_row_id, category, severity, owner_role, title, details)
    VALUES (NEW.first_case_id, NEW.employee_id, 'checkin', NEW.id, 'trainer_followup', 'attention',
      'training_admin','CentralReach did not work during first session',
      'RBT reported CentralReach did not work as expected. Verify access and orientation.');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_first_checkin_outcomes AFTER INSERT ON public.rbt_first_session_checkins
FOR EACH ROW EXECUTE FUNCTION public.rbt_first_checkin_outcomes();

CREATE OR REPLACE FUNCTION public.rbt_first_lead_eval_outcomes()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_cat text; v_sev text; v_title text; v_owner text;
BEGIN
  IF NEW.support_recommendation = 'continue' THEN RETURN NEW; END IF;
  v_cat := NEW.support_recommendation;
  v_sev := CASE WHEN NEW.support_recommendation = 'staffing_review' THEN 'urgent' ELSE 'attention' END;
  v_owner := CASE NEW.support_recommendation
    WHEN 'supported_session' THEN 'lead_rbt'
    WHEN 'refresher' THEN 'training_admin'
    WHEN 'trainer_followup' THEN 'trainer'
    WHEN 'bcba_followup' THEN 'bcba'
    WHEN 'staffing_review' THEN 'scheduling_lead'
    ELSE NULL END;
  v_title := 'Lead RBT recommended: ' || replace(NEW.support_recommendation, '_', ' ');
  INSERT INTO public.rbt_first_session_outcomes
    (first_case_id, employee_id, source, source_row_id, category, severity, owner_role, title, details)
  VALUES (NEW.first_case_id, NEW.employee_id, 'lead_eval', NEW.id, v_cat, v_sev, v_owner, v_title, NEW.notes);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_first_lead_eval_outcomes AFTER INSERT ON public.rbt_first_session_lead_evaluations
FOR EACH ROW EXECUTE FUNCTION public.rbt_first_lead_eval_outcomes();

CREATE OR REPLACE FUNCTION public.rbt_first_bcba_outcomes()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.additional_supervision_required THEN
    INSERT INTO public.rbt_first_session_outcomes
      (first_case_id, employee_id, source, source_row_id, category, severity, owner_role, title, details, due_date)
    VALUES (NEW.first_case_id, NEW.employee_id, 'bcba', NEW.id, 'supported_session', 'attention',
      'bcba','Additional supervision recommended by BCBA', NEW.notes, NEW.followup_date);
  END IF;
  IF NEW.training_required THEN
    INSERT INTO public.rbt_first_session_outcomes
      (first_case_id, employee_id, source, source_row_id, category, severity, owner_role, title, details, due_date)
    VALUES (NEW.first_case_id, NEW.employee_id, 'bcba', NEW.id, 'refresher', 'attention',
      'training_admin','BCBA requested refresher training', NEW.notes, NEW.followup_date);
  END IF;
  IF NEW.case_fit_concern THEN
    INSERT INTO public.rbt_first_session_outcomes
      (first_case_id, employee_id, source, source_row_id, category, severity, owner_role, title, details, due_date)
    VALUES (NEW.first_case_id, NEW.employee_id, 'bcba', NEW.id, 'staffing_review', 'urgent',
      'scheduling_lead','Case fit concern flagged by BCBA — human review required',
      COALESCE(NEW.notes, 'Route for human review. Do not auto-remove the RBT from the case.'), NEW.followup_date);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_first_bcba_outcomes AFTER INSERT ON public.rbt_first_session_bcba_followups
FOR EACH ROW EXECUTE FUNCTION public.rbt_first_bcba_outcomes();
