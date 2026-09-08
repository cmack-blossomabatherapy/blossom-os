-- Current-snapshot claims view: latest active/success claims snapshot batch only.
CREATE OR REPLACE VIEW public.v_cr_claims_current AS
WITH latest_batch AS (
  SELECT b.id
  FROM public.cr_import_batches b
  WHERE b.is_active
    AND b.status = ANY (ARRAY['active','success'])
    AND b.import_strategy = 'upsert_snapshot'
    AND lower(b.export_type) = ANY (ARRAY['claims','claim'])
  ORDER BY b.created_at DESC, b.id DESC
  LIMIT 1
)
SELECT
  c.id,
  c.claim_number,
  c.client_name,
  c.payor,
  c.state,
  c.date_of_service,
  c.procedure_code,
  c.status,
  c.responses_status,
  c.action_date,
  c.action_by,
  c.submit_reason,
  c.error_count,
  c.exported,
  c.amount_unit,
  c.source_row_id,
  c.last_seen_at
FROM public.cr_claims c
WHERE NOT EXISTS (SELECT 1 FROM latest_batch)
   OR COALESCE(c.last_seen_batch_id, c.batch_id) = (SELECT latest_batch.id FROM latest_batch);

ALTER VIEW public.v_cr_claims_current SET (security_invoker = true);

REVOKE ALL ON public.v_cr_claims_current FROM PUBLIC;
REVOKE ALL ON public.v_cr_claims_current FROM anon;
GRANT SELECT ON public.v_cr_claims_current TO authenticated;
GRANT SELECT ON public.v_cr_claims_current TO service_role;

CREATE INDEX IF NOT EXISTS cr_claims_current_batch_idx
ON public.cr_claims ((COALESCE(last_seen_batch_id, batch_id)));

-- Staff-facing claims reader now reads the current snapshot only.
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
  FROM public.v_cr_claims_current c;
END;
$$;

REVOKE ALL ON FUNCTION public.report_claims_status() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.report_claims_status() FROM anon;
GRANT EXECUTE ON FUNCTION public.report_claims_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_claims_status() TO service_role;