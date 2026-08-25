CREATE OR REPLACE FUNCTION public.report_authorization_events()
RETURNS TABLE (
  record_id uuid,
  source text,
  event_type text,
  event_date date,
  client_name text,
  client_cr_id text,
  authorization_number text,
  payor text,
  state text,
  reason text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    e.id AS record_id,
    'authorization_weekly_events'::text AS source,
    e.event_type,
    e.event_date,
    e.client_name,
    e.client_cr_id,
    e.authorization_number,
    e.payor,
    e.state,
    COALESCE(NULLIF(btrim(e.pause_reason), ''), NULLIF(btrim(e.pause_reason_detail), '')) AS reason,
    e.created_at
  FROM public.authorization_weekly_events e
  WHERE auth.uid() IS NOT NULL

  UNION ALL

  SELECT
    r.id AS record_id,
    'authorization_operational_records'::text AS source,
    v.event_type,
    v.event_date,
    r.client_name,
    r.centralreach_client_id AS client_cr_id,
    r.authorization_number,
    r.payer AS payor,
    r.state,
    v.reason,
    r.created_at
  FROM public.authorization_operational_records r
  CROSS JOIN LATERAL (
    VALUES
      ('submitted'::text, r.submitted_date, NULL::text),
      ('approved'::text, r.approved_date, NULL::text),
      ('denied'::text, r.denied_date, NULLIF(btrim(r.denial_reason), '')),
      ('resubmitted'::text, r.resubmitted_date, NULLIF(btrim(r.missing_info), ''))
  ) AS v(event_type, event_date, reason)
  WHERE auth.uid() IS NOT NULL
    AND v.event_date IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.report_authorization_events() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.report_authorization_events() FROM anon;
GRANT EXECUTE ON FUNCTION public.report_authorization_events() TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_authorization_events() TO service_role;