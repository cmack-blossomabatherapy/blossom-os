CREATE OR REPLACE FUNCTION public.report_authorization_actions()
RETURNS TABLE (
  record_id uuid,
  client_name text,
  client_cr_id text,
  authorization_id text,
  authorization_number text,
  auth_type text,
  state text,
  payor text,
  service_code text,
  status text,
  workflow_stage text,
  received_date date,
  submitted_date date,
  approved_date date,
  denied_date date,
  resubmitted_date date,
  expiration_date date,
  denial_reason text,
  missing_info text,
  next_action text,
  next_action_due_date date,
  appeal_due_date date,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
  WHERE auth.uid() IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.report_authorization_actions() FROM anon;
REVOKE ALL ON FUNCTION public.report_authorization_actions() FROM public;
GRANT EXECUTE ON FUNCTION public.report_authorization_actions() TO authenticated;

CREATE OR REPLACE FUNCTION public.report_billing_facts()
RETURNS TABLE (
  id uuid,
  source_row_id text,
  date_of_service date,
  procedure_code text,
  hours numeric,
  client_name text,
  client_cr_id text,
  provider_name text,
  provider_cr_id text,
  payor text,
  state text,
  location text,
  status text,
  authorization_id text,
  creation_date date,
  first_bill_date date,
  first_claim_date date,
  is_void boolean,
  deleted boolean,
  signed_by_provider boolean,
  signed_by_client boolean,
  provider_role text,
  delivery_method text,
  place_of_service text,
  last_seen_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
  WHERE auth.uid() IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.report_billing_facts() FROM anon;
REVOKE ALL ON FUNCTION public.report_billing_facts() FROM public;
GRANT EXECUTE ON FUNCTION public.report_billing_facts() TO authenticated;