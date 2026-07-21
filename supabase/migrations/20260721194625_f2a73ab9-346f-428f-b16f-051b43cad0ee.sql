
DO $$ BEGIN
  CREATE TYPE public.rbt_certification_status AS ENUM ('not_certified','certified','unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.recruiting_candidates
  ADD COLUMN IF NOT EXISTS rbt_certification_status public.rbt_certification_status
    NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS rbt_years_experience_direct numeric(4,1),
  ADD COLUMN IF NOT EXISTS linked_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_recruiting_candidates_linked_employee
  ON public.recruiting_candidates(linked_employee_id)
  WHERE linked_employee_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.rbt_pathway_assignment_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  candidate_id uuid,
  previous_pathway_key text,
  new_pathway_key text NOT NULL,
  reason text NOT NULL,
  cert_status text,
  years_experience numeric(4,1),
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.rbt_pathway_assignment_audit TO authenticated;
GRANT ALL ON public.rbt_pathway_assignment_audit TO service_role;
ALTER TABLE public.rbt_pathway_assignment_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rbt_pathway_audit_admin_read" ON public.rbt_pathway_assignment_audit;
CREATE POLICY "rbt_pathway_audit_admin_read"
  ON public.rbt_pathway_assignment_audit FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'recruiting_assistant')
    OR public.has_role(auth.uid(), 'training_admin')
  );

DROP POLICY IF EXISTS "rbt_pathway_audit_admin_insert" ON public.rbt_pathway_assignment_audit;
CREATE POLICY "rbt_pathway_audit_admin_insert"
  ON public.rbt_pathway_assignment_audit FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'recruiting_assistant')
    OR public.has_role(auth.uid(), 'training_admin')
  );

CREATE OR REPLACE FUNCTION public.resolve_rbt_pathway_key(
  _cert_status public.rbt_certification_status,
  _years numeric
) RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _cert_status = 'not_certified' THEN 'new_rbt_certification'
    WHEN _cert_status = 'certified' AND COALESCE(_years, 0) < 2 THEN 'under_2_years'
    WHEN _cert_status = 'certified' AND COALESCE(_years, 0) >= 2 THEN 'experienced_rbt'
    ELSE NULL
  END
$$;

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
BEGIN
  SELECT * INTO v_candidate FROM public.recruiting_candidates WHERE id = _candidate_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_employee_id := v_candidate.linked_employee_id;
  IF v_employee_id IS NULL THEN RETURN NULL; END IF;

  v_key := public.resolve_rbt_pathway_key(
    v_candidate.rbt_certification_status,
    v_candidate.rbt_years_experience_direct
  );
  IF v_key IS NULL THEN RETURN NULL; END IF;

  SELECT id INTO v_pathway_id FROM public.rbt_pathways WHERE key = v_key AND is_active IS NOT FALSE LIMIT 1;
  IF v_pathway_id IS NULL THEN RETURN NULL; END IF;

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

GRANT EXECUTE ON FUNCTION public.sync_rbt_pathway_assignment(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.trg_recruiting_candidate_pathway_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.linked_employee_id IS NOT NULL AND (
       TG_OP = 'INSERT'
    OR NEW.linked_employee_id IS DISTINCT FROM OLD.linked_employee_id
    OR NEW.rbt_certification_status IS DISTINCT FROM OLD.rbt_certification_status
    OR NEW.rbt_years_experience_direct IS DISTINCT FROM OLD.rbt_years_experience_direct
  ) THEN
    PERFORM public.sync_rbt_pathway_assignment(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recruiting_candidate_pathway_sync ON public.recruiting_candidates;
CREATE TRIGGER recruiting_candidate_pathway_sync
  AFTER INSERT OR UPDATE OF linked_employee_id, rbt_certification_status, rbt_years_experience_direct
  ON public.recruiting_candidates
  FOR EACH ROW EXECUTE FUNCTION public.trg_recruiting_candidate_pathway_sync();
