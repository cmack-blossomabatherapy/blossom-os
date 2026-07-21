BEGIN;

-- 1) Log & correct invalid "certified without years" candidates using the REAL
--    column names on recruiting_pathway_data_quality (candidate_id, employee_id,
--    kind, detail) with the real unique key (candidate_id, kind).
DO $$
DECLARE
  v_row record;
  v_has_cert_cols boolean;
  v_has_dq_table  boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='recruiting_candidates'
      AND column_name='rbt_certification_status'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='recruiting_candidates'
      AND column_name='rbt_years_experience_direct'
  ) INTO v_has_cert_cols;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='recruiting_pathway_data_quality'
  ) INTO v_has_dq_table;

  IF v_has_cert_cols AND v_has_dq_table THEN
    FOR v_row IN
      SELECT id, linked_employee_id
      FROM public.recruiting_candidates
      WHERE rbt_certification_status = 'certified'
        AND rbt_years_experience_direct IS NULL
    LOOP
      INSERT INTO public.recruiting_pathway_data_quality
        (candidate_id, employee_id, kind, detail)
      VALUES
        (v_row.id, v_row.linked_employee_id, 'certified_missing_years',
         'Certified without years; corrective migration cleared certification to unknown. Re-enter years and re-mark certified.')
      ON CONFLICT (candidate_id, kind) DO UPDATE
        SET detail = EXCLUDED.detail,
            employee_id = COALESCE(public.recruiting_pathway_data_quality.employee_id, EXCLUDED.employee_id),
            resolved_at = NULL,
            updated_at = now();

      UPDATE public.recruiting_candidates
        SET rbt_certification_status = 'unknown',
            updated_at = now()
        WHERE id = v_row.id;
    END LOOP;
  END IF;
END $$;

-- 2) Ensure the CHECK is present + VALIDATED. Loud on failure (no swallow).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='rbt_certified_requires_years'
      AND conrelid='public.recruiting_candidates'::regclass
  ) THEN
    ALTER TABLE public.recruiting_candidates
      ADD CONSTRAINT rbt_certified_requires_years CHECK (
        rbt_certification_status IS DISTINCT FROM 'certified'
        OR rbt_years_experience_direct IS NOT NULL
      ) NOT VALID;
  END IF;
END $$;

ALTER TABLE public.recruiting_candidates
  VALIDATE CONSTRAINT rbt_certified_requires_years;

-- 3) Deterministically deactivate duplicate active assignment rows BEFORE we
--    (re)ensure the partial unique index. Keep most-recent per employee.
WITH ranked AS (
  SELECT id,
         employee_id,
         row_number() OVER (
           PARTITION BY employee_id
           ORDER BY assigned_at DESC NULLS LAST, updated_at DESC NULLS LAST, id
         ) AS rn
  FROM public.rbt_pathway_assignments
  WHERE active = true
)
UPDATE public.rbt_pathway_assignments a
   SET active = false, updated_at = now()
  FROM ranked r
 WHERE a.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_rbt_pathway_assignment_active_per_employee
  ON public.rbt_pathway_assignments (employee_id)
  WHERE active = true;

-- 4) Harden the sync function with a per-employee transaction advisory lock
--    acquired BEFORE any read/write of active assignments.
CREATE OR REPLACE FUNCTION public.sync_rbt_pathway_assignment(_candidate_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_candidate public.recruiting_candidates%ROWTYPE;
  v_employee_id uuid;
  v_key text;
  v_pathway_id uuid;
  v_current_assignment RECORD;
  v_previous_key text;
  v_role text;
  v_lock_key bigint;
BEGIN
  SELECT * INTO v_candidate FROM public.recruiting_candidates WHERE id = _candidate_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_role := v_candidate.role::text;
  v_employee_id := v_candidate.linked_employee_id;
  IF v_employee_id IS NULL THEN RETURN NULL; END IF;

  IF v_role NOT IN ('RBT','BT') THEN
    DELETE FROM public.recruiting_pathway_data_quality WHERE candidate_id = _candidate_id;
    RETURN NULL;
  END IF;

  IF v_candidate.rbt_years_experience_direct IS NOT NULL
     AND v_candidate.rbt_years_experience_direct < 0 THEN
    INSERT INTO public.recruiting_pathway_data_quality (candidate_id, employee_id, kind, detail)
      VALUES (_candidate_id, v_employee_id, 'invalid_years',
              'Years of RBT experience must be zero or greater.')
    ON CONFLICT (candidate_id, kind) DO UPDATE
      SET detail = EXCLUDED.detail, updated_at = now(), resolved_at = NULL;
    RETURN NULL;
  END IF;

  IF v_candidate.rbt_certification_status = 'certified'
     AND v_candidate.rbt_years_experience_direct IS NULL THEN
    INSERT INTO public.recruiting_pathway_data_quality (candidate_id, employee_id, kind, detail)
      VALUES (_candidate_id, v_employee_id, 'missing_years_certified',
              'Certified RBT is missing years of direct experience.')
    ON CONFLICT (candidate_id, kind) DO UPDATE
      SET detail = EXCLUDED.detail, updated_at = now(), resolved_at = NULL;
    RETURN NULL;
  END IF;

  v_key := public.resolve_rbt_pathway_key(
    v_candidate.rbt_certification_status,
    v_candidate.rbt_years_experience_direct
  );
  IF v_key IS NULL THEN
    INSERT INTO public.recruiting_pathway_data_quality (candidate_id, employee_id, kind, detail)
      VALUES (_candidate_id, v_employee_id, 'unknown_certification',
              'RBT certification status has not been captured.')
    ON CONFLICT (candidate_id, kind) DO UPDATE
      SET detail = EXCLUDED.detail, updated_at = now(), resolved_at = NULL;
    RETURN NULL;
  END IF;

  UPDATE public.recruiting_pathway_data_quality
    SET resolved_at = now(), updated_at = now()
    WHERE candidate_id = _candidate_id AND resolved_at IS NULL;

  SELECT id INTO v_pathway_id FROM public.rbt_pathways
    WHERE key = v_key AND is_active IS NOT FALSE LIMIT 1;
  IF v_pathway_id IS NULL THEN RETURN NULL; END IF;

  -- Concurrency lock: derive a stable bigint from the employee uuid and hold
  -- it for the remainder of the transaction. Serializes concurrent provisions
  -- for the same employee (uses top 15 hex chars = 60 bits, always positive).
  v_lock_key := ('x' || substr(md5(v_employee_id::text), 1, 15))::bit(60)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);

  SELECT a.id, a.pathway_id, p.key AS pathway_key
    INTO v_current_assignment
    FROM public.rbt_pathway_assignments a
    JOIN public.rbt_pathways p ON p.id = a.pathway_id
    WHERE a.employee_id = v_employee_id AND a.active = true
    ORDER BY a.assigned_at DESC
    LIMIT 1;

  IF FOUND AND v_current_assignment.pathway_id = v_pathway_id THEN
    RETURN v_current_assignment.id;
  END IF;

  v_previous_key := CASE WHEN FOUND THEN v_current_assignment.pathway_key ELSE NULL END;

  UPDATE public.rbt_pathway_assignments
    SET active = false, updated_at = now()
    WHERE employee_id = v_employee_id AND active = true;

  INSERT INTO public.rbt_pathway_assignments (employee_id, pathway_id, assignment_source, assigned_at, active, notes)
    VALUES (v_employee_id, v_pathway_id, 'recruiting_auto', now(), true,
      'Auto-assigned from recruiting fields: cert=' || v_candidate.rbt_certification_status::text
      || ', years=' || COALESCE(v_candidate.rbt_years_experience_direct::text,'unknown'));

  INSERT INTO public.rbt_pathway_assignment_audit
    (employee_id, candidate_id, previous_pathway_key, new_pathway_key, reason,
     cert_status, years_experience, performed_by)
    VALUES (v_employee_id, _candidate_id, v_previous_key, v_key,
      CASE WHEN v_previous_key IS NULL THEN 'initial_assignment' ELSE 'recruiting_correction' END,
      v_candidate.rbt_certification_status::text,
      v_candidate.rbt_years_experience_direct,
      auth.uid());

  RETURN v_employee_id;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_rbt_pathway_assignment(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_rbt_pathway_assignment(uuid) FROM authenticated;

COMMIT;