
CREATE OR REPLACE FUNCTION public.rbt_lifecycle_access_revoke()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
BEGIN
  IF NEW.stage IS NOT DISTINCT FROM OLD.stage THEN
    RETURN NEW;
  END IF;

  SELECT e.user_id INTO v_user FROM public.employees e WHERE e.id = NEW.employee_id;
  IF v_user IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.stage IN ('separated','offboarding') THEN
    DELETE FROM public.user_roles WHERE user_id = v_user;
    INSERT INTO public.rbt_lifecycle_events(employee_id, from_stage, to_stage, reason, source, actor_id)
    VALUES (NEW.employee_id, OLD.stage, NEW.stage, 'Auto-revoked all user_roles on offboarding/separation', 'trigger:access_revoke', auth.uid());
  ELSIF NEW.stage IN ('leave','inactive') THEN
    DELETE FROM public.user_roles
    WHERE user_id = v_user
      AND role::text NOT IN ('rbt');
    INSERT INTO public.rbt_lifecycle_events(employee_id, from_stage, to_stage, reason, source, actor_id)
    VALUES (NEW.employee_id, OLD.stage, NEW.stage, 'Auto-suspended elevated roles on leave/inactive', 'trigger:access_suspend', auth.uid());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rbt_lifecycle_access_revoke ON public.rbt_lifecycle_state;
CREATE TRIGGER trg_rbt_lifecycle_access_revoke
AFTER UPDATE OF stage ON public.rbt_lifecycle_state
FOR EACH ROW
EXECUTE FUNCTION public.rbt_lifecycle_access_revoke();
