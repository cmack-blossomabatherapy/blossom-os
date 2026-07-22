
-- Fix column ambiguity by fully qualifying and using distinct OUT names.
CREATE OR REPLACE FUNCTION public.preview_employee_user_reconciliation()
RETURNS TABLE (
  employee_id uuid,
  employee_email text,
  first_name text,
  last_name text,
  action text,
  candidate_user_id uuid,
  candidate_email text,
  match_method text,
  ambiguity_reason text
)
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public
AS $$
BEGIN
  IF NOT public.can_reconcile_cr_identity(auth.uid()) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH emp AS (
    SELECT e.id, e.first_name, e.last_name, e.email, e.user_id,
           lower(regexp_replace(coalesce(e.email,''),'\s+','','g')) AS norm_email
      FROM public.employees e
  ),
  au AS (
    SELECT u.id, u.email,
           lower(regexp_replace(coalesce(u.email,''),'\s+','','g')) AS norm_email
      FROM auth.users u WHERE nullif(u.email,'') IS NOT NULL
  ),
  au_counts AS (SELECT au.norm_email, count(*) AS c FROM au GROUP BY au.norm_email),
  au_unique AS (SELECT au.id, au.email, au.norm_email FROM au JOIN au_counts USING (norm_email) WHERE au_counts.c=1),
  emp_claim AS (SELECT e.user_id, count(*) AS c FROM public.employees e WHERE e.user_id IS NOT NULL GROUP BY e.user_id)
  SELECT
    e.id,
    e.email,
    e.first_name,
    e.last_name,
    CASE
      WHEN e.user_id IS NOT NULL THEN 'already_linked'
      WHEN e.norm_email = '' OR e.norm_email IS NULL THEN 'unmatched'
      WHEN u.id IS NULL AND EXISTS (SELECT 1 FROM au_counts x WHERE x.norm_email=e.norm_email AND x.c>1) THEN 'ambiguous'
      WHEN u.id IS NULL THEN 'unmatched'
      WHEN EXISTS (SELECT 1 FROM emp_claim c WHERE c.user_id = u.id) THEN 'conflict'
      ELSE 'auto_link'
    END,
    u.id,
    u.email,
    CASE WHEN u.id IS NULL THEN 'no_auth_match' ELSE 'exact_email' END,
    CASE
      WHEN e.user_id IS NOT NULL THEN 'employee.user_id already set'
      WHEN u.id IS NULL AND EXISTS (SELECT 1 FROM au_counts x WHERE x.norm_email=e.norm_email AND x.c>1) THEN 'multiple auth users share this email'
      WHEN u.id IS NOT NULL AND EXISTS (SELECT 1 FROM emp_claim c WHERE c.user_id = u.id) THEN 'auth user already linked to another employee'
      ELSE NULL
    END
  FROM emp e
  LEFT JOIN au_unique u ON u.norm_email = e.norm_email AND e.norm_email <> ''
  ORDER BY 5, e.last_name NULLS LAST, e.first_name NULLS LAST;
END $$;

REVOKE ALL ON FUNCTION public.preview_employee_user_reconciliation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_employee_user_reconciliation() TO authenticated;

-- Server-side (service_role/superuser) runner: takes an explicit actor uuid,
-- re-verifies that actor has admin/super_admin role, then delegates to the
-- normal apply logic. Never exposed to anon/authenticated Data APIs.
CREATE OR REPLACE FUNCTION public.admin_apply_employee_user_reconciliation(
  _actor uuid, _dry_run boolean DEFAULT false
) RETURNS TABLE (
  auto_linked int, already_linked int, conflicts int, ambiguous int, unmatched int, queue_rows int
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _auto int:=0; _already int:=0; _conflict int:=0; _amb int:=0; _un int:=0;
BEGIN
  IF _actor IS NULL OR NOT public.can_reconcile_cr_identity(_actor) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE='42501';
  END IF;

  CREATE TEMP TABLE _prev ON COMMIT DROP AS
  WITH emp AS (
    SELECT e.id, e.first_name, e.last_name, e.email, e.user_id,
           lower(regexp_replace(coalesce(e.email,''),'\s+','','g')) AS ne FROM public.employees e
  ),
  au AS (SELECT u.id, u.email, lower(regexp_replace(coalesce(u.email,''),'\s+','','g')) ne
           FROM auth.users u WHERE nullif(u.email,'') IS NOT NULL),
  au_c AS (SELECT ne, count(*) c FROM au GROUP BY 1),
  au_u AS (SELECT au.id, au.email, au.ne FROM au JOIN au_c USING (ne) WHERE au_c.c=1),
  emp_c AS (SELECT e.user_id FROM public.employees e WHERE e.user_id IS NOT NULL)
  SELECT e.id AS employee_id, e.email AS employee_email, u.id AS candidate_user_id, u.email AS candidate_email,
    CASE
      WHEN e.user_id IS NOT NULL THEN 'already_linked'
      WHEN e.ne='' OR e.ne IS NULL THEN 'unmatched'
      WHEN u.id IS NULL AND EXISTS (SELECT 1 FROM au_c x WHERE x.ne=e.ne AND x.c>1) THEN 'ambiguous'
      WHEN u.id IS NULL THEN 'unmatched'
      WHEN EXISTS (SELECT 1 FROM emp_c c WHERE c.user_id=u.id) THEN 'conflict'
      ELSE 'auto_link' END AS action,
    CASE WHEN u.id IS NULL THEN 'no_auth_match' ELSE 'exact_email' END AS match_method,
    NULL::text AS ambiguity_reason
  FROM emp e LEFT JOIN au_u u ON u.ne=e.ne AND e.ne<>'';

  SELECT
    count(*) FILTER (WHERE action='auto_link'),
    count(*) FILTER (WHERE action='already_linked'),
    count(*) FILTER (WHERE action='conflict'),
    count(*) FILTER (WHERE action='ambiguous'),
    count(*) FILTER (WHERE action='unmatched')
    INTO _auto,_already,_conflict,_amb,_un FROM _prev;

  IF NOT _dry_run THEN
    WITH to_link AS (
      SELECT p.employee_id, p.candidate_user_id, p.candidate_email
        FROM _prev p
       WHERE p.action='auto_link' AND p.candidate_user_id IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM public.employees e2 WHERE e2.user_id=p.candidate_user_id AND e2.id<>p.employee_id)
         AND NOT EXISTS (SELECT 1 FROM public.employees e3 WHERE e3.id=p.employee_id AND e3.user_id IS NOT NULL)
    ),
    updated AS (
      UPDATE public.employees e SET user_id=t.candidate_user_id
        FROM to_link t WHERE e.id=t.employee_id
      RETURNING e.id AS employee_id, t.candidate_user_id, t.candidate_email
    )
    INSERT INTO public.user_link_audit
      (employee_id, user_id_before, user_id_after, action, method, reason, actor, matched_email)
    SELECT u.employee_id, NULL, u.candidate_user_id, 'auto_link', 'exact_email',
           'Phase 3 reconciliation apply (server)', _actor, u.candidate_email FROM updated u;

    INSERT INTO public.user_link_audit (action, method, reason, actor)
    VALUES ('apply_run','exact_email',
      format('auto=%s already=%s conflict=%s ambiguous=%s unmatched=%s',_auto,_already,_conflict,_amb,_un),
      _actor);

    DELETE FROM public.user_link_queue q USING _prev p
     WHERE q.employee_id=p.employee_id AND p.action='already_linked';

    INSERT INTO public.user_link_queue AS q
      (employee_id, employee_email, candidate_user_id, candidate_email, match_method, status,
       ambiguity_reason, resolved_by, resolved_at, updated_at)
    SELECT p.employee_id, p.employee_email, p.candidate_user_id, p.candidate_email, p.match_method,
      CASE WHEN p.action='auto_link' THEN 'auto_linked' ELSE p.action END,
      p.ambiguity_reason,
      CASE WHEN p.action='auto_link' THEN _actor ELSE NULL END,
      CASE WHEN p.action='auto_link' THEN now() ELSE NULL END,
      now()
    FROM _prev p WHERE p.action<>'already_linked'
    ON CONFLICT (employee_id) DO UPDATE
      SET candidate_user_id=EXCLUDED.candidate_user_id,
          candidate_email=EXCLUDED.candidate_email,
          match_method=EXCLUDED.match_method,
          status=CASE WHEN q.status IN ('rejected','manual_paired') THEN q.status ELSE EXCLUDED.status END,
          ambiguity_reason=EXCLUDED.ambiguity_reason,
          updated_at=now();
  END IF;

  RETURN QUERY SELECT _auto,_already,_conflict,_amb,_un,
    (SELECT count(*)::int FROM _prev WHERE action<>'already_linked');
END $$;

REVOKE ALL ON FUNCTION public.admin_apply_employee_user_reconciliation(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_apply_employee_user_reconciliation(uuid, boolean) FROM authenticated;
REVOKE ALL ON FUNCTION public.admin_apply_employee_user_reconciliation(uuid, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_apply_employee_user_reconciliation(uuid, boolean) TO service_role;
