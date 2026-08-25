-- =====================================================================
-- Curated, role-checked report readers for the CentralReach claims,
-- payments/ERA and timesheet-documentation datasets.
--
-- The underlying tables keep their strict cr_hub_can_manage() SELECT
-- policies. These SECURITY DEFINER RPCs are the ONLY staff-facing read
-- path, they guard on auth.uid() plus an explicit role check matching
-- the report catalog, and they never project restricted columns
-- (raw amounts, references, check numbers, notes, contacts).
-- Forward-only: no data is inserted, updated or deleted.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.can_read_claims_report(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT _user_id IS NOT NULL AND (
    public.has_role(_user_id, 'super_admin'::app_role)
    OR public.has_role(_user_id, 'admin'::app_role)
    OR public.has_role(_user_id, 'executive_leadership'::app_role)
    OR public.has_role(_user_id, 'executive'::app_role)
    OR public.has_role(_user_id, 'exec'::app_role)
    OR public.has_role(_user_id, 'ceo'::app_role)
    OR public.has_role(_user_id, 'coo'::app_role)
    OR public.has_role(_user_id, 'cfo'::app_role)
    OR public.has_role(_user_id, 'controller'::app_role)
    OR public.has_role(_user_id, 'operations_leadership'::app_role)
    OR public.has_role(_user_id, 'director_of_operations'::app_role)
    OR public.has_role(_user_id, 'operations_manager'::app_role)
    OR public.has_role(_user_id, 'finance'::app_role)
    OR public.has_role(_user_id, 'billing_lead'::app_role)
    OR public.has_role(_user_id, 'billing_coordinator'::app_role)
    OR public.has_role(_user_id, 'rcm_team'::app_role)
    OR public.has_role(_user_id, 'finance_benefits_lead'::app_role)
    OR public.has_role(_user_id, 'finance_benefits_team'::app_role)
    OR public.has_role(_user_id, 'authorization_manager'::app_role)
    OR public.has_role(_user_id, 'authorization_coordinator'::app_role)
    OR public.has_role(_user_id, 'director_of_authorizations'::app_role)
    OR public.has_role(_user_id, 'qa_team'::app_role)
    OR public.has_role(_user_id, 'qa_director'::app_role)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_read_payment_reconciliation_report(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT _user_id IS NOT NULL AND (
    public.has_role(_user_id, 'super_admin'::app_role)
    OR public.has_role(_user_id, 'admin'::app_role)
    OR public.has_role(_user_id, 'executive_leadership'::app_role)
    OR public.has_role(_user_id, 'executive'::app_role)
    OR public.has_role(_user_id, 'exec'::app_role)
    OR public.has_role(_user_id, 'ceo'::app_role)
    OR public.has_role(_user_id, 'coo'::app_role)
    OR public.has_role(_user_id, 'cfo'::app_role)
    OR public.has_role(_user_id, 'controller'::app_role)
    OR public.has_role(_user_id, 'operations_leadership'::app_role)
    OR public.has_role(_user_id, 'director_of_operations'::app_role)
    OR public.has_role(_user_id, 'finance'::app_role)
    OR public.has_role(_user_id, 'billing_lead'::app_role)
    OR public.has_role(_user_id, 'billing_coordinator'::app_role)
    OR public.has_role(_user_id, 'rcm_team'::app_role)
    OR public.has_role(_user_id, 'finance_benefits_lead'::app_role)
    OR public.has_role(_user_id, 'finance_benefits_team'::app_role)
  );
$$;

-- ------------------------------------------------------------------ claims
CREATE OR REPLACE FUNCTION public.report_claims_status()
RETURNS TABLE (
  id uuid,
  claim_number text,
  client_name text,
  payor text,
  state text,
  date_of_service date,
  procedure_code text,
  status text,
  responses_status text,
  action_date date,
  action_by text,
  submit_reason text,
  error_count integer,
  exported boolean,
  amount_unit text,
  source_row_id text,
  last_seen_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT public.can_read_claims_report(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to read the claims submission report';
  END IF;
  RETURN QUERY
  SELECT
    c.id, c.claim_number, c.client_name, c.payor, c.state,
    c.date_of_service, c.procedure_code, c.status, c.responses_status,
    c.action_date, c.action_by, c.submit_reason, c.error_count, c.exported,
    c.amount_unit, c.source_row_id, c.last_seen_at
  FROM public.cr_claims c;
END;
$$;

-- ---------------------------------------------------------------- payments
CREATE OR REPLACE FUNCTION public.report_payments_current()
RETURNS TABLE (
  id uuid,
  record_date date,
  creation_date date,
  date_of_service date,
  first_billed date,
  client_name text,
  client_cr_id text,
  department text,
  payor text,
  payment_type text,
  is_copay boolean,
  payment_labels text,
  primary_location text,
  applied_to_billing_entry boolean,
  is_voided boolean,
  amount_unit text,
  source_row_id text,
  last_seen_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT public.can_read_payment_reconciliation_report(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to read the payment reconciliation report';
  END IF;
  RETURN QUERY
  SELECT
    p.id, p.record_date, p.creation_date, p.date_of_service, p.first_billed,
    p.client_name, p.client_cr_id, p.department, p.payor, p.payment_type,
    p.is_copay, p.payment_labels, p.primary_location,
    (p.billing_entry_id IS NOT NULL AND btrim(p.billing_entry_id) <> '') AS applied_to_billing_entry,
    (p.voided_date IS NOT NULL OR (p.voided_by IS NOT NULL AND btrim(p.voided_by) <> '')) AS is_voided,
    p.amount_unit, p.source_row_id, p.last_seen_at
  FROM public.cr_payments p;
END;
$$;

-- -------------------------------------------------------------------- ERA
CREATE OR REPLACE FUNCTION public.report_era_reconciliation()
RETURNS TABLE (
  id uuid,
  era_labels text,
  received_date date,
  payor text,
  claim_count integer,
  client_count integer,
  reconcile_status text,
  amount_unit text,
  source_row_id text,
  last_seen_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT public.can_read_payment_reconciliation_report(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to read the payment reconciliation report';
  END IF;
  RETURN QUERY
  SELECT
    e.id, e.era_labels, e.received_date, e.payor, e.claim_count, e.client_count,
    e.reconcile_status, e.amount_unit, e.source_row_id, e.last_seen_at
  FROM public.cr_era_payments e;
END;
$$;

-- ------------------------------------------- timesheet documentation summary
-- Aggregate documentation readiness ONLY: provider-level counts with no
-- client name/id, no rate/amount/reference/note/check fields. Any signed-in
-- staff member who can already view Commit to Submit may read it.
CREATE OR REPLACE FUNCTION public.report_timesheet_documentation_summary()
RETURNS TABLE (
  provider_key text,
  provider_name text,
  provider_cr_id text,
  rows_total bigint,
  locked_rows bigint,
  unlocked_rows bigint,
  missing_provider_signature bigint,
  incomplete_tasks bigint,
  latest_date_of_service date,
  latest_seen_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT public.has_any_role(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to read documentation readiness';
  END IF;
  RETURN QUERY
  SELECT
    COALESCE(NULLIF(btrim(t.provider_cr_id), ''), NULLIF(btrim(t.provider_name), ''), 'unknown') AS provider_key,
    COALESCE(NULLIF(btrim(t.provider_name), ''), 'Unknown provider') AS provider_name,
    NULLIF(btrim(t.provider_cr_id), '') AS provider_cr_id,
    count(*) AS rows_total,
    count(*) FILTER (WHERE t.is_locked IS TRUE) AS locked_rows,
    count(*) FILTER (WHERE t.is_locked IS FALSE) AS unlocked_rows,
    count(*) FILTER (WHERE t.provider_signature IS FALSE) AS missing_provider_signature,
    count(*) FILTER (
      WHERE t.tasks_total IS NOT NULL
        AND t.tasks_total > 0
        AND COALESCE(t.tasks_completed, 0) < t.tasks_total
    ) AS incomplete_tasks,
    max(t.date_of_service) AS latest_date_of_service,
    max(t.last_seen_at) AS latest_seen_at
  FROM public.cr_timesheet_status t
  WHERE t.is_void IS NOT TRUE
  GROUP BY 1, 2, 3;
END;
$$;

-- ------------------------------------------------------------------ grants
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'report_claims_status',
        'report_payments_current',
        'report_era_reconciliation',
        'report_timesheet_documentation_summary',
        'can_read_claims_report',
        'can_read_payment_reconciliation_report'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;