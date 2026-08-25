ALTER TABLE public.cr_schedule_events
  ADD COLUMN IF NOT EXISTS client_cr_id text,
  ADD COLUMN IF NOT EXISTS provider_cr_id text;

DROP VIEW IF EXISTS public.v_cr_schedule_current;

CREATE VIEW public.v_cr_schedule_current
WITH (security_invoker = on) AS
 SELECT e.id,
    e.event_date,
    e.start_time,
    e.end_time,
    COALESCE(NULLIF(e.billing_code_name, ''::text), NULLIF(e.billing_code, ''::text), e.procedure_code) AS service_code,
    e.procedure_code,
    e.billing_code,
    e.billing_code_name,
    e.scheduled_hours,
    e.client_name,
    e.client_cr_id,
    e.provider_name,
    e.provider_cr_id,
    e.status,
    e.attendance,
    e.cancelled,
    e.deleted,
    e.converted_to_timesheet,
    e.cancellation_reason,
    e.cancelled_by,
    e.state,
    e.location,
    e.payor,
    e.billing_creation_date,
    e.source_row_id,
    e.last_seen_at
   FROM public.cr_schedule_events e;