
-- Map department name -> app_role
CREATE OR REPLACE FUNCTION public.app_role_for_department(_dept_name text)
RETURNS app_role
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(coalesce(_dept_name, ''))
    WHEN 'executive'                   THEN 'exec'::app_role
    WHEN 'executive support'           THEN 'exec'::app_role
    WHEN 'operations'                  THEN 'ops_manager'::app_role
    WHEN 'state leadership'            THEN 'state_director'::app_role
    WHEN 'intake'                      THEN 'intake'::app_role
    WHEN 'authorizations'              THEN 'auth_team'::app_role
    WHEN 'scheduling'                  THEN 'scheduling'::app_role
    WHEN 'staffing'                    THEN 'staffing'::app_role
    WHEN 'recruiting'                  THEN 'recruiting_assistant'::app_role
    WHEN 'hr / recruiting'             THEN 'hr'::app_role
    WHEN 'human resources'             THEN 'hr'::app_role
    WHEN 'finance'                     THEN 'finance'::app_role
    WHEN 'payroll / finance'           THEN 'payroll_admin'::app_role
    WHEN 'qa / compliance'             THEN 'qa'::app_role
    WHEN 'marketing'                   THEN 'marketing'::app_role
    WHEN 'business development'        THEN 'marketing'::app_role
    WHEN 'clinic operations'           THEN 'clinic'::app_role
    WHEN 'phone / support'             THEN 'phone_support'::app_role
    WHEN 'behavioral support'          THEN 'bcba'::app_role
    WHEN 'case management'             THEN 'bcba'::app_role
    WHEN 'training / clinical support' THEN 'training_admin'::app_role
    WHEN 'systems & software'          THEN 'admin'::app_role
    ELSE NULL
  END
$$;

-- Trigger function: sync role from employee's department
CREATE OR REPLACE FUNCTION public.sync_user_role_from_department()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _dept_name text;
  _role app_role;
BEGIN
  IF NEW.user_id IS NULL OR NEW.department_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT name INTO _dept_name FROM public.hr_departments WHERE id = NEW.department_id;
  _role := public.app_role_for_department(_dept_name);

  IF _role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, _role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_role_from_department ON public.employees;
CREATE TRIGGER trg_sync_user_role_from_department
AFTER INSERT OR UPDATE OF user_id, department_id ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_from_department();

-- Backfill existing employees
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT e.user_id, public.app_role_for_department(d.name)
FROM public.employees e
JOIN public.hr_departments d ON d.id = e.department_id
WHERE e.user_id IS NOT NULL
  AND public.app_role_for_department(d.name) IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;
