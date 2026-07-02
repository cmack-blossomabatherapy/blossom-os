CREATE OR REPLACE FUNCTION public.can_access_referral_crm(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid
      AND role::text IN (
        'admin',
        'super_admin',
        'exec',
        'executive',
        'executive_leadership',
        'ops_manager',
        'operations_manager',
        'marketing',
        'marketing_team',
        'marketing_growth_lead',
        'business_development'
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_growth_source_visibility(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.can_access_marketing(_uid)
      OR EXISTS (
           SELECT 1 FROM public.user_roles
           WHERE user_id = _uid
             AND role::text = 'business_development'
         );
$$;