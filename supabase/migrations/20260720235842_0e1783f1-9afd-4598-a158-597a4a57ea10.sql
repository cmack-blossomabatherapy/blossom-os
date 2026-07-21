
-- Clinician identity reconciliation: CR provider_id ↔ employees
-- 1) Idempotent normalization helper
CREATE OR REPLACE FUNCTION public.normalize_person_name(_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(regexp_replace(btrim(coalesce(_name,'')), '\s+', ' ', 'g'));
$$;

-- 2) Reconcile employees.centralreach_id from productivity billing rows.
--    Match strategy (in order):
--      a) exact provider_id already on the employee (no-op)
--      b) normalized full name matches a UNIQUE provider_name in imported rows
--    Ambiguous matches (name maps to >1 provider_id) are left NULL and
--    counted in the returned diagnostic so the UI can surface them.
CREATE OR REPLACE FUNCTION public.reconcile_employee_centralreach_ids()
RETURNS TABLE(linked int, ambiguous int, unmatched int, total_employees int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_linked int := 0;
  v_ambiguous int := 0;
  v_unmatched int := 0;
  v_total int := 0;
BEGIN
  IF NOT (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'systems_admin'::app_role)
  ) THEN
    RAISE EXCEPTION 'reconcile_employee_centralreach_ids requires admin';
  END IF;

  WITH cand AS (
    SELECT provider_id, provider_name,
           normalize_person_name(provider_name) AS norm
    FROM bcba_productivity_billing_rows
    WHERE active AND provider_id <> '' AND provider_name <> ''
    GROUP BY provider_id, provider_name
  ),
  unique_by_name AS (
    SELECT norm, min(provider_id) AS provider_id, count(distinct provider_id) AS n
    FROM cand
    GROUP BY norm
  ),
  upd AS (
    UPDATE employees e
       SET centralreach_id = u.provider_id
      FROM unique_by_name u
     WHERE e.centralreach_id IS NULL
       AND u.n = 1
       AND normalize_person_name(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) = u.norm
    RETURNING 1
  )
  SELECT count(*) INTO v_linked FROM upd;

  SELECT count(*) INTO v_ambiguous
  FROM (
    SELECT norm FROM (
      SELECT normalize_person_name(provider_name) AS norm, count(distinct provider_id) AS n
      FROM bcba_productivity_billing_rows
      WHERE active AND provider_id <> '' AND provider_name <> ''
      GROUP BY normalize_person_name(provider_name)
    ) x WHERE n > 1
  ) y;

  SELECT count(*) INTO v_total FROM employees;
  SELECT count(*) INTO v_unmatched FROM employees WHERE centralreach_id IS NULL;

  RETURN QUERY SELECT v_linked, v_ambiguous, v_unmatched, v_total;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reconcile_employee_centralreach_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_person_name(text) TO authenticated, anon;

-- 3) Read-only mapping diagnostics view (admins only via RLS on employees).
CREATE OR REPLACE VIEW public.v_clinician_cr_mapping
WITH (security_invoker=on) AS
SELECT
  e.id                  AS employee_id,
  e.user_id             AS auth_user_id,
  e.first_name,
  e.last_name,
  e.email,
  e.credential,
  e.centralreach_id,
  CASE
    WHEN e.centralreach_id IS NOT NULL THEN 'linked'
    WHEN amb.norm IS NOT NULL          THEN 'ambiguous'
    WHEN cand.norm IS NOT NULL         THEN 'candidate'
    ELSE 'unmatched'
  END AS mapping_status,
  cand.provider_id       AS candidate_provider_id,
  cand.provider_name     AS candidate_provider_name
FROM employees e
LEFT JOIN LATERAL (
  SELECT normalize_person_name(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) AS norm
) k ON true
LEFT JOIN (
  SELECT normalize_person_name(provider_name) AS norm,
         min(provider_id) AS provider_id,
         min(provider_name) AS provider_name,
         count(distinct provider_id) AS n
  FROM bcba_productivity_billing_rows
  WHERE active AND provider_id <> '' AND provider_name <> ''
  GROUP BY normalize_person_name(provider_name)
  HAVING count(distinct provider_id) = 1
) cand ON cand.norm = k.norm
LEFT JOIN (
  SELECT normalize_person_name(provider_name) AS norm
  FROM bcba_productivity_billing_rows
  WHERE active AND provider_id <> '' AND provider_name <> ''
  GROUP BY normalize_person_name(provider_name)
  HAVING count(distinct provider_id) > 1
) amb ON amb.norm = k.norm;

GRANT SELECT ON public.v_clinician_cr_mapping TO authenticated;
