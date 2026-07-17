
-- ============================================================================
-- RBT SUPPORT CENTER — unified ticketing, routing, updates, audit, contacts
-- ============================================================================

-- 1. Extend rbt_help_requests to become the canonical Support Ticket table
ALTER TABLE public.rbt_help_requests
  ADD COLUMN IF NOT EXISTS ticket_number     TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS subcategory       TEXT,
  ADD COLUMN IF NOT EXISTS subject           TEXT,
  ADD COLUMN IF NOT EXISTS attachment_url    TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name   TEXT,
  ADD COLUMN IF NOT EXISTS due_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_minutes       INTEGER,
  ADD COLUMN IF NOT EXISTS sla_breached_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_notes  TEXT,
  ADD COLUMN IF NOT EXISTS satisfaction_rating SMALLINT
    CHECK (satisfaction_rating IS NULL OR satisfaction_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS satisfaction_comment TEXT,
  ADD COLUMN IF NOT EXISTS satisfaction_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS routed_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS routing_rule_id   UUID,
  ADD COLUMN IF NOT EXISTS escalation_level  SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS escalated_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS state             TEXT,
  ADD COLUMN IF NOT EXISTS service_setting   TEXT, -- clinic | home
  ADD COLUMN IF NOT EXISTS assigned_bcba_id  UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_urgent_safety  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS emergency_acknowledged BOOLEAN NOT NULL DEFAULT false;

-- Ticket number generator
CREATE SEQUENCE IF NOT EXISTS public.rbt_support_ticket_seq START 10001;

CREATE OR REPLACE FUNCTION public.rbt_support_assign_ticket_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := 'SUP-' || nextval('public.rbt_support_ticket_seq');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_rbt_support_ticket_number ON public.rbt_help_requests;
CREATE TRIGGER trg_rbt_support_ticket_number
BEFORE INSERT ON public.rbt_help_requests
FOR EACH ROW EXECUTE FUNCTION public.rbt_support_assign_ticket_number();

DROP TRIGGER IF EXISTS trg_rbt_help_requests_updated_at ON public.rbt_help_requests;
CREATE TRIGGER trg_rbt_help_requests_updated_at
BEFORE UPDATE ON public.rbt_help_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Support categories (config, seeded)
CREATE TABLE IF NOT EXISTS public.rbt_support_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  default_urgency TEXT NOT NULL DEFAULT 'normal',
  default_sla_minutes INTEGER NOT NULL DEFAULT 1440,
  is_urgent_safety BOOLEAN NOT NULL DEFAULT false,
  allow_client_link BOOLEAN NOT NULL DEFAULT true,
  ai_advice_restricted BOOLEAN NOT NULL DEFAULT false,
  subcategories TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_support_categories TO authenticated;
GRANT ALL ON public.rbt_support_categories TO service_role;
ALTER TABLE public.rbt_support_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_read_all" ON public.rbt_support_categories
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories_admin_write" ON public.rbt_support_categories
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'training_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'training_admin'::app_role));
DROP TRIGGER IF EXISTS trg_rbt_support_categories_updated ON public.rbt_support_categories;
CREATE TRIGGER trg_rbt_support_categories_updated
BEFORE UPDATE ON public.rbt_support_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed 15 categories
INSERT INTO public.rbt_support_categories (key,label,description,icon,order_index,default_urgency,default_sla_minutes,is_urgent_safety,allow_client_link,ai_advice_restricted,subcategories) VALUES
  ('clinical_guidance','Clinical guidance','Questions about protocols, programs, behavior support','stethoscope',10,'normal',480,false,true,true,ARRAY['Program question','BIP question','Data collection','Skill acquisition']),
  ('scheduling_issue','Scheduling issue','Conflicts, changes, or missing sessions','calendar',20,'normal',240,false,true,false,ARRAY['Missing session','Overlap','Location change','Cancellation']),
  ('unable_to_attend','Unable to attend','Let us know you cannot make an upcoming session','calendar-x',30,'high',60,false,true,false,ARRAY['Illness','Emergency','Transportation','Other']),
  ('client_caregiver_concern','Client or caregiver concern','Non-emergency concerns about a client or caregiver','heart',40,'high',240,false,true,true,ARRAY['Communication','Environment','Cancellation pattern','Other']),
  ('centralreach_access','CentralReach access','Login, permissions, or CR errors','key-round',50,'high',240,false,false,false,ARRAY['Login','Permissions','Data missing','Other']),
  ('payroll_hours','Payroll or hours','Timesheet, pay, or hours questions','dollar-sign',60,'normal',1440,false,false,false,ARRAY['Missing hours','Rate','Direct deposit','Reimbursement']),
  ('training_question','Training question','Onboarding, coursework, or Academy help','graduation-cap',70,'normal',1440,false,false,false,ARRAY['Assignment','Access','Content question','Other']),
  ('certification_question','Certification question','RBT credential, renewal, or exam','badge-check',80,'normal',1440,false,false,false,ARRAY['Renewal','Documentation','Exam','Other']),
  ('equipment_supplies','Equipment or supplies','Materials or tech you need to do your job','package',90,'normal',1440,false,false,false,ARRAY['Program materials','Reinforcers','Tech','Other']),
  ('safety_concern','Safety concern','A safety issue you want reviewed (not an emergency)','shield-alert',100,'urgent',30,true,true,true,ARRAY['Environment','Aggression','Vehicle','Other']),
  ('incident','Incident','Report an incident that occurred','alert-triangle',110,'urgent',30,true,true,true,ARRAY['Injury','Property','Elopement','Other']),
  ('bcba_support_concern','BCBA support concern','Concerns about supervision or BCBA support','user-cog',120,'high',480,false,true,true,ARRAY['Availability','Feedback','Communication','Other']),
  ('case_fit_concern','Case fit concern','This case may not be a fit — let us know','user-x',130,'high',480,false,true,false,ARRAY['Schedule','Fit','Safety','Other']),
  ('fellowship_question','Fellowship question','Questions about the Fellowship program','sparkles',140,'normal',1440,false,false,false,ARRAY['Eligibility','Application','Timeline','Other']),
  ('other','Other','Something else we can help with','help-circle',999,'normal',1440,false,true,false,ARRAY[]::TEXT[])
ON CONFLICT (key) DO NOTHING;

-- 3. Routing rules
CREATE TABLE IF NOT EXISTS public.rbt_support_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 100, -- lower runs first
  active BOOLEAN NOT NULL DEFAULT true,
  -- match conditions (null = any)
  match_category TEXT,
  match_subcategory TEXT,
  match_state TEXT,
  match_service_setting TEXT, -- clinic | home
  match_urgency TEXT,
  match_escalation_min SMALLINT,
  match_time_of_day TEXT, -- business_hours | after_hours | any
  match_has_client BOOLEAN,
  match_has_bcba BOOLEAN,
  -- routing target
  route_to_role TEXT, -- e.g. scheduling, hr, bcba_lead, safety_lead
  route_to_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  route_to_assigned_bcba BOOLEAN NOT NULL DEFAULT false,
  route_to_rbt_support_rep BOOLEAN NOT NULL DEFAULT false,
  sla_minutes_override INTEGER,
  escalate_after_minutes INTEGER,
  notify_role TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_support_routing_rules TO authenticated;
GRANT ALL ON public.rbt_support_routing_rules TO service_role;
ALTER TABLE public.rbt_support_routing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "routing_read_admin" ON public.rbt_support_routing_rules
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'hr'::app_role) OR has_role(auth.uid(),'training_admin'::app_role) OR can_oversee_rbt());
CREATE POLICY "routing_write_admin" ON public.rbt_support_routing_rules
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'hr'::app_role) OR has_role(auth.uid(),'training_admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'hr'::app_role) OR has_role(auth.uid(),'training_admin'::app_role));
DROP TRIGGER IF EXISTS trg_rbt_support_routing_updated ON public.rbt_support_routing_rules;
CREATE TRIGGER trg_rbt_support_routing_updated
BEFORE UPDATE ON public.rbt_support_routing_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default routing rules
INSERT INTO public.rbt_support_routing_rules
  (name, priority, match_category, match_urgency, route_to_role, sla_minutes_override, escalate_after_minutes, notify_role, route_to_assigned_bcba, route_to_rbt_support_rep) VALUES
  ('Urgent safety → Safety Lead + Ops', 1, 'safety_concern', 'urgent', 'safety_lead', 30, 15, ARRAY['admin','hr','operations'], false, false),
  ('Incident → Safety Lead + Ops',       2, 'incident',       'urgent', 'safety_lead', 30, 15, ARRAY['admin','hr','operations'], false, false),
  ('Clinical guidance → Assigned BCBA', 10, 'clinical_guidance', NULL, 'bcba', 480, 240, ARRAY['bcba_lead'], true, false),
  ('BCBA concern → RBT Support Rep',    20, 'bcba_support_concern', NULL, 'rbt_support', 480, 240, ARRAY['hr','operations'], false, true),
  ('Case fit → RBT Support Rep',        21, 'case_fit_concern', NULL, 'rbt_support', 480, NULL, ARRAY['operations'], false, true),
  ('Scheduling → Scheduling team',      30, 'scheduling_issue', NULL, 'scheduling', 240, NULL, ARRAY['scheduling'], false, false),
  ('Unable to attend → Scheduling',     31, 'unable_to_attend', NULL, 'scheduling', 60, NULL, ARRAY['scheduling','bcba_lead'], false, false),
  ('Client concern → Assigned BCBA',    40, 'client_caregiver_concern', NULL, 'bcba', 240, NULL, ARRAY['bcba_lead'], true, false),
  ('CentralReach → IT',                 50, 'centralreach_access', NULL, 'it', 240, NULL, ARRAY['admin'], false, false),
  ('Payroll → Payroll team',            60, 'payroll_hours', NULL, 'payroll', 1440, NULL, ARRAY['hr'], false, false),
  ('Training → Training Admin',         70, 'training_question', NULL, 'training_admin', 1440, NULL, ARRAY['training_admin'], false, false),
  ('Certification → HR',                80, 'certification_question', NULL, 'hr', 1440, NULL, ARRAY['hr'], false, false),
  ('Equipment → Operations',            90, 'equipment_supplies', NULL, 'operations', 1440, NULL, ARRAY['operations'], false, false),
  ('Fellowship → Fellowship Admin',    100, 'fellowship_question', NULL, 'fellowship_admin', 1440, NULL, ARRAY['admin'], false, false),
  ('Other → RBT Support Rep',          999, 'other', NULL, 'rbt_support', 1440, NULL, ARRAY['operations'], false, true)
ON CONFLICT DO NOTHING;

-- 4. Ticket updates (messages / status changes visible to employee)
CREATE TABLE IF NOT EXISTS public.rbt_support_ticket_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.rbt_help_requests(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  update_type TEXT NOT NULL DEFAULT 'message', -- message | status_change | assignment | escalation | resolution | system
  body TEXT,
  from_status TEXT,
  to_status TEXT,
  visible_to_employee BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rbt_support_updates_ticket_idx ON public.rbt_support_ticket_updates (ticket_id, created_at DESC);
GRANT SELECT, INSERT ON public.rbt_support_ticket_updates TO authenticated;
GRANT ALL ON public.rbt_support_ticket_updates TO service_role;
ALTER TABLE public.rbt_support_ticket_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "updates_read" ON public.rbt_support_ticket_updates FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rbt_help_requests t
      WHERE t.id = ticket_id
        AND (
          (is_employee_self(t.rbt_employee_id) AND visible_to_employee)
          OR can_oversee_rbt()
          OR has_role(auth.uid(),'admin'::app_role)
          OR has_role(auth.uid(),'hr'::app_role)
        )
    )
  );
CREATE POLICY "updates_insert" ON public.rbt_support_ticket_updates FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rbt_help_requests t
      WHERE t.id = ticket_id
        AND (is_employee_self(t.rbt_employee_id) OR can_oversee_rbt() OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'hr'::app_role))
    )
  );

-- 5. Ticket audit log (immutable, comprehensive)
CREATE TABLE IF NOT EXISTS public.rbt_support_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.rbt_help_requests(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- created | routed | reassigned | status_changed | escalated | resolved | closed | reopened | satisfaction_submitted | attachment_added | note_added | sla_breached
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rbt_support_audit_ticket_idx ON public.rbt_support_audit (ticket_id, created_at DESC);
GRANT SELECT, INSERT ON public.rbt_support_audit TO authenticated;
GRANT ALL ON public.rbt_support_audit TO service_role;
ALTER TABLE public.rbt_support_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_read" ON public.rbt_support_audit FOR SELECT TO authenticated
  USING (
    can_oversee_rbt() OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'hr'::app_role)
    OR EXISTS (SELECT 1 FROM public.rbt_help_requests t WHERE t.id = ticket_id AND is_employee_self(t.rbt_employee_id))
  );
CREATE POLICY "audit_insert" ON public.rbt_support_audit FOR INSERT TO authenticated WITH CHECK (true);

-- 6. Support team contacts (configurable per employee / state / fallback)
CREATE TABLE IF NOT EXISTS public.rbt_support_team_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL DEFAULT 'default', -- default | state | employee
  scope_state TEXT,
  scope_employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  role_key TEXT NOT NULL, -- bcba | rbt_support | scheduling | training | state_clinic
  contact_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_support_team_contacts TO authenticated;
GRANT ALL ON public.rbt_support_team_contacts TO service_role;
ALTER TABLE public.rbt_support_team_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_contacts_read" ON public.rbt_support_team_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "team_contacts_write_admin" ON public.rbt_support_team_contacts FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'hr'::app_role) OR has_role(auth.uid(),'training_admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'hr'::app_role) OR has_role(auth.uid(),'training_admin'::app_role));
DROP TRIGGER IF EXISTS trg_rbt_support_contacts_updated ON public.rbt_support_team_contacts;
CREATE TRIGGER trg_rbt_support_contacts_updated
BEFORE UPDATE ON public.rbt_support_team_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Ticket creation trigger: apply routing rule + create audit
CREATE OR REPLACE FUNCTION public.rbt_support_apply_routing()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_rule public.rbt_support_routing_rules%ROWTYPE;
  v_hour INTEGER;
  v_tod  TEXT;
BEGIN
  v_hour := EXTRACT(hour FROM (now() AT TIME ZONE 'America/New_York'))::INTEGER;
  v_tod := CASE WHEN v_hour BETWEEN 8 AND 17 THEN 'business_hours' ELSE 'after_hours' END;

  SELECT * INTO v_rule
  FROM public.rbt_support_routing_rules
  WHERE active
    AND (match_category IS NULL OR match_category = NEW.category)
    AND (match_subcategory IS NULL OR match_subcategory = NEW.subcategory)
    AND (match_state IS NULL OR match_state = NEW.state)
    AND (match_service_setting IS NULL OR match_service_setting = NEW.service_setting)
    AND (match_urgency IS NULL OR match_urgency = NEW.urgency)
    AND (match_escalation_min IS NULL OR match_escalation_min <= NEW.escalation_level)
    AND (match_time_of_day IS NULL OR match_time_of_day IN ('any', v_tod))
    AND (match_has_client IS NULL OR match_has_client = (NEW.related_client_id IS NOT NULL))
    AND (match_has_bcba   IS NULL OR match_has_bcba   = (NEW.assigned_bcba_id IS NOT NULL))
  ORDER BY priority ASC, created_at ASC
  LIMIT 1;

  IF v_rule.id IS NOT NULL THEN
    NEW.routing_rule_id := v_rule.id;
    NEW.routed_to_role := COALESCE(NEW.routed_to_role, v_rule.route_to_role);
    IF v_rule.route_to_assigned_bcba AND NEW.assigned_bcba_id IS NOT NULL THEN
      NEW.routed_to_employee_id := COALESCE(NEW.routed_to_employee_id, NEW.assigned_bcba_id);
    ELSIF v_rule.route_to_employee_id IS NOT NULL THEN
      NEW.routed_to_employee_id := COALESCE(NEW.routed_to_employee_id, v_rule.route_to_employee_id);
    END IF;
    IF v_rule.sla_minutes_override IS NOT NULL THEN
      NEW.sla_minutes := COALESCE(NEW.sla_minutes, v_rule.sla_minutes_override);
      NEW.due_at := COALESCE(NEW.due_at, now() + make_interval(mins => v_rule.sla_minutes_override));
    END IF;
    NEW.routed_at := now();
  END IF;

  IF NEW.status IS NULL OR NEW.status = 'open' THEN
    NEW.status := 'submitted';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_rbt_support_apply_routing ON public.rbt_help_requests;
CREATE TRIGGER trg_rbt_support_apply_routing
BEFORE INSERT ON public.rbt_help_requests
FOR EACH ROW EXECUTE FUNCTION public.rbt_support_apply_routing();

-- Post-insert: audit + first update
CREATE OR REPLACE FUNCTION public.rbt_support_after_insert()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  INSERT INTO public.rbt_support_audit (ticket_id, actor_id, action, detail)
  VALUES (NEW.id, auth.uid(), 'created', jsonb_build_object(
    'category', NEW.category, 'urgency', NEW.urgency, 'is_urgent_safety', NEW.is_urgent_safety
  ));
  IF NEW.routing_rule_id IS NOT NULL THEN
    INSERT INTO public.rbt_support_audit (ticket_id, actor_id, action, detail)
    VALUES (NEW.id, auth.uid(), 'routed', jsonb_build_object(
      'rule_id', NEW.routing_rule_id, 'role', NEW.routed_to_role, 'employee_id', NEW.routed_to_employee_id
    ));
  END IF;
  INSERT INTO public.rbt_support_ticket_updates (ticket_id, author_id, update_type, body, to_status, visible_to_employee)
  VALUES (NEW.id, auth.uid(), 'system', 'Support request received. A teammate will follow up.', NEW.status, true);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_rbt_support_after_insert ON public.rbt_help_requests;
CREATE TRIGGER trg_rbt_support_after_insert
AFTER INSERT ON public.rbt_help_requests
FOR EACH ROW EXECUTE FUNCTION public.rbt_support_after_insert();

-- Update audit on status/assignment/escalation/resolution changes
CREATE OR REPLACE FUNCTION public.rbt_support_after_update()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.rbt_support_audit (ticket_id, actor_id, action, detail)
    VALUES (NEW.id, auth.uid(), 'status_changed', jsonb_build_object('from', OLD.status, 'to', NEW.status));
    INSERT INTO public.rbt_support_ticket_updates (ticket_id, author_id, update_type, from_status, to_status, visible_to_employee)
    VALUES (NEW.id, auth.uid(), 'status_change', OLD.status, NEW.status, true);
    IF NEW.status = 'resolved' AND NEW.resolved_at IS NULL THEN NEW.resolved_at := now(); END IF;
  END IF;
  IF NEW.routed_to_employee_id IS DISTINCT FROM OLD.routed_to_employee_id THEN
    INSERT INTO public.rbt_support_audit (ticket_id, actor_id, action, detail)
    VALUES (NEW.id, auth.uid(), 'reassigned', jsonb_build_object('from', OLD.routed_to_employee_id, 'to', NEW.routed_to_employee_id));
  END IF;
  IF NEW.escalation_level IS DISTINCT FROM OLD.escalation_level AND NEW.escalation_level > COALESCE(OLD.escalation_level,0) THEN
    NEW.escalated_at := now();
    INSERT INTO public.rbt_support_audit (ticket_id, actor_id, action, detail)
    VALUES (NEW.id, auth.uid(), 'escalated', jsonb_build_object('level', NEW.escalation_level));
  END IF;
  IF NEW.satisfaction_rating IS DISTINCT FROM OLD.satisfaction_rating AND NEW.satisfaction_rating IS NOT NULL THEN
    NEW.satisfaction_at := now();
    INSERT INTO public.rbt_support_audit (ticket_id, actor_id, action, detail)
    VALUES (NEW.id, auth.uid(), 'satisfaction_submitted', jsonb_build_object('rating', NEW.satisfaction_rating));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_rbt_support_after_update ON public.rbt_help_requests;
CREATE TRIGGER trg_rbt_support_after_update
BEFORE UPDATE ON public.rbt_help_requests
FOR EACH ROW EXECUTE FUNCTION public.rbt_support_after_update();
