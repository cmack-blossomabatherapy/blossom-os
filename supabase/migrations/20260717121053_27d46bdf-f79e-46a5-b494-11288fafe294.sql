
CREATE OR REPLACE FUNCTION public.has_preboarding_internal_access(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.has_role(_uid,'admin')
      OR public.has_role(_uid,'super_admin')
      OR public.has_role(_uid,'hr')
      OR public.has_role(_uid,'hr_admin')
      OR public.has_role(_uid,'hr_lead')
      OR public.has_role(_uid,'recruiting_lead')
      OR public.has_role(_uid,'recruiting_coordinator')
      OR public.has_role(_uid,'recruiting_assistant')
      OR public.has_role(_uid,'training_admin');
$$;

CREATE TABLE public.rbt_preboarding_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  sort_order integer NOT NULL DEFAULT 100,
  owner_role text NOT NULL DEFAULT 'rbt',
  employee_instructions text,
  internal_instructions text,
  is_required boolean NOT NULL DEFAULT true,
  requires_approval boolean NOT NULL DEFAULT false,
  requires_file boolean NOT NULL DEFAULT false,
  external_system text,
  external_action_label text,
  external_action_url text,
  applies_to_stages text[] NOT NULL DEFAULT ARRAY['offer_accepted','preboarding','orientation_scheduled']::text[],
  applies_to_states text[],
  default_due_offset_days integer,
  advances_gate_key text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_preboarding_requirements TO authenticated;
GRANT ALL ON public.rbt_preboarding_requirements TO service_role;
ALTER TABLE public.rbt_preboarding_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reqs read auth" ON public.rbt_preboarding_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "reqs manage internal" ON public.rbt_preboarding_requirements FOR ALL TO authenticated
  USING (public.has_preboarding_internal_access(auth.uid())) WITH CHECK (public.has_preboarding_internal_access(auth.uid()));

CREATE TABLE public.rbt_preboarding_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  requirement_key text NOT NULL,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','submitted','approved','rejected','waived','complete')),
  owner_role text NOT NULL DEFAULT 'rbt',
  assigned_to uuid,
  due_at timestamptz,
  submitted_at timestamptz,
  submitted_by uuid,
  approved_at timestamptz,
  approved_by uuid,
  file_path text,
  file_name text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_reminded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, requirement_key)
);
CREATE INDEX idx_preb_items_employee ON public.rbt_preboarding_items(employee_id);
CREATE INDEX idx_preb_items_status ON public.rbt_preboarding_items(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_preboarding_items TO authenticated;
GRANT ALL ON public.rbt_preboarding_items TO service_role;
ALTER TABLE public.rbt_preboarding_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items select own or internal" ON public.rbt_preboarding_items FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.has_preboarding_internal_access(auth.uid()));
CREATE POLICY "items update own or internal" ON public.rbt_preboarding_items FOR UPDATE TO authenticated
  USING (employee_id = auth.uid() OR public.has_preboarding_internal_access(auth.uid()))
  WITH CHECK (employee_id = auth.uid() OR public.has_preboarding_internal_access(auth.uid()));
CREATE POLICY "items insert internal" ON public.rbt_preboarding_items FOR INSERT TO authenticated
  WITH CHECK (public.has_preboarding_internal_access(auth.uid()));
CREATE POLICY "items delete internal" ON public.rbt_preboarding_items FOR DELETE TO authenticated
  USING (public.has_preboarding_internal_access(auth.uid()));

CREATE TABLE public.rbt_preboarding_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.rbt_preboarding_items(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_role text,
  body text NOT NULL,
  visibility text NOT NULL DEFAULT 'all' CHECK (visibility IN ('all','internal')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_preb_comments_item ON public.rbt_preboarding_comments(item_id);
GRANT SELECT, INSERT ON public.rbt_preboarding_comments TO authenticated;
GRANT ALL ON public.rbt_preboarding_comments TO service_role;
ALTER TABLE public.rbt_preboarding_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments read scoped" ON public.rbt_preboarding_comments FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.rbt_preboarding_items i WHERE i.id = item_id AND (
      i.employee_id = auth.uid() OR public.has_preboarding_internal_access(auth.uid())
    ))
    AND (visibility = 'all' OR public.has_preboarding_internal_access(auth.uid()))
  );
CREATE POLICY "comments insert scoped" ON public.rbt_preboarding_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.rbt_preboarding_items i WHERE i.id = item_id AND (
      i.employee_id = auth.uid() OR public.has_preboarding_internal_access(auth.uid())
    )
  ));

CREATE TABLE public.rbt_preboarding_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.rbt_preboarding_items(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL,
  from_status text,
  to_status text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_preb_audit_item ON public.rbt_preboarding_audit(item_id);
GRANT SELECT, INSERT ON public.rbt_preboarding_audit TO authenticated;
GRANT ALL ON public.rbt_preboarding_audit TO service_role;
ALTER TABLE public.rbt_preboarding_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit read scoped" ON public.rbt_preboarding_audit FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.rbt_preboarding_items i WHERE i.id = item_id AND (
    i.employee_id = auth.uid() OR public.has_preboarding_internal_access(auth.uid())
  )));
CREATE POLICY "audit insert scoped" ON public.rbt_preboarding_audit FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.rbt_preboarding_items i WHERE i.id = item_id AND (
    i.employee_id = auth.uid() OR public.has_preboarding_internal_access(auth.uid())
  )));

CREATE OR REPLACE FUNCTION public.rbt_preboarding_audit_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  req record;
  emp_stage text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.rbt_preboarding_audit(item_id, actor_id, action, to_status)
    VALUES (NEW.id, auth.uid(), 'created', NEW.status);
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.rbt_preboarding_audit(item_id, actor_id, action, from_status, to_status)
    VALUES (NEW.id, auth.uid(), 'status_change', OLD.status, NEW.status);

    IF NEW.status IN ('approved','complete','waived') THEN
      SELECT * INTO req FROM public.rbt_preboarding_requirements WHERE key = NEW.requirement_key;
      IF req.advances_gate_key IS NOT NULL THEN
        SELECT stage INTO emp_stage FROM public.rbt_lifecycle_state WHERE employee_id = NEW.employee_id;
        IF emp_stage IS NOT NULL THEN
          INSERT INTO public.rbt_lifecycle_gate_completions(employee_id, stage_key, gate_key, completed_at, completed_by, notes)
          VALUES (NEW.employee_id, emp_stage, req.advances_gate_key, now(), auth.uid(), 'Auto: preboarding ' || NEW.requirement_key)
          ON CONFLICT DO NOTHING;
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_preb_items_audit AFTER INSERT OR UPDATE ON public.rbt_preboarding_items
  FOR EACH ROW EXECUTE FUNCTION public.rbt_preboarding_audit_status();

CREATE OR REPLACE FUNCTION public.rbt_preboarding_touch()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_preb_items_touch BEFORE UPDATE ON public.rbt_preboarding_items FOR EACH ROW EXECUTE FUNCTION public.rbt_preboarding_touch();
CREATE TRIGGER trg_preb_reqs_touch BEFORE UPDATE ON public.rbt_preboarding_requirements FOR EACH ROW EXECUTE FUNCTION public.rbt_preboarding_touch();

CREATE OR REPLACE FUNCTION public.initialize_rbt_preboarding(_employee_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inserted integer := 0; emp_state text;
BEGIN
  SELECT COALESCE(state, working_state) INTO emp_state FROM public.employees WHERE id = _employee_id;
  INSERT INTO public.rbt_preboarding_items (employee_id, requirement_key, owner_role, due_at)
  SELECT _employee_id, r.key, r.owner_role,
         CASE WHEN r.default_due_offset_days IS NOT NULL THEN now() + (r.default_due_offset_days || ' days')::interval END
  FROM public.rbt_preboarding_requirements r
  WHERE r.is_active = true
    AND (r.applies_to_states IS NULL OR array_length(r.applies_to_states,1) IS NULL OR emp_state = ANY(r.applies_to_states))
  ON CONFLICT (employee_id, requirement_key) DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$;

INSERT INTO public.rbt_preboarding_requirements (key, label, category, sort_order, owner_role, employee_instructions, internal_instructions, is_required, requires_approval, requires_file, external_system, external_action_label, external_action_url, default_due_offset_days, advances_gate_key) VALUES
('offer_accepted','Offer accepted','offer',10,'rbt','Confirm your acceptance of the offer letter.','Verify countersigned offer on file.',true,true,false,NULL,NULL,NULL,0,'offer_accepted'),
('employment_forms','Complete employment forms','hr',20,'rbt','Complete W-4, I-9, and direct deposit forms.','Confirm forms submitted and countersigned.',true,true,false,NULL,NULL,NULL,5,NULL),
('viventium_onboarding','Finish onboarding in Viventium','hr',30,'rbt','Complete your onboarding tasks in Viventium — our payroll & HR partner.','Verify Viventium onboarding status = Complete.',true,true,false,'viventium','Open Viventium','https://ess.viventium.com',7,NULL),
('background_check_initiated','Background check initiated','compliance',40,'hr',NULL,'Initiate background check with vendor and log request ID.',true,false,false,'background_check','Start Background Check',NULL,3,NULL),
('background_check_cleared','Background check cleared','compliance',50,'hr',NULL,'Upload cleared background check report.',true,true,true,'background_check','View Background Check',NULL,14,'background_cleared'),
('identity_documents','Identity documents received','compliance',60,'rbt','Upload a photo of your driver''s license or state ID.','Verify I-9 documents on file.',true,true,true,NULL,NULL,NULL,5,NULL),
('certification_status','Certification status confirmed','credentials',70,'training','Provide your RBT / BCAT certification number.','Confirm active status in BACB registry.',true,true,false,'bacb','Verify on BACB','https://www.bacb.com',7,NULL),
('rbt_certificate','Upload RBT certificate','credentials',80,'rbt','Upload a PDF of your active RBT certificate.',NULL,true,true,true,NULL,NULL,NULL,7,NULL),
('cpr_first_aid','Upload CPR / First Aid certificate','credentials',90,'rbt','Upload a PDF of your current CPR/First Aid certification.',NULL,true,true,true,NULL,NULL,NULL,14,NULL),
('orientation_selected','Select orientation date','orientation',100,'rbt','Choose your orientation date from the available options.','Confirm slot in scheduling system.',true,false,false,NULL,NULL,NULL,7,'orientation_selected'),
('centralreach_requested','CentralReach account requested','systems',110,'training',NULL,'Submit CentralReach account request; deliver credentials 1 day before orientation.',true,false,false,'centralreach','Request CentralReach Account',NULL,10,NULL),
('required_equipment','Required equipment confirmed','systems',120,'hr','Confirm receipt of your work materials.','Ship / confirm equipment package.',false,false,false,NULL,NULL,NULL,10,NULL),
('state_requirements','State-specific requirements complete','compliance',130,'hr',NULL,'Complete any state-required registrations (e.g., NC RBT registration).',false,true,false,NULL,NULL,NULL,14,NULL);
