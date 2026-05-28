
CREATE OR REPLACE FUNCTION public.sync_eval_staff_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_text text;
  v_existing uuid;
  v_first text;
  v_last text;
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT CASE ur.role::text WHEN 'rbt' THEN 'RBT' WHEN 'bcba' THEN 'BCBA' ELSE NULL END
    INTO v_role_text
  FROM public.user_roles ur
  WHERE ur.user_id = NEW.user_id
    AND ur.role::text IN ('rbt','bcba')
  LIMIT 1;

  IF v_role_text IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_existing
  FROM public.evaluation_staff
  WHERE lower(email) = lower(NEW.email)
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    UPDATE public.evaluation_staff
       SET hire_date = COALESCE(NEW.hire_date, hire_date),
           state = COALESCE(NEW.state, state),
           active_status = COALESCE(NEW.active, active_status),
           role = v_role_text,
           updated_at = now()
     WHERE id = v_existing;
    RETURN NEW;
  END IF;

  IF NEW.display_name IS NOT NULL AND position(' ' IN NEW.display_name) > 0 THEN
    v_first := split_part(NEW.display_name, ' ', 1);
    v_last := trim(substring(NEW.display_name FROM position(' ' IN NEW.display_name) + 1));
  ELSE
    v_first := COALESCE(NULLIF(NEW.display_name, ''), split_part(NEW.email, '@', 1));
    v_last := '—';
  END IF;

  INSERT INTO public.evaluation_staff (
    first_name, last_name, email, role, state, hire_date, active_status, evaluation_frequency
  ) VALUES (
    v_first, COALESCE(NULLIF(v_last, ''), '—'), NEW.email, v_role_text,
    NEW.state, NEW.hire_date, COALESCE(NEW.active, true), 'Both'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_eval_staff_from_profile ON public.profiles;
CREATE TRIGGER trg_sync_eval_staff_from_profile
AFTER INSERT OR UPDATE OF hire_date, state, active, display_name ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_eval_staff_from_profile();

-- Backfill from existing profile hire dates so the eval_staff trigger regenerates schedules
UPDATE public.evaluation_staff es
   SET hire_date = p.hire_date,
       state = COALESCE(p.state, es.state),
       active_status = COALESCE(p.active, es.active_status),
       updated_at = now()
  FROM public.profiles p
 WHERE lower(p.email) = lower(es.email)
   AND p.hire_date IS NOT NULL
   AND es.hire_date IS DISTINCT FROM p.hire_date;
