
-- ============================================================
-- CentralReach Export Sync Center
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.cr_sync_type_key AS ENUM (
    'employees','clients','schedule','timesheets','authorizations'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.cr_run_status AS ENUM (
    'uploaded','validating','previewed','committing','committed','partial','rejected','rolled_back','failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.cr_freshness_level AS ENUM (
    'current','aging','stale','critical','no_data'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- cr_sync_types: registered import kinds + defaults
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cr_sync_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key public.cr_sync_type_key NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  external_id_field TEXT NOT NULL, -- canonical key name after mapping
  required_fields TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cr_sync_types TO authenticated;
GRANT ALL ON public.cr_sync_types TO service_role;
ALTER TABLE public.cr_sync_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_sync_types read" ON public.cr_sync_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "cr_sync_types admin write" ON public.cr_sync_types FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- ============================================================
-- cr_sync_templates: mapping templates
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cr_sync_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type_key public.cr_sync_type_key NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  -- header aliases -> canonical field name  (e.g. {"cr id":"external_id","first":"first_name"})
  column_map JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- canonical fields required for this template (in addition to type defaults)
  required_fields TEXT[] NOT NULL DEFAULT '{}',
  -- {"first_name":"string","dob":"date","start_at":"datetime"}
  field_types JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- header signatures used to auto-recognize this template (case-insensitive substring match)
  recognition_headers TEXT[] NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cr_tmpl_type ON public.cr_sync_templates(type_key, active);
GRANT SELECT ON public.cr_sync_templates TO authenticated;
GRANT ALL ON public.cr_sync_templates TO service_role;
ALTER TABLE public.cr_sync_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_tmpl read" ON public.cr_sync_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "cr_tmpl admin write" ON public.cr_sync_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operations_leadership') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operations_leadership') OR public.has_role(auth.uid(),'super_admin'));

-- ============================================================
-- cr_sync_runs: each import attempt
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cr_sync_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type_key public.cr_sync_type_key NOT NULL,
  template_id UUID REFERENCES public.cr_sync_templates(id) ON DELETE SET NULL,
  status public.cr_run_status NOT NULL DEFAULT 'uploaded',
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_sha256 TEXT NOT NULL,          -- fingerprint for idempotency
  storage_path TEXT,                   -- private bucket path
  storage_bucket TEXT DEFAULT 'cr-sync-source',
  row_count_total INT NOT NULL DEFAULT 0,
  rows_added INT NOT NULL DEFAULT 0,
  rows_updated INT NOT NULL DEFAULT 0,
  rows_rejected INT NOT NULL DEFAULT 0,
  rows_unchanged INT NOT NULL DEFAULT 0,
  preview JSONB,                       -- preview payload (sample rows, error summary)
  error_report_path TEXT,              -- storage path to CSV error report
  detected_headers TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  committed_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cr_runs_type ON public.cr_sync_runs(type_key, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ux_cr_runs_fingerprint_committed
  ON public.cr_sync_runs(type_key, file_sha256)
  WHERE status IN ('committed','partial');
GRANT SELECT, INSERT, UPDATE ON public.cr_sync_runs TO authenticated;
GRANT ALL ON public.cr_sync_runs TO service_role;
ALTER TABLE public.cr_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_runs admin read" ON public.cr_sync_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operations_leadership') OR public.has_role(auth.uid(),'super_admin') OR uploaded_by = auth.uid());
CREATE POLICY "cr_runs insert" ON public.cr_sync_runs FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operations_leadership') OR public.has_role(auth.uid(),'super_admin')) AND uploaded_by = auth.uid());
CREATE POLICY "cr_runs update" ON public.cr_sync_runs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operations_leadership') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operations_leadership') OR public.has_role(auth.uid(),'super_admin'));

-- ============================================================
-- cr_sync_run_errors: per-row errors
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cr_sync_run_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.cr_sync_runs(id) ON DELETE CASCADE,
  row_number INT NOT NULL,
  external_id TEXT,
  field TEXT,
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  raw_row JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cr_run_errors_run ON public.cr_sync_run_errors(run_id);
GRANT SELECT, INSERT, DELETE ON public.cr_sync_run_errors TO authenticated;
GRANT ALL ON public.cr_sync_run_errors TO service_role;
ALTER TABLE public.cr_sync_run_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_run_errors admin" ON public.cr_sync_run_errors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operations_leadership') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operations_leadership') OR public.has_role(auth.uid(),'super_admin'));

-- ============================================================
-- cr_external_records: staging + committed external records
-- Never delete unless explicit reconciliation rule.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cr_external_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type_key public.cr_sync_type_key NOT NULL,
  external_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  is_committed BOOLEAN NOT NULL DEFAULT false,
  first_run_id UUID REFERENCES public.cr_sync_runs(id) ON DELETE SET NULL,
  last_run_id UUID REFERENCES public.cr_sync_runs(id) ON DELETE SET NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INT NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_cr_ext_type_id ON public.cr_external_records(type_key, external_id);
CREATE INDEX IF NOT EXISTS idx_cr_ext_last_run ON public.cr_external_records(last_run_id);
GRANT SELECT, INSERT, UPDATE ON public.cr_external_records TO authenticated;
GRANT ALL ON public.cr_external_records TO service_role;
ALTER TABLE public.cr_external_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_ext admin" ON public.cr_external_records FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operations_leadership') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'scheduling'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operations_leadership') OR public.has_role(auth.uid(),'super_admin'));

-- ============================================================
-- cr_freshness_config: per-type thresholds (minutes)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cr_freshness_config (
  type_key public.cr_sync_type_key PRIMARY KEY,
  current_minutes INT NOT NULL DEFAULT 1440,       -- < 1 day
  aging_minutes INT NOT NULL DEFAULT 2880,         -- < 2 days
  stale_minutes INT NOT NULL DEFAULT 4320,         -- < 3 days
  critical_minutes INT NOT NULL DEFAULT 10080,     -- < 7 days
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cr_freshness_config TO authenticated;
GRANT ALL ON public.cr_freshness_config TO service_role;
ALTER TABLE public.cr_freshness_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_fresh read" ON public.cr_freshness_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "cr_fresh admin write" ON public.cr_freshness_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- ============================================================
-- cr_sync_audit
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cr_sync_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID REFERENCES public.cr_sync_runs(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,     -- uploaded, validated, previewed, committed, rolled_back, downloaded, template_saved, config_changed
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cr_audit_run ON public.cr_sync_audit(run_id);
GRANT SELECT, INSERT ON public.cr_sync_audit TO authenticated;
GRANT ALL ON public.cr_sync_audit TO service_role;
ALTER TABLE public.cr_sync_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_audit admin read" ON public.cr_sync_audit FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operations_leadership') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "cr_audit insert self" ON public.cr_sync_audit FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- ============================================================
-- Updated-at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION public.cr_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_cr_types_touch ON public.cr_sync_types;
CREATE TRIGGER trg_cr_types_touch BEFORE UPDATE ON public.cr_sync_types
  FOR EACH ROW EXECUTE FUNCTION public.cr_touch_updated_at();
DROP TRIGGER IF EXISTS trg_cr_tmpl_touch ON public.cr_sync_templates;
CREATE TRIGGER trg_cr_tmpl_touch BEFORE UPDATE ON public.cr_sync_templates
  FOR EACH ROW EXECUTE FUNCTION public.cr_touch_updated_at();
DROP TRIGGER IF EXISTS trg_cr_runs_touch ON public.cr_sync_runs;
CREATE TRIGGER trg_cr_runs_touch BEFORE UPDATE ON public.cr_sync_runs
  FOR EACH ROW EXECUTE FUNCTION public.cr_touch_updated_at();
DROP TRIGGER IF EXISTS trg_cr_fresh_touch ON public.cr_freshness_config;
CREATE TRIGGER trg_cr_fresh_touch BEFORE UPDATE ON public.cr_freshness_config
  FOR EACH ROW EXECUTE FUNCTION public.cr_touch_updated_at();

-- ============================================================
-- Freshness helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.cr_sync_freshness()
RETURNS TABLE (
  type_key public.cr_sync_type_key,
  last_success TIMESTAMPTZ,
  last_attempt TIMESTAMPTZ,
  last_row_count INT,
  age_minutes INT,
  level public.cr_freshness_level
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE t RECORD; cfg RECORD; ls TIMESTAMPTZ; la TIMESTAMPTZ; rc INT; am INT; lv public.cr_freshness_level;
BEGIN
  FOR t IN SELECT unnest(enum_range(NULL::public.cr_sync_type_key)) AS key LOOP
    SELECT * INTO cfg FROM public.cr_freshness_config WHERE cr_freshness_config.type_key = t.key;
    IF NOT FOUND THEN
      cfg.current_minutes := 1440; cfg.aging_minutes := 2880; cfg.stale_minutes := 4320; cfg.critical_minutes := 10080;
    END IF;
    SELECT MAX(committed_at) INTO ls FROM public.cr_sync_runs r WHERE r.type_key = t.key AND r.status IN ('committed','partial') AND r.rolled_back_at IS NULL;
    SELECT MAX(created_at) INTO la FROM public.cr_sync_runs r WHERE r.type_key = t.key;
    SELECT COALESCE(SUM(rows_added + rows_updated + rows_unchanged),0)::INT INTO rc
      FROM public.cr_sync_runs r WHERE r.type_key = t.key AND r.status IN ('committed','partial') AND r.rolled_back_at IS NULL;
    IF ls IS NULL THEN
      lv := 'no_data'; am := NULL;
    ELSE
      am := EXTRACT(EPOCH FROM (now() - ls))/60;
      IF am <= cfg.current_minutes THEN lv := 'current';
      ELSIF am <= cfg.aging_minutes THEN lv := 'aging';
      ELSIF am <= cfg.stale_minutes THEN lv := 'stale';
      ELSE lv := 'critical';
      END IF;
    END IF;
    type_key := t.key; last_success := ls; last_attempt := la; last_row_count := rc; age_minutes := am; level := lv;
    RETURN NEXT;
  END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.cr_sync_freshness() TO authenticated;

-- ============================================================
-- Idempotent upsert for external records (called from client)
-- Returns action: 'added' | 'updated' | 'unchanged'
-- ============================================================
CREATE OR REPLACE FUNCTION public.cr_upsert_external_record(
  _type_key public.cr_sync_type_key,
  _external_id TEXT,
  _payload JSONB,
  _run_id UUID
) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existing RECORD; result TEXT;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operations_leadership') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT * INTO existing FROM public.cr_external_records
    WHERE type_key = _type_key AND external_id = _external_id;
  IF NOT FOUND THEN
    INSERT INTO public.cr_external_records(type_key, external_id, payload, is_committed, first_run_id, last_run_id)
    VALUES (_type_key, _external_id, _payload, true, _run_id, _run_id);
    RETURN 'added';
  END IF;
  IF existing.payload = _payload THEN
    UPDATE public.cr_external_records
      SET last_seen_at = now(), last_run_id = _run_id
      WHERE id = existing.id;
    RETURN 'unchanged';
  END IF;
  UPDATE public.cr_external_records
    SET payload = _payload, last_seen_at = now(), last_run_id = _run_id, version = existing.version + 1, is_committed = true
    WHERE id = existing.id;
  RETURN 'updated';
END $$;
GRANT EXECUTE ON FUNCTION public.cr_upsert_external_record(public.cr_sync_type_key, TEXT, JSONB, UUID) TO authenticated;

-- ============================================================
-- Rollback: reverts records last touched by a run to their previous run's payload where possible;
-- otherwise marks the run rolled_back and removes external records that were first added by it.
-- ============================================================
CREATE OR REPLACE FUNCTION public.cr_rollback_run(_run_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE deleted INT := 0; reverted INT := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  DELETE FROM public.cr_external_records WHERE first_run_id = _run_id;
  GET DIAGNOSTICS deleted = ROW_COUNT;
  UPDATE public.cr_sync_runs SET status = 'rolled_back', rolled_back_at = now(), rolled_back_by = auth.uid()
    WHERE id = _run_id;
  RETURN jsonb_build_object('deleted', deleted, 'reverted', reverted);
END $$;
GRANT EXECUTE ON FUNCTION public.cr_rollback_run(UUID) TO authenticated;

-- ============================================================
-- Seed types
-- ============================================================
INSERT INTO public.cr_sync_types(key,label,description,external_id_field,required_fields) VALUES
  ('employees','Employee / Contact Export','CentralReach employees and contacts (RBTs, BCBAs, admin staff)','cr_employee_id',ARRAY['cr_employee_id','first_name','last_name']),
  ('clients','Client Assignment Export','CentralReach clients and staff assignments','cr_client_id',ARRAY['cr_client_id','client_name']),
  ('schedule','Schedule / Appointment Export','CentralReach scheduled appointments','cr_appointment_id',ARRAY['cr_appointment_id','cr_client_id','cr_employee_id','start_at','end_at']),
  ('timesheets','Timesheet / Billing Export','CentralReach billable timesheet entries','cr_billing_id',ARRAY['cr_billing_id','cr_employee_id','service_date']),
  ('authorizations','Authorization Export','CentralReach payer authorizations (future)','cr_authorization_id',ARRAY['cr_authorization_id','cr_client_id'])
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description, external_id_field = EXCLUDED.external_id_field, required_fields = EXCLUDED.required_fields;

-- Default templates (recognition + column map)
INSERT INTO public.cr_sync_templates(type_key,name,description,column_map,required_fields,field_types,recognition_headers,is_default)
SELECT 'employees','Default CR Employee Export','Auto-detects standard CR employee export columns',
  jsonb_build_object('id','cr_employee_id','contact id','cr_employee_id','employee id','cr_employee_id','first name','first_name','last name','last_name','email','email','role','role','status','status'),
  ARRAY['cr_employee_id','first_name','last_name']::text[],
  jsonb_build_object('cr_employee_id','string','first_name','string','last_name','string','email','email','status','string'),
  ARRAY['contact id','first name','last name']::text[], true
WHERE NOT EXISTS (SELECT 1 FROM public.cr_sync_templates WHERE type_key='employees' AND is_default);

INSERT INTO public.cr_sync_templates(type_key,name,description,column_map,required_fields,field_types,recognition_headers,is_default)
SELECT 'clients','Default CR Client Assignment Export','',
  jsonb_build_object('client id','cr_client_id','id','cr_client_id','client name','client_name','name','client_name','assigned bcba id','cr_bcba_id','assigned rbt id','cr_rbt_id','status','status'),
  ARRAY['cr_client_id','client_name']::text[],
  jsonb_build_object('cr_client_id','string','client_name','string','status','string'),
  ARRAY['client id','client name']::text[], true
WHERE NOT EXISTS (SELECT 1 FROM public.cr_sync_templates WHERE type_key='clients' AND is_default);

INSERT INTO public.cr_sync_templates(type_key,name,description,column_map,required_fields,field_types,recognition_headers,is_default)
SELECT 'schedule','Default CR Schedule Export','Appointment ID + Client + Provider + Times',
  jsonb_build_object(
    'appointment id','cr_appointment_id','id','cr_appointment_id',
    'client id','cr_client_id','provider id','cr_employee_id','employee id','cr_employee_id',
    'bcba id','cr_bcba_id','date','service_date','start','start_at','end','end_at',
    'location type','location_type','service code','service_code','status','appointment_status','cancellation status','cancellation_status'
  ),
  ARRAY['cr_appointment_id','cr_client_id','cr_employee_id','start_at','end_at']::text[],
  jsonb_build_object('cr_appointment_id','string','start_at','datetime','end_at','datetime','service_date','date'),
  ARRAY['appointment id','client id','start']::text[], true
WHERE NOT EXISTS (SELECT 1 FROM public.cr_sync_templates WHERE type_key='schedule' AND is_default);

INSERT INTO public.cr_sync_templates(type_key,name,description,column_map,required_fields,field_types,recognition_headers,is_default)
SELECT 'timesheets','Default CR Timesheet / Billing Export','',
  jsonb_build_object('billing id','cr_billing_id','timesheet id','cr_billing_id','id','cr_billing_id',
    'employee id','cr_employee_id','client id','cr_client_id','service date','service_date',
    'units','units','rate','rate','amount','amount','status','status'),
  ARRAY['cr_billing_id','cr_employee_id','service_date']::text[],
  jsonb_build_object('cr_billing_id','string','service_date','date','units','number','amount','number'),
  ARRAY['billing id','service date']::text[], true
WHERE NOT EXISTS (SELECT 1 FROM public.cr_sync_templates WHERE type_key='timesheets' AND is_default);

INSERT INTO public.cr_sync_templates(type_key,name,description,column_map,required_fields,field_types,recognition_headers,is_default)
SELECT 'authorizations','Default CR Authorization Export','Future — placeholder mapping',
  jsonb_build_object('authorization id','cr_authorization_id','id','cr_authorization_id','client id','cr_client_id',
    'payer','payer','start date','start_date','end date','end_date','units authorized','units_authorized','service code','service_code'),
  ARRAY['cr_authorization_id','cr_client_id']::text[],
  jsonb_build_object('cr_authorization_id','string','start_date','date','end_date','date','units_authorized','number'),
  ARRAY['authorization id']::text[], true
WHERE NOT EXISTS (SELECT 1 FROM public.cr_sync_templates WHERE type_key='authorizations' AND is_default);

-- Seed freshness config defaults
INSERT INTO public.cr_freshness_config(type_key) SELECT unnest(enum_range(NULL::public.cr_sync_type_key))
ON CONFLICT (type_key) DO NOTHING;
