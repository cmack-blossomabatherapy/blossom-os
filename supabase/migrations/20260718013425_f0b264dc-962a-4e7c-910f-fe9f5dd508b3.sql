
-- Helper: extract JSON field as text from cr_external_records payload
-- All views are SECURITY INVOKER so they inherit the caller's RLS on cr_external_records.

-- 1. Caseload: BCBA → assigned clients
CREATE OR REPLACE VIEW public.v_bcba_caseload
WITH (security_invoker = true) AS
SELECT
  a.payload->>'cr_bcba_id'          AS cr_bcba_id,
  a.payload->>'cr_client_id'        AS cr_client_id,
  a.payload->>'relationship_type'   AS relationship_type,
  (a.payload->>'start_date')::date  AS start_date,
  NULLIF(a.payload->>'end_date','')::date AS end_date,
  a.payload->>'active_status'       AS active_status,
  a.last_seen_at
FROM public.cr_external_records a
WHERE a.type_key = 'assignments'::cr_sync_type_key
  AND a.payload ? 'cr_bcba_id';

-- 2. RBT roster: BCBA → RBTs via shared clients
CREATE OR REPLACE VIEW public.v_bcba_rbt_roster
WITH (security_invoker = true) AS
SELECT DISTINCT
  a.payload->>'cr_bcba_id'   AS cr_bcba_id,
  a.payload->>'cr_rbt_id'    AS cr_rbt_id,
  a.payload->>'cr_client_id' AS cr_client_id,
  a.payload->>'active_status' AS active_status,
  a.last_seen_at
FROM public.cr_external_records a
WHERE a.type_key = 'assignments'::cr_sync_type_key
  AND a.payload ? 'cr_bcba_id'
  AND a.payload ? 'cr_rbt_id';

-- 3. Schedule (appointments)
CREATE OR REPLACE VIEW public.v_bcba_schedule
WITH (security_invoker = true) AS
SELECT
  s.external_id                                AS cr_appointment_id,
  s.payload->>'cr_employee_id'                 AS cr_employee_id,
  s.payload->>'cr_bcba_id'                     AS cr_bcba_id,
  s.payload->>'cr_client_id'                   AS cr_client_id,
  NULLIF(s.payload->>'service_date','')::date  AS service_date,
  NULLIF(s.payload->>'start_at','')::timestamptz AS start_at,
  NULLIF(s.payload->>'end_at','')::timestamptz   AS end_at,
  s.payload->>'service_code'                   AS service_code,
  s.payload->>'location_type'                  AS location_type,
  s.payload->>'appointment_status'             AS appointment_status,
  s.payload->>'cancellation_status'            AS cancellation_status,
  s.payload->>'cancellation_reason'            AS cancellation_reason,
  s.last_seen_at
FROM public.cr_external_records s
WHERE s.type_key = 'schedule'::cr_sync_type_key;

-- 4. Service utilization from authorizations
CREATE OR REPLACE VIEW public.v_bcba_service_utilization
WITH (security_invoker = true) AS
SELECT
  a.external_id                                AS cr_authorization_id,
  a.payload->>'cr_client_id'                   AS cr_client_id,
  a.payload->>'payer'                          AS payer,
  a.payload->>'service_code'                   AS service_code,
  NULLIF(a.payload->>'start_date','')::date    AS start_date,
  NULLIF(a.payload->>'end_date','')::date      AS end_date,
  NULLIF(a.payload->>'units_authorized','')::numeric AS units_authorized,
  NULLIF(a.payload->>'units_used','')::numeric       AS units_used,
  NULLIF(a.payload->>'units_remaining','')::numeric  AS units_remaining,
  a.payload->>'auth_status'                    AS auth_status,
  CASE
    WHEN NULLIF(a.payload->>'units_authorized','')::numeric > 0
      THEN ROUND(100.0 * COALESCE(NULLIF(a.payload->>'units_used','')::numeric, 0)
                       / NULLIF(a.payload->>'units_authorized','')::numeric, 1)
    ELSE NULL
  END AS pct_used,
  a.last_seen_at
FROM public.cr_external_records a
WHERE a.type_key = 'authorizations'::cr_sync_type_key;

-- 5. Parent-training frequency (per client / provider) — heuristic on service code
CREATE OR REPLACE VIEW public.v_bcba_parent_training_frequency
WITH (security_invoker = true) AS
SELECT
  s.payload->>'cr_employee_id' AS cr_employee_id,
  s.payload->>'cr_client_id'   AS cr_client_id,
  DATE_TRUNC('month', COALESCE(
    NULLIF(s.payload->>'service_date','')::date,
    NULLIF(s.payload->>'start_at','')::timestamptz::date
  ))::date AS month,
  COUNT(*) FILTER (
    WHERE COALESCE(s.payload->>'appointment_status','') NOT ILIKE '%cancel%'
  ) AS delivered_sessions,
  COUNT(*) AS total_sessions
FROM public.cr_external_records s
WHERE s.type_key = 'schedule'::cr_sync_type_key
  AND (s.payload->>'service_code') ILIKE ANY (ARRAY['%97156%','%parent%','%caregiver%'])
GROUP BY 1,2,3;

-- 6. Supervision indicators (BCBA supervising RBT via schedule where code ~ 97155/supervision)
CREATE OR REPLACE VIEW public.v_bcba_supervision_indicators
WITH (security_invoker = true) AS
SELECT
  s.payload->>'cr_bcba_id'     AS cr_bcba_id,
  s.payload->>'cr_employee_id' AS cr_rbt_id,
  s.payload->>'cr_client_id'   AS cr_client_id,
  DATE_TRUNC('month', COALESCE(
    NULLIF(s.payload->>'service_date','')::date,
    NULLIF(s.payload->>'start_at','')::timestamptz::date
  ))::date AS month,
  COUNT(*) FILTER (
    WHERE COALESCE(s.payload->>'appointment_status','') NOT ILIKE '%cancel%'
  ) AS supervision_sessions
FROM public.cr_external_records s
WHERE s.type_key = 'schedule'::cr_sync_type_key
  AND (s.payload->>'service_code') ILIKE ANY (ARRAY['%97155%','%supervis%'])
GROUP BY 1,2,3,4;

-- 7. Productivity: billable hours per BCBA from timesheets
CREATE OR REPLACE VIEW public.v_bcba_productivity
WITH (security_invoker = true) AS
SELECT
  t.payload->>'cr_employee_id' AS cr_employee_id,
  DATE_TRUNC('week', NULLIF(t.payload->>'service_date','')::date)::date AS week_start,
  SUM(COALESCE(NULLIF(t.payload->>'hours','')::numeric,
               NULLIF(t.payload->>'units','')::numeric / 4.0, 0)) AS billable_hours,
  COUNT(*) AS session_rows,
  COUNT(*) FILTER (WHERE (t.payload->>'billing_status') ILIKE '%billed%') AS billed_rows
FROM public.cr_external_records t
WHERE t.type_key = 'timesheets'::cr_sync_type_key
GROUP BY 1,2;

-- 8. Authorization deadlines
CREATE OR REPLACE VIEW public.v_bcba_authorization_deadlines
WITH (security_invoker = true) AS
SELECT
  a.external_id                              AS cr_authorization_id,
  a.payload->>'cr_client_id'                 AS cr_client_id,
  a.payload->>'payer'                        AS payer,
  a.payload->>'service_code'                 AS service_code,
  NULLIF(a.payload->>'end_date','')::date    AS end_date,
  (NULLIF(a.payload->>'end_date','')::date - CURRENT_DATE) AS days_remaining,
  a.payload->>'auth_status'                  AS auth_status
FROM public.cr_external_records a
WHERE a.type_key = 'authorizations'::cr_sync_type_key
  AND NULLIF(a.payload->>'end_date','') IS NOT NULL;

-- 9. Progress-report deadlines (derive 30-day pre-auth-end)
CREATE OR REPLACE VIEW public.v_bcba_progress_report_deadlines
WITH (security_invoker = true) AS
SELECT
  a.external_id                              AS cr_authorization_id,
  a.payload->>'cr_client_id'                 AS cr_client_id,
  NULLIF(a.payload->>'end_date','')::date    AS auth_end_date,
  (NULLIF(a.payload->>'end_date','')::date - INTERVAL '30 days')::date AS progress_report_due_date,
  ((NULLIF(a.payload->>'end_date','')::date - INTERVAL '30 days')::date - CURRENT_DATE) AS days_until_due
FROM public.cr_external_records a
WHERE a.type_key = 'authorizations'::cr_sync_type_key
  AND NULLIF(a.payload->>'end_date','') IS NOT NULL;

-- 10. Capacity indicators per BCBA
CREATE OR REPLACE VIEW public.v_bcba_capacity_indicators
WITH (security_invoker = true) AS
WITH clients_per_bcba AS (
  SELECT cr_bcba_id, COUNT(DISTINCT cr_client_id) AS active_clients
  FROM public.v_bcba_caseload
  WHERE COALESCE(active_status,'') NOT ILIKE '%inactive%'
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  GROUP BY cr_bcba_id
),
hours_30d AS (
  SELECT
    t.payload->>'cr_employee_id' AS cr_employee_id,
    SUM(COALESCE(NULLIF(t.payload->>'hours','')::numeric,
                 NULLIF(t.payload->>'units','')::numeric / 4.0, 0)) AS billable_hours_30d
  FROM public.cr_external_records t
  WHERE t.type_key = 'timesheets'::cr_sync_type_key
    AND NULLIF(t.payload->>'service_date','')::date >= (CURRENT_DATE - INTERVAL '30 days')
  GROUP BY 1
)
SELECT
  c.cr_bcba_id,
  c.active_clients,
  COALESCE(h.billable_hours_30d, 0) AS billable_hours_30d,
  CASE
    WHEN c.active_clients IS NULL THEN 'unknown'
    WHEN c.active_clients < 8  THEN 'available'
    WHEN c.active_clients < 11 THEN 'approaching'
    WHEN c.active_clients < 13 THEN 'at_capacity'
    WHEN c.active_clients < 15 THEN 'over_capacity'
    ELSE 'review_required'
  END AS capacity_band
FROM clients_per_bcba c
LEFT JOIN hours_30d h ON h.cr_employee_id = c.cr_bcba_id;

-- Grants (RLS on the underlying table enforces access)
GRANT SELECT ON public.v_bcba_caseload,
                public.v_bcba_rbt_roster,
                public.v_bcba_schedule,
                public.v_bcba_service_utilization,
                public.v_bcba_parent_training_frequency,
                public.v_bcba_supervision_indicators,
                public.v_bcba_productivity,
                public.v_bcba_authorization_deadlines,
                public.v_bcba_progress_report_deadlines,
                public.v_bcba_capacity_indicators
TO authenticated, service_role;
