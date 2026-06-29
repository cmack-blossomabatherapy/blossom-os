
-- ============================================================================
-- Helper access functions
-- ============================================================================
CREATE OR REPLACE FUNCTION public.has_credentialing_write_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin','super_admin','systems_admin','credentialing_lead')
  );
$$;

CREATE OR REPLACE FUNCTION public.has_credentialing_read_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_credentialing_write_access(_user_id)
      OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN (
        'executive','exec','executive_leadership','operations_leadership','coo',
        'director_of_operations','operations_manager','ops_manager',
        'state_director','assistant_state_director',
        'qa','qa_director','qa_specialist',
        'authorization_coordinator','authorization_manager','auth_team',
        'hr','hr_admin','hr_lead','hr_manager','bcba','clinical_lead'
      )
  );
$$;

-- updated_at trigger helper (idempotent)
CREATE OR REPLACE FUNCTION public.cred_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- credentialing_providers
-- ============================================================================
CREATE TABLE public.credentialing_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid,
  provider_name text NOT NULL,
  provider_type text NOT NULL DEFAULT 'BCBA',
  email text,
  phone text,
  npi text,
  caqh_id text,
  license_number text,
  license_state text,
  license_expiration_date date,
  centralreach_provider_id text,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credentialing_providers TO authenticated;
GRANT ALL ON public.credentialing_providers TO service_role;
ALTER TABLE public.credentialing_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY cred_providers_read ON public.credentialing_providers FOR SELECT
  TO authenticated USING (public.has_credentialing_read_access(auth.uid()));
CREATE POLICY cred_providers_write ON public.credentialing_providers FOR ALL
  TO authenticated USING (public.has_credentialing_write_access(auth.uid()))
  WITH CHECK (public.has_credentialing_write_access(auth.uid()));
CREATE TRIGGER trg_cred_providers_updated BEFORE UPDATE ON public.credentialing_providers
  FOR EACH ROW EXECUTE FUNCTION public.cred_set_updated_at();
CREATE INDEX idx_cred_providers_active ON public.credentialing_providers(active);
CREATE INDEX idx_cred_providers_type ON public.credentialing_providers(provider_type);
CREATE INDEX idx_cred_providers_state ON public.credentialing_providers(license_state);

-- ============================================================================
-- credentialing_records
-- ============================================================================
CREATE TABLE public.credentialing_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.credentialing_providers(id) ON DELETE CASCADE,
  payer_name text NOT NULL,
  state text,
  plan_type text,
  credentialing_type text NOT NULL DEFAULT 'Initial',
  status text NOT NULL DEFAULT 'Not Started',
  priority text NOT NULL DEFAULT 'Normal',
  owner_id uuid,
  submitted_date date,
  approved_date date,
  effective_date date,
  expiration_date date,
  reattestation_due_date date,
  next_follow_up_date date,
  last_follow_up_date date,
  missing_items text[] NOT NULL DEFAULT '{}',
  blocker_reason text,
  payer_reference_number text,
  source_system text,
  legacy_monday_raw_id uuid,
  centralreach_sync_status text NOT NULL DEFAULT 'Not Connected',
  centralreach_external_id text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credentialing_records TO authenticated;
GRANT ALL ON public.credentialing_records TO service_role;
ALTER TABLE public.credentialing_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY cred_records_read ON public.credentialing_records FOR SELECT
  TO authenticated USING (public.has_credentialing_read_access(auth.uid()));
CREATE POLICY cred_records_write ON public.credentialing_records FOR ALL
  TO authenticated USING (public.has_credentialing_write_access(auth.uid()))
  WITH CHECK (public.has_credentialing_write_access(auth.uid()));
CREATE TRIGGER trg_cred_records_updated BEFORE UPDATE ON public.credentialing_records
  FOR EACH ROW EXECUTE FUNCTION public.cred_set_updated_at();
CREATE INDEX idx_cred_records_provider ON public.credentialing_records(provider_id);
CREATE INDEX idx_cred_records_status ON public.credentialing_records(status);
CREATE INDEX idx_cred_records_state ON public.credentialing_records(state);
CREATE INDEX idx_cred_records_payer ON public.credentialing_records(payer_name);
CREATE INDEX idx_cred_records_expiration ON public.credentialing_records(expiration_date);
CREATE INDEX idx_cred_records_follow_up ON public.credentialing_records(next_follow_up_date);

-- ============================================================================
-- credentialing_documents
-- ============================================================================
CREATE TABLE public.credentialing_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.credentialing_providers(id) ON DELETE CASCADE,
  credentialing_record_id uuid REFERENCES public.credentialing_records(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_name text,
  storage_path text,
  verification_status text NOT NULL DEFAULT 'Needed',
  expiration_date date,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credentialing_documents TO authenticated;
GRANT ALL ON public.credentialing_documents TO service_role;
ALTER TABLE public.credentialing_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY cred_docs_read ON public.credentialing_documents FOR SELECT
  TO authenticated USING (public.has_credentialing_read_access(auth.uid()));
CREATE POLICY cred_docs_write ON public.credentialing_documents FOR ALL
  TO authenticated USING (public.has_credentialing_write_access(auth.uid()))
  WITH CHECK (public.has_credentialing_write_access(auth.uid()));
CREATE INDEX idx_cred_docs_provider ON public.credentialing_documents(provider_id);
CREATE INDEX idx_cred_docs_record ON public.credentialing_documents(credentialing_record_id);

-- ============================================================================
-- credentialing_activity
-- ============================================================================
CREATE TABLE public.credentialing_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credentialing_record_id uuid NOT NULL REFERENCES public.credentialing_records(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  message text,
  old_status text,
  new_status text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.credentialing_activity TO authenticated;
GRANT ALL ON public.credentialing_activity TO service_role;
ALTER TABLE public.credentialing_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY cred_activity_read ON public.credentialing_activity FOR SELECT
  TO authenticated USING (public.has_credentialing_read_access(auth.uid()));
CREATE POLICY cred_activity_insert ON public.credentialing_activity FOR INSERT
  TO authenticated WITH CHECK (public.has_credentialing_write_access(auth.uid()));
CREATE INDEX idx_cred_activity_record ON public.credentialing_activity(credentialing_record_id, created_at DESC);

-- ============================================================================
-- credentialing_tasks
-- ============================================================================
CREATE TABLE public.credentialing_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credentialing_record_id uuid REFERENCES public.credentialing_records(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  owner_id uuid,
  due_date date,
  status text NOT NULL DEFAULT 'Open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credentialing_tasks TO authenticated;
GRANT ALL ON public.credentialing_tasks TO service_role;
ALTER TABLE public.credentialing_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY cred_tasks_read ON public.credentialing_tasks FOR SELECT
  TO authenticated USING (public.has_credentialing_read_access(auth.uid()));
CREATE POLICY cred_tasks_write ON public.credentialing_tasks FOR ALL
  TO authenticated USING (public.has_credentialing_write_access(auth.uid()))
  WITH CHECK (public.has_credentialing_write_access(auth.uid()));
CREATE TRIGGER trg_cred_tasks_updated BEFORE UPDATE ON public.credentialing_tasks
  FOR EACH ROW EXECUTE FUNCTION public.cred_set_updated_at();
CREATE INDEX idx_cred_tasks_record ON public.credentialing_tasks(credentialing_record_id);
CREATE INDEX idx_cred_tasks_due ON public.credentialing_tasks(due_date);

-- ============================================================================
-- Status change logging trigger on credentialing_records
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_credentialing_status_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.credentialing_activity (credentialing_record_id, activity_type, message, new_status, actor_id)
    VALUES (NEW.id, 'created', 'Credentialing record created', NEW.status, NEW.created_by);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.credentialing_activity (credentialing_record_id, activity_type, message, old_status, new_status, actor_id)
    VALUES (NEW.id, 'status_change', 'Status changed', OLD.status, NEW.status, NEW.updated_by);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cred_records_log_status
AFTER INSERT OR UPDATE OF status ON public.credentialing_records
FOR EACH ROW EXECUTE FUNCTION public.log_credentialing_status_change();
