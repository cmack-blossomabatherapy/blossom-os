-- Forward-only: point curated report readers at the current-snapshot views so
-- they cannot report historical snapshot rows. Signatures, SECURITY DEFINER,
-- auth.uid()/role guards, grants and staff-safe projections are preserved.
-- Claims readers are intentionally untouched.

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
    p.applied_to_billing_entry,
    p.is_voided,
    p.amount_unit, p.source_row_id, p.last_seen_at
  FROM public.v_cr_payments_current p;
END;
$$;

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
  FROM public.v_cr_era_reconciliation e;
END;
$$;

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
  FROM public.v_cr_timesheet_documentation t
  WHERE t.is_void IS NOT TRUE
  GROUP BY 1, 2, 3;
END;
$$;

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
        'report_payments_current',
        'report_era_reconciliation',
        'report_timesheet_documentation_summary'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;