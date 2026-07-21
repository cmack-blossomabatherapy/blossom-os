
-- Canonical reporting RPCs over v_cr_canonical_sessions.
-- All SECURITY INVOKER so caller's RLS on bcba_productivity_billing_rows applies.

CREATE OR REPLACE FUNCTION public.canonical_sessions_provider_summary(
  _auth_user_id uuid DEFAULT NULL,
  _employee_id  uuid DEFAULT NULL,
  _start        date DEFAULT NULL,
  _end          date DEFAULT NULL
) RETURNS TABLE (
  session_kind text,
  hours numeric,
  units numeric,
  row_count bigint,
  distinct_clients bigint,
  min_service_date date,
  max_service_date date
)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT
    v.session_kind,
    COALESCE(SUM(v.hours), 0)::numeric AS hours,
    COALESCE(SUM(v.units), 0)::numeric AS units,
    COUNT(*)::bigint                    AS row_count,
    COUNT(DISTINCT v.cr_client_id)::bigint AS distinct_clients,
    MIN(v.service_date)                 AS min_service_date,
    MAX(v.service_date)                 AS max_service_date
  FROM public.v_cr_canonical_sessions v
  WHERE
    (_auth_user_id IS NULL OR v.provider_auth_user_id = _auth_user_id)
    AND (_employee_id IS NULL OR v.provider_employee_id = _employee_id)
    AND (_start IS NULL OR v.service_date >= _start)
    AND (_end   IS NULL OR v.service_date <= _end)
    -- If a scope was requested but neither maps, return nothing rather than all rows.
    AND (_auth_user_id IS NULL OR v.provider_auth_user_id IS NOT NULL)
    AND (_employee_id  IS NULL OR v.provider_employee_id  IS NOT NULL)
  GROUP BY v.session_kind
$$;

CREATE OR REPLACE FUNCTION public.canonical_sessions_client_summary(
  _auth_user_id uuid DEFAULT NULL,
  _employee_id  uuid DEFAULT NULL,
  _start        date DEFAULT NULL,
  _end          date DEFAULT NULL
) RETURNS TABLE (
  cr_client_id text,
  client_name text,
  session_kind text,
  hours numeric,
  units numeric,
  row_count bigint,
  min_service_date date,
  max_service_date date
)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT
    v.cr_client_id,
    MAX(v.client_name) AS client_name,
    v.session_kind,
    COALESCE(SUM(v.hours), 0)::numeric AS hours,
    COALESCE(SUM(v.units), 0)::numeric AS units,
    COUNT(*)::bigint                    AS row_count,
    MIN(v.service_date)                 AS min_service_date,
    MAX(v.service_date)                 AS max_service_date
  FROM public.v_cr_canonical_sessions v
  WHERE
    (_auth_user_id IS NULL OR v.provider_auth_user_id = _auth_user_id)
    AND (_employee_id IS NULL OR v.provider_employee_id = _employee_id)
    AND (_start IS NULL OR v.service_date >= _start)
    AND (_end   IS NULL OR v.service_date <= _end)
    AND (_auth_user_id IS NULL OR v.provider_auth_user_id IS NOT NULL)
    AND (_employee_id  IS NULL OR v.provider_employee_id  IS NOT NULL)
    AND v.cr_client_id IS NOT NULL
  GROUP BY v.cr_client_id, v.session_kind
$$;

CREATE OR REPLACE FUNCTION public.canonical_sessions_rows(
  _auth_user_id uuid    DEFAULT NULL,
  _employee_id  uuid    DEFAULT NULL,
  _client_id    text    DEFAULT NULL,
  _kinds        text[]  DEFAULT NULL,
  _start        date    DEFAULT NULL,
  _end          date    DEFAULT NULL,
  _limit        int     DEFAULT 500
) RETURNS TABLE (
  row_id uuid,
  batch_id uuid,
  source_file_name text,
  batch_uploaded_at timestamptz,
  service_date date,
  cr_client_id text,
  client_name text,
  cr_provider_id text,
  provider_name text,
  provider_employee_id uuid,
  provider_auth_user_id uuid,
  procedure_code text,
  session_kind text,
  hours numeric,
  units numeric
)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  -- Deterministic dedupe: within (service_date, cr_client_id, cr_provider_id,
  -- procedure_code, hours) keep the newest batch's row (largest row_id as a
  -- stable tiebreak). This filters accidental re-uploads without hiding real
  -- distinct sessions.
  SELECT
    d.row_id, d.batch_id, d.source_file_name, d.batch_uploaded_at,
    d.service_date, d.cr_client_id, d.client_name, d.cr_provider_id,
    d.provider_name, d.provider_employee_id, d.provider_auth_user_id,
    d.procedure_code, d.session_kind, d.hours, d.units
  FROM (
    SELECT DISTINCT ON (
      v.service_date, v.cr_client_id, v.cr_provider_id, v.procedure_code, v.hours
    )
      v.row_id, v.batch_id, v.source_file_name, v.batch_uploaded_at,
      v.service_date, v.cr_client_id, v.client_name, v.cr_provider_id,
      v.provider_name, v.provider_employee_id, v.provider_auth_user_id,
      v.procedure_code, v.session_kind, v.hours, v.units
    FROM public.v_cr_canonical_sessions v
    WHERE
      (_auth_user_id IS NULL OR v.provider_auth_user_id = _auth_user_id)
      AND (_employee_id IS NULL OR v.provider_employee_id = _employee_id)
      AND (_client_id   IS NULL OR v.cr_client_id = _client_id)
      AND (_kinds       IS NULL OR v.session_kind = ANY(_kinds))
      AND (_start       IS NULL OR v.service_date >= _start)
      AND (_end         IS NULL OR v.service_date <= _end)
      AND (_auth_user_id IS NULL OR v.provider_auth_user_id IS NOT NULL)
      AND (_employee_id  IS NULL OR v.provider_employee_id  IS NOT NULL)
    ORDER BY
      v.service_date, v.cr_client_id, v.cr_provider_id,
      v.procedure_code, v.hours,
      v.batch_uploaded_at DESC NULLS LAST, v.row_id DESC
  ) d
  ORDER BY d.service_date DESC, d.client_name
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 500), 5000))
$$;

CREATE OR REPLACE FUNCTION public.canonical_sessions_unmapped_providers(
  _limit int DEFAULT 100
) RETURNS TABLE (
  cr_provider_id text,
  provider_name text,
  row_count bigint,
  distinct_clients bigint,
  min_service_date date,
  max_service_date date
)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT
    v.cr_provider_id,
    MAX(v.provider_name) AS provider_name,
    COUNT(*)::bigint     AS row_count,
    COUNT(DISTINCT v.cr_client_id)::bigint AS distinct_clients,
    MIN(v.service_date)  AS min_service_date,
    MAX(v.service_date)  AS max_service_date
  FROM public.v_cr_canonical_sessions v
  WHERE v.provider_employee_id IS NULL
    AND v.cr_provider_id IS NOT NULL
  GROUP BY v.cr_provider_id
  ORDER BY row_count DESC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 100), 500))
$$;

REVOKE EXECUTE ON FUNCTION public.canonical_sessions_provider_summary(uuid, uuid, date, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.canonical_sessions_client_summary(uuid, uuid, date, date)   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.canonical_sessions_rows(uuid, uuid, text, text[], date, date, int) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.canonical_sessions_unmapped_providers(int) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.canonical_sessions_provider_summary(uuid, uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.canonical_sessions_client_summary(uuid, uuid, date, date)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.canonical_sessions_rows(uuid, uuid, text, text[], date, date, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.canonical_sessions_unmapped_providers(int) TO authenticated;

COMMENT ON FUNCTION public.canonical_sessions_provider_summary(uuid, uuid, date, date) IS
  'Aggregate hours-by-kind for a reconciled provider. Import-only. Returns nothing if scope requested but provider not mapped.';
COMMENT ON FUNCTION public.canonical_sessions_rows(uuid, uuid, text, text[], date, date, int) IS
  'Deduped, filtered canonical CentralReach session rows for tables/drilldowns/exports. Deterministic dedupe on (dos,client,provider,proc,hours) keeping newest batch.';
