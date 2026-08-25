-- Deterministic ordering for curated report functions so client-side paging
-- (range requests) returns every row exactly once. Signatures, row shapes,
-- security semantics and search_path are unchanged.

CREATE OR REPLACE FUNCTION public.report_authorization_actions()
 RETURNS TABLE(record_id uuid, client_name text, client_cr_id text, authorization_id text, authorization_number text, auth_type text, state text, payor text, service_code text, status text, workflow_stage text, received_date date, submitted_date date, approved_date date, denied_date date, resubmitted_date date, expiration_date date, denial_reason text, missing_info text, next_action text, next_action_due_date date, appeal_due_date date, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT
    r.id AS record_id,
    r.client_name,
    r.centralreach_client_id AS client_cr_id,
    r.centralreach_authorization_id AS authorization_id,
    r.authorization_number,
    r.auth_type,
    r.state,
    r.payer AS payor,
    r.service_code,
    r.status,
    r.workflow_stage,
    r.received_date,
    r.submitted_date,
    r.approved_date,
    r.denied_date,
    r.resubmitted_date,
    r.expiration_date,
    r.denial_reason,
    r.missing_info,
    r.next_action,
    r.next_action_due_date,
    r.appeal_due_date,
    r.created_at,
    r.updated_at
  FROM public.authorization_operational_records r
  WHERE auth.uid() IS NOT NULL
  ORDER BY r.id;
$function$;

CREATE OR REPLACE FUNCTION public.report_authorization_events()
 RETURNS TABLE(record_id uuid, source text, event_type text, event_date date, client_name text, client_cr_id text, authorization_number text, auth_type text, lifecycle_kind text, payor text, state text, reason text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT
    u.record_id, u.source, u.event_type, u.event_date, u.client_name, u.client_cr_id,
    u.authorization_number, u.auth_type, u.lifecycle_kind, u.payor, u.state, u.reason, u.created_at
  FROM (
    SELECT
      e.id AS record_id,
      'authorization_weekly_events'::text AS source,
      e.event_type,
      e.event_date,
      e.client_name,
      e.client_cr_id,
      e.authorization_number,
      NULL::text AS auth_type,
      NULL::text AS lifecycle_kind,
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
      NULLIF(btrim(r.auth_type::text), '') AS auth_type,
      NULLIF(btrim(r.auth_type::text), '') AS lifecycle_kind,
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
      AND v.event_date IS NOT NULL
  ) u
  ORDER BY u.source, u.record_id, u.event_type, u.event_date;
$function$;

CREATE OR REPLACE FUNCTION public.report_bcba_performance_targets()
 RETURNS TABLE(bcba_name text, state text, period_start date, period_end date, mtd_target_hours numeric, mtd_actual_hours numeric, forecast_hours numeric, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT
    s.bcba_name,
    s.state,
    s.period_start,
    s.period_end,
    s.mtd_target_hours,
    s.mtd_actual_hours,
    s.forecast_hours,
    s.updated_at
  FROM public.bcba_productivity_snapshots s
  WHERE auth.uid() IS NOT NULL
  ORDER BY s.id;
$function$;

CREATE OR REPLACE FUNCTION public.report_billing_facts()
 RETURNS TABLE(id uuid, source_row_id text, date_of_service date, procedure_code text, hours numeric, client_name text, client_cr_id text, provider_name text, provider_cr_id text, payor text, state text, location text, status text, authorization_id text, creation_date date, first_bill_date date, first_claim_date date, is_void boolean, deleted boolean, signed_by_provider boolean, signed_by_client boolean, provider_role text, delivery_method text, place_of_service text, last_seen_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT
    b.id,
    COALESCE(b.source_row_id, s.source_row_id) AS source_row_id,
    b.date_of_service,
    b.procedure_code,
    b.hours,
    b.client_name,
    b.client_cr_id,
    b.rendering_provider_name AS provider_name,
    b.rendering_provider_cr_id AS provider_cr_id,
    b.payor,
    b.state,
    COALESCE(b.location, s.location) AS location,
    b.status,
    s.authorization_id,
    s.creation_date,
    s.first_bill_date,
    s.first_claim_date,
    s.is_void,
    s.deleted,
    s.signed_by_provider,
    s.signed_by_client,
    s.provider_role,
    s.delivery_method,
    s.place_of_service,
    COALESCE(s.last_seen_at, b.last_seen_at) AS last_seen_at
  FROM public.cr_billing_sessions b
  LEFT JOIN public.cr_billing_session_status s
    ON s.row_hash = b.row_hash
  WHERE auth.uid() IS NOT NULL
  ORDER BY b.id;
$function$;

REVOKE ALL ON FUNCTION public.report_authorization_actions() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_authorization_events() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_bcba_performance_targets() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_billing_facts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_authorization_actions() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.report_authorization_events() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.report_bcba_performance_targets() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.report_billing_facts() TO authenticated, service_role;