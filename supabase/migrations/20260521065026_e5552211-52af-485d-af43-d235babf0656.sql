
CREATE OR REPLACE FUNCTION public.current_user_state()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.state FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.can_read_all_states()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'exec')
    OR public.has_role(auth.uid(),'ops_manager')
    OR public.has_role(auth.uid(),'finance')
    OR public.has_role(auth.uid(),'qa')
    OR public.has_role(auth.uid(),'auth_team')
    OR public.has_role(auth.uid(),'scheduling')
    OR public.has_role(auth.uid(),'intake')
    OR public.has_role(auth.uid(),'hr_admin')
    OR public.has_role(auth.uid(),'hr_manager')
    OR public.has_role(auth.uid(),'hr')
$$;

CREATE OR REPLACE VIEW public.v_clients_real
WITH (security_invoker=on) AS
WITH ranked AS (
  SELECT
    client_full,
    COALESCE(state,'UNASSIGNED') AS state,
    bcba_name,
    ROW_NUMBER() OVER (
      PARTITION BY client_full, COALESCE(state,'UNASSIGNED')
      ORDER BY SUM(hours) DESC NULLS LAST
    ) AS rn
  FROM public.bcba_billable_sessions
  WHERE client_full IS NOT NULL
  GROUP BY client_full, COALESCE(state,'UNASSIGNED'), bcba_name
),
agg AS (
  SELECT
    client_full,
    COALESCE(state,'UNASSIGNED') AS state,
    MIN(date_of_service) AS first_service_date,
    MAX(date_of_service) AS last_service_date,
    COUNT(*) AS total_sessions,
    COALESCE(SUM(hours),0) AS total_hours,
    COALESCE(SUM(charges_total),0) AS total_charges,
    COALESCE(SUM(amount_paid),0) AS total_paid,
    COALESCE(SUM(amount_owed),0) AS total_owed,
    MAX(payor_name) AS payor_name,
    MAX(payor_type) AS payor_type,
    MAX(service_location) AS service_location
  FROM public.bcba_billable_sessions
  WHERE client_full IS NOT NULL
  GROUP BY client_full, COALESCE(state,'UNASSIGNED')
)
SELECT
  a.client_full,
  a.state,
  r.bcba_name AS primary_bcba,
  a.first_service_date,
  a.last_service_date,
  a.total_sessions,
  a.total_hours,
  a.total_charges,
  a.total_paid,
  a.total_owed,
  a.payor_name,
  a.payor_type,
  a.service_location,
  (a.last_service_date >= CURRENT_DATE - INTERVAL '30 days') AS is_active
FROM agg a
LEFT JOIN ranked r ON r.client_full = a.client_full AND r.state = a.state AND r.rn = 1;

CREATE OR REPLACE VIEW public.v_bcbas_real
WITH (security_invoker=on) AS
SELECT
  bcba_name,
  COALESCE(state,'UNASSIGNED') AS state,
  COUNT(DISTINCT client_full) AS clients_served,
  MIN(date_of_service) AS first_service_date,
  MAX(date_of_service) AS last_service_date,
  COUNT(*) AS total_sessions,
  COALESCE(SUM(hours),0) AS total_hours,
  COALESCE(SUM(charges_total),0) AS total_charges,
  COALESCE(SUM(amount_paid),0) AS total_paid,
  ROUND(
    COALESCE(SUM(hours),0)
    / NULLIF(GREATEST((MAX(date_of_service) - MIN(date_of_service))::numeric / 7.0, 1.0), 0),
    1
  ) AS avg_weekly_hours
FROM public.bcba_billable_sessions
WHERE bcba_name IS NOT NULL
GROUP BY bcba_name, COALESCE(state,'UNASSIGNED');

CREATE OR REPLACE VIEW public.v_state_kpis_weekly
WITH (security_invoker=on) AS
SELECT
  COALESCE(state,'UNASSIGNED') AS state,
  date_trunc('week', date_of_service)::date AS week_start,
  COUNT(*) AS sessions,
  COALESCE(SUM(hours),0) AS hours,
  COALESCE(SUM(charges_total),0) AS charges,
  COALESCE(SUM(amount_paid),0) AS collected,
  COALESCE(SUM(amount_owed),0) AS outstanding,
  COUNT(DISTINCT client_full) AS active_clients,
  COUNT(DISTINCT bcba_name) AS active_bcbas,
  COUNT(*) FILTER (WHERE procedure_code = '97155') AS supervision_sessions,
  COUNT(*) FILTER (WHERE procedure_code = '97153') AS direct_sessions
FROM public.bcba_billable_sessions
GROUP BY COALESCE(state,'UNASSIGNED'), date_trunc('week', date_of_service);

CREATE OR REPLACE VIEW public.v_state_kpis_monthly
WITH (security_invoker=on) AS
SELECT
  COALESCE(state,'UNASSIGNED') AS state,
  date_trunc('month', date_of_service)::date AS month_start,
  COUNT(*) AS sessions,
  COALESCE(SUM(hours),0) AS hours,
  COALESCE(SUM(charges_total),0) AS charges,
  COALESCE(SUM(amount_paid),0) AS collected,
  COALESCE(SUM(amount_owed),0) AS outstanding,
  COUNT(DISTINCT client_full) AS active_clients,
  COUNT(DISTINCT bcba_name) AS active_bcbas
FROM public.bcba_billable_sessions
GROUP BY COALESCE(state,'UNASSIGNED'), date_trunc('month', date_of_service);

CREATE OR REPLACE VIEW public.v_payor_mix
WITH (security_invoker=on) AS
SELECT
  COALESCE(state,'UNASSIGNED') AS state,
  COALESCE(payor_name,'Unknown') AS payor,
  COALESCE(payor_type,'Unknown') AS payor_type,
  COUNT(*) AS sessions,
  COALESCE(SUM(hours),0) AS hours,
  COALESCE(SUM(charges_total),0) AS charges,
  COALESCE(SUM(amount_paid),0) AS collected
FROM public.bcba_billable_sessions
GROUP BY COALESCE(state,'UNASSIGNED'), COALESCE(payor_name,'Unknown'), COALESCE(payor_type,'Unknown');

CREATE OR REPLACE VIEW public.v_data_quality_alerts
WITH (security_invoker=on) AS
SELECT
  'sessions_missing_state'::text AS alert_key,
  'Sessions missing state assignment'::text AS title,
  'crit'::text AS severity,
  COUNT(*) AS row_count,
  MIN(date_of_service) AS earliest,
  MAX(date_of_service) AS latest,
  'Fix the source label on imported sessions so they attribute to the correct state director.'::text AS detail
FROM public.bcba_billable_sessions
WHERE state IS NULL OR btrim(state) = ''
HAVING COUNT(*) > 0;

GRANT SELECT ON public.v_clients_real, public.v_bcbas_real,
              public.v_state_kpis_weekly, public.v_state_kpis_monthly,
              public.v_payor_mix, public.v_data_quality_alerts
TO authenticated;
