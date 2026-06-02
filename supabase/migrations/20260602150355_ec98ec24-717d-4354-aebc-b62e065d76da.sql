CREATE OR REPLACE FUNCTION public.app_role_for_department(_dept_name text)
RETURNS app_role
LANGUAGE sql
IMMUTABLE
SET search_path = public
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
    WHEN 'behavioral support'          THEN 'behavioral_support'::app_role
    WHEN 'case management'             THEN 'bcba'::app_role
    WHEN 'training / clinical support' THEN 'training_admin'::app_role
    WHEN 'systems & software'          THEN 'admin'::app_role
    ELSE NULL
  END
$$;

-- Add new behavioral_support role to all Behavioral Support employees
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT e.user_id, 'behavioral_support'::app_role
FROM public.employees e
JOIN public.hr_departments d ON d.id = e.department_id
WHERE e.user_id IS NOT NULL
  AND lower(d.name) = 'behavioral support'
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove the legacy bcba role for those same employees so their menu reflects the new role
DELETE FROM public.user_roles ur
USING public.employees e, public.hr_departments d
WHERE ur.user_id = e.user_id
  AND e.department_id = d.id
  AND lower(d.name) = 'behavioral support'
  AND ur.role = 'bcba'::app_role;