-- Forward-only fix: current-snapshot views must recognize finalized batches
-- (status 'active' OR legacy 'success') and scope to the latest snapshot batch.
-- Columns, projections, grants and RPC compatibility are preserved.
-- v_cr_claims_status is intentionally untouched.

DROP VIEW IF EXISTS public.v_cr_schedule_current;
CREATE VIEW public.v_cr_schedule_current
WITH (security_invoker = on) AS
WITH latest_batch AS (
  SELECT b.id
  FROM public.cr_import_batches b
  WHERE b.is_active
    AND b.status IN ('active', 'success')
    AND b.import_strategy = 'upsert_snapshot'
    AND lower(b.export_type) IN ('scheduling', 'schedule', 'schedule_events')
  ORDER BY b.created_at DESC, b.id DESC
  LIMIT 1
)
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
FROM public.cr_schedule_events e
WHERE NOT EXISTS (SELECT 1 FROM latest_batch)
   OR COALESCE(e.last_seen_batch_id, e.batch_id) = (SELECT id FROM latest_batch);

DROP VIEW IF EXISTS public.v_cr_authorization_current;
CREATE VIEW public.v_cr_authorization_current
WITH (security_invoker = on) AS
WITH latest_batch AS (
  SELECT b.id
  FROM public.cr_import_batches b
  WHERE b.is_active
    AND b.status IN ('active', 'success')
    AND b.import_strategy = 'upsert_snapshot'
    AND lower(b.export_type) IN ('authorization', 'authorizations')
  ORDER BY b.created_at DESC, b.id DESC
  LIMIT 1
)
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
FROM public.cr_authorizations a
WHERE NOT EXISTS (SELECT 1 FROM latest_batch)
   OR COALESCE(a.last_seen_batch_id, a.batch_id) = (SELECT id FROM latest_batch);

DROP VIEW IF EXISTS public.v_cr_timesheet_documentation;
CREATE VIEW public.v_cr_timesheet_documentation
WITH (security_invoker = on) AS
WITH latest_batch AS (
  SELECT b.id
  FROM public.cr_import_batches b
  WHERE b.is_active
    AND b.status IN ('active', 'success')
    AND b.import_strategy = 'upsert_snapshot'
    AND lower(b.export_type) IN ('timesheet', 'timesheets', 'documentation')
  ORDER BY b.created_at DESC, b.id DESC
  LIMIT 1
)
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
FROM public.cr_timesheet_status t
WHERE NOT EXISTS (SELECT 1 FROM latest_batch)
   OR COALESCE(t.last_seen_batch_id, t.batch_id) = (SELECT id FROM latest_batch);

DROP VIEW IF EXISTS public.v_cr_payments_current;
CREATE VIEW public.v_cr_payments_current
WITH (security_invoker = on) AS
WITH latest_batch AS (
  SELECT b.id
  FROM public.cr_import_batches b
  WHERE b.is_active
    AND b.status IN ('active', 'success')
    AND b.import_strategy = 'upsert_snapshot'
    AND lower(b.export_type) IN ('payments', 'payment')
  ORDER BY b.created_at DESC, b.id DESC
  LIMIT 1
)
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
FROM public.cr_payments p
WHERE NOT EXISTS (SELECT 1 FROM latest_batch)
   OR COALESCE(p.last_seen_batch_id, p.batch_id) = (SELECT id FROM latest_batch);

DROP VIEW IF EXISTS public.v_cr_era_reconciliation;
CREATE VIEW public.v_cr_era_reconciliation
WITH (security_invoker = on) AS
WITH latest_batch AS (
  SELECT b.id
  FROM public.cr_import_batches b
  WHERE b.is_active
    AND b.status IN ('active', 'success')
    AND b.import_strategy = 'upsert_snapshot'
    AND lower(b.export_type) IN ('era_payments', 'era', 'era_payment_detail')
  ORDER BY b.created_at DESC, b.id DESC
  LIMIT 1
)
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
FROM public.cr_era_payments e
WHERE NOT EXISTS (SELECT 1 FROM latest_batch)
   OR COALESCE(e.last_seen_batch_id, e.batch_id) = (SELECT id FROM latest_batch);

REVOKE ALL ON public.v_cr_schedule_current FROM PUBLIC;
REVOKE ALL ON public.v_cr_schedule_current FROM anon;
REVOKE ALL ON public.v_cr_authorization_current FROM PUBLIC;
REVOKE ALL ON public.v_cr_authorization_current FROM anon;
REVOKE ALL ON public.v_cr_timesheet_documentation FROM PUBLIC;
REVOKE ALL ON public.v_cr_timesheet_documentation FROM anon;
REVOKE ALL ON public.v_cr_payments_current FROM PUBLIC;
REVOKE ALL ON public.v_cr_payments_current FROM anon;
REVOKE ALL ON public.v_cr_era_reconciliation FROM PUBLIC;
REVOKE ALL ON public.v_cr_era_reconciliation FROM anon;
GRANT SELECT ON public.v_cr_schedule_current TO authenticated;
GRANT SELECT ON public.v_cr_authorization_current TO authenticated;
GRANT SELECT ON public.v_cr_timesheet_documentation TO authenticated;
GRANT SELECT ON public.v_cr_payments_current TO authenticated;
GRANT SELECT ON public.v_cr_era_reconciliation TO authenticated;