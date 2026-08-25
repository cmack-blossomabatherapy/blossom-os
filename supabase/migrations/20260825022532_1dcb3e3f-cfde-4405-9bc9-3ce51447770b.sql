DROP VIEW IF EXISTS public.v_authorization_operational_events;
CREATE VIEW public.v_authorization_operational_events
WITH (security_invoker = on) AS
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

GRANT SELECT ON public.v_authorization_operational_events TO authenticated;