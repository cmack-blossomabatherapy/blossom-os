
CREATE OR REPLACE FUNCTION public.sync_eval_staff_from_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_text text;
  v_profile record;
  v_first text;
  v_last text;
  v_existing uuid;
BEGIN
  v_role_text := CASE NEW.role::text
    WHEN 'rbt' THEN 'RBT'
    WHEN 'bcba' THEN 'BCBA'
    ELSE NULL
  END;

  IF v_role_text IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id, display_name, email, state, hire_date, active
    INTO v_profile
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  IF v_profile.email IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_existing
  FROM public.evaluation_staff
  WHERE lower(email) = lower(v_profile.email)
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    UPDATE public.evaluation_staff
       SET role = v_role_text,
           active_status = COALESCE(v_profile.active, true),
           updated_at = now()
     WHERE id = v_existing;
    RETURN NEW;
  END IF;

  IF v_profile.display_name IS NOT NULL AND position(' ' IN v_profile.display_name) > 0 THEN
    v_first := split_part(v_profile.display_name, ' ', 1);
    v_last := trim(substring(v_profile.display_name FROM position(' ' IN v_profile.display_name) + 1));
  ELSE
    v_first := COALESCE(NULLIF(v_profile.display_name, ''), split_part(v_profile.email, '@', 1));
    v_last := '';
  END IF;

  INSERT INTO public.evaluation_staff (
    first_name, last_name, email, role, state, hire_date, active_status, evaluation_frequency
  ) VALUES (
    v_first,
    COALESCE(NULLIF(v_last, ''), '—'),
    v_profile.email,
    v_role_text,
    v_profile.state,
    v_profile.hire_date,
    COALESCE(v_profile.active, true),
    'Both'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_eval_staff_from_user_role ON public.user_roles;
CREATE TRIGGER trg_sync_eval_staff_from_user_role
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_eval_staff_from_user_role();

-- Backfill existing rbt/bcba users
INSERT INTO public.evaluation_staff (first_name, last_name, email, role, state, hire_date, active_status, evaluation_frequency)
SELECT
  CASE WHEN p.display_name IS NOT NULL AND position(' ' IN p.display_name) > 0
       THEN split_part(p.display_name, ' ', 1)
       ELSE COALESCE(NULLIF(p.display_name, ''), split_part(p.email, '@', 1)) END,
  CASE WHEN p.display_name IS NOT NULL AND position(' ' IN p.display_name) > 0
       THEN trim(substring(p.display_name FROM position(' ' IN p.display_name) + 1))
       ELSE '—' END,
  p.email,
  CASE ur.role::text WHEN 'rbt' THEN 'RBT' WHEN 'bcba' THEN 'BCBA' END,
  p.state,
  p.hire_date,
  COALESCE(p.active, true),
  'Both'
FROM public.user_roles ur
JOIN public.profiles p ON p.user_id = ur.user_id
WHERE ur.role::text IN ('rbt','bcba')
  AND p.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.evaluation_staff es WHERE lower(es.email) = lower(p.email)
  );
