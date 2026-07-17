
CREATE TABLE public.rbt_readiness_gates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  employee_instructions text,
  internal_instructions text,
  owner_role text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  requires_approval boolean NOT NULL DEFAULT true,
  approver_role text,
  due_offset_days integer,
  risk_after_days integer,
  advances_stage_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_readiness_gates TO authenticated;
GRANT ALL ON public.rbt_readiness_gates TO service_role;
ALTER TABLE public.rbt_readiness_gates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "readiness gates readable" ON public.rbt_readiness_gates FOR SELECT TO authenticated USING (true);
CREATE POLICY "readiness gates admin manage" ON public.rbt_readiness_gates FOR ALL TO authenticated
  USING (public.has_preboarding_internal_access(auth.uid())) WITH CHECK (public.has_preboarding_internal_access(auth.uid()));

CREATE TABLE public.rbt_readiness_gate_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  gate_key text NOT NULL REFERENCES public.rbt_readiness_gates(key) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started',
  assigned_to uuid,
  due_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  risk_flag text,
  blocker_note text,
  last_progress_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, gate_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_readiness_gate_state TO authenticated;
GRANT ALL ON public.rbt_readiness_gate_state TO service_role;
ALTER TABLE public.rbt_readiness_gate_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "readiness state read" ON public.rbt_readiness_gate_state FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.has_preboarding_internal_access(auth.uid()));
CREATE POLICY "readiness state internal manage" ON public.rbt_readiness_gate_state FOR ALL TO authenticated
  USING (public.has_preboarding_internal_access(auth.uid())) WITH CHECK (public.has_preboarding_internal_access(auth.uid()));

CREATE TABLE public.rbt_readiness_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  gate_key text,
  event_type text NOT NULL,
  from_value text,
  to_value text,
  note text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.rbt_readiness_events TO authenticated;
GRANT ALL ON public.rbt_readiness_events TO service_role;
ALTER TABLE public.rbt_readiness_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "readiness events read" ON public.rbt_readiness_events FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.has_preboarding_internal_access(auth.uid()));
CREATE POLICY "readiness events internal insert" ON public.rbt_readiness_events FOR INSERT TO authenticated
  WITH CHECK (public.has_preboarding_internal_access(auth.uid()));

CREATE TABLE public.rbt_staffing_status (
  employee_id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'not_ready',
  became_ready_at timestamptz,
  potential_case_ref text,
  potential_case_summary text,
  schedule_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  case_start_date date,
  case_confirmed_at timestamptz,
  last_activity_at timestamptz,
  assigned_coordinator uuid,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_staffing_status TO authenticated;
GRANT ALL ON public.rbt_staffing_status TO service_role;
ALTER TABLE public.rbt_staffing_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staffing status read" ON public.rbt_staffing_status FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.has_preboarding_internal_access(auth.uid()));
CREATE POLICY "staffing status internal manage" ON public.rbt_staffing_status FOR ALL TO authenticated
  USING (public.has_preboarding_internal_access(auth.uid())) WITH CHECK (public.has_preboarding_internal_access(auth.uid()));

CREATE TABLE public.rbt_staffing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  note text,
  actor_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.rbt_staffing_events TO authenticated;
GRANT ALL ON public.rbt_staffing_events TO service_role;
ALTER TABLE public.rbt_staffing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staffing events read" ON public.rbt_staffing_events FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.has_preboarding_internal_access(auth.uid()));
CREATE POLICY "staffing events internal insert" ON public.rbt_staffing_events FOR INSERT TO authenticated
  WITH CHECK (public.has_preboarding_internal_access(auth.uid()));

CREATE TABLE public.rbt_availability_profile (
  employee_id uuid PRIMARY KEY,
  days jsonb NOT NULL DEFAULT '[]'::jsonb,
  time_windows jsonb NOT NULL DEFAULT '[]'::jsonb,
  max_weekly_hours integer,
  travel_radius_miles integer,
  preferred_settings jsonb NOT NULL DEFAULT '[]'::jsonb,
  clinic_available boolean NOT NULL DEFAULT true,
  home_available boolean NOT NULL DEFAULT true,
  school_available boolean NOT NULL DEFAULT false,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_availability_profile TO authenticated;
GRANT ALL ON public.rbt_availability_profile TO service_role;
ALTER TABLE public.rbt_availability_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "availability own" ON public.rbt_availability_profile FOR ALL TO authenticated
  USING (employee_id = auth.uid() OR public.has_preboarding_internal_access(auth.uid()))
  WITH CHECK (employee_id = auth.uid() OR public.has_preboarding_internal_access(auth.uid()));

CREATE TABLE public.rbt_availability_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  reason text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_availability_overrides TO authenticated;
GRANT ALL ON public.rbt_availability_overrides TO service_role;
ALTER TABLE public.rbt_availability_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "availability overrides own" ON public.rbt_availability_overrides FOR ALL TO authenticated
  USING (employee_id = auth.uid() OR public.has_preboarding_internal_access(auth.uid()))
  WITH CHECK (employee_id = auth.uid() OR public.has_preboarding_internal_access(auth.uid()));

CREATE TABLE public.rbt_availability_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  snapshot jsonb NOT NULL,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.rbt_availability_history TO authenticated;
GRANT ALL ON public.rbt_availability_history TO service_role;
ALTER TABLE public.rbt_availability_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "availability history read" ON public.rbt_availability_history FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.has_preboarding_internal_access(auth.uid()));
CREATE POLICY "availability history insert" ON public.rbt_availability_history FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid() OR public.has_preboarding_internal_access(auth.uid()));

CREATE TABLE public.rbt_unstaffed_alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  days integer NOT NULL,
  severity text NOT NULL DEFAULT 'attention',
  audience_roles text[] NOT NULL DEFAULT ARRAY['staffing','recruiting','hr']::text[],
  message text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_unstaffed_alert_rules TO authenticated;
GRANT ALL ON public.rbt_unstaffed_alert_rules TO service_role;
ALTER TABLE public.rbt_unstaffed_alert_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alert rules readable" ON public.rbt_unstaffed_alert_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "alert rules manage" ON public.rbt_unstaffed_alert_rules FOR ALL TO authenticated
  USING (public.has_preboarding_internal_access(auth.uid())) WITH CHECK (public.has_preboarding_internal_access(auth.uid()));

CREATE TABLE public.rbt_unstaffed_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  rule_id uuid REFERENCES public.rbt_unstaffed_alert_rules(id) ON DELETE SET NULL,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  severity text NOT NULL,
  message text NOT NULL,
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  UNIQUE (employee_id, rule_id)
);
GRANT SELECT, INSERT, UPDATE ON public.rbt_unstaffed_alerts TO authenticated;
GRANT ALL ON public.rbt_unstaffed_alerts TO service_role;
ALTER TABLE public.rbt_unstaffed_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "unstaffed alerts internal" ON public.rbt_unstaffed_alerts FOR ALL TO authenticated
  USING (public.has_preboarding_internal_access(auth.uid())) WITH CHECK (public.has_preboarding_internal_access(auth.uid()));

CREATE TABLE public.rbt_outreach_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  task_type text NOT NULL,
  title text NOT NULL,
  description text,
  assigned_to uuid,
  status text NOT NULL DEFAULT 'open',
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_outreach_tasks TO authenticated;
GRANT ALL ON public.rbt_outreach_tasks TO service_role;
ALTER TABLE public.rbt_outreach_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "outreach internal" ON public.rbt_outreach_tasks FOR ALL TO authenticated
  USING (public.has_preboarding_internal_access(auth.uid())) WITH CHECK (public.has_preboarding_internal_access(auth.uid()));
CREATE POLICY "outreach employee read own" ON public.rbt_outreach_tasks FOR SELECT TO authenticated
  USING (employee_id = auth.uid());

CREATE TABLE public.rbt_readiness_support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  gate_key text,
  subject text NOT NULL,
  body text,
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.rbt_readiness_support_requests TO authenticated;
GRANT ALL ON public.rbt_readiness_support_requests TO service_role;
ALTER TABLE public.rbt_readiness_support_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "support req read" ON public.rbt_readiness_support_requests FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.has_preboarding_internal_access(auth.uid()));
CREATE POLICY "support req employee create" ON public.rbt_readiness_support_requests FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid());
CREATE POLICY "support req internal update" ON public.rbt_readiness_support_requests FOR UPDATE TO authenticated
  USING (public.has_preboarding_internal_access(auth.uid())) WITH CHECK (public.has_preboarding_internal_access(auth.uid()));

CREATE TRIGGER trg_readiness_gates_updated BEFORE UPDATE ON public.rbt_readiness_gates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_readiness_state_updated BEFORE UPDATE ON public.rbt_readiness_gate_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_staffing_status_updated BEFORE UPDATE ON public.rbt_staffing_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_outreach_updated BEFORE UPDATE ON public.rbt_outreach_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_support_req_updated BEFORE UPDATE ON public.rbt_readiness_support_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.rbt_readiness_state_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  advances text;
BEGIN
  IF (NEW.status IN ('approved','waived')) AND NOT public.has_preboarding_internal_access(auth.uid()) THEN
    RAISE EXCEPTION 'Only internal reviewers can approve readiness gates';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.rbt_readiness_events(employee_id, gate_key, event_type, from_value, to_value, actor_id)
    VALUES (NEW.employee_id, NEW.gate_key, 'status_changed', OLD.status, NEW.status, auth.uid());

    IF NEW.status = 'approved' THEN
      SELECT advances_stage_key INTO advances FROM public.rbt_readiness_gates WHERE key = NEW.gate_key;
      IF advances IS NOT NULL AND advances <> '' THEN
        INSERT INTO public.rbt_lifecycle_gate_completions (employee_id, gate_key, completed_at, completed_by)
        VALUES (NEW.employee_id, advances, now(), auth.uid())
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;

  NEW.last_progress_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_readiness_state_guard BEFORE INSERT OR UPDATE ON public.rbt_readiness_gate_state
  FOR EACH ROW EXECUTE FUNCTION public.rbt_readiness_state_guard();

CREATE OR REPLACE FUNCTION public.rbt_staffing_status_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.rbt_staffing_events(employee_id, event_type, from_status, to_status, actor_id)
    VALUES (NEW.employee_id, 'status_changed', OLD.status, NEW.status, auth.uid());
  END IF;
  IF NEW.status = 'ready_for_matching' AND NEW.became_ready_at IS NULL THEN
    NEW.became_ready_at = now();
  END IF;
  NEW.last_activity_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_staffing_status_guard BEFORE INSERT OR UPDATE ON public.rbt_staffing_status
  FOR EACH ROW EXECUTE FUNCTION public.rbt_staffing_status_guard();

CREATE OR REPLACE FUNCTION public.rbt_availability_snapshot()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.rbt_availability_history(employee_id, snapshot, changed_by)
  VALUES (NEW.employee_id, to_jsonb(NEW), COALESCE(auth.uid(), NEW.updated_by));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_availability_snapshot AFTER INSERT OR UPDATE ON public.rbt_availability_profile
  FOR EACH ROW EXECUTE FUNCTION public.rbt_availability_snapshot();

INSERT INTO public.rbt_readiness_gates
  (key, label, owner_role, sort_order, requires_approval, employee_instructions, internal_instructions, risk_after_days, advances_stage_key)
VALUES
  ('employment_onboarding_complete','Employment onboarding complete','hr',10,true,
    'Your HR onboarding is being finalized.','Confirm Viventium onboarding complete and I-9 finalized.',5,NULL),
  ('background_check_cleared','Background check cleared','hr',20,true,
    'Your background check is being processed.','Confirm clearance from background check provider.',7,NULL),
  ('required_documents_complete','Required documents complete','hr',30,true,
    'Upload any remaining required documents.','Verify all HR document requirements are complete.',5,NULL),
  ('certification_verified','Certification verified or pathway complete','training',40,true,
    'Your RBT certification or 40-hour pathway is being verified.','Confirm RBT certificate on file or 40-hour training pathway complete.',7,NULL),
  ('orientation_complete','Orientation complete','training',50,true,
    'Complete orientation with our team.','Confirm orientation attendance recorded.',5,NULL),
  ('required_courses_complete','Required courses complete','training',60,true,
    'Finish all required training courses in the Academy.','Confirm all required Blossom Academy courses complete.',7,NULL),
  ('role_play_complete','Role-play complete','training',70,true,
    'Complete your assigned role-play exercises.','Verify role-play exercises reviewed by a trainer.',5,NULL),
  ('session_note_practice_reviewed','Session-note practice reviewed','training',80,true,
    'Submit practice session notes for review.','Review submitted practice notes for quality.',5,NULL),
  ('competency_complete','Competency complete','bcba',90,true,
    'Your BCBA will review your competency assessment.','Confirm competency assessment complete.',7,NULL),
  ('bcba_signoff_complete','BCBA signoff complete','bcba',100,true,
    'A BCBA will sign off on your readiness.','BCBA sign-off required before staffing.',5,NULL),
  ('readiness_evaluation_complete','Readiness evaluation complete','training',110,true,
    'Final readiness evaluation with your trainer.','Complete final readiness evaluation.',5,NULL),
  ('centralreach_access_active','CentralReach access active','admin',120,true,
    'CentralReach access is being set up for you.','Confirm CentralReach account provisioned and active.',5,NULL),
  ('availability_confirmed','Availability confirmed','scheduling',130,true,
    'Make sure your availability profile is up to date.','Confirm employee availability profile complete.',3,NULL),
  ('staffing_approval_complete','Staffing approval complete','scheduling',140,true,
    'Scheduling will confirm you are cleared for matching.','Final approval to mark ready_for_staffing.',3,'ready_for_staffing');

INSERT INTO public.rbt_unstaffed_alert_rules (days, severity, audience_roles, message) VALUES
  (3,'attention',ARRAY['staffing','recruiting'],'RBT has been ready for staffing for 3 days without a match.'),
  (7,'warning',ARRAY['staffing','recruiting','hr'],'RBT has been ready for staffing for 7 days. Add outreach and check engagement.'),
  (14,'escalation',ARRAY['staffing','recruiting','hr','operations'],'RBT has been ready for staffing for 14 days. Escalate to Operations leadership.');
