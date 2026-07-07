
CREATE OR REPLACE FUNCTION public.user_is_leadership()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
       public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'systems_admin')
    OR public.has_role(auth.uid(), 'exec')
    OR public.has_role(auth.uid(), 'executive')
    OR public.has_role(auth.uid(), 'executive_leadership')
    OR public.has_role(auth.uid(), 'ceo')
    OR public.has_role(auth.uid(), 'coo')
    OR public.has_role(auth.uid(), 'director_of_operations')
    OR public.has_role(auth.uid(), 'operations_manager')
    OR public.has_role(auth.uid(), 'ops_manager')
    OR public.has_role(auth.uid(), 'operations_leadership')
$function$;

CREATE OR REPLACE FUNCTION public.is_leadership(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
       public.has_role(_user_id, 'admin')
    OR public.has_role(_user_id, 'super_admin')
    OR public.has_role(_user_id, 'systems_admin')
    OR public.has_role(_user_id, 'exec')
    OR public.has_role(_user_id, 'executive')
    OR public.has_role(_user_id, 'executive_leadership')
    OR public.has_role(_user_id, 'ceo')
    OR public.has_role(_user_id, 'coo')
    OR public.has_role(_user_id, 'director_of_operations')
    OR public.has_role(_user_id, 'operations_manager')
    OR public.has_role(_user_id, 'ops_manager')
    OR public.has_role(_user_id, 'operations_leadership')
$function$;

DROP POLICY IF EXISTS "Admins can update issues" ON public.system_issues;
CREATE POLICY "Leadership can update issues"
ON public.system_issues
FOR UPDATE
TO authenticated
USING (public.user_is_leadership())
WITH CHECK (public.user_is_leadership());
