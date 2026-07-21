
-- Canonical reporting foundation: read-only view + coverage RPC.
-- Reuses bcba_productivity_billing_rows (only row-bearing CentralReach import
-- table today) + reconciliation infra (normalize_person_name,
-- v_clinician_cr_mapping) + shared_report_datasets (file-based sources).

-- 1. Canonical sessions view (read-only). security_invoker=true so caller RLS
--    on underlying tables applies. bcba_productivity_billing_rows is already
--    authenticated-readable via existing policies.
CREATE OR REPLACE VIEW public.v_cr_canonical_sessions
WITH (security_invoker = true)
AS
SELECT
  r.id                                                             AS row_id,
  r.batch_id,
  b.file_name                                                      AS source_file_name,
  b.source_system,
  b.report_type,
  b.created_at                                                     AS batch_uploaded_at,
  r.service_date,
  r.client_id                                                      AS cr_client_id,
  r.client_name,
  public.normalize_person_name(r.client_name)                      AS client_name_key,
  r.provider_id                                                    AS cr_provider_id,
  r.provider_name,
  public.normalize_person_name(r.provider_name)                    AS provider_name_key,
  map.employee_id                                                  AS provider_employee_id,
  map.auth_user_id                                                 AS provider_auth_user_id,
  map.mapping_status                                               AS provider_mapping_status,
  r.procedure_code,
  -- Canonical CPT bucket: strip trailing modifier tokens (RBT/BCBA/Clinic/VA)
  NULLIF(split_part(trim(r.procedure_code), ' ', 1), '')           AS procedure_code_root,
  CASE
    WHEN r.procedure_code ILIKE '97153%' THEN 'direct'
    WHEN r.procedure_code ILIKE '97155%' THEN 'supervision'
    WHEN r.procedure_code ILIKE '97156%' THEN 'parent_training'
    WHEN r.procedure_code ILIKE '97151%' THEN 'assessment'
    WHEN r.procedure_code ILIKE '97152%' THEN 'assessment'
    WHEN r.procedure_code ILIKE 'Client Admin- Client Cancellation%' THEN 'cancellation'
    WHEN r.procedure_code ILIKE 'Client Admin%' THEN 'admin'
    WHEN r.procedure_code ILIKE 'Clinic Non-Billable%' THEN 'admin'
    ELSE 'other'
  END                                                              AS session_kind,
  COALESCE(r.hours, 0)::numeric                                    AS hours,
  COALESCE(r.units, 0)::numeric                                    AS units,
  r.active
FROM public.bcba_productivity_billing_rows r
LEFT JOIN public.bcba_productivity_upload_batches b ON b.id = r.batch_id
LEFT JOIN public.v_clinician_cr_mapping map
       ON map.candidate_provider_id = r.provider_id
      AND map.mapping_status IN ('linked','candidate')
WHERE r.active = true;

GRANT SELECT ON public.v_cr_canonical_sessions TO authenticated;

-- 2. Source-coverage diagnostic. Returns per-report_key row counts, date
--    ranges, unmapped providers/clients, freshness. SECURITY DEFINER so it
--    can read shared_report_datasets + productivity tables without leaking
--    row-level PHI (only aggregates + counts + file names).
CREATE OR REPLACE FUNCTION public.report_source_coverage()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := '[]'::jsonb;
  prod_batch RECORD;
  prod_stats RECORD;
  ds RECORD;
BEGIN
  -- Productivity / supervision / parent-training / hour-based utilization all
  -- read from bcba_productivity_billing_rows via v_cr_canonical_sessions.
  SELECT id, file_name, created_at, service_date_min, service_date_max,
         appended_row_count, source_system, report_type, status
    INTO prod_batch
    FROM public.bcba_productivity_upload_batches
   WHERE status = 'active'
   ORDER BY created_at DESC
   LIMIT 1;

  SELECT COUNT(*)                                     AS rows_total,
         COUNT(*) FILTER (WHERE session_kind='direct')          AS direct_rows,
         COUNT(*) FILTER (WHERE session_kind='supervision')     AS supervision_rows,
         COUNT(*) FILTER (WHERE session_kind='parent_training') AS parent_training_rows,
         COUNT(*) FILTER (WHERE session_kind='cancellation')    AS cancellation_rows,
         COUNT(DISTINCT cr_client_id)                           AS distinct_clients,
         COUNT(DISTINCT cr_provider_id)                         AS distinct_providers,
         COUNT(DISTINCT cr_provider_id)
           FILTER (WHERE provider_employee_id IS NULL)          AS unmapped_providers,
         MIN(service_date)                                      AS min_dos,
         MAX(service_date)                                      AS max_dos
    INTO prod_stats
    FROM public.v_cr_canonical_sessions;

  FOR ds IN
    SELECT unnest(ARRAY[
      'bcba-productivity','bcba-supervision','parent-training-97156',
      'hour-based-utilization','rbt-session-supervision'
    ]) AS report_key
  LOOP
    result := result || jsonb_build_object(
      'report_key', ds.report_key,
      'source', 'bcba_productivity_billing_rows',
      'source_file_name', prod_batch.file_name,
      'source_system', prod_batch.source_system,
      'uploaded_at', prod_batch.created_at,
      'service_date_min', prod_stats.min_dos,
      'service_date_max', prod_stats.max_dos,
      'row_count', prod_stats.rows_total,
      'direct_rows', prod_stats.direct_rows,
      'supervision_rows', prod_stats.supervision_rows,
      'parent_training_rows', prod_stats.parent_training_rows,
      'cancellation_rows', prod_stats.cancellation_rows,
      'distinct_clients', prod_stats.distinct_clients,
      'distinct_providers', prod_stats.distinct_providers,
      'unmapped_providers', prod_stats.unmapped_providers,
      'status', CASE WHEN prod_batch.id IS NULL THEN 'missing' ELSE 'ready' END
    );
  END LOOP;

  -- File-based shared_report_datasets (authorization + cancellation exports).
  FOR ds IN
    SELECT DISTINCT ON (report_key) report_key, file_name, uploaded_at, file_size
      FROM public.shared_report_datasets
     WHERE is_active = true
     ORDER BY report_key, uploaded_at DESC
  LOOP
    result := result || jsonb_build_object(
      'report_key', ds.report_key,
      'source', 'shared_report_datasets',
      'source_file_name', ds.file_name,
      'uploaded_at', ds.uploaded_at,
      'file_size', ds.file_size,
      'status', 'ready'
    );
  END LOOP;

  RETURN result;
END $$;

GRANT EXECUTE ON FUNCTION public.report_source_coverage() TO authenticated;

COMMENT ON VIEW public.v_cr_canonical_sessions IS
  'Read-only canonical CentralReach session rows for reporting. Import-only; downstream code MUST NOT write clinical documentation back to CentralReach through this surface.';
COMMENT ON FUNCTION public.report_source_coverage() IS
  'Aggregated source coverage per report_key: file name, upload/sync time, row counts, date range, unmapped providers. No row-level PHI exposed.';
