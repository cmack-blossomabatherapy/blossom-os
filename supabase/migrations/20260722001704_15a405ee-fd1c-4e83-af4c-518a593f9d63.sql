
-- =========================================================
-- Phase 3 — Employee ↔ auth.users reconciliation
-- =========================================================

-- Append-only audit
CREATE TABLE IF NOT EXISTS public.user_link_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid,
  user_id_before uuid,
  user_id_after uuid,
  action text NOT NULL,                 -- 'auto_link' | 'manual_link' | 'unlink' | 'reject' | 'apply_run'
  method text,                          -- 'exact_email' | 'manual' | 'admin'
  reason text,
  actor uuid,
  matched_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.user_link_audit TO authenticated;
GRANT ALL ON public.user_link_audit TO service_role;
ALTER TABLE public.user_link_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_link_audit_admin_select" ON public.user_link_audit;
CREATE POLICY "user_link_audit_admin_select"
  ON public.user_link_audit FOR SELECT TO authenticated
  USING (public.can_reconcile_cr_identity(auth.uid()));

-- Only SECURITY DEFINER functions write here; block direct inserts.
DROP POLICY IF EXISTS "user_link_audit_no_direct_insert" ON public.user_link_audit;
CREATE POLICY "user_link_audit_no_direct_insert"
  ON public.user_link_audit FOR INSERT TO authenticated
  WITH CHECK (false);

-- Durable review queue
CREATE TABLE IF NOT EXISTS public.user_link_queue (
  employee_id uuid PRIMARY KEY REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_email text,
  candidate_user_id uuid,
  candidate_email text,
  match_method text NOT NULL,           -- 'exact_email' | 'no_auth_match' | 'ambiguous' | 'conflict'
  status text NOT NULL,                 -- 'pending' | 'auto_linked' | 'manual_paired' | 'rejected' | 'conflict'
  ambiguity_reason text,
  resolved_by uuid,
  resolved_at timestamptz,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_link_queue TO authenticated;
GRANT ALL ON public.user_link_queue TO service_role;
ALTER TABLE public.user_link_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_link_queue_admin_select" ON public.user_link_queue;
CREATE POLICY "user_link_queue_admin_select"
  ON public.user_link_queue FOR SELECT TO authenticated
  USING (public.can_reconcile_cr_identity(auth.uid()));

DROP POLICY IF EXISTS "user_link_queue_no_direct_write" ON public.user_link_queue;
CREATE POLICY "user_link_queue_no_direct_write"
  ON public.user_link_queue FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

CREATE INDEX IF NOT EXISTS user_link_queue_status_idx ON public.user_link_queue (status);
CREATE INDEX IF NOT EXISTS user_link_audit_employee_idx ON public.user_link_audit (employee_id, created_at DESC);

-- =========================================================
-- Preview / classify every employee missing user_id
-- =========================================================
CREATE OR REPLACE FUNCTION public.preview_employee_user_reconciliation()
RETURNS TABLE (
  employee_id uuid,
  employee_email text,
  first_name text,
  last_name text,
  action text,             -- 'auto_link' | 'already_linked' | 'ambiguous' | 'conflict' | 'unmatched'
  candidate_user_id uuid,
  candidate_email text,
  match_method text,
  ambiguity_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_reconcile_cr_identity(auth.uid()) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH emp AS (
    SELECT id, first_name, last_name, email, user_id,
           lower(regexp_replace(coalesce(email,''),'\s+','','g')) AS norm_email
      FROM public.employees
  ),
  au AS (
    SELECT id, email,
           lower(regexp_replace(coalesce(email,''),'\s+','','g')) AS norm_email
      FROM auth.users
     WHERE nullif(email,'') IS NOT NULL
  ),
  au_counts AS (
    SELECT norm_email, count(*) AS c FROM au GROUP BY norm_email
  ),
  au_unique AS (
    SELECT au.id, au.email, au.norm_email
      FROM au JOIN au_counts USING (norm_email)
     WHERE au_counts.c = 1
  ),
  emp_claim AS (
    SELECT user_id, count(*) AS c FROM public.employees WHERE user_id IS NOT NULL GROUP BY user_id
  )
  SELECT
    e.id,
    e.email,
    e.first_name,
    e.last_name,
    CASE
      WHEN e.user_id IS NOT NULL THEN 'already_linked'
      WHEN e.norm_email = '' OR e.norm_email IS NULL THEN 'unmatched'
      WHEN u.id IS NULL AND EXISTS (
        SELECT 1 FROM au_counts x WHERE x.norm_email = e.norm_email AND x.c > 1
      ) THEN 'ambiguous'
      WHEN u.id IS NULL THEN 'unmatched'
      WHEN EXISTS (SELECT 1 FROM emp_claim c WHERE c.user_id = u.id) THEN 'conflict'
      ELSE 'auto_link'
    END AS action,
    u.id,
    u.email,
    CASE WHEN u.id IS NULL THEN 'no_auth_match' ELSE 'exact_email' END,
    CASE
      WHEN e.user_id IS NOT NULL THEN 'employee.user_id already set'
      WHEN u.id IS NULL AND EXISTS (
        SELECT 1 FROM au_counts x WHERE x.norm_email = e.norm_email AND x.c > 1
      ) THEN 'multiple auth users share this email'
      WHEN u.id IS NOT NULL AND EXISTS (SELECT 1 FROM emp_claim c WHERE c.user_id = u.id)
        THEN 'auth user already linked to another employee'
      ELSE NULL
    END
  FROM emp e
  LEFT JOIN au_unique u ON u.norm_email = e.norm_email AND e.norm_email <> ''
  ORDER BY action, e.last_name NULLS LAST, e.first_name NULLS LAST;
END $$;

REVOKE ALL ON FUNCTION public.preview_employee_user_reconciliation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_employee_user_reconciliation() TO authenticated;

-- =========================================================
-- Apply — safe exact-email matches only
-- =========================================================
CREATE OR REPLACE FUNCTION public.apply_employee_user_reconciliation(_dry_run boolean DEFAULT false)
RETURNS TABLE (
  auto_linked int,
  already_linked int,
  conflicts int,
  ambiguous int,
  unmatched int,
  queue_rows int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid := auth.uid();
  _auto int := 0; _already int := 0; _conflict int := 0; _amb int := 0; _un int := 0;
BEGIN
  IF NOT public.can_reconcile_cr_identity(_actor) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  -- Snapshot preview into temp table
  CREATE TEMP TABLE _prev ON COMMIT DROP AS
  SELECT * FROM public.preview_employee_user_reconciliation();

  SELECT
    count(*) FILTER (WHERE action = 'auto_link'),
    count(*) FILTER (WHERE action = 'already_linked'),
    count(*) FILTER (WHERE action = 'conflict'),
    count(*) FILTER (WHERE action = 'ambiguous'),
    count(*) FILTER (WHERE action = 'unmatched')
    INTO _auto, _already, _conflict, _amb, _un
    FROM _prev;

  IF NOT _dry_run THEN
    -- Apply only auto_link rows; belt-and-suspenders re-check of conflicts
    WITH to_link AS (
      SELECT p.employee_id, p.candidate_user_id, p.candidate_email
        FROM _prev p
       WHERE p.action = 'auto_link'
         AND p.candidate_user_id IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM public.employees e2
            WHERE e2.user_id = p.candidate_user_id AND e2.id <> p.employee_id
         )
         AND NOT EXISTS (
           SELECT 1 FROM public.employees e3
            WHERE e3.id = p.employee_id AND e3.user_id IS NOT NULL
         )
    ),
    updated AS (
      UPDATE public.employees e
         SET user_id = t.candidate_user_id
        FROM to_link t
       WHERE e.id = t.employee_id
      RETURNING e.id AS employee_id, t.candidate_user_id, t.candidate_email
    )
    INSERT INTO public.user_link_audit (
      employee_id, user_id_before, user_id_after, action, method, reason, actor, matched_email
    )
    SELECT u.employee_id, NULL, u.candidate_user_id, 'auto_link', 'exact_email',
           'Phase 3 reconciliation apply', _actor, u.candidate_email
      FROM updated u;

    -- Log the batch itself
    INSERT INTO public.user_link_audit (action, method, reason, actor)
    VALUES ('apply_run', 'exact_email',
            format('auto=%s already=%s conflict=%s ambiguous=%s unmatched=%s',
                   _auto, _already, _conflict, _amb, _un),
            _actor);

    -- Rebuild queue: every non-already-linked case becomes a durable row
    DELETE FROM public.user_link_queue q
      USING _prev p
      WHERE q.employee_id = p.employee_id
        AND p.action = 'already_linked';

    INSERT INTO public.user_link_queue AS q (
      employee_id, employee_email, candidate_user_id, candidate_email,
      match_method, status, ambiguity_reason, resolved_by, resolved_at, updated_at
    )
    SELECT p.employee_id, p.employee_email, p.candidate_user_id, p.candidate_email,
           p.match_method,
           CASE WHEN p.action = 'auto_link' THEN 'auto_linked' ELSE p.action END,
           p.ambiguity_reason,
           CASE WHEN p.action = 'auto_link' THEN _actor ELSE NULL END,
           CASE WHEN p.action = 'auto_link' THEN now() ELSE NULL END,
           now()
      FROM _prev p
     WHERE p.action <> 'already_linked'
    ON CONFLICT (employee_id) DO UPDATE
      SET candidate_user_id = EXCLUDED.candidate_user_id,
          candidate_email  = EXCLUDED.candidate_email,
          match_method     = EXCLUDED.match_method,
          status           = CASE
            WHEN q.status IN ('rejected','manual_paired') THEN q.status
            ELSE EXCLUDED.status
          END,
          ambiguity_reason = EXCLUDED.ambiguity_reason,
          updated_at       = now();
  END IF;

  RETURN QUERY SELECT _auto, _already, _conflict, _amb, _un,
    (SELECT count(*)::int FROM _prev WHERE action <> 'already_linked');
END $$;

REVOKE ALL ON FUNCTION public.apply_employee_user_reconciliation(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_employee_user_reconciliation(boolean) TO authenticated;

-- =========================================================
-- Manual actions
-- =========================================================
CREATE OR REPLACE FUNCTION public.confirm_employee_user_link(
  _employee_id uuid, _user_id uuid, _reason text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _actor uuid := auth.uid(); _prev uuid; _email text;
BEGIN
  IF NOT public.can_reconcile_cr_identity(_actor) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  -- Refuse if another employee already owns this auth user
  IF EXISTS (SELECT 1 FROM public.employees WHERE user_id = _user_id AND id <> _employee_id) THEN
    RAISE EXCEPTION 'auth_user_already_linked_to_another_employee';
  END IF;

  SELECT user_id INTO _prev FROM public.employees WHERE id = _employee_id;
  SELECT email INTO _email FROM auth.users WHERE id = _user_id;

  UPDATE public.employees SET user_id = _user_id WHERE id = _employee_id;

  INSERT INTO public.user_link_audit (
    employee_id, user_id_before, user_id_after, action, method, reason, actor, matched_email
  ) VALUES (_employee_id, _prev, _user_id, 'manual_link', 'manual', _reason, _actor, _email);

  INSERT INTO public.user_link_queue AS q (
    employee_id, candidate_user_id, candidate_email, match_method, status,
    resolved_by, resolved_at, notes, updated_at
  ) VALUES (_employee_id, _user_id, _email, 'manual', 'manual_paired',
            _actor, now(), _reason, now())
  ON CONFLICT (employee_id) DO UPDATE
    SET candidate_user_id = EXCLUDED.candidate_user_id,
        candidate_email = EXCLUDED.candidate_email,
        status = 'manual_paired',
        resolved_by = _actor, resolved_at = now(),
        notes = _reason, updated_at = now();

  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.reject_employee_user_link(
  _employee_id uuid, _reason text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _actor uuid := auth.uid();
BEGIN
  IF NOT public.can_reconcile_cr_identity(_actor) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.user_link_queue AS q (
    employee_id, match_method, status, resolved_by, resolved_at, notes, updated_at
  ) VALUES (_employee_id, 'manual', 'rejected', _actor, now(), _reason, now())
  ON CONFLICT (employee_id) DO UPDATE
    SET status = 'rejected', resolved_by = _actor, resolved_at = now(),
        notes = _reason, updated_at = now();

  INSERT INTO public.user_link_audit (
    employee_id, action, method, reason, actor
  ) VALUES (_employee_id, 'reject', 'manual', _reason, _actor);

  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.unlink_employee_user(
  _employee_id uuid, _reason text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _actor uuid := auth.uid(); _prev uuid;
BEGIN
  IF NOT public.can_reconcile_cr_identity(_actor) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  SELECT user_id INTO _prev FROM public.employees WHERE id = _employee_id;
  UPDATE public.employees SET user_id = NULL WHERE id = _employee_id;

  INSERT INTO public.user_link_audit (
    employee_id, user_id_before, user_id_after, action, method, reason, actor
  ) VALUES (_employee_id, _prev, NULL, 'unlink', 'admin', _reason, _actor);

  INSERT INTO public.user_link_queue AS q (
    employee_id, match_method, status, resolved_by, resolved_at, notes, updated_at
  ) VALUES (_employee_id, 'manual', 'pending', _actor, now(), _reason, now())
  ON CONFLICT (employee_id) DO UPDATE
    SET status = 'pending', resolved_by = _actor, resolved_at = now(),
        notes = _reason, updated_at = now();

  RETURN true;
END $$;

REVOKE ALL ON FUNCTION public.confirm_employee_user_link(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_employee_user_link(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unlink_employee_user(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_employee_user_link(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_employee_user_link(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlink_employee_user(uuid, text) TO authenticated;
