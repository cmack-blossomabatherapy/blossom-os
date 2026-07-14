CREATE OR REPLACE FUNCTION public.hr_resource_visible(_user uuid, _visibility_level text, _visibility_roles text[], _tags text[], _is_sensitive boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  IF public.has_role(_user, 'super_admin') OR public.has_role(_user, 'admin') THEN RETURN true; END IF;

  user_roles := public.hr_user_role_slugs(_user);

  -- Executive/leadership + system admins: full visibility of the entire resource library.
  IF user_roles && ARRAY[
    'executive','executive_leadership','ceo','coo',
    'director_of_operations','systems_admin','admin','super_admin'
  ] THEN
    RETURN true;
  END IF;

  vroles := COALESCE(
    ARRAY(SELECT public.hr_normalize_role(x) FROM unnest(coalesce(_visibility_roles, ARRAY[]::text[])) x),
    ARRAY[]::text[]
  );
  has_vroles := array_length(vroles, 1) IS NOT NULL;
  overlap := user_roles && vroles;

  is_leader := user_roles && ARRAY[
    'operations_leadership','exec'
  ];
  is_admin_or_lead := is_leader OR user_roles && ARRAY[
    'hr_admin','admin','hr_lead','hr_manager'
  ];
  is_clinical := user_roles && ARRAY[
    'clinical_director','clinical_lead','bcba','rbt','case_manager',
    'behavioral_support','qa','qa_team','qa_director','qa_specialist'
  ];

  IF 'admin_source_archive' = ANY(COALESCE(_tags, ARRAY[]::text[])) THEN
    RETURN is_admin_or_lead AND overlap;
  END IF;

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
    ELSE overlap OR NOT has_vroles
  END;
END;
$function$;