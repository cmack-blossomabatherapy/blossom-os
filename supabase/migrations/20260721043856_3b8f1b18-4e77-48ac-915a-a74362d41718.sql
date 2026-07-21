
-- Provider-side deterministic mapping.
CREATE OR REPLACE VIEW public.v_cr_provider_mapping AS
WITH providers AS (
  SELECT
    r.provider_id,
    (array_agg(r.provider_name ORDER BY r.service_date DESC NULLS LAST)
       FILTER (WHERE coalesce(r.provider_name,'') <> ''))[1] AS provider_name,
    public.normalize_person_name(
      (array_agg(r.provider_name ORDER BY r.service_date DESC NULLS LAST)
         FILTER (WHERE coalesce(r.provider_name,'') <> ''))[1]
    ) AS provider_name_key
  FROM public.bcba_productivity_billing_rows r
  WHERE r.active = true AND coalesce(r.provider_id,'') <> ''
  GROUP BY r.provider_id
),
clinicians AS (
  SELECT
    e.id AS employee_id,
    e.user_id AS auth_user_id,
    NULLIF(e.centralreach_id,'') AS cr_id,
    public.normalize_person_name(
      coalesce(e.first_name,'') || ' ' || coalesce(e.last_name,'')
    ) AS name_key
  FROM public.employees e
  WHERE e.status = 'active'
    AND (e.credential IN ('BCBA','BCaBA','RBT')
         OR e.job_title ILIKE '%BCBA%'
         OR e.job_title ILIKE '%Behavior Analyst%'
         OR e.job_title ILIKE '%RBT%'
         OR e.job_title ILIKE '%Behavior Technician%')
),
exact_match AS (
  SELECT p.provider_id, c.employee_id, c.auth_user_id
  FROM providers p JOIN clinicians c ON c.cr_id = p.provider_id
),
exact_counts AS (
  SELECT provider_id, count(*) AS n FROM exact_match GROUP BY provider_id
),
emp_by_name AS (
  SELECT name_key, count(*) AS n_emp,
         (array_agg(employee_id ORDER BY employee_id))[1] AS employee_id,
         (array_agg(auth_user_id ORDER BY auth_user_id NULLS LAST))[1] AS auth_user_id
  FROM clinicians WHERE name_key <> '' GROUP BY name_key
),
prov_by_name AS (
  SELECT provider_name_key, count(*) AS n_prov
  FROM providers WHERE coalesce(provider_name_key,'') <> ''
  GROUP BY provider_name_key
)
SELECT
  p.provider_id,
  p.provider_name,
  p.provider_name_key,
  CASE
    WHEN ec.n = 1 THEN em.employee_id
    WHEN ec.n IS NULL AND ebn.n_emp = 1 AND pbn.n_prov = 1
      AND coalesce(p.provider_name_key,'') <> '' THEN ebn.employee_id
    ELSE NULL END AS employee_id,
  CASE
    WHEN ec.n = 1 THEN em.auth_user_id
    WHEN ec.n IS NULL AND ebn.n_emp = 1 AND pbn.n_prov = 1
      AND coalesce(p.provider_name_key,'') <> '' THEN ebn.auth_user_id
    ELSE NULL END AS auth_user_id,
  CASE
    WHEN ec.n = 1 THEN 'exact_id'
    WHEN ec.n IS NULL AND ebn.n_emp = 1 AND pbn.n_prov = 1
      AND coalesce(p.provider_name_key,'') <> '' THEN 'unique_name'
    WHEN coalesce(p.provider_name_key,'') = '' THEN 'blank_name'
    WHEN ec.n > 1 THEN 'ambiguous_id'
    WHEN pbn.n_prov > 1 THEN 'ambiguous_provider'
    WHEN ebn.n_emp > 1 THEN 'ambiguous_employee'
    WHEN ebn.n_emp IS NULL THEN 'no_employee_match'
    ELSE 'unmatched'
  END AS mapping_method,
  CASE
    WHEN ec.n = 1 THEN 'mapped'
    WHEN ec.n IS NULL AND ebn.n_emp = 1 AND pbn.n_prov = 1
      AND coalesce(p.provider_name_key,'') <> '' THEN 'mapped'
    ELSE 'unmapped'
  END AS mapping_status,
  CASE
    WHEN ec.n = 1 THEN 1.00
    WHEN ec.n IS NULL AND ebn.n_emp = 1 AND pbn.n_prov = 1
      AND coalesce(p.provider_name_key,'') <> '' THEN 0.75
    ELSE 0.00
  END::numeric AS mapping_confidence,
  CASE
    WHEN ec.n = 1 OR (ec.n IS NULL AND ebn.n_emp = 1 AND pbn.n_prov = 1
                       AND coalesce(p.provider_name_key,'') <> '') THEN NULL
    WHEN coalesce(p.provider_name_key,'') = '' THEN 'Provider name is blank in CentralReach export'
    WHEN ec.n > 1 THEN 'Multiple active clinicians already claim this CentralReach ID'
    WHEN pbn.n_prov > 1 THEN 'Multiple CentralReach provider IDs share this name'
    WHEN ebn.n_emp > 1 THEN 'Multiple active clinicians share this name'
    WHEN ebn.n_emp IS NULL THEN 'No active clinician matches this provider name'
    ELSE 'Unmatched'
  END AS ambiguity_reason
FROM providers p
LEFT JOIN exact_counts ec ON ec.provider_id = p.provider_id
LEFT JOIN LATERAL (
  SELECT employee_id, auth_user_id FROM exact_match em2
  WHERE em2.provider_id = p.provider_id LIMIT 1
) em ON true
LEFT JOIN emp_by_name ebn ON ebn.name_key = p.provider_name_key
LEFT JOIN prov_by_name pbn ON pbn.provider_name_key = p.provider_name_key;

GRANT SELECT ON public.v_cr_provider_mapping TO authenticated, service_role;

-- Employee-facing mapping view.
CREATE OR REPLACE VIEW public.v_clinician_cr_mapping AS
SELECT
  e.id AS employee_id,
  e.user_id AS auth_user_id,
  e.first_name,
  e.last_name,
  e.email,
  e.credential,
  e.centralreach_id,
  CASE
    WHEN e.centralreach_id IS NOT NULL AND e.centralreach_id <> ''
      AND EXISTS (SELECT 1 FROM public.v_cr_provider_mapping m
                  WHERE m.provider_id = e.centralreach_id AND m.mapping_method = 'exact_id')
      THEN 'linked'
    WHEN EXISTS (SELECT 1 FROM public.v_cr_provider_mapping m
                 WHERE m.employee_id = e.id AND m.mapping_method = 'unique_name')
      THEN 'candidate'
    WHEN EXISTS (SELECT 1 FROM public.v_cr_provider_mapping m
                 WHERE m.mapping_method IN ('ambiguous_employee','ambiguous_provider')
                   AND m.provider_name_key = public.normalize_person_name(
                     coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')))
      THEN 'ambiguous'
    ELSE 'unmatched'
  END AS mapping_status,
  (SELECT m.provider_id FROM public.v_cr_provider_mapping m
     WHERE m.employee_id = e.id AND m.mapping_method IN ('exact_id','unique_name')
     ORDER BY m.mapping_confidence DESC NULLS LAST LIMIT 1) AS candidate_provider_id,
  (SELECT m.provider_name FROM public.v_cr_provider_mapping m
     WHERE m.employee_id = e.id AND m.mapping_method IN ('exact_id','unique_name')
     ORDER BY m.mapping_confidence DESC NULLS LAST LIMIT 1) AS candidate_provider_name
FROM public.employees e;

GRANT SELECT ON public.v_clinician_cr_mapping TO authenticated, service_role;

-- Rebuild canonical sessions view: preserve original 21-column prefix (identical
-- names, order, and types) so dependent SQL functions rebind cleanly, and append
-- new mapping columns at the end.
CREATE OR REPLACE VIEW public.v_cr_canonical_sessions AS
SELECT
  r.id AS row_id,
  r.batch_id,
  b.file_name AS source_file_name,
  b.source_system,
  b.report_type,
  b.created_at AS batch_uploaded_at,
  r.service_date,
  r.client_id AS cr_client_id,
  r.client_name,
  public.normalize_person_name(r.client_name) AS client_name_key,
  r.provider_id AS cr_provider_id,
  r.provider_name,
  public.normalize_person_name(r.provider_name) AS provider_name_key,
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
LEFT JOIN public.v_cr_provider_mapping pm ON pm.provider_id = r.provider_id
WHERE r.active = true;

GRANT SELECT ON public.v_cr_canonical_sessions TO authenticated, service_role;

-- Non-PHI diagnostic RPC.
CREATE OR REPLACE FUNCTION public.clinician_mapping_diagnostics()
RETURNS TABLE (
  total_providers bigint,
  mapped_providers bigint,
  unmapped_providers bigint,
  exact_id bigint,
  unique_name bigint,
  ambiguous_id bigint,
  ambiguous_provider bigint,
  ambiguous_employee bigint,
  no_employee_match bigint,
  blank_name bigint,
  mapped_hours numeric,
  unmapped_hours numeric,
  mapped_rows bigint,
  unmapped_rows bigint,
  distinct_active_clinicians bigint,
  unmapped_sample jsonb
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH counts AS (
    SELECT
      count(*)::bigint AS total_providers,
      count(*) FILTER (WHERE mapping_status='mapped')::bigint AS mapped_providers,
      count(*) FILTER (WHERE mapping_status<>'mapped')::bigint AS unmapped_providers,
      count(*) FILTER (WHERE mapping_method='exact_id')::bigint AS exact_id,
      count(*) FILTER (WHERE mapping_method='unique_name')::bigint AS unique_name,
      count(*) FILTER (WHERE mapping_method='ambiguous_id')::bigint AS ambiguous_id,
      count(*) FILTER (WHERE mapping_method='ambiguous_provider')::bigint AS ambiguous_provider,
      count(*) FILTER (WHERE mapping_method='ambiguous_employee')::bigint AS ambiguous_employee,
      count(*) FILTER (WHERE mapping_method='no_employee_match')::bigint AS no_employee_match,
      count(*) FILTER (WHERE mapping_method='blank_name')::bigint AS blank_name
    FROM public.v_cr_provider_mapping
  ),
  session_counts AS (
    SELECT
      count(*) FILTER (WHERE provider_mapping_status='mapped')::bigint AS mapped_rows,
      count(*) FILTER (WHERE provider_mapping_status<>'mapped')::bigint AS unmapped_rows,
      COALESCE(sum(hours) FILTER (WHERE provider_mapping_status='mapped'),0)::numeric AS mapped_hours,
      COALESCE(sum(hours) FILTER (WHERE provider_mapping_status<>'mapped'),0)::numeric AS unmapped_hours
    FROM public.v_cr_canonical_sessions
    WHERE active = true
  ),
  clinicians AS (
    SELECT count(*)::bigint AS distinct_active_clinicians
    FROM public.employees
    WHERE status='active'
      AND (credential IN ('BCBA','BCaBA','RBT')
           OR job_title ILIKE '%BCBA%'
           OR job_title ILIKE '%Behavior Analyst%'
           OR job_title ILIKE '%RBT%'
           OR job_title ILIKE '%Behavior Technician%')
  ),
  sample AS (
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) AS unmapped_sample FROM (
      SELECT provider_id, provider_name, mapping_method, ambiguity_reason
      FROM public.v_cr_provider_mapping
      WHERE mapping_status <> 'mapped'
      ORDER BY provider_name NULLS LAST
      LIMIT 200
    ) t
  )
  SELECT c.total_providers, c.mapped_providers, c.unmapped_providers,
         c.exact_id, c.unique_name, c.ambiguous_id, c.ambiguous_provider,
         c.ambiguous_employee, c.no_employee_match, c.blank_name,
         s.mapped_hours, s.unmapped_hours, s.mapped_rows, s.unmapped_rows,
         cl.distinct_active_clinicians,
         sm.unmapped_sample
  FROM counts c CROSS JOIN session_counts s CROSS JOIN clinicians cl CROSS JOIN sample sm;
$function$;

REVOKE ALL ON FUNCTION public.clinician_mapping_diagnostics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clinician_mapping_diagnostics() TO authenticated, service_role;

-- Read-only reconcile RPC (never auto-writes).
CREATE OR REPLACE FUNCTION public.reconcile_employee_centralreach_ids()
RETURNS TABLE (linked integer, ambiguous integer, unmatched integer, total_employees integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_linked int := 0;
  v_ambiguous int := 0;
  v_unmatched int := 0;
  v_total int := 0;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'systems_admin'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'reconcile_employee_centralreach_ids requires admin';
  END IF;

  SELECT count(*) INTO v_linked
  FROM public.v_cr_provider_mapping WHERE mapping_method = 'exact_id';

  SELECT count(*) INTO v_ambiguous
  FROM public.v_cr_provider_mapping
  WHERE mapping_method IN ('ambiguous_id','ambiguous_provider','ambiguous_employee');

  SELECT count(*) INTO v_total FROM public.employees;

  SELECT count(*) INTO v_unmatched
  FROM public.v_cr_provider_mapping WHERE mapping_status <> 'mapped';

  RETURN QUERY SELECT v_linked, v_ambiguous, v_unmatched, v_total;
END;
$function$;

REVOKE ALL ON FUNCTION public.reconcile_employee_centralreach_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reconcile_employee_centralreach_ids() TO authenticated, service_role;
