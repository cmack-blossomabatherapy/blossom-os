-- Phase 3B repair: deterministic ordering + complete pagination + staff-safe
-- aggregate governance counts for Commit to Submit. Additive only.

CREATE OR REPLACE FUNCTION public.report_c2s_documentation_proxy(p_from date, p_to date)
 RETURNS TABLE(employee_id uuid, provider_display_name text, role_group text, state text, date_of_service date, documentation_date date, lag_days integer, timeliness_status text, proxy_category text, used_authoritative_completion boolean, provenance text, source_quality text, last_seen_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH guard AS (SELECT auth.uid() AS uid),
  id_pool AS (
    SELECT nullif(btrim(e.centralreach_id), '') AS provider_id, e.id AS employee_id
    FROM public.employees e
    WHERE nullif(btrim(e.centralreach_id), '') IS NOT NULL
    UNION
    SELECT nullif(btrim(l.cr_provider_id), ''), l.employee_id
    FROM public.cr_provider_match_links l
    WHERE l.employee_id IS NOT NULL
      AND nullif(btrim(l.cr_provider_id), '') IS NOT NULL
  ),
  by_id AS (
    SELECT provider_id, (min(employee_id::text))::uuid AS employee_id
    FROM id_pool
    GROUP BY provider_id
    HAVING count(DISTINCT employee_id) = 1
  ),
  name_pool AS (
    SELECT public.normalize_person_name(l.cr_provider_name) AS name_key, l.employee_id
    FROM public.cr_provider_match_links l
    WHERE l.employee_id IS NOT NULL AND btrim(coalesce(l.cr_provider_name, '')) <> ''
    UNION
    SELECT public.normalize_person_name(concat_ws(' ', e.first_name, e.last_name)), e.id
    FROM public.employees e
    WHERE btrim(concat_ws(' ', e.first_name, e.last_name)) <> ''
  ),
  by_name AS (
    SELECT name_key, (min(employee_id::text))::uuid AS employee_id
    FROM name_pool
    WHERE name_key IS NOT NULL AND btrim(name_key) <> ''
    GROUP BY name_key
    HAVING count(DISTINCT employee_id) = 1
  ),
  facts AS (
    SELECT
      b.date_of_service,
      b.state,
      b.rendering_provider_name,
      b.rendering_provider_cr_id,
      b.row_hash,
      s.creation_date,
      s.provider_role,
      s.billing_labels,
      s.last_seen_at
    FROM public.cr_billing_sessions b
    INNER JOIN public.cr_billing_session_status s ON s.row_hash = b.row_hash
    WHERE coalesce(s.is_void, false) = false
      AND coalesce(s.deleted, false) = false
      AND lower(coalesce(s.source_quality->>'status', '')) NOT IN ('invalid','rejected')
      AND lower(coalesce(s.source_quality->>'invalid', '')) NOT IN ('true','t','1','yes')
      AND lower(coalesce(s.source_quality->>'rejected', '')) NOT IN ('true','t','1','yes')
      AND b.date_of_service IS NOT NULL
      AND (p_from IS NULL OR b.date_of_service >= p_from)
      AND (p_to IS NULL OR b.date_of_service <= p_to)
  ),
  mapped AS (
    SELECT
      f.*,
      coalesce(i.employee_id, n.employee_id) AS employee_id,
      CASE
        WHEN i.employee_id IS NOT NULL THEN 'mapped_by_provider_id'
        WHEN n.employee_id IS NOT NULL THEN 'mapped_by_unique_normalized_name'
        ELSE 'unmapped_provider'
      END AS source_quality
    FROM facts f
    LEFT JOIN by_id i ON i.provider_id = nullif(btrim(f.rendering_provider_cr_id), '')
    LEFT JOIN by_name n
      ON i.employee_id IS NULL
     AND n.name_key = public.normalize_person_name(f.rendering_provider_name)
  ),
  authoritative AS (
    SELECT m.*, t.completed_on
    FROM mapped m
    LEFT JOIN LATERAL (
      SELECT (tr.authoritative_completed_at AT TIME ZONE 'UTC')::date AS completed_on
      FROM public.c2s_tracker_records tr
      WHERE tr.subject_employee_id = m.employee_id
        AND tr.service_date = m.date_of_service
        AND tr.authoritative_completed_at IS NOT NULL
      ORDER BY tr.authoritative_completed_at ASC
      LIMIT 1
    ) t ON true
  ),
  shaped AS (
    SELECT
      a.employee_id,
      nullif(btrim(a.rendering_provider_name), '') AS provider_display_name,
      CASE
        WHEN lower(coalesce(a.provider_role, '') || ' ' || coalesce(a.billing_labels, '')) ~ '\m(bcba|bcaba|lba|analyst)\M'
          THEN 'BCBA'
        WHEN lower(coalesce(a.provider_role, '') || ' ' || coalesce(a.billing_labels, '')) ~ '\m(rbt|bt|technician)\M'
          THEN 'RBT'
        WHEN lower(coalesce(emp.job_title, '') || ' ' || coalesce(emp.credential, '')) ~ '\m(bcba|bcaba|lba)\M'
          THEN 'BCBA'
        WHEN lower(coalesce(emp.job_title, '') || ' ' || coalesce(emp.credential, '')) ~ '\m(rbt|bt|technician)\M'
          THEN 'RBT'
        ELSE 'Unknown'
      END AS role_group,
      nullif(btrim(a.state), '') AS state,
      a.date_of_service,
      coalesce(a.completed_on, a.creation_date) AS documentation_date,
      CASE
        WHEN coalesce(a.completed_on, a.creation_date) IS NULL THEN NULL
        ELSE (coalesce(a.completed_on, a.creation_date) - a.date_of_service)
      END AS lag_days,
      (a.completed_on IS NOT NULL) AS used_authoritative_completion,
      CASE
        WHEN a.completed_on IS NOT NULL THEN 'authoritative_completion'
        WHEN a.creation_date IS NOT NULL THEN 'dos_to_billing_creation_proxy'
        ELSE 'missing_documentation_timestamp'
      END AS provenance,
      a.source_quality,
      a.last_seen_at,
      a.row_hash
    FROM authoritative a
    LEFT JOIN public.employees emp ON emp.id = a.employee_id
  )
  SELECT
    s.employee_id,
    s.provider_display_name,
    s.role_group,
    s.state,
    s.date_of_service,
    s.documentation_date,
    s.lag_days,
    CASE
      WHEN s.lag_days IS NULL THEN 'missing'
      WHEN s.lag_days < 0 THEN 'invalid'
      WHEN s.lag_days > 7 THEN 'late'
      ELSE 'on_time'
    END AS timeliness_status,
    CASE
      WHEN s.role_group = 'RBT' THEN 'RBT proxy'
      WHEN s.role_group = 'BCBA' THEN 'BCBA Category 2 proxy'
      ELSE 'unclassified'
    END AS proxy_category,
    s.used_authoritative_completion,
    s.provenance,
    s.source_quality,
    s.last_seen_at
  FROM shaped s
  CROSS JOIN guard g
  WHERE g.uid IS NOT NULL
    AND (p_from IS NULL OR p_to IS NULL OR p_from <= p_to)
  -- Deterministic total order so paged reads can never skip or repeat a row.
  ORDER BY
    s.date_of_service,
    coalesce(s.employee_id::text, ''),
    coalesce(s.provider_display_name, ''),
    coalesce(s.documentation_date::text, ''),
    coalesce(s.lag_days, -2147483647),
    coalesce(s.row_hash, '');
$function$;

-- Paged reader: the client walks pages until a short page arrives, so no
-- PostgREST row cap can silently truncate the report.
CREATE OR REPLACE FUNCTION public.report_c2s_documentation_proxy_page(
  p_from date,
  p_to date,
  p_limit integer DEFAULT 1000,
  p_offset integer DEFAULT 0
)
 RETURNS TABLE(employee_id uuid, provider_display_name text, role_group text, state text, date_of_service date, documentation_date date, lag_days integer, timeliness_status text, proxy_category text, used_authoritative_completion boolean, provenance text, source_quality text, last_seen_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT r.*
  FROM public.report_c2s_documentation_proxy(p_from, p_to) r
  CROSS JOIN (SELECT auth.uid() AS uid) g
  WHERE g.uid IS NOT NULL
  ORDER BY
    r.date_of_service,
    coalesce(r.employee_id::text, ''),
    coalesce(r.provider_display_name, ''),
    coalesce(r.documentation_date::text, ''),
    coalesce(r.lag_days, -2147483647),
    coalesce(r.provenance, ''),
    coalesce(r.source_quality, '')
  LIMIT greatest(coalesce(p_limit, 1000), 1)
  OFFSET greatest(coalesce(p_offset, 0), 0);
$function$;

REVOKE ALL ON FUNCTION public.report_c2s_documentation_proxy_page(date, date, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.report_c2s_documentation_proxy_page(date, date, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.report_c2s_documentation_proxy_page(date, date, integer, integer) TO authenticated;

-- Staff-safe aggregate governance counts. Aggregates ONLY: no subject, client,
-- or record detail. Every counted row is constrained by c2s_can_read_subject.
CREATE OR REPLACE FUNCTION public.report_c2s_governance_counts()
 RETURNS TABLE(
   historical_formal_records bigint,
   active_formal_records bigint,
   open_disputes bigint,
   active_approved_exceptions bigint
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH guard AS (SELECT auth.uid() AS uid)
  SELECT
    (
      SELECT count(*) FROM public.c2s_tracker_records t
      WHERE public.c2s_can_read_subject(t.subject_employee_id, g.uid)
        AND t.is_formal_violation = true
        AND t.formal_violation_recorded_at IS NOT NULL
    )::bigint AS historical_formal_records,
    (
      SELECT count(*) FROM public.c2s_tracker_records t
      WHERE public.c2s_can_read_subject(t.subject_employee_id, g.uid)
        AND public.c2s_is_active_formal(t.id)
    )::bigint AS active_formal_records,
    (
      SELECT count(*) FROM public.c2s_disputes d
      WHERE public.c2s_can_read_subject(d.subject_employee_id, g.uid)
        AND d.status IN ('submitted', 'under_review')
    )::bigint AS open_disputes,
    (
      SELECT count(*) FROM public.c2s_exceptions x
      WHERE public.c2s_can_read_subject(x.subject_employee_id, g.uid)
        AND x.status = 'approved'
        AND (
          x.tracker_record_id IS NOT NULL
          OR (
            x.applies_from IS NOT NULL
            AND x.applies_to IS NOT NULL
            AND current_date >= x.applies_from
            AND current_date <= x.applies_to
          )
        )
    )::bigint AS active_approved_exceptions
  FROM guard g
  WHERE g.uid IS NOT NULL;
$function$;

REVOKE ALL ON FUNCTION public.report_c2s_governance_counts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.report_c2s_governance_counts() FROM anon;
GRANT EXECUTE ON FUNCTION public.report_c2s_governance_counts() TO authenticated;