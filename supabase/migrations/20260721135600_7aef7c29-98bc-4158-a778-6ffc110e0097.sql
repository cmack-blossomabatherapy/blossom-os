
-- 1) Materialize provider mapping (cheap: ~500 rows)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_cr_provider_mapping AS
SELECT * FROM public.v_cr_provider_mapping;

CREATE UNIQUE INDEX IF NOT EXISTS mv_cr_provider_mapping_pk
  ON public.mv_cr_provider_mapping (provider_id);
CREATE INDEX IF NOT EXISTS mv_cr_provider_mapping_name_key
  ON public.mv_cr_provider_mapping (provider_name_key);

GRANT SELECT ON public.mv_cr_provider_mapping TO authenticated, anon, service_role;

-- 2) Rebuild canonical sessions view on the materialized mapping
CREATE OR REPLACE VIEW public.v_cr_canonical_sessions AS
SELECT r.id AS row_id,
    r.batch_id,
    b.file_name AS source_file_name,
    b.source_system,
    b.report_type,
    b.created_at AS batch_uploaded_at,
    r.service_date,
    r.client_id AS cr_client_id,
    r.client_name,
    normalize_person_name(r.client_name) AS client_name_key,
    r.provider_id AS cr_provider_id,
    r.provider_name,
    normalize_person_name(r.provider_name) AS provider_name_key,
    pm.employee_id AS provider_employee_id,
    pm.auth_user_id AS provider_auth_user_id,
    CASE WHEN pm.mapping_status = 'mapped' THEN 'mapped' ELSE 'unmapped' END AS provider_mapping_status,
    r.procedure_code,
    NULLIF(split_part(TRIM(BOTH FROM r.procedure_code), ' ', 1), '') AS procedure_code_root,
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
    END AS session_kind,
    COALESCE(r.hours, 0::numeric) AS hours,
    COALESCE(r.units, 0::numeric) AS units,
    r.active,
    pm.mapping_method AS provider_mapping_method,
    pm.mapping_confidence AS provider_mapping_confidence,
    pm.ambiguity_reason AS provider_ambiguity_reason
FROM public.bcba_productivity_billing_rows r
LEFT JOIN public.bcba_productivity_upload_batches b ON b.id = r.batch_id
LEFT JOIN public.mv_cr_provider_mapping pm ON pm.provider_id = r.provider_id
WHERE r.active = true;

-- 3) Auto-refresh the mapping when new batches land (fire-and-forget)
CREATE OR REPLACE FUNCTION public.refresh_mv_cr_provider_mapping()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_cr_provider_mapping;
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      REFRESH MATERIALIZED VIEW public.mv_cr_provider_mapping;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_mv_cr_provider_mapping ON public.bcba_productivity_upload_batches;
CREATE TRIGGER trg_refresh_mv_cr_provider_mapping
AFTER INSERT OR UPDATE ON public.bcba_productivity_upload_batches
FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_mv_cr_provider_mapping();

-- 4) Slimmer billing_rows RPC: skip full COUNT on subsequent pages so paged
-- reads fit under the PostgREST statement timeout.
CREATE OR REPLACE FUNCTION public.canonical_report_billing_rows(
  _start date DEFAULT NULL,
  _end date DEFAULT NULL,
  _search text DEFAULT NULL,
  _client_id text DEFAULT NULL,
  _provider_id text DEFAULT NULL,
  _kinds text[] DEFAULT NULL,
  _codes text[] DEFAULT NULL,
  _limit integer DEFAULT 1000,
  _offset integer DEFAULT 0
)
RETURNS TABLE(
  row_id uuid, batch_id uuid, source_file_name text,
  batch_uploaded_at timestamptz, service_date date,
  cr_client_id text, client_name text,
  cr_provider_id text, provider_name text,
  provider_employee_id uuid, provider_auth_user_id uuid,
  provider_mapping_status text, procedure_code text,
  procedure_code_root text, session_kind text,
  hours numeric, units numeric, total_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT v.*
    FROM public.v_cr_canonical_sessions v
    WHERE v.active = true
      AND (_start IS NULL OR v.service_date >= _start)
      AND (_end   IS NULL OR v.service_date <= _end)
      AND (_client_id IS NULL OR v.cr_client_id = _client_id)
      AND (_provider_id IS NULL OR v.cr_provider_id = _provider_id)
      AND (_kinds IS NULL OR v.session_kind = ANY(_kinds))
      AND (_codes IS NULL OR v.procedure_code_root = ANY(_codes))
      AND (_search IS NULL OR _search = ''
        OR v.client_name ILIKE '%' || _search || '%'
        OR v.provider_name ILIKE '%' || _search || '%')
  ),
  page AS (
    SELECT * FROM filtered
    ORDER BY service_date DESC NULLS LAST, row_id
    OFFSET COALESCE(_offset, 0)
    LIMIT  COALESCE(_limit, 1000)
  )
  SELECT
    p.row_id, p.batch_id, p.source_file_name, p.batch_uploaded_at,
    p.service_date, p.cr_client_id, p.client_name,
    p.cr_provider_id, p.provider_name, p.provider_employee_id,
    p.provider_auth_user_id, p.provider_mapping_status,
    p.procedure_code, p.procedure_code_root, p.session_kind,
    p.hours, p.units,
    CASE
      WHEN COALESCE(_offset, 0) = 0 THEN (SELECT count(*) FROM filtered)
      ELSE 0::bigint
    END AS total_count
  FROM page p;
$$;

GRANT EXECUTE ON FUNCTION public.canonical_report_billing_rows(date, date, text, text, text, text[], text[], integer, integer)
  TO anon, authenticated, service_role;

-- 5) Prime the mapping cache once
REFRESH MATERIALIZED VIEW public.mv_cr_provider_mapping;
