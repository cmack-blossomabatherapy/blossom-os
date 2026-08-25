-- CentralReach payments (mutable CURRENT snapshot, keyed by CR payment id)
CREATE TABLE public.cr_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  row_hash text NOT NULL,
  source_row_id text,
  batch_id uuid,
  last_seen_batch_id uuid,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  payment_cr_id text,
  billing_entry_id text,
  record_date date,
  creation_date date,
  date_of_service date,
  client_name text,
  client_cr_id text,
  department text,
  payor text,
  payor_nickname text,
  payment_type text,
  reference text,
  notes text,
  applied_by_name text,
  applied_by_contact_id text,
  resource_id text,
  amount_raw numeric,
  amount_unit text NOT NULL DEFAULT 'unknown',
  is_copay boolean,
  voided_by text,
  voided_date date,
  voided_reason text,
  payment_labels text,
  primary_location text,
  invoice_number text,
  first_billed date,
  procedure_code_string text,
  claims_raw text,
  claim_adjustments_raw text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX cr_payments_row_hash_key ON public.cr_payments (row_hash);
CREATE INDEX cr_payments_record_date_idx ON public.cr_payments (record_date);
CREATE INDEX cr_payments_payor_idx ON public.cr_payments (payor);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_payments TO authenticated;
GRANT ALL ON public.cr_payments TO service_role;
ALTER TABLE public.cr_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY cr_payments_read_admin ON public.cr_payments
  FOR SELECT TO authenticated USING (public.cr_hub_can_manage());
CREATE POLICY cr_payments_manage ON public.cr_payments
  FOR ALL TO authenticated USING (public.cr_hub_can_manage()) WITH CHECK (public.cr_hub_can_manage());

-- CentralReach ERA payment detail (mutable CURRENT snapshot, keyed by CR ERA id)
CREATE TABLE public.cr_era_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  row_hash text NOT NULL,
  source_row_id text,
  batch_id uuid,
  last_seen_batch_id uuid,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  era_cr_id text,
  era_labels text,
  received_date date,
  payor text,
  check_number text,
  claim_count integer,
  client_count integer,
  est_total_claim_charges numeric,
  agreed_charges numeric,
  claim_adjustment_amount numeric,
  provider_adjustment_amount numeric,
  contractual_obligations numeric,
  corrections_reversals numeric,
  other_adjustments numeric,
  payor_initiated_reductions numeric,
  total_adjustments numeric,
  patient_responsibility numeric,
  insurance_paid_amount numeric,
  total_adjustment_amount numeric,
  paid_amount numeric,
  amount_unit text NOT NULL DEFAULT 'unknown',
  reconcile_status text,
  files_raw text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX cr_era_payments_row_hash_key ON public.cr_era_payments (row_hash);
CREATE INDEX cr_era_payments_received_idx ON public.cr_era_payments (received_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_era_payments TO authenticated;
GRANT ALL ON public.cr_era_payments TO service_role;
ALTER TABLE public.cr_era_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY cr_era_payments_read_admin ON public.cr_era_payments
  FOR SELECT TO authenticated USING (public.cr_hub_can_manage());
CREATE POLICY cr_era_payments_manage ON public.cr_era_payments
  FOR ALL TO authenticated USING (public.cr_hub_can_manage()) WITH CHECK (public.cr_hub_can_manage());

-- CentralReach timesheet / documentation status. Documentation-only CURRENT
-- layer: never a billing fact, never an input to BCBA Productivity V3.
CREATE TABLE public.cr_timesheet_status (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  row_hash text NOT NULL,
  source_row_id text,
  batch_id uuid,
  last_seen_batch_id uuid,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  timesheet_cr_id text,
  date_of_service date,
  datetime_from text,
  datetime_to text,
  client_cr_id text,
  client_name text,
  provider_cr_id text,
  provider_name text,
  authorization_id text,
  procedure_code text,
  time_worked_hours numeric,
  billing_labels text,
  client_signature boolean,
  provider_signature boolean,
  is_void boolean,
  is_locked boolean,
  tasks_total numeric,
  tasks_completed numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX cr_timesheet_status_row_hash_key ON public.cr_timesheet_status (row_hash);
CREATE INDEX cr_timesheet_status_dos_idx ON public.cr_timesheet_status (date_of_service);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_timesheet_status TO authenticated;
GRANT ALL ON public.cr_timesheet_status TO service_role;
ALTER TABLE public.cr_timesheet_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY cr_timesheet_status_read_admin ON public.cr_timesheet_status
  FOR SELECT TO authenticated USING (public.cr_hub_can_manage());
CREATE POLICY cr_timesheet_status_manage ON public.cr_timesheet_status
  FOR ALL TO authenticated USING (public.cr_hub_can_manage()) WITH CHECK (public.cr_hub_can_manage());

-- updated_at triggers
CREATE TRIGGER cr_payments_touch BEFORE UPDATE ON public.cr_payments
  FOR EACH ROW EXECUTE FUNCTION public.cr_hub_touch_updated_at();
CREATE TRIGGER cr_era_payments_touch BEFORE UPDATE ON public.cr_era_payments
  FOR EACH ROW EXECUTE FUNCTION public.cr_hub_touch_updated_at();
CREATE TRIGGER cr_timesheet_status_touch BEFORE UPDATE ON public.cr_timesheet_status
  FOR EACH ROW EXECUTE FUNCTION public.cr_hub_touch_updated_at();

-- Curated staff-safe read views. Payment references, check numbers, notes and
-- unconfirmed dollar amounts are deliberately excluded.
DROP VIEW IF EXISTS public.v_cr_payments_current;
CREATE VIEW public.v_cr_payments_current
WITH (security_invoker = on) AS
SELECT
  p.id,
  p.record_date,
  p.creation_date,
  p.date_of_service,
  p.first_billed,
  p.client_name,
  p.client_cr_id,
  p.department,
  p.payor,
  p.payment_type,
  p.is_copay,
  p.payment_labels,
  p.primary_location,
  (p.billing_entry_id IS NOT NULL AND btrim(p.billing_entry_id) <> '') AS applied_to_billing_entry,
  (p.voided_date IS NOT NULL OR (p.voided_by IS NOT NULL AND btrim(p.voided_by) <> '')) AS is_voided,
  p.amount_unit,
  p.source_row_id,
  p.last_seen_at
FROM public.cr_payments p;

DROP VIEW IF EXISTS public.v_cr_era_reconciliation;
CREATE VIEW public.v_cr_era_reconciliation
WITH (security_invoker = on) AS
SELECT
  e.id,
  e.era_labels,
  e.received_date,
  e.payor,
  e.claim_count,
  e.client_count,
  e.reconcile_status,
  e.amount_unit,
  e.source_row_id,
  e.last_seen_at
FROM public.cr_era_payments e;

DROP VIEW IF EXISTS public.v_cr_timesheet_documentation;
CREATE VIEW public.v_cr_timesheet_documentation
WITH (security_invoker = on) AS
SELECT
  t.id,
  t.source_row_id,
  t.date_of_service,
  t.client_name,
  t.client_cr_id,
  t.provider_name,
  t.provider_cr_id,
  t.authorization_id,
  t.procedure_code,
  t.time_worked_hours,
  t.billing_labels,
  t.client_signature,
  t.provider_signature,
  t.is_void,
  t.is_locked,
  t.tasks_total,
  t.tasks_completed,
  t.last_seen_at
FROM public.cr_timesheet_status t;

REVOKE ALL ON public.v_cr_payments_current FROM PUBLIC, anon;
REVOKE ALL ON public.v_cr_era_reconciliation FROM PUBLIC, anon;
REVOKE ALL ON public.v_cr_timesheet_documentation FROM PUBLIC, anon;
GRANT SELECT ON public.v_cr_payments_current TO authenticated;
GRANT SELECT ON public.v_cr_era_reconciliation TO authenticated;
GRANT SELECT ON public.v_cr_timesheet_documentation TO authenticated;