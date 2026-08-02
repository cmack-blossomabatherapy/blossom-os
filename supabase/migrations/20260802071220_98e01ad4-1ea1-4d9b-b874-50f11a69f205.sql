
-- ============ CentralReach Data Hub: normalized data model ============

CREATE OR REPLACE FUNCTION public.cr_hub_can_manage()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'super_admin'::app_role)
      OR public.has_role(auth.uid(), 'systems_admin'::app_role);
$$;

CREATE TABLE public.cr_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_hash text NOT NULL,
  export_type text NOT NULL,
  row_count integer NOT NULL DEFAULT 0,
  deduped_row_count integer,
  coverage_start date,
  coverage_end date,
  uploaded_by uuid,
  status text NOT NULL DEFAULT 'pending',
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cr_import_batches_type_active_idx ON public.cr_import_batches(export_type, is_active);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_import_batches TO authenticated;
GRANT ALL ON public.cr_import_batches TO service_role;
ALTER TABLE public.cr_import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_import_batches_read" ON public.cr_import_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "cr_import_batches_manage" ON public.cr_import_batches FOR ALL TO authenticated
  USING (public.cr_hub_can_manage()) WITH CHECK (public.cr_hub_can_manage());

CREATE TABLE public.cr_raw_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.cr_import_batches(id) ON DELETE CASCADE,
  export_type text NOT NULL,
  cr_row_id text,
  row_hash text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX cr_raw_rows_batch_identity_idx ON public.cr_raw_rows(batch_id, row_hash);
CREATE INDEX cr_raw_rows_type_idx ON public.cr_raw_rows(export_type);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_raw_rows TO authenticated;
GRANT ALL ON public.cr_raw_rows TO service_role;
ALTER TABLE public.cr_raw_rows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_raw_rows_read" ON public.cr_raw_rows FOR SELECT TO authenticated USING (true);
CREATE POLICY "cr_raw_rows_manage" ON public.cr_raw_rows FOR ALL TO authenticated
  USING (public.cr_hub_can_manage()) WITH CHECK (public.cr_hub_can_manage());

CREATE TABLE public.cr_billing_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.cr_import_batches(id) ON DELETE CASCADE,
  row_hash text NOT NULL,
  date_of_service date,
  procedure_code text,
  hours numeric,
  client_name text,
  client_cr_id text,
  rendering_provider_name text,
  rendering_provider_cr_id text,
  provider_contact_labels text,
  payor text,
  state text,
  location text,
  status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX cr_billing_sessions_identity_idx ON public.cr_billing_sessions(batch_id, row_hash);
CREATE INDEX cr_billing_sessions_dos_idx ON public.cr_billing_sessions(date_of_service);
CREATE INDEX cr_billing_sessions_code_idx ON public.cr_billing_sessions(procedure_code);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_billing_sessions TO authenticated;
GRANT ALL ON public.cr_billing_sessions TO service_role;
ALTER TABLE public.cr_billing_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_billing_sessions_read" ON public.cr_billing_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "cr_billing_sessions_manage" ON public.cr_billing_sessions FOR ALL TO authenticated
  USING (public.cr_hub_can_manage()) WITH CHECK (public.cr_hub_can_manage());

CREATE TABLE public.cr_schedule_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.cr_import_batches(id) ON DELETE CASCADE,
  row_hash text NOT NULL,
  event_date date,
  procedure_code text,
  scheduled_hours numeric,
  client_name text,
  provider_name text,
  status text,
  cancellation_reason text,
  cancelled_by text,
  state text,
  location text,
  payor text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX cr_schedule_events_identity_idx ON public.cr_schedule_events(batch_id, row_hash);
CREATE INDEX cr_schedule_events_date_idx ON public.cr_schedule_events(event_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_schedule_events TO authenticated;
GRANT ALL ON public.cr_schedule_events TO service_role;
ALTER TABLE public.cr_schedule_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_schedule_events_read" ON public.cr_schedule_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "cr_schedule_events_manage" ON public.cr_schedule_events FOR ALL TO authenticated
  USING (public.cr_hub_can_manage()) WITH CHECK (public.cr_hub_can_manage());

CREATE TABLE public.cr_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.cr_import_batches(id) ON DELETE CASCADE,
  row_hash text NOT NULL,
  authorization_number text,
  client_name text,
  client_cr_id text,
  payor text,
  state text,
  procedure_code text,
  start_date date,
  end_date date,
  authorized_hours numeric,
  worked_hours numeric,
  remaining_hours numeric,
  status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX cr_authorizations_identity_idx ON public.cr_authorizations(batch_id, row_hash);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_authorizations TO authenticated;
GRANT ALL ON public.cr_authorizations TO service_role;
ALTER TABLE public.cr_authorizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_authorizations_read" ON public.cr_authorizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "cr_authorizations_manage" ON public.cr_authorizations FOR ALL TO authenticated
  USING (public.cr_hub_can_manage()) WITH CHECK (public.cr_hub_can_manage());

CREATE TABLE public.cr_authorization_utilization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.cr_import_batches(id) ON DELETE CASCADE,
  row_hash text NOT NULL,
  authorization_number text,
  client_name text,
  payor text,
  state text,
  procedure_code text,
  week_start date,
  week_end date,
  authorized_hours numeric,
  used_hours numeric,
  utilization_percent numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX cr_auth_utilization_identity_idx ON public.cr_authorization_utilization(batch_id, row_hash);
CREATE INDEX cr_auth_utilization_week_idx ON public.cr_authorization_utilization(week_start);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_authorization_utilization TO authenticated;
GRANT ALL ON public.cr_authorization_utilization TO service_role;
ALTER TABLE public.cr_authorization_utilization ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_auth_util_read" ON public.cr_authorization_utilization FOR SELECT TO authenticated USING (true);
CREATE POLICY "cr_auth_util_manage" ON public.cr_authorization_utilization FOR ALL TO authenticated
  USING (public.cr_hub_can_manage()) WITH CHECK (public.cr_hub_can_manage());

CREATE TABLE public.cr_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.cr_import_batches(id) ON DELETE CASCADE,
  row_hash text NOT NULL,
  claim_number text,
  client_name text,
  payor text,
  state text,
  date_of_service date,
  procedure_code text,
  billed_amount numeric,
  paid_amount numeric,
  status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX cr_claims_identity_idx ON public.cr_claims(batch_id, row_hash);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_claims TO authenticated;
GRANT ALL ON public.cr_claims TO service_role;
ALTER TABLE public.cr_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_claims_read" ON public.cr_claims FOR SELECT TO authenticated USING (true);
CREATE POLICY "cr_claims_manage" ON public.cr_claims FOR ALL TO authenticated
  USING (public.cr_hub_can_manage()) WITH CHECK (public.cr_hub_can_manage());

CREATE TABLE public.cr_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.cr_import_batches(id) ON DELETE CASCADE,
  row_hash text NOT NULL,
  cr_contact_id text,
  contact_name text,
  contact_type text,
  labels text,
  state text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX cr_contacts_identity_idx ON public.cr_contacts(batch_id, row_hash);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_contacts TO authenticated;
GRANT ALL ON public.cr_contacts TO service_role;
ALTER TABLE public.cr_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_contacts_read" ON public.cr_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "cr_contacts_manage" ON public.cr_contacts FOR ALL TO authenticated
  USING (public.cr_hub_can_manage()) WITH CHECK (public.cr_hub_can_manage());

CREATE TABLE public.cr_patient_match_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cr_client_name text NOT NULL,
  cr_client_id text,
  client_id uuid,
  match_status text NOT NULL DEFAULT 'unmatched',
  match_method text,
  confidence numeric,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX cr_patient_match_links_key_idx ON public.cr_patient_match_links(lower(cr_client_name), coalesce(cr_client_id,''));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_patient_match_links TO authenticated;
GRANT ALL ON public.cr_patient_match_links TO service_role;
ALTER TABLE public.cr_patient_match_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_patient_links_read" ON public.cr_patient_match_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "cr_patient_links_manage" ON public.cr_patient_match_links FOR ALL TO authenticated
  USING (public.cr_hub_can_manage()) WITH CHECK (public.cr_hub_can_manage());

CREATE TABLE public.cr_provider_match_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cr_provider_name text NOT NULL,
  cr_provider_id text,
  employee_id uuid,
  credential text,
  match_status text NOT NULL DEFAULT 'unmatched',
  match_method text,
  confidence numeric,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX cr_provider_match_links_key_idx ON public.cr_provider_match_links(lower(cr_provider_name), coalesce(cr_provider_id,''));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_provider_match_links TO authenticated;
GRANT ALL ON public.cr_provider_match_links TO service_role;
ALTER TABLE public.cr_provider_match_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_provider_links_read" ON public.cr_provider_match_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "cr_provider_links_manage" ON public.cr_provider_match_links FOR ALL TO authenticated
  USING (public.cr_hub_can_manage()) WITH CHECK (public.cr_hub_can_manage());

CREATE TABLE public.cr_client_provider_crosswalk (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  provider_name text NOT NULL,
  provider_role text,
  first_seen date,
  last_seen date,
  session_count integer NOT NULL DEFAULT 0,
  total_hours numeric NOT NULL DEFAULT 0,
  state text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX cr_crosswalk_key_idx ON public.cr_client_provider_crosswalk(lower(client_name), lower(provider_name), coalesce(provider_role,''));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_client_provider_crosswalk TO authenticated;
GRANT ALL ON public.cr_client_provider_crosswalk TO service_role;
ALTER TABLE public.cr_client_provider_crosswalk ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_crosswalk_read" ON public.cr_client_provider_crosswalk FOR SELECT TO authenticated USING (true);
CREATE POLICY "cr_crosswalk_manage" ON public.cr_client_provider_crosswalk FOR ALL TO authenticated
  USING (public.cr_hub_can_manage()) WITH CHECK (public.cr_hub_can_manage());

CREATE TABLE public.cr_bcba_ownership_inferred (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  month_start date NOT NULL,
  bcba_name text NOT NULL,
  effective_start date NOT NULL,
  effective_end date,
  anchor_count integer NOT NULL DEFAULT 0,
  carried_forward boolean NOT NULL DEFAULT false,
  state text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cr_bcba_ownership_client_month_idx ON public.cr_bcba_ownership_inferred(lower(client_name), month_start);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_bcba_ownership_inferred TO authenticated;
GRANT ALL ON public.cr_bcba_ownership_inferred TO service_role;
ALTER TABLE public.cr_bcba_ownership_inferred ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_ownership_read" ON public.cr_bcba_ownership_inferred FOR SELECT TO authenticated USING (true);
CREATE POLICY "cr_ownership_manage" ON public.cr_bcba_ownership_inferred FOR ALL TO authenticated
  USING (public.cr_hub_can_manage()) WITH CHECK (public.cr_hub_can_manage());

CREATE TABLE public.cr_report_data_freshness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_key text NOT NULL UNIQUE,
  export_type text,
  last_batch_id uuid REFERENCES public.cr_import_batches(id) ON DELETE SET NULL,
  last_uploaded_at timestamptz,
  coverage_start date,
  coverage_end date,
  row_count integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_report_data_freshness TO authenticated;
GRANT ALL ON public.cr_report_data_freshness TO service_role;
ALTER TABLE public.cr_report_data_freshness ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_freshness_read" ON public.cr_report_data_freshness FOR SELECT TO authenticated USING (true);
CREATE POLICY "cr_freshness_manage" ON public.cr_report_data_freshness FOR ALL TO authenticated
  USING (public.cr_hub_can_manage()) WITH CHECK (public.cr_hub_can_manage());

CREATE TABLE public.cr_import_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text,
  tables jsonb NOT NULL DEFAULT '[]'::jsonb,
  row_count integer NOT NULL DEFAULT 0,
  snapshot jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_import_backups TO authenticated;
GRANT ALL ON public.cr_import_backups TO service_role;
ALTER TABLE public.cr_import_backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_import_backups_manage" ON public.cr_import_backups FOR ALL TO authenticated
  USING (public.cr_hub_can_manage()) WITH CHECK (public.cr_hub_can_manage());

-- touch triggers
CREATE OR REPLACE FUNCTION public.cr_hub_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER cr_import_batches_touch BEFORE UPDATE ON public.cr_import_batches
  FOR EACH ROW EXECUTE FUNCTION public.cr_hub_touch_updated_at();
CREATE TRIGGER cr_patient_links_touch BEFORE UPDATE ON public.cr_patient_match_links
  FOR EACH ROW EXECUTE FUNCTION public.cr_hub_touch_updated_at();
CREATE TRIGGER cr_provider_links_touch BEFORE UPDATE ON public.cr_provider_match_links
  FOR EACH ROW EXECUTE FUNCTION public.cr_hub_touch_updated_at();
CREATE TRIGGER cr_crosswalk_touch BEFORE UPDATE ON public.cr_client_provider_crosswalk
  FOR EACH ROW EXECUTE FUNCTION public.cr_hub_touch_updated_at();
CREATE TRIGGER cr_ownership_touch BEFORE UPDATE ON public.cr_bcba_ownership_inferred
  FOR EACH ROW EXECUTE FUNCTION public.cr_hub_touch_updated_at();

-- guarded reset of CR-derived report data only
CREATE OR REPLACE FUNCTION public.cr_reset_report_data(_confirmation text, _backup_label text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_backup_id uuid;
  v_rows integer := 0;
BEGIN
  IF NOT public.cr_hub_can_manage() THEN
    RAISE EXCEPTION 'Not authorized to reset CentralReach report data';
  END IF;
  IF _confirmation IS DISTINCT FROM 'RESET CENTRALREACH REPORT DATA' THEN
    RAISE EXCEPTION 'Confirmation phrase mismatch';
  END IF;

  SELECT (SELECT count(*) FROM public.cr_raw_rows)
       + (SELECT count(*) FROM public.cr_billing_sessions)
       + (SELECT count(*) FROM public.cr_schedule_events)
       + (SELECT count(*) FROM public.cr_authorizations)
       + (SELECT count(*) FROM public.cr_authorization_utilization)
       + (SELECT count(*) FROM public.cr_claims)
       + (SELECT count(*) FROM public.cr_contacts)
       + (SELECT count(*) FROM public.cr_bcba_ownership_inferred)
       + (SELECT count(*) FROM public.cr_import_batches)
    INTO v_rows;

  INSERT INTO public.cr_import_backups (label, tables, row_count, snapshot, created_by)
  VALUES (
    coalesce(_backup_label, 'cr-reset-' || to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS')),
    to_jsonb(ARRAY[
      'cr_raw_rows','cr_billing_sessions','cr_schedule_events','cr_authorizations',
      'cr_authorization_utilization','cr_claims','cr_contacts',
      'cr_bcba_ownership_inferred','cr_import_batches'
    ]),
    v_rows,
    (SELECT coalesce(jsonb_agg(to_jsonb(b)), '[]'::jsonb) FROM public.cr_import_batches b),
    auth.uid()
  )
  RETURNING id INTO v_backup_id;

  DELETE FROM public.cr_bcba_ownership_inferred;
  DELETE FROM public.cr_contacts;
  DELETE FROM public.cr_claims;
  DELETE FROM public.cr_authorization_utilization;
  DELETE FROM public.cr_authorizations;
  DELETE FROM public.cr_schedule_events;
  DELETE FROM public.cr_billing_sessions;
  DELETE FROM public.cr_raw_rows;
  DELETE FROM public.cr_import_batches;
  UPDATE public.cr_report_data_freshness
     SET last_batch_id = NULL, last_uploaded_at = NULL, row_count = 0, updated_at = now();

  RETURN v_backup_id;
END;
$$;

REVOKE ALL ON FUNCTION public.cr_reset_report_data(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.cr_reset_report_data(text, text) TO authenticated;
