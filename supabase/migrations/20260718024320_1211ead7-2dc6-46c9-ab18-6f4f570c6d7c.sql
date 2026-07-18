
CREATE OR REPLACE FUNCTION public.is_rbt_self_only()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'bcba'::app_role)
    OR public.has_role(auth.uid(), 'hr'::app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_lead'::app_role)
    OR public.has_role(auth.uid(), 'training_admin'::app_role)
    OR public.has_role(auth.uid(), 'clinical_lead'::app_role)
    OR public.has_role(auth.uid(), 'state_director'::app_role)
    OR public.has_role(auth.uid(), 'assistant_state_director'::app_role)
    OR public.has_role(auth.uid(), 'coo'::app_role)
    OR public.has_role(auth.uid(), 'executive'::app_role)
    OR public.has_role(auth.uid(), 'director_of_operations'::app_role)
    OR public.has_role(auth.uid(), 'ops_manager'::app_role)
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_rbt_self_only() FROM anon;

CREATE OR REPLACE FUNCTION public.enforce_rbt_readiness_column_lock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_rbt_self_only() AND auth.uid() = NEW.user_id THEN
    IF NEW.ready IS DISTINCT FROM OLD.ready THEN RAISE EXCEPTION 'RBT cannot self-approve readiness gate'; END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN RAISE EXCEPTION 'RBT cannot self-modify readiness status'; END IF;
    IF NEW.signoffs IS DISTINCT FROM OLD.signoffs THEN RAISE EXCEPTION 'RBT cannot self-modify readiness signoffs'; END IF;
    IF NEW.flags IS DISTINCT FROM OLD.flags THEN RAISE EXCEPTION 'RBT cannot self-modify readiness flags'; END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_rbt_readiness_column_lock ON public.rbt_readiness_records;
CREATE TRIGGER trg_rbt_readiness_column_lock BEFORE UPDATE ON public.rbt_readiness_records
FOR EACH ROW EXECUTE FUNCTION public.enforce_rbt_readiness_column_lock();

CREATE OR REPLACE FUNCTION public.enforce_rbt_sessions_column_lock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_rbt_self_only() AND NEW.session_status IS DISTINCT FROM OLD.session_status THEN
    RAISE EXCEPTION 'RBT cannot self-modify session_status';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_rbt_sessions_column_lock ON public.rbt_sessions;
CREATE TRIGGER trg_rbt_sessions_column_lock BEFORE UPDATE ON public.rbt_sessions
FOR EACH ROW EXECUTE FUNCTION public.enforce_rbt_sessions_column_lock();

CREATE OR REPLACE FUNCTION public.enforce_rbt_supervision_column_lock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_rbt_self_only() THEN
    IF NEW.feedback IS DISTINCT FROM OLD.feedback
       OR NEW.competency_area IS DISTINCT FROM OLD.competency_area
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.signed_by_bcba_at IS DISTINCT FROM OLD.signed_by_bcba_at
       OR NEW.bcba_id IS DISTINCT FROM OLD.bcba_id
       OR NEW.duration_minutes IS DISTINCT FROM OLD.duration_minutes
       OR NEW.supervision_type IS DISTINCT FROM OLD.supervision_type THEN
      RAISE EXCEPTION 'RBT can only acknowledge supervision; other fields are BCBA-owned';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_rbt_supervision_column_lock ON public.rbt_supervision;
CREATE TRIGGER trg_rbt_supervision_column_lock BEFORE UPDATE ON public.rbt_supervision
FOR EACH ROW EXECUTE FUNCTION public.enforce_rbt_supervision_column_lock();

CREATE OR REPLACE FUNCTION public.enforce_rbt_hours_issue_resolution()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_rbt_self_only() AND TG_OP = 'UPDATE' THEN
    IF NEW.status IN ('resolved','closed')
       AND (OLD.status IS NULL OR OLD.status NOT IN ('resolved','closed')) THEN
      RAISE EXCEPTION 'RBT cannot self-resolve their own hours issue';
    END IF;
    IF NEW.resolved_by IS DISTINCT FROM OLD.resolved_by THEN
      RAISE EXCEPTION 'RBT cannot set resolved_by on hours issue';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_rbt_hours_issue_resolve_lock ON public.rbt_hours_issues;
CREATE TRIGGER trg_rbt_hours_issue_resolve_lock BEFORE UPDATE ON public.rbt_hours_issues
FOR EACH ROW EXECUTE FUNCTION public.enforce_rbt_hours_issue_resolution();
DROP TRIGGER IF EXISTS trg_rbt_shift_discrepancy_resolve_lock ON public.rbt_shift_discrepancies;
CREATE TRIGGER trg_rbt_shift_discrepancy_resolve_lock BEFORE UPDATE ON public.rbt_shift_discrepancies
FOR EACH ROW EXECUTE FUNCTION public.enforce_rbt_hours_issue_resolution();

CREATE OR REPLACE FUNCTION public.enforce_rbt_first_session_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_self_emp uuid;
BEGIN
  IF public.is_rbt_self_only() THEN
    SELECT id INTO v_self_emp FROM public.employees WHERE user_id = auth.uid() LIMIT 1;
    IF v_self_emp IS NOT NULL AND NEW.owner_employee_id IS NOT NULL AND NEW.owner_employee_id = v_self_emp THEN
      RAISE EXCEPTION 'RBT cannot assign themselves as the follow-up owner';
    END IF;
    IF v_self_emp IS NOT NULL AND NEW.employee_id = v_self_emp
       AND TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status IN ('resolved','closed') THEN
      RAISE EXCEPTION 'RBT cannot self-resolve their own first-session outcome';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_rbt_first_session_owner ON public.rbt_first_session_outcomes;
CREATE TRIGGER trg_rbt_first_session_owner BEFORE INSERT OR UPDATE ON public.rbt_first_session_outcomes
FOR EACH ROW EXECUTE FUNCTION public.enforce_rbt_first_session_owner();
