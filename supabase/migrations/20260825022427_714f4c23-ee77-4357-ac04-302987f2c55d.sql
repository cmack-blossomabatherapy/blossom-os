-- ============================================================
-- Phase 1: CentralReach import/data/security foundation
-- Idempotent and additive. No existing column is renamed or dropped.
-- ============================================================

-- ---------- shared source-tracking columns on current tables ----------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'cr_billing_sessions','cr_schedule_events','cr_authorizations',
    'cr_authorization_utilization','cr_claims','cr_contacts'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS source_row_id text', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS last_seen_batch_id uuid', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now()', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS source_quality jsonb DEFAULT ''{}''::jsonb', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(source_row_id)', 'idx_' || t || '_source_row_id', t);
  END LOOP;
END $$;

-- ---------- scheduling: real CentralReach event state ----------
ALTER TABLE public.cr_schedule_events
  ADD COLUMN IF NOT EXISTS deleted boolean,
  ADD COLUMN IF NOT EXISTS cancelled boolean,
  ADD COLUMN IF NOT EXISTS converted_to_timesheet boolean,
  ADD COLUMN IF NOT EXISTS attendance text,
  ADD COLUMN IF NOT EXISTS start_time text,
  ADD COLUMN IF NOT EXISTS end_time text,
  ADD COLUMN IF NOT EXISTS billing_creation_date date,
  ADD COLUMN IF NOT EXISTS billing_code text,
  ADD COLUMN IF NOT EXISTS billing_code_name text;

-- ---------- authorizations: identity + explicit hour windows ----------
ALTER TABLE public.cr_authorizations
  ADD COLUMN IF NOT EXISTS authorization_id text,
  ADD COLUMN IF NOT EXISTS manager text,
  ADD COLUMN IF NOT EXISTS implementer text,
  ADD COLUMN IF NOT EXISTS frequency text,
  ADD COLUMN IF NOT EXISTS followup_authorization_number text,
  ADD COLUMN IF NOT EXISTS followup_service_codes text,
  ADD COLUMN IF NOT EXISTS authorized_hours_all numeric,
  ADD COLUMN IF NOT EXISTS authorized_hours_month numeric,
  ADD COLUMN IF NOT EXISTS authorized_hours_auth_range numeric,
  ADD COLUMN IF NOT EXISTS worked_hours_all numeric,
  ADD COLUMN IF NOT EXISTS worked_hours_month numeric,
  ADD COLUMN IF NOT EXISTS worked_hours_auth_range numeric,
  ADD COLUMN IF NOT EXISTS scheduled_hours_all numeric,
  ADD COLUMN IF NOT EXISTS scheduled_hours_month numeric,
  ADD COLUMN IF NOT EXISTS scheduled_hours_auth_range numeric,
  ADD COLUMN IF NOT EXISTS pending_hours_all numeric,
  ADD COLUMN IF NOT EXISTS pending_hours_month numeric,
  ADD COLUMN IF NOT EXISTS pending_hours_auth_range numeric,
  ADD COLUMN IF NOT EXISTS remaining_hours_all numeric,
  ADD COLUMN IF NOT EXISTS remaining_hours_month numeric,
  ADD COLUMN IF NOT EXISTS remaining_hours_auth_range numeric,
  ADD COLUMN IF NOT EXISTS utilization_percent_all numeric,
  ADD COLUMN IF NOT EXISTS utilization_percent_month numeric,
  ADD COLUMN IF NOT EXISTS utilization_percent_auth_range numeric;

-- ---------- claims: workflow + honest amount units ----------
ALTER TABLE public.cr_claims
  ADD COLUMN IF NOT EXISTS action_date date,
  ADD COLUMN IF NOT EXISTS action_by text,
  ADD COLUMN IF NOT EXISTS submit_reason text,
  ADD COLUMN IF NOT EXISTS error_count integer,
  ADD COLUMN IF NOT EXISTS exported boolean,
  ADD COLUMN IF NOT EXISTS responses_status text,
  ADD COLUMN IF NOT EXISTS amount_raw numeric,
  ADD COLUMN IF NOT EXISTS paid_amount_raw numeric,
  ADD COLUMN IF NOT EXISTS amount_unit text NOT NULL DEFAULT 'unknown';

-- ---------- import accounting ----------
ALTER TABLE public.cr_import_batches
  ADD COLUMN IF NOT EXISTS import_strategy text NOT NULL DEFAULT 'append_fact',
  ADD COLUMN IF NOT EXISTS updated_row_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unchanged_row_count integer NOT NULL DEFAULT 0;

-- ---------- billing documentation status (current, upsert-able) ----------
CREATE TABLE IF NOT EXISTS public.cr_billing_session_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  row_hash text NOT NULL,
  source_row_id text,
  batch_id uuid,
  last_seen_batch_id uuid,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  source_quality jsonb NOT NULL DEFAULT '{}'::jsonb,
  authorization_id text,
  creation_date date,
  first_bill_date date,
  first_claim_date date,
  claims_exported boolean,
  is_void boolean,
  deleted boolean,
  signed_by_provider boolean,
  signed_by_client boolean,
  provider_role text,
  billing_labels text,
  location text,
  delivery_method text,
  place_of_service text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS cr_billing_session_status_row_hash_key
  ON public.cr_billing_session_status(row_hash);
CREATE INDEX IF NOT EXISTS idx_cr_billing_session_status_source_row_id
  ON public.cr_billing_session_status(source_row_id);

GRANT SELECT ON public.cr_billing_session_status TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cr_billing_session_status TO authenticated;
GRANT ALL ON public.cr_billing_session_status TO service_role;

ALTER TABLE public.cr_billing_session_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cr_billing_session_status_read ON public.cr_billing_session_status;
CREATE POLICY cr_billing_session_status_read
  ON public.cr_billing_session_status FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS cr_billing_session_status_manage ON public.cr_billing_session_status;
CREATE POLICY cr_billing_session_status_manage
  ON public.cr_billing_session_status FOR ALL TO authenticated
  USING (public.cr_hub_can_manage()) WITH CHECK (public.cr_hub_can_manage());

CREATE OR REPLACE FUNCTION public.cr_touch_billing_session_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_cr_billing_session_status_touch ON public.cr_billing_session_status;
CREATE TRIGGER trg_cr_billing_session_status_touch
  BEFORE UPDATE ON public.cr_billing_session_status
  FOR EACH ROW EXECUTE FUNCTION public.cr_touch_billing_session_status();

-- ---------- SECURITY: raw payloads are admin-only ----------
DROP POLICY IF EXISTS cr_raw_rows_read ON public.cr_raw_rows;
DROP POLICY IF EXISTS "cr_raw_rows_read" ON public.cr_raw_rows;
DROP POLICY IF EXISTS cr_raw_rows_read_admin ON public.cr_raw_rows;
CREATE POLICY cr_raw_rows_read_admin
  ON public.cr_raw_rows FOR SELECT TO authenticated
  USING (public.cr_hub_can_manage());

-- ---------- curated report views (minimum necessary) ----------
DROP VIEW IF EXISTS public.v_cr_schedule_current;
CREATE VIEW public.v_cr_schedule_current
WITH (security_invoker = on) AS
SELECT
  e.id, e.event_date, e.start_time, e.end_time,
  COALESCE(NULLIF(e.billing_code_name, ''), NULLIF(e.billing_code, ''), e.procedure_code) AS service_code,
  e.procedure_code, e.billing_code, e.billing_code_name,
  e.scheduled_hours, e.client_name, e.provider_name,
  e.status, e.attendance, e.cancelled, e.deleted, e.converted_to_timesheet,
  e.cancellation_reason, e.cancelled_by,
  e.state, e.location, e.payor, e.billing_creation_date,
  e.source_row_id, e.last_seen_at
FROM public.cr_schedule_events e;

DROP VIEW IF EXISTS public.v_cr_authorization_current;
CREATE VIEW public.v_cr_authorization_current
WITH (security_invoker = on) AS
SELECT
  a.id, a.authorization_id, a.authorization_number, a.followup_authorization_number,
  a.client_name, a.client_cr_id, a.payor, a.state,
  a.procedure_code, a.service_codes, a.followup_service_codes, a.frequency,
  a.manager, a.implementer,
  a.start_date, a.end_date, a.actual_start_date, a.actual_end_date,
  a.followup_start_date, a.followup_end_date,
  a.is_active, a.status,
  a.authorized_hours, a.worked_hours, a.remaining_hours,
  a.authorized_hours_all, a.authorized_hours_month, a.authorized_hours_auth_range,
  a.worked_hours_all, a.worked_hours_month, a.worked_hours_auth_range,
  a.scheduled_hours_all, a.scheduled_hours_month, a.scheduled_hours_auth_range,
  a.pending_hours_all, a.pending_hours_month, a.pending_hours_auth_range,
  a.remaining_hours_all, a.remaining_hours_month, a.remaining_hours_auth_range,
  a.utilization_percent_all, a.utilization_percent_month, a.utilization_percent_auth_range,
  a.source_row_id, a.last_seen_at
FROM public.cr_authorizations a;

DROP VIEW IF EXISTS public.v_cr_billing_documentation_status;
CREATE VIEW public.v_cr_billing_documentation_status
WITH (security_invoker = on) AS
SELECT
  s.id, s.row_hash, s.source_row_id, s.authorization_id,
  s.creation_date, s.first_bill_date, s.first_claim_date,
  s.claims_exported, s.is_void, s.deleted,
  s.signed_by_provider, s.signed_by_client,
  s.provider_role, s.billing_labels, s.location, s.delivery_method, s.place_of_service,
  s.last_seen_at
FROM public.cr_billing_session_status s;

DROP VIEW IF EXISTS public.v_cr_claims_status;
CREATE VIEW public.v_cr_claims_status
WITH (security_invoker = on) AS
SELECT
  c.id, c.claim_number, c.client_name, c.payor, c.state,
  c.date_of_service, c.procedure_code, c.status, c.responses_status,
  c.action_date, c.action_by, c.submit_reason, c.error_count, c.exported,
  c.amount_raw, c.paid_amount_raw, c.amount_unit,
  c.source_row_id, c.last_seen_at
FROM public.cr_claims c;

-- Authorization workflow events. Intentionally SECURITY DEFINER-style
-- (security_invoker off) so every authenticated employee can read this
-- curated, minimum-necessary event feed across states. Sensitive fields
-- (notes, payloads, assignments, denial narratives, Commit-to-Submit
-- disciplinary detail) are deliberately excluded.
DROP VIEW IF EXISTS public.v_authorization_operational_events;
CREATE VIEW public.v_authorization_operational_events AS
SELECT
  w.id,
  'weekly_event'::text AS source,
  w.event_type,
  w.event_date,
  w.client_name,
  w.client_cr_id,
  w.authorization_number,
  w.payor,
  w.state,
  w.pause_reason,
  w.created_at
FROM public.authorization_weekly_events w
UNION ALL
SELECT
  r.id,
  'operational_record'::text AS source,
  e.event_type,
  e.event_date,
  r.client_name,
  r.centralreach_client_id AS client_cr_id,
  r.authorization_number,
  r.payer AS payor,
  r.state,
  NULL::text AS pause_reason,
  r.created_at
FROM public.authorization_operational_records r
CROSS JOIN LATERAL (
  VALUES
    ('received', r.received_date),
    ('submitted', r.submitted_date),
    ('approved', r.approved_date),
    ('denied', r.denied_date),
    ('resubmitted', r.resubmitted_date)
) AS e(event_type, event_date)
WHERE e.event_date IS NOT NULL;

GRANT SELECT ON public.v_cr_schedule_current TO authenticated;
GRANT SELECT ON public.v_cr_authorization_current TO authenticated;
GRANT SELECT ON public.v_cr_billing_documentation_status TO authenticated;
GRANT SELECT ON public.v_cr_claims_status TO authenticated;
GRANT SELECT ON public.v_authorization_operational_events TO authenticated;