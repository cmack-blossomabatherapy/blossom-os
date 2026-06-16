
-- 1. employees: drop broad directory policy and provide safe view instead
DROP POLICY IF EXISTS "View directory employees" ON public.employees;

CREATE OR REPLACE VIEW public.employee_directory
WITH (security_invoker = false) AS
SELECT
  id,
  first_name,
  last_name,
  preferred_name,
  job_title,
  department_id,
  email,
  phone,
  extension,
  photo_url,
  avatar_url,
  state,
  bio,
  pronouns,
  credential,
  linkedin_url,
  meeting_link,
  show_in_directory,
  show_in_org_chart,
  manager_id,
  user_id
FROM public.employees
WHERE show_in_directory = true OR show_in_org_chart = true;

GRANT SELECT ON public.employee_directory TO authenticated;

-- 2. phone_ai_call_routing
DROP POLICY IF EXISTS "auth write routing" ON public.phone_ai_call_routing;
CREATE POLICY "Admins manage routing"
ON public.phone_ai_call_routing
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'ops_manager'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'ops_manager'::app_role));

-- 3. phone_ai_calls
DROP POLICY IF EXISTS "Authenticated can insert phone_ai_calls" ON public.phone_ai_calls;
DROP POLICY IF EXISTS "Authenticated can update phone_ai_calls" ON public.phone_ai_calls;

CREATE POLICY "Service role inserts phone_ai_calls"
ON public.phone_ai_calls
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Admins update phone_ai_calls"
ON public.phone_ai_calls
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'ops_manager'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'ops_manager'::app_role));

-- 4. phone_system_state
DROP POLICY IF EXISTS "Authenticated can delete phone system" ON public.phone_system_state;
DROP POLICY IF EXISTS "Authenticated can insert phone system" ON public.phone_system_state;
DROP POLICY IF EXISTS "Authenticated can update phone system" ON public.phone_system_state;

CREATE POLICY "Admins insert phone system"
ON public.phone_system_state
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'ops_manager'::app_role));

CREATE POLICY "Admins update phone system"
ON public.phone_system_state
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'ops_manager'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'ops_manager'::app_role));

CREATE POLICY "Admins delete phone system"
ON public.phone_system_state
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'ops_manager'::app_role));

-- 5. monday raw tables: tighten role from public (anon) to authenticated
DROP POLICY IF EXISTS "read_internal" ON public.monday_auth_approvals_raw;
CREATE POLICY "read_internal"
ON public.monday_auth_approvals_raw
FOR SELECT
TO authenticated
USING (can_read_all_states() OR (state = current_user_state()));

DROP POLICY IF EXISTS "read_state_scoped" ON public.monday_no_oon_raw;
CREATE POLICY "read_state_scoped"
ON public.monday_no_oon_raw
FOR SELECT
TO authenticated
USING (can_read_all_states() OR (state = current_user_state()));

-- 6. recruiting_can_write: remove generic 'staff' role
CREATE OR REPLACE FUNCTION public.recruiting_can_write(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    public.has_role(_user_id, 'admin')
    OR public.has_role(_user_id, 'ops_manager')
    OR public.has_role(_user_id, 'hr_admin')
    OR public.has_role(_user_id, 'hr_manager')
    OR public.has_role(_user_id, 'hr')
    OR public.has_role(_user_id, 'recruiting_assistant')
$function$;
