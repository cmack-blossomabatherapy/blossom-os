
CREATE OR REPLACE FUNCTION public.canonical_report_totals(
  _start date DEFAULT NULL,
  _end date DEFAULT NULL,
  _search text DEFAULT NULL
) RETURNS TABLE(
  total_rows bigint,
  total_hours numeric,
  direct_hours numeric,
  supervision_hours numeric,
  parent_training_hours numeric,
  assessment_hours numeric,
  cancellation_hours numeric,
  admin_hours numeric,
  h97153 numeric,
  h97155 numeric,
  h97156 numeric,
  distinct_clients bigint,
  distinct_providers bigint,
  unmapped_rows bigint,
  unmapped_hours numeric,
  unmapped_providers bigint,
  min_service_date date,
  max_service_date date,
  min_batch_uploaded_at timestamptz,
  max_batch_uploaded_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT * FROM public.v_cr_canonical_sessions
    WHERE active = true
      AND (_start IS NULL OR service_date >= _start)
      AND (_end   IS NULL OR service_date <= _end)
      AND (_search IS NULL OR _search = ''
        OR client_name ILIKE '%' || _search || '%'
        OR provider_name ILIKE '%' || _search || '%')
  )
  SELECT
    count(*)::bigint,
    COALESCE(sum(hours),0)::numeric,
    COALESCE(sum(hours) FILTER (WHERE session_kind='direct'),0)::numeric,
    COALESCE(sum(hours) FILTER (WHERE session_kind='supervision'),0)::numeric,
    COALESCE(sum(hours) FILTER (WHERE session_kind='parent_training'),0)::numeric,
    COALESCE(sum(hours) FILTER (WHERE session_kind='assessment'),0)::numeric,
    COALESCE(sum(hours) FILTER (WHERE session_kind='cancellation'),0)::numeric,
    COALESCE(sum(hours) FILTER (WHERE session_kind='admin'),0)::numeric,
    COALESCE(sum(hours) FILTER (WHERE procedure_code_root='97153'),0)::numeric,
    COALESCE(sum(hours) FILTER (WHERE procedure_code_root='97155'),0)::numeric,
    COALESCE(sum(hours) FILTER (WHERE procedure_code_root='97156'),0)::numeric,
    count(DISTINCT cr_client_id) FILTER (WHERE cr_client_id IS NOT NULL)::bigint,
    count(DISTINCT cr_provider_id) FILTER (WHERE cr_provider_id IS NOT NULL)::bigint,
    count(*) FILTER (WHERE provider_mapping_status IS DISTINCT FROM 'mapped')::bigint,
    COALESCE(sum(hours) FILTER (WHERE provider_mapping_status IS DISTINCT FROM 'mapped'),0)::numeric,
    count(DISTINCT cr_provider_id) FILTER (WHERE provider_mapping_status IS DISTINCT FROM 'mapped')::bigint,
    min(service_date), max(service_date),
    min(batch_uploaded_at), max(batch_uploaded_at)
  FROM base
$$;
GRANT EXECUTE ON FUNCTION public.canonical_report_totals(date,date,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.canonical_report_client_hours(
  _start date DEFAULT NULL,
  _end date DEFAULT NULL,
  _search text DEFAULT NULL,
  _limit int DEFAULT 500,
  _offset int DEFAULT 0
) RETURNS TABLE(
  cr_client_id text, client_name text,
  h97153 numeric, h97155 numeric, h97156 numeric,
  total_hours numeric, row_count bigint,
  distinct_providers bigint,
  primary_provider text, primary_provider_id text,
  min_service_date date, max_service_date date,
  total_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT * FROM public.v_cr_canonical_sessions
    WHERE active = true
      AND (_start IS NULL OR service_date >= _start)
      AND (_end   IS NULL OR service_date <= _end)
      AND (_search IS NULL OR _search = ''
        OR client_name ILIKE '%' || _search || '%'
        OR provider_name ILIKE '%' || _search || '%')
      AND (cr_client_id IS NOT NULL OR client_name IS NOT NULL)
  ),
  per_client_provider AS (
    SELECT
      COALESCE(cr_client_id, client_name_key) AS client_key,
      max(cr_client_id) AS cr_client_id,
      max(client_name) AS client_name,
      cr_provider_id,
      max(provider_name) AS provider_name,
      sum(hours) AS phours
    FROM base
    GROUP BY 1, cr_provider_id
  ),
  primary_provider_pick AS (
    SELECT DISTINCT ON (client_key)
      client_key, cr_provider_id, provider_name, phours
    FROM per_client_provider
    ORDER BY client_key, phours DESC NULLS LAST, provider_name
  ),
  agg AS (
    SELECT
      COALESCE(cr_client_id, client_name_key) AS client_key,
      max(cr_client_id) AS cr_client_id,
      max(client_name) AS client_name,
      COALESCE(sum(hours) FILTER (WHERE procedure_code_root='97153'),0) AS h97153,
      COALESCE(sum(hours) FILTER (WHERE procedure_code_root='97155'),0) AS h97155,
      COALESCE(sum(hours) FILTER (WHERE procedure_code_root='97156'),0) AS h97156,
      COALESCE(sum(hours),0) AS total_hours,
      count(*)::bigint AS row_count,
      count(DISTINCT cr_provider_id) FILTER (WHERE cr_provider_id IS NOT NULL)::bigint AS distinct_providers,
      min(service_date) AS min_service_date,
      max(service_date) AS max_service_date
    FROM base GROUP BY 1
  ),
  total AS (SELECT count(*)::bigint AS n FROM agg)
  SELECT a.cr_client_id, a.client_name,
    a.h97153, a.h97155, a.h97156,
    a.total_hours, a.row_count, a.distinct_providers,
    p.provider_name, p.cr_provider_id,
    a.min_service_date, a.max_service_date,
    (SELECT n FROM total)
  FROM agg a
  LEFT JOIN primary_provider_pick p ON p.client_key = a.client_key
  ORDER BY a.total_hours DESC NULLS LAST, a.client_name
  LIMIT GREATEST(COALESCE(_limit,500),1)
  OFFSET GREATEST(COALESCE(_offset,0),0);
$$;
GRANT EXECUTE ON FUNCTION public.canonical_report_client_hours(date,date,text,int,int) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.canonical_report_provider_hours(
  _start date DEFAULT NULL,
  _end date DEFAULT NULL,
  _search text DEFAULT NULL,
  _include_unmapped boolean DEFAULT true,
  _limit int DEFAULT 500,
  _offset int DEFAULT 0
) RETURNS TABLE(
  cr_provider_id text, provider_name text,
  provider_employee_id uuid, provider_auth_user_id uuid,
  mapping_status text,
  direct_hours numeric, supervision_hours numeric,
  parent_training_hours numeric, assessment_hours numeric, admin_hours numeric,
  total_hours numeric, total_units numeric,
  row_count bigint, distinct_clients bigint,
  min_service_date date, max_service_date date,
  total_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT * FROM public.v_cr_canonical_sessions
    WHERE active = true
      AND (_start IS NULL OR service_date >= _start)
      AND (_end   IS NULL OR service_date <= _end)
      AND (_search IS NULL OR _search = ''
        OR client_name ILIKE '%' || _search || '%'
        OR provider_name ILIKE '%' || _search || '%')
      AND (_include_unmapped OR provider_mapping_status = 'mapped')
  ),
  agg AS (
    SELECT
      cr_provider_id,
      max(provider_name) AS provider_name,
      (array_agg(provider_employee_id) FILTER (WHERE provider_employee_id IS NOT NULL))[1] AS provider_employee_id,
      (array_agg(provider_auth_user_id) FILTER (WHERE provider_auth_user_id IS NOT NULL))[1] AS provider_auth_user_id,
      max(provider_mapping_status) AS mapping_status,
      COALESCE(sum(hours) FILTER (WHERE session_kind='direct'),0) AS direct_hours,
      COALESCE(sum(hours) FILTER (WHERE session_kind='supervision'),0) AS supervision_hours,
      COALESCE(sum(hours) FILTER (WHERE session_kind='parent_training'),0) AS parent_training_hours,
      COALESCE(sum(hours) FILTER (WHERE session_kind='assessment'),0) AS assessment_hours,
      COALESCE(sum(hours) FILTER (WHERE session_kind='admin'),0) AS admin_hours,
      COALESCE(sum(hours),0) AS total_hours,
      COALESCE(sum(units),0) AS total_units,
      count(*)::bigint AS row_count,
      count(DISTINCT cr_client_id) FILTER (WHERE cr_client_id IS NOT NULL)::bigint AS distinct_clients,
      min(service_date) AS min_service_date,
      max(service_date) AS max_service_date
    FROM base GROUP BY cr_provider_id
  ),
  total AS (SELECT count(*)::bigint AS n FROM agg)
  SELECT
    a.cr_provider_id, a.provider_name,
    a.provider_employee_id, a.provider_auth_user_id,
    a.mapping_status,
    a.direct_hours, a.supervision_hours, a.parent_training_hours,
    a.assessment_hours, a.admin_hours,
    a.total_hours, a.total_units,
    a.row_count, a.distinct_clients,
    a.min_service_date, a.max_service_date,
    (SELECT n FROM total)
  FROM agg a
  ORDER BY a.total_hours DESC NULLS LAST, a.provider_name
  LIMIT GREATEST(COALESCE(_limit,500),1)
  OFFSET GREATEST(COALESCE(_offset,0),0);
$$;
GRANT EXECUTE ON FUNCTION public.canonical_report_provider_hours(date,date,text,boolean,int,int) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.canonical_report_billing_rows(
  _start date DEFAULT NULL,
  _end date DEFAULT NULL,
  _search text DEFAULT NULL,
  _client_id text DEFAULT NULL,
  _provider_id text DEFAULT NULL,
  _kinds text[] DEFAULT NULL,
  _codes text[] DEFAULT NULL,
  _limit int DEFAULT 1000,
  _offset int DEFAULT 0
) RETURNS TABLE(
  row_id uuid, batch_id uuid, source_file_name text, batch_uploaded_at timestamptz,
  service_date date, cr_client_id text, client_name text,
  cr_provider_id text, provider_name text,
  provider_employee_id uuid, provider_auth_user_id uuid, provider_mapping_status text,
  procedure_code text, procedure_code_root text, session_kind text,
  hours numeric, units numeric, total_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT * FROM public.v_cr_canonical_sessions
    WHERE active = true
      AND (_start IS NULL OR service_date >= _start)
      AND (_end   IS NULL OR service_date <= _end)
      AND (_client_id IS NULL OR cr_client_id = _client_id)
      AND (_provider_id IS NULL OR cr_provider_id = _provider_id)
      AND (_kinds IS NULL OR session_kind = ANY(_kinds))
      AND (_codes IS NULL OR procedure_code_root = ANY(_codes))
      AND (_search IS NULL OR _search = ''
        OR client_name ILIKE '%' || _search || '%'
        OR provider_name ILIKE '%' || _search || '%')
  ),
  total AS (SELECT count(*)::bigint AS n FROM base)
  SELECT b.row_id, b.batch_id, b.source_file_name, b.batch_uploaded_at,
    b.service_date, b.cr_client_id, b.client_name,
    b.cr_provider_id, b.provider_name, b.provider_employee_id,
    b.provider_auth_user_id, b.provider_mapping_status,
    b.procedure_code, b.procedure_code_root, b.session_kind,
    b.hours, b.units, (SELECT n FROM total)
  FROM base b
  ORDER BY b.service_date DESC NULLS LAST, b.client_name, b.provider_name
  LIMIT GREATEST(COALESCE(_limit,1000),1)
  OFFSET GREATEST(COALESCE(_offset,0),0);
$$;
GRANT EXECUTE ON FUNCTION public.canonical_report_billing_rows(date,date,text,text,text,text[],text[],int,int) TO authenticated, service_role;
