
-- Helper: does the caller have wide (company-wide) canonical-reporting access?
CREATE OR REPLACE FUNCTION public.can_report_canonical_wide(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid
      AND role::text IN (
        'admin','super_admin','systems_admin',
        'exec','executive','coo','director_of_operations','operations_manager','ops_manager',
        'qa','qa_director','qa_specialist',
        'auth_team','authorization_manager','authorization_coordinator',
        'scheduling','scheduling_lead','scheduling_coordinator',
        'staffing','staffing_lead','staffing_coordinator',
        'state_director','assistant_state_director',
        'clinical_director','clinical_lead','clinic_director','behavioral_support',
        'hr','hr_admin','hr_manager','hr_lead','hr_admin_assistant',
        'finance','billing_lead','payroll_admin','payroll_lead','payroll_coordinator',
        'credentialing','credentialing_lead','credentialing_team',
        'dept_manager'
      )
  )
$$;

REVOKE ALL ON FUNCTION public.can_report_canonical_wide(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_report_canonical_wide(uuid) TO authenticated, service_role;

-- Provider summary
CREATE OR REPLACE FUNCTION public.canonical_sessions_provider_summary(
  _auth_user_id uuid DEFAULT NULL,
  _employee_id uuid DEFAULT NULL,
  _start date DEFAULT NULL,
  _end date DEFAULT NULL
)
RETURNS TABLE(
  session_kind text, hours numeric, units numeric, row_count bigint,
  distinct_clients bigint, min_service_date date, max_service_date date
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  wide boolean;
  self_auth uuid;
  self_emp uuid;
BEGIN
  IF uid IS NULL THEN
    RETURN;
  END IF;
  wide := public.can_report_canonical_wide(uid);
  IF NOT wide THEN
    self_auth := uid;
    SELECT e.id INTO self_emp FROM public.employees e WHERE e.user_id = uid LIMIT 1;
    -- Non-privileged callers may only see their own scoped data.
    IF _auth_user_id IS NOT NULL AND _auth_user_id <> self_auth THEN RETURN; END IF;
    IF _employee_id IS NOT NULL AND _employee_id <> self_emp THEN RETURN; END IF;
    IF _auth_user_id IS NULL AND _employee_id IS NULL THEN
      _auth_user_id := self_auth;
      _employee_id := self_emp;
    END IF;
  END IF;

  RETURN QUERY
    SELECT
      v.session_kind,
      COALESCE(SUM(v.hours), 0)::numeric,
      COALESCE(SUM(v.units), 0)::numeric,
      COUNT(*)::bigint,
      COUNT(DISTINCT v.cr_client_id)::bigint,
      MIN(v.service_date),
      MAX(v.service_date)
    FROM public.v_cr_canonical_sessions v
    WHERE (_auth_user_id IS NULL OR v.provider_auth_user_id = _auth_user_id)
      AND (_employee_id IS NULL OR v.provider_employee_id = _employee_id)
      AND (_start IS NULL OR v.service_date >= _start)
      AND (_end IS NULL OR v.service_date <= _end)
      AND (_auth_user_id IS NULL OR v.provider_auth_user_id IS NOT NULL)
      AND (_employee_id IS NULL OR v.provider_employee_id IS NOT NULL)
    GROUP BY v.session_kind;
END;
$$;

REVOKE ALL ON FUNCTION public.canonical_sessions_provider_summary(uuid,uuid,date,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.canonical_sessions_provider_summary(uuid,uuid,date,date) TO authenticated, service_role;

-- Client summary
CREATE OR REPLACE FUNCTION public.canonical_sessions_client_summary(
  _auth_user_id uuid DEFAULT NULL,
  _employee_id uuid DEFAULT NULL,
  _start date DEFAULT NULL,
  _end date DEFAULT NULL
)
RETURNS TABLE(
  cr_client_id text, client_name text, session_kind text, hours numeric,
  units numeric, row_count bigint, min_service_date date, max_service_date date
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  wide boolean;
  self_auth uuid;
  self_emp uuid;
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  wide := public.can_report_canonical_wide(uid);
  IF NOT wide THEN
    self_auth := uid;
    SELECT e.id INTO self_emp FROM public.employees e WHERE e.user_id = uid LIMIT 1;
    IF _auth_user_id IS NOT NULL AND _auth_user_id <> self_auth THEN RETURN; END IF;
    IF _employee_id IS NOT NULL AND _employee_id <> self_emp THEN RETURN; END IF;
    IF _auth_user_id IS NULL AND _employee_id IS NULL THEN
      _auth_user_id := self_auth;
      _employee_id := self_emp;
    END IF;
  END IF;

  RETURN QUERY
    SELECT
      v.cr_client_id,
      MAX(v.client_name),
      v.session_kind,
      COALESCE(SUM(v.hours), 0)::numeric,
      COALESCE(SUM(v.units), 0)::numeric,
      COUNT(*)::bigint,
      MIN(v.service_date),
      MAX(v.service_date)
    FROM public.v_cr_canonical_sessions v
    WHERE (_auth_user_id IS NULL OR v.provider_auth_user_id = _auth_user_id)
      AND (_employee_id IS NULL OR v.provider_employee_id = _employee_id)
      AND (_start IS NULL OR v.service_date >= _start)
      AND (_end IS NULL OR v.service_date <= _end)
      AND (_auth_user_id IS NULL OR v.provider_auth_user_id IS NOT NULL)
      AND (_employee_id IS NULL OR v.provider_employee_id IS NOT NULL)
      AND v.cr_client_id IS NOT NULL
    GROUP BY v.cr_client_id, v.session_kind;
END;
$$;

REVOKE ALL ON FUNCTION public.canonical_sessions_client_summary(uuid,uuid,date,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.canonical_sessions_client_summary(uuid,uuid,date,date) TO authenticated, service_role;

-- Session rows
CREATE OR REPLACE FUNCTION public.canonical_sessions_rows(
  _auth_user_id uuid DEFAULT NULL,
  _employee_id uuid DEFAULT NULL,
  _client_id text DEFAULT NULL,
  _kinds text[] DEFAULT NULL,
  _start date DEFAULT NULL,
  _end date DEFAULT NULL,
  _limit integer DEFAULT 500
)
RETURNS TABLE(
  row_id uuid, batch_id uuid, source_file_name text, batch_uploaded_at timestamptz,
  service_date date, cr_client_id text, client_name text, cr_provider_id text,
  provider_name text, provider_employee_id uuid, provider_auth_user_id uuid,
  procedure_code text, session_kind text, hours numeric, units numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  wide boolean;
  self_auth uuid;
  self_emp uuid;
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  wide := public.can_report_canonical_wide(uid);
  IF NOT wide THEN
    self_auth := uid;
    SELECT e.id INTO self_emp FROM public.employees e WHERE e.user_id = uid LIMIT 1;
    IF _auth_user_id IS NOT NULL AND _auth_user_id <> self_auth THEN RETURN; END IF;
    IF _employee_id IS NOT NULL AND _employee_id <> self_emp THEN RETURN; END IF;
    IF _auth_user_id IS NULL AND _employee_id IS NULL THEN
      _auth_user_id := self_auth;
      _employee_id := self_emp;
    END IF;
  END IF;

  RETURN QUERY
    SELECT
      d.row_id, d.batch_id, d.source_file_name, d.batch_uploaded_at,
      d.service_date, d.cr_client_id, d.client_name, d.cr_provider_id,
      d.provider_name, d.provider_employee_id, d.provider_auth_user_id,
      d.procedure_code, d.session_kind, d.hours, d.units
    FROM (
      SELECT DISTINCT ON (v.service_date, v.cr_client_id, v.cr_provider_id, v.procedure_code, v.hours)
        v.row_id, v.batch_id, v.source_file_name, v.batch_uploaded_at,
        v.service_date, v.cr_client_id, v.client_name, v.cr_provider_id,
        v.provider_name, v.provider_employee_id, v.provider_auth_user_id,
        v.procedure_code, v.session_kind, v.hours, v.units
      FROM public.v_cr_canonical_sessions v
      WHERE (_auth_user_id IS NULL OR v.provider_auth_user_id = _auth_user_id)
        AND (_employee_id IS NULL OR v.provider_employee_id = _employee_id)
        AND (_client_id IS NULL OR v.cr_client_id = _client_id)
        AND (_kinds IS NULL OR v.session_kind = ANY(_kinds))
        AND (_start IS NULL OR v.service_date >= _start)
        AND (_end IS NULL OR v.service_date <= _end)
        AND (_auth_user_id IS NULL OR v.provider_auth_user_id IS NOT NULL)
        AND (_employee_id IS NULL OR v.provider_employee_id IS NOT NULL)
      ORDER BY v.service_date, v.cr_client_id, v.cr_provider_id, v.procedure_code, v.hours,
               v.batch_uploaded_at DESC NULLS LAST, v.row_id DESC
    ) d
    ORDER BY d.service_date DESC, d.client_name
    LIMIT GREATEST(1, LEAST(COALESCE(_limit, 500), 5000));
END;
$$;

REVOKE ALL ON FUNCTION public.canonical_sessions_rows(uuid,uuid,text,text[],date,date,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.canonical_sessions_rows(uuid,uuid,text,text[],date,date,integer) TO authenticated, service_role;

-- Unmapped providers - leadership only
CREATE OR REPLACE FUNCTION public.canonical_sessions_unmapped_providers(_limit integer DEFAULT 100)
RETURNS TABLE(
  cr_provider_id text, provider_name text, row_count bigint,
  distinct_clients bigint, min_service_date date, max_service_date date
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.can_report_canonical_wide(uid) THEN
    RETURN;
  END IF;
  RETURN QUERY
    SELECT
      v.cr_provider_id,
      MAX(v.provider_name),
      COUNT(*)::bigint,
      COUNT(DISTINCT v.cr_client_id)::bigint,
      MIN(v.service_date),
      MAX(v.service_date)
    FROM public.v_cr_canonical_sessions v
    WHERE v.provider_employee_id IS NULL
      AND v.cr_provider_id IS NOT NULL
    GROUP BY v.cr_provider_id
    ORDER BY COUNT(*) DESC
    LIMIT GREATEST(1, LEAST(COALESCE(_limit, 100), 500));
END;
$$;

REVOKE ALL ON FUNCTION public.canonical_sessions_unmapped_providers(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.canonical_sessions_unmapped_providers(integer) TO authenticated, service_role;
