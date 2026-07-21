
-- Corrective migration: recruiting-owned RBT pathway assignment.
-- Layers on top of the prior migration; does not rewrite it.

-- 1) Data integrity on recruiter classification fields.
DO $$ BEGIN
  ALTER TABLE public.recruiting_candidates
    ADD CONSTRAINT recruiting_candidates_rbt_years_nonneg
    CHECK (rbt_years_experience_direct IS NULL OR rbt_years_experience_direct >= 0)
    NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.recruiting_candidates
    VALIDATE CONSTRAINT recruiting_candidates_rbt_years_nonneg;
EXCEPTION WHEN others THEN NULL; END $$;

-- 2) Enforce at most one active pathway assignment per employee.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_rbt_pathway_assignment_active_per_employee
  ON public.rbt_pathway_assignments (employee_id)
  WHERE active = true;

-- 3) Staff-visible data-quality flags for candidates missing classification
--    data. Dedupes on (candidate_id, kind); resolves audit-worthy events.
CREATE TABLE IF NOT EXISTS public.recruiting_pathway_data_quality (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.recruiting_candidates(id) ON DELETE CASCADE,
  employee_id uuid,
  kind text NOT NULL,
  detail text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, kind)
);

GRANT SELECT, INSERT, UPDATE ON public.recruiting_pathway_data_quality TO authenticated;
GRANT ALL ON public.recruiting_pathway_data_quality TO service_role;

ALTER TABLE public.recruiting_pathway_data_quality ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rbt_dq_recruiting_read" ON public.recruiting_pathway_data_quality;
CREATE POLICY "rbt_dq_recruiting_read"
  ON public.recruiting_pathway_data_quality FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'recruiting_assistant')
    OR public.has_role(auth.uid(), 'training_admin')
  );

DROP POLICY IF EXISTS "rbt_dq_recruiting_write" ON public.recruiting_pathway_data_quality;
CREATE POLICY "rbt_dq_recruiting_write"
  ON public.recruiting_pathway_data_quality FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'recruiting_assistant')
    OR public.has_role(auth.uid(), 'training_admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'recruiting_assistant')
    OR public.has_role(auth.uid(), 'training_admin')
  );

-- 4) Corrected sync function:
--    - Only RBT/BT candidates.
--    - Certified requires years (non-null, >= 0).
--    - Concurrency-safe via explicit row lock on the employee's assignments.
--    - Idempotent: no-op when the resolved key already matches active row.
--    - Emits a deduped data-quality flag on incomplete source data,
--      and clears it when the data becomes complete.
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
BEGIN
  SELECT * INTO v_candidate FROM public.recruiting_candidates WHERE id = _candidate_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_role := v_candidate.role::text;
  v_employee_id := v_candidate.linked_employee_id;
  IF v_employee_id IS NULL THEN RETURN NULL; END IF;

  -- Only RBT/BT candidates ever get a pathway assignment.
  IF v_role NOT IN ('RBT','BT') THEN
    -- Also clear any stale DQ flag for this candidate.
    DELETE FROM public.recruiting_pathway_data_quality
      WHERE candidate_id = _candidate_id;
    RETURN NULL;
  END IF;

  -- Guard: years must be >= 0 when present.
  IF v_candidate.rbt_years_experience_direct IS NOT NULL
     AND v_candidate.rbt_years_experience_direct < 0 THEN
    INSERT INTO public.recruiting_pathway_data_quality (candidate_id, employee_id, kind, detail)
      VALUES (_candidate_id, v_employee_id, 'invalid_years',
              'Years of RBT experience must be zero or greater.')
    ON CONFLICT (candidate_id, kind) DO UPDATE
      SET detail = EXCLUDED.detail, updated_at = now(), resolved_at = NULL;
    RETURN NULL;
  END IF;

  -- Certified requires years.
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
    -- Unknown cert_status: flag as incomplete.
    INSERT INTO public.recruiting_pathway_data_quality (candidate_id, employee_id, kind, detail)
      VALUES (_candidate_id, v_employee_id, 'unknown_certification',
              'RBT certification status has not been captured.')
    ON CONFLICT (candidate_id, kind) DO UPDATE
      SET detail = EXCLUDED.detail, updated_at = now(), resolved_at = NULL;
    RETURN NULL;
  END IF;

  -- Data is complete; clear any prior flags.
  UPDATE public.recruiting_pathway_data_quality
    SET resolved_at = now(), updated_at = now()
    WHERE candidate_id = _candidate_id AND resolved_at IS NULL;

  SELECT id INTO v_pathway_id FROM public.rbt_pathways
    WHERE key = v_key AND is_active IS NOT FALSE LIMIT 1;
  IF v_pathway_id IS NULL THEN RETURN NULL; END IF;

  -- Concurrency-safe: lock the employee's active-assignment rows.
  PERFORM 1 FROM public.rbt_pathway_assignments
    WHERE employee_id = v_employee_id AND active = true
    FOR UPDATE;

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

-- 5) Lock down arbitrary-ID sync from clients.
--    Trigger use is unaffected because the function is SECURITY DEFINER
--    and runs as the function owner, which retains EXECUTE.
REVOKE ALL ON FUNCTION public.sync_rbt_pathway_assignment(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_rbt_pathway_assignment(uuid) FROM authenticated;

-- 6) Scoped self-service entry point for the currently authed RBT.
--    Resolves auth.uid() -> employee -> linked candidate, then delegates.
CREATE OR REPLACE FUNCTION public.ensure_my_rbt_pathway_assignment()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_employee_id uuid;
  v_candidate_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT e.id INTO v_employee_id
    FROM public.employees e
    WHERE e.user_id = v_uid
    LIMIT 1;
  IF v_employee_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT c.id INTO v_candidate_id
    FROM public.recruiting_candidates c
    WHERE c.linked_employee_id = v_employee_id
      AND c.role IN ('RBT','BT')
    ORDER BY c.updated_at DESC
    LIMIT 1;
  IF v_candidate_id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN public.sync_rbt_pathway_assignment(v_candidate_id);
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_my_rbt_pathway_assignment() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_my_rbt_pathway_assignment() TO authenticated;

-- 7) Backfill: sync every eligible linked RBT/BT candidate.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM public.recruiting_candidates
    WHERE linked_employee_id IS NOT NULL
      AND role IN ('RBT','BT')
      AND rbt_certification_status <> 'unknown'
  LOOP
    PERFORM public.sync_rbt_pathway_assignment(r.id);
  END LOOP;
END $$;
