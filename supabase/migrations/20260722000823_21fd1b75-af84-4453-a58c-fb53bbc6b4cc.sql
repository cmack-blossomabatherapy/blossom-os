
-- =========================================================
-- Phase 2: CR provider ↔ employee reconciliation
-- =========================================================

-- Helper: is caller an authorized reconciliation admin?
CREATE OR REPLACE FUNCTION public.can_reconcile_cr_identity(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    public.has_role(_uid, 'super_admin'::public.app_role)
      OR public.has_role(_uid, 'admin'::public.app_role)
      OR public.has_role(_uid, 'systems_admin'::public.app_role),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.can_reconcile_cr_identity(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_reconcile_cr_identity(uuid) TO authenticated, service_role;

-- =========================================================
-- Audit table (append-only)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.cr_identity_mapping_audit (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  actor_id      uuid,
  action        text NOT NULL,
  provider_id   text,
  employee_id   uuid,
  before        jsonb,
  after         jsonb,
  method        text,
  reason        text,
  details       jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_cr_id_audit_created ON public.cr_identity_mapping_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cr_id_audit_provider ON public.cr_identity_mapping_audit(provider_id);
CREATE INDEX IF NOT EXISTS idx_cr_id_audit_employee ON public.cr_identity_mapping_audit(employee_id);

GRANT SELECT ON public.cr_identity_mapping_audit TO authenticated;
GRANT ALL    ON public.cr_identity_mapping_audit TO service_role;

ALTER TABLE public.cr_identity_mapping_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cr_id_audit_admin_read" ON public.cr_identity_mapping_audit;
CREATE POLICY "cr_id_audit_admin_read"
  ON public.cr_identity_mapping_audit
  FOR SELECT TO authenticated
  USING (public.can_reconcile_cr_identity(auth.uid()));

-- Deny writes from clients; only SECURITY DEFINER functions write.
DROP POLICY IF EXISTS "cr_id_audit_no_client_write" ON public.cr_identity_mapping_audit;
CREATE POLICY "cr_id_audit_no_client_write"
  ON public.cr_identity_mapping_audit
  FOR INSERT TO authenticated
  WITH CHECK (false);

-- =========================================================
-- Durable review queue
-- =========================================================
CREATE TABLE IF NOT EXISTS public.cr_identity_mapping_queue (
  provider_id       text PRIMARY KEY,
  provider_name     text,
  provider_name_key text,
  suggested_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  mapping_method    text NOT NULL,
  mapping_status    text NOT NULL,     -- pending | confirmed | rejected | manual_paired | auto_linked | conflict
  ambiguity_reason  text,
  resolved_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  resolved_by       uuid,
  resolved_at       timestamptz,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cr_id_queue_status ON public.cr_identity_mapping_queue(mapping_status);
CREATE INDEX IF NOT EXISTS idx_cr_id_queue_method ON public.cr_identity_mapping_queue(mapping_method);

GRANT SELECT ON public.cr_identity_mapping_queue TO authenticated;
GRANT ALL    ON public.cr_identity_mapping_queue TO service_role;

ALTER TABLE public.cr_identity_mapping_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cr_id_queue_admin_read" ON public.cr_identity_mapping_queue;
CREATE POLICY "cr_id_queue_admin_read"
  ON public.cr_identity_mapping_queue
  FOR SELECT TO authenticated
  USING (public.can_reconcile_cr_identity(auth.uid()));

DROP POLICY IF EXISTS "cr_id_queue_no_client_write" ON public.cr_identity_mapping_queue;
CREATE POLICY "cr_id_queue_no_client_write"
  ON public.cr_identity_mapping_queue
  FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "cr_id_queue_no_client_update" ON public.cr_identity_mapping_queue;
CREATE POLICY "cr_id_queue_no_client_update"
  ON public.cr_identity_mapping_queue
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public._touch_cr_id_queue_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_cr_id_queue_touch ON public.cr_identity_mapping_queue;
CREATE TRIGGER trg_cr_id_queue_touch
  BEFORE UPDATE ON public.cr_identity_mapping_queue
  FOR EACH ROW EXECUTE FUNCTION public._touch_cr_id_queue_updated_at();

-- =========================================================
-- Dry-run classification for every CR provider
-- =========================================================
CREATE OR REPLACE FUNCTION public.preview_cr_employee_reconciliation()
RETURNS TABLE(
  provider_id text,
  provider_name text,
  provider_name_key text,
  suggested_employee_id uuid,
  mapping_method text,
  mapping_status text,
  ambiguity_reason text,
  currently_linked_employee_id uuid,
  action text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH src AS (
    SELECT m.provider_id, m.provider_name, m.provider_name_key,
           m.employee_id AS suggested_employee_id,
           m.mapping_method, m.mapping_status, m.ambiguity_reason
    FROM public.v_cr_provider_mapping m
  ),
  linked AS (
    SELECT NULLIF(e.centralreach_id,'') AS provider_id, e.id AS employee_id
    FROM public.employees e
    WHERE NULLIF(e.centralreach_id,'') IS NOT NULL
  )
  SELECT
    s.provider_id,
    s.provider_name,
    s.provider_name_key,
    s.suggested_employee_id,
    s.mapping_method,
    s.mapping_status,
    s.ambiguity_reason,
    l.employee_id AS currently_linked_employee_id,
    CASE
      WHEN l.employee_id IS NOT NULL AND s.suggested_employee_id IS NOT NULL
           AND l.employee_id <> s.suggested_employee_id            THEN 'conflict'
      WHEN l.employee_id IS NOT NULL AND s.mapping_status='mapped' THEN 'already_linked'
      WHEN l.employee_id IS NOT NULL                                THEN 'already_linked_other'
      WHEN s.mapping_status='mapped' AND s.mapping_method IN ('exact_id','unique_name')
           AND s.suggested_employee_id IS NOT NULL                 THEN 'auto_link'
      WHEN s.mapping_method IN ('ambiguous_id','ambiguous_provider','ambiguous_employee')
                                                                    THEN 'ambiguous'
      ELSE 'unmatched'
    END AS action
  FROM src s
  LEFT JOIN linked l ON l.provider_id = s.provider_id
  WHERE public.can_reconcile_cr_identity(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.preview_cr_employee_reconciliation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_cr_employee_reconciliation() TO authenticated, service_role;

-- =========================================================
-- Apply safe reconciliation
-- =========================================================
CREATE OR REPLACE FUNCTION public.apply_cr_employee_reconciliation(_dry_run boolean DEFAULT false)
RETURNS TABLE(
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
  v_actor uuid := auth.uid();
  v_auto  int := 0;
  v_already int := 0;
  v_conflict int := 0;
  v_ambig int := 0;
  v_unmatch int := 0;
  v_qrows int := 0;
  r RECORD;
BEGIN
  IF NOT public.can_reconcile_cr_identity(v_actor) THEN
    RAISE EXCEPTION 'apply_cr_employee_reconciliation requires admin';
  END IF;

  FOR r IN
    SELECT * FROM public.preview_cr_employee_reconciliation()
  LOOP
    IF r.action = 'auto_link' THEN
      -- Only write when the target employee has NO existing centralreach_id
      -- AND no other employee currently claims this provider_id.
      IF NOT _dry_run
         AND r.suggested_employee_id IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM public.employees e2
           WHERE e2.centralreach_id = r.provider_id
         )
         AND (
           SELECT COALESCE(NULLIF(centralreach_id,''), NULL) IS NULL
           FROM public.employees WHERE id = r.suggested_employee_id
         )
      THEN
        UPDATE public.employees
           SET centralreach_id = r.provider_id, updated_at = now()
         WHERE id = r.suggested_employee_id
           AND (centralreach_id IS NULL OR centralreach_id = '');

        INSERT INTO public.cr_identity_mapping_audit
          (actor_id, action, provider_id, employee_id, before, after, method, reason)
        VALUES
          (v_actor, 'auto_link', r.provider_id, r.suggested_employee_id,
           jsonb_build_object('centralreach_id', null),
           jsonb_build_object('centralreach_id', r.provider_id),
           r.mapping_method, 'Reconciliation apply');

        INSERT INTO public.cr_identity_mapping_queue
          (provider_id, provider_name, provider_name_key, suggested_employee_id,
           mapping_method, mapping_status, ambiguity_reason,
           resolved_employee_id, resolved_by, resolved_at)
        VALUES
          (r.provider_id, r.provider_name, r.provider_name_key, r.suggested_employee_id,
           r.mapping_method, 'auto_linked', r.ambiguity_reason,
           r.suggested_employee_id, v_actor, now())
        ON CONFLICT (provider_id) DO UPDATE
          SET mapping_status = 'auto_linked',
              suggested_employee_id = EXCLUDED.suggested_employee_id,
              resolved_employee_id  = EXCLUDED.resolved_employee_id,
              resolved_by = EXCLUDED.resolved_by,
              resolved_at = EXCLUDED.resolved_at,
              provider_name = EXCLUDED.provider_name,
              provider_name_key = EXCLUDED.provider_name_key,
              mapping_method = EXCLUDED.mapping_method,
              ambiguity_reason = EXCLUDED.ambiguity_reason;

        v_auto := v_auto + 1;
      ELSIF _dry_run THEN
        v_auto := v_auto + 1;
      END IF;

    ELSIF r.action = 'already_linked' THEN
      v_already := v_already + 1;

    ELSIF r.action = 'already_linked_other' THEN
      v_already := v_already + 1;
      IF NOT _dry_run THEN
        INSERT INTO public.cr_identity_mapping_queue
          (provider_id, provider_name, provider_name_key, suggested_employee_id,
           mapping_method, mapping_status, ambiguity_reason)
        VALUES
          (r.provider_id, r.provider_name, r.provider_name_key, r.suggested_employee_id,
           r.mapping_method, 'pending', r.ambiguity_reason)
        ON CONFLICT (provider_id) DO UPDATE
          SET provider_name = EXCLUDED.provider_name,
              provider_name_key = EXCLUDED.provider_name_key,
              suggested_employee_id = EXCLUDED.suggested_employee_id,
              mapping_method = EXCLUDED.mapping_method,
              ambiguity_reason = EXCLUDED.ambiguity_reason
          WHERE public.cr_identity_mapping_queue.mapping_status
                NOT IN ('confirmed','manual_paired','auto_linked','rejected');
        v_qrows := v_qrows + 1;
      END IF;

    ELSIF r.action = 'conflict' THEN
      v_conflict := v_conflict + 1;
      IF NOT _dry_run THEN
        INSERT INTO public.cr_identity_mapping_queue
          (provider_id, provider_name, provider_name_key, suggested_employee_id,
           mapping_method, mapping_status, ambiguity_reason)
        VALUES
          (r.provider_id, r.provider_name, r.provider_name_key, r.suggested_employee_id,
           r.mapping_method, 'conflict',
           COALESCE(r.ambiguity_reason, 'Suggested employee differs from currently linked employee'))
        ON CONFLICT (provider_id) DO UPDATE
          SET mapping_status = 'conflict',
              provider_name = EXCLUDED.provider_name,
              provider_name_key = EXCLUDED.provider_name_key,
              suggested_employee_id = EXCLUDED.suggested_employee_id,
              mapping_method = EXCLUDED.mapping_method,
              ambiguity_reason = EXCLUDED.ambiguity_reason;
        v_qrows := v_qrows + 1;
      END IF;

    ELSIF r.action = 'ambiguous' THEN
      v_ambig := v_ambig + 1;
      IF NOT _dry_run THEN
        INSERT INTO public.cr_identity_mapping_queue
          (provider_id, provider_name, provider_name_key, suggested_employee_id,
           mapping_method, mapping_status, ambiguity_reason)
        VALUES
          (r.provider_id, r.provider_name, r.provider_name_key, r.suggested_employee_id,
           r.mapping_method, 'pending', r.ambiguity_reason)
        ON CONFLICT (provider_id) DO UPDATE
          SET provider_name = EXCLUDED.provider_name,
              provider_name_key = EXCLUDED.provider_name_key,
              suggested_employee_id = EXCLUDED.suggested_employee_id,
              mapping_method = EXCLUDED.mapping_method,
              ambiguity_reason = EXCLUDED.ambiguity_reason
          WHERE public.cr_identity_mapping_queue.mapping_status
                NOT IN ('confirmed','manual_paired','auto_linked','rejected');
        v_qrows := v_qrows + 1;
      END IF;

    ELSE
      v_unmatch := v_unmatch + 1;
      IF NOT _dry_run THEN
        INSERT INTO public.cr_identity_mapping_queue
          (provider_id, provider_name, provider_name_key, suggested_employee_id,
           mapping_method, mapping_status, ambiguity_reason)
        VALUES
          (r.provider_id, r.provider_name, r.provider_name_key, NULL,
           r.mapping_method, 'pending',
           COALESCE(r.ambiguity_reason, 'No employee match'))
        ON CONFLICT (provider_id) DO UPDATE
          SET provider_name = EXCLUDED.provider_name,
              provider_name_key = EXCLUDED.provider_name_key,
              mapping_method = EXCLUDED.mapping_method,
              ambiguity_reason = EXCLUDED.ambiguity_reason
          WHERE public.cr_identity_mapping_queue.mapping_status
                NOT IN ('confirmed','manual_paired','auto_linked','rejected');
        v_qrows := v_qrows + 1;
      END IF;
    END IF;
  END LOOP;

  IF NOT _dry_run THEN
    INSERT INTO public.cr_identity_mapping_audit(actor_id, action, method, reason, details)
    VALUES (v_actor, 'apply_run', 'batch', 'Phase 2 reconciliation run',
      jsonb_build_object('auto_linked', v_auto, 'already_linked', v_already,
                         'conflicts', v_conflict, 'ambiguous', v_ambig,
                         'unmatched', v_unmatch, 'queue_rows', v_qrows));
  END IF;

  RETURN QUERY SELECT v_auto, v_already, v_conflict, v_ambig, v_unmatch, v_qrows;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_cr_employee_reconciliation(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_cr_employee_reconciliation(boolean) TO authenticated, service_role;

-- =========================================================
-- Manual pair / confirm / reject / unlink
-- =========================================================
CREATE OR REPLACE FUNCTION public.confirm_cr_provider_mapping(
  _provider_id text,
  _employee_id uuid,
  _reason text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_prev text;
  v_other uuid;
BEGIN
  IF NOT public.can_reconcile_cr_identity(v_actor) THEN
    RAISE EXCEPTION 'confirm_cr_provider_mapping requires admin';
  END IF;
  IF _provider_id IS NULL OR _employee_id IS NULL THEN
    RAISE EXCEPTION 'provider_id and employee_id required';
  END IF;

  SELECT id INTO v_other FROM public.employees
   WHERE centralreach_id = _provider_id AND id <> _employee_id;
  IF v_other IS NOT NULL THEN
    RAISE EXCEPTION 'Provider % already linked to a different employee %', _provider_id, v_other;
  END IF;

  SELECT centralreach_id INTO v_prev FROM public.employees WHERE id = _employee_id;

  UPDATE public.employees
     SET centralreach_id = _provider_id, updated_at = now()
   WHERE id = _employee_id;

  INSERT INTO public.cr_identity_mapping_audit
    (actor_id, action, provider_id, employee_id, before, after, method, reason)
  VALUES
    (v_actor, 'manual_pair', _provider_id, _employee_id,
     jsonb_build_object('centralreach_id', v_prev),
     jsonb_build_object('centralreach_id', _provider_id),
     'manual', _reason);

  INSERT INTO public.cr_identity_mapping_queue
    (provider_id, mapping_method, mapping_status,
     resolved_employee_id, suggested_employee_id, resolved_by, resolved_at, notes)
  VALUES
    (_provider_id, 'manual', 'manual_paired',
     _employee_id, _employee_id, v_actor, now(), _reason)
  ON CONFLICT (provider_id) DO UPDATE
    SET mapping_status = 'manual_paired',
        resolved_employee_id = EXCLUDED.resolved_employee_id,
        resolved_by = EXCLUDED.resolved_by,
        resolved_at = EXCLUDED.resolved_at,
        notes = EXCLUDED.notes;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_cr_provider_mapping(text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_cr_provider_mapping(text,uuid,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.reject_cr_provider_mapping(
  _provider_id text,
  _reason text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_actor uuid := auth.uid();
BEGIN
  IF NOT public.can_reconcile_cr_identity(v_actor) THEN
    RAISE EXCEPTION 'reject_cr_provider_mapping requires admin';
  END IF;

  INSERT INTO public.cr_identity_mapping_queue
    (provider_id, mapping_method, mapping_status, resolved_by, resolved_at, notes)
  VALUES (_provider_id, 'manual', 'rejected', v_actor, now(), _reason)
  ON CONFLICT (provider_id) DO UPDATE
    SET mapping_status = 'rejected',
        resolved_by = EXCLUDED.resolved_by,
        resolved_at = EXCLUDED.resolved_at,
        notes = EXCLUDED.notes;

  INSERT INTO public.cr_identity_mapping_audit
    (actor_id, action, provider_id, method, reason)
  VALUES (v_actor, 'reject', _provider_id, 'manual', _reason);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_cr_provider_mapping(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_cr_provider_mapping(text,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.unlink_cr_provider_mapping(
  _employee_id uuid,
  _reason text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_prev text;
BEGIN
  IF NOT public.can_reconcile_cr_identity(v_actor) THEN
    RAISE EXCEPTION 'unlink_cr_provider_mapping requires admin';
  END IF;

  SELECT centralreach_id INTO v_prev FROM public.employees WHERE id = _employee_id;
  IF v_prev IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.employees SET centralreach_id = NULL, updated_at = now()
   WHERE id = _employee_id;

  INSERT INTO public.cr_identity_mapping_audit
    (actor_id, action, provider_id, employee_id, before, after, method, reason)
  VALUES
    (v_actor, 'unlink', v_prev, _employee_id,
     jsonb_build_object('centralreach_id', v_prev),
     jsonb_build_object('centralreach_id', null),
     'manual', _reason);

  UPDATE public.cr_identity_mapping_queue
     SET mapping_status = 'pending',
         resolved_employee_id = NULL,
         resolved_by = v_actor,
         resolved_at = now(),
         notes = COALESCE(_reason, notes)
   WHERE provider_id = v_prev;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.unlink_cr_provider_mapping(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlink_cr_provider_mapping(uuid,text) TO authenticated, service_role;
