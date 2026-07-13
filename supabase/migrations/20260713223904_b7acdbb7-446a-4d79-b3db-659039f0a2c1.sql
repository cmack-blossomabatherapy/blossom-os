
-- Helper: normalize role labels ("Executive Leadership" -> "executive_leadership")
CREATE OR REPLACE FUNCTION public.hr_normalize_role(_r text)
RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(regexp_replace(coalesce(_r, ''), '\s+', '_', 'g'))
$$;

-- Helper: current user's role slugs (bypasses RLS on user_roles)
CREATE OR REPLACE FUNCTION public.hr_user_role_slugs(_user uuid)
RETURNS text[]
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(DISTINCT role::text), ARRAY[]::text[])
  FROM public.user_roles
  WHERE user_id = _user
$$;

-- Row-level visibility predicate for hr_resources
CREATE OR REPLACE FUNCTION public.hr_resource_visible(
  _user uuid,
  _visibility_level text,
  _visibility_roles text[],
  _tags text[],
  _is_sensitive boolean
)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_roles text[];
  vroles text[];
  overlap boolean;
  is_leader boolean;
  is_admin_or_lead boolean;
  is_clinical boolean;
  has_vroles boolean;
BEGIN
  IF _user IS NULL THEN RETURN false; END IF;
  IF public.has_role(_user, 'super_admin') THEN RETURN true; END IF;

  user_roles := public.hr_user_role_slugs(_user);
  vroles := COALESCE(
    ARRAY(SELECT public.hr_normalize_role(x) FROM unnest(coalesce(_visibility_roles, ARRAY[]::text[])) x),
    ARRAY[]::text[]
  );
  has_vroles := array_length(vroles, 1) IS NOT NULL;
  overlap := user_roles && vroles;

  is_leader := user_roles && ARRAY[
    'executive_leadership','operations_leadership','coo','ceo','exec',
    'executive','director_of_operations'
  ];
  is_admin_or_lead := is_leader OR user_roles && ARRAY[
    'systems_admin','hr_admin','admin','hr_lead','hr_manager'
  ];
  is_clinical := user_roles && ARRAY[
    'clinical_director','clinical_lead','bcba','rbt','case_manager',
    'behavioral_support','qa','qa_team','qa_director','qa_specialist'
  ];

  -- Admin source archive tag: super admin only (handled above) or admin/leadership + explicit overlap
  IF 'admin_source_archive' = ANY(COALESCE(_tags, ARRAY[]::text[])) THEN
    RETURN is_admin_or_lead AND overlap;
  END IF;

  -- Sensitive: always require an exact role match
  IF COALESCE(_is_sensitive, false) THEN
    RETURN overlap;
  END IF;

  RETURN CASE COALESCE(_visibility_level, '')
    WHEN 'admin_only'      THEN is_admin_or_lead AND (overlap OR NOT has_vroles)
    WHEN 'leadership_only' THEN is_leader
    WHEN 'operations_only' THEN is_leader OR user_roles && ARRAY['operations_leadership','ops_manager','operations_manager']
    WHEN 'clinical_only'   THEN is_clinical AND (overlap OR NOT has_vroles)
    WHEN 'department_only' THEN overlap
    WHEN 'role_only'       THEN overlap
    WHEN 'all_staff'       THEN true
    ELSE
      CASE
        WHEN has_vroles THEN overlap
        ELSE public.has_permission(_user, 'hr.resources.view')
          OR public.has_permission(_user, 'hr.view')
      END
  END;
END;
$$;

-- Rewrite the SELECT policy to use the new predicate
DROP POLICY IF EXISTS "View resources" ON public.hr_resources;
CREATE POLICY "View resources"
ON public.hr_resources
FOR SELECT
TO authenticated
USING (
  public.hr_resource_visible(
    auth.uid(),
    visibility_level,
    visibility_roles,
    tags,
    is_sensitive
  )
);

-- Keep existing "Manage resources" policy for INSERT/UPDATE/DELETE (unchanged)

GRANT EXECUTE ON FUNCTION public.hr_normalize_role(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.hr_user_role_slugs(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hr_resource_visible(uuid, text, text[], text[], boolean) TO authenticated;
