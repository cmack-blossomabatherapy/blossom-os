-- Authorizations operational layer (pass 1)

-- 1. authorization_operational_records
CREATE TABLE IF NOT EXISTS public.authorization_operational_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system text NOT NULL DEFAULT 'manual' CHECK (source_system IN ('monday','centralreach','manual')),
  source_id text,
  centralreach_authorization_id text,
  centralreach_client_id text,
  monday_item_id text,
  client_id text,
  client_name text,
  state text,
  payer text,
  secondary_payer text,
  auth_type text,
  service_code text,
  authorization_number text,
  tracking_number text,
  status text,
  workflow_stage text,
  priority text,
  assigned_owner text,
  assigned_auth_coordinator uuid,
  assigned_bcba text,
  qa_owner text,
  submitted_under text,
  received_date date,
  submitted_date date,
  approved_date date,
  denied_date date,
  start_date date,
  expiration_date date,
  authorized_units numeric,
  authorized_hours numeric,
  used_units numeric,
  used_hours numeric,
  remaining_units numeric,
  remaining_hours numeric,
  utilization_percent numeric,
  denial_reason text,
  appeal_due_date date,
  resubmitted_date date,
  missing_info text,
  next_action text,
  next_action_due_date date,
  centralreach_sync_status text DEFAULT 'not_configured',
  centralreach_last_synced_at timestamptz,
  centralreach_payload jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.authorization_operational_records TO authenticated;
GRANT ALL ON public.authorization_operational_records TO service_role;
ALTER TABLE public.authorization_operational_records ENABLE ROW LEVEL SECURITY;

-- 2. authorization_requirements
CREATE TABLE IF NOT EXISTS public.authorization_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  authorization_id uuid REFERENCES public.authorization_operational_records(id) ON DELETE CASCADE,
  client_name text,
  state text,
  payer text,
  requirement_type text,
  requirement_name text NOT NULL,
  owner_department text,
  owner_user text,
  status text NOT NULL DEFAULT 'Needed' CHECK (status IN ('Needed','Requested','Received','Waived','Not Applicable')),
  requested_at timestamptz,
  received_at timestamptz,
  due_date date,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.authorization_requirements TO authenticated;
GRANT ALL ON public.authorization_requirements TO service_role;
ALTER TABLE public.authorization_requirements ENABLE ROW LEVEL SECURITY;

-- 3. authorization_activity
CREATE TABLE IF NOT EXISTS public.authorization_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  authorization_id uuid REFERENCES public.authorization_operational_records(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  title text,
  body text,
  old_value text,
  new_value text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.authorization_activity TO authenticated;
GRANT ALL ON public.authorization_activity TO service_role;
ALTER TABLE public.authorization_activity ENABLE ROW LEVEL SECURITY;

-- 4. authorization_tasks
CREATE TABLE IF NOT EXISTS public.authorization_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  authorization_id uuid REFERENCES public.authorization_operational_records(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  owner_user text,
  owner_department text,
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','In Progress','Waiting','Complete','Canceled')),
  priority text,
  due_date date,
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.authorization_tasks TO authenticated;
GRANT ALL ON public.authorization_tasks TO service_role;
ALTER TABLE public.authorization_tasks ENABLE ROW LEVEL SECURITY;

-- 5. payer_requirements
CREATE TABLE IF NOT EXISTS public.payer_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payer text NOT NULL,
  state text,
  auth_requirements text,
  document_requirements text,
  reassessment_rules text,
  parent_signature_rules text,
  submission_portal text,
  payer_contact text,
  phone text,
  email text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payer_requirements TO authenticated;
GRANT ALL ON public.payer_requirements TO service_role;
ALTER TABLE public.payer_requirements ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_auth_op_updated_at ON public.authorization_operational_records;
CREATE TRIGGER trg_auth_op_updated_at BEFORE UPDATE ON public.authorization_operational_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_auth_req_updated_at ON public.authorization_requirements;
CREATE TRIGGER trg_auth_req_updated_at BEFORE UPDATE ON public.authorization_requirements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_auth_task_updated_at ON public.authorization_tasks;
CREATE TRIGGER trg_auth_task_updated_at BEFORE UPDATE ON public.authorization_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_payer_req_updated_at ON public.payer_requirements;
CREATE TRIGGER trg_payer_req_updated_at BEFORE UPDATE ON public.payer_requirements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Access helpers
CREATE OR REPLACE FUNCTION public.has_authorization_write_access(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role::text IN (
        'admin','super_admin','systems_admin',
        'auth_team','authorization_manager','authorization_coordinator',
        'exec','executive','coo','ops_manager','director_of_operations','operations_manager'
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.has_authorization_read_access(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_authorization_write_access(_user_id) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role::text IN (
        'state_director','assistant_state_director',
        'qa','qa_team','qa_director','qa_specialist',
        'bcba','case_manager'
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_authorization_write_access(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_authorization_read_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_authorization_write_access(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_authorization_read_access(uuid) TO authenticated, service_role;

-- RLS policies
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'authorization_operational_records',
    'authorization_requirements',
    'authorization_activity',
    'authorization_tasks',
    'payer_requirements'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "auth_read_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "auth_write_%s" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "auth_read_%s" ON public.%I FOR SELECT TO authenticated USING (public.has_authorization_read_access(auth.uid()))',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "auth_write_%s" ON public.%I FOR ALL TO authenticated USING (public.has_authorization_write_access(auth.uid())) WITH CHECK (public.has_authorization_write_access(auth.uid()))',
      t, t
    );
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_auth_op_expiration ON public.authorization_operational_records(expiration_date);
CREATE INDEX IF NOT EXISTS idx_auth_op_status ON public.authorization_operational_records(status);
CREATE INDEX IF NOT EXISTS idx_auth_op_payer ON public.authorization_operational_records(payer);
CREATE INDEX IF NOT EXISTS idx_auth_req_auth_id ON public.authorization_requirements(authorization_id);
CREATE INDEX IF NOT EXISTS idx_auth_req_status ON public.authorization_requirements(status);
CREATE INDEX IF NOT EXISTS idx_auth_act_auth_id ON public.authorization_activity(authorization_id);
CREATE INDEX IF NOT EXISTS idx_auth_task_auth_id ON public.authorization_tasks(authorization_id);
CREATE INDEX IF NOT EXISTS idx_payer_req_payer_state ON public.payer_requirements(payer, state);