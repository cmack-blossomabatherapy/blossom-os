
-- 1) Update visibility function: leadership always sees all
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
  IF public.has_role(_user, 'super_admin') THEN RETURN true; END IF;

  user_roles := public.hr_user_role_slugs(_user);

  -- Executive/leadership: full visibility of the entire resource library.
  IF user_roles && ARRAY[
    'executive','executive_leadership','ceo','coo',
    'director_of_operations','systems_admin'
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
    ELSE
      CASE
        WHEN has_vroles THEN overlap
        ELSE public.has_permission(_user, 'hr.resources.view')
          OR public.has_permission(_user, 'hr.view')
      END
  END;
END;
$function$;

-- 2) Canonical alias map for legacy visibility_roles labels
CREATE OR REPLACE FUNCTION public.hr_canonicalize_role(_r text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE public.hr_normalize_role(_r)
    WHEN 'regional_state_director'    THEN 'state_director'
    WHEN 'state_director_assistant'   THEN 'assistant_state_director'
    WHEN 'state_va'                   THEN 'state_director'
    WHEN 'authorizations_team'        THEN 'authorization_coordinator'
    WHEN 'intake_team'                THEN 'intake_coordinator'
    WHEN 'exec'                       THEN 'executive_leadership'
    ELSE public.hr_normalize_role(_r)
  END
$$;

-- 3) Normalize visibility_roles in place, always inject Executive tier
UPDATE public.hr_resources
SET visibility_roles = (
  SELECT ARRAY(
    SELECT DISTINCT x FROM unnest(
      ARRAY(SELECT public.hr_canonicalize_role(r) FROM unnest(visibility_roles) r)
      ||
      ARRAY['super_admin','executive_leadership','executive','ceo','coo','director_of_operations']
    ) x
    WHERE x IS NOT NULL AND x <> ''
  )
)
WHERE visibility_roles IS NOT NULL;

-- 4) Backfill state_scope from legacy "State XX" role labels
UPDATE public.hr_resources hr
SET state_scope = COALESCE(hr.state_scope, ARRAY[]::text[]) || ARRAY[extracted.state_code]
FROM (
  SELECT id, upper(substring(role FROM 'state[_ ]([A-Za-z]{2})$')) AS state_code
  FROM public.hr_resources, unnest(visibility_roles) AS role
  WHERE role ~* '^state[_ ][a-z]{2}$'
) extracted
WHERE hr.id = extracted.id
  AND extracted.state_code IS NOT NULL
  AND NOT (COALESCE(hr.state_scope, ARRAY[]::text[]) @> ARRAY[extracted.state_code]);

-- 5) Backfill resource_type based on storage bucket when missing
UPDATE public.hr_resources
SET resource_type = CASE storage_bucket
  WHEN 'resource-videos'     THEN 'video'
  WHEN 'knowledge-documents' THEN 'document'
  WHEN 'resource-library'    THEN COALESCE(NULLIF(resource_type,''),'document')
  ELSE resource_type
END
WHERE resource_type IS NULL OR resource_type = '';

-- 6) Orphans: no storage bucket and no url → mark for admin review
UPDATE public.hr_resources
SET is_active = false,
    pending_reason = COALESCE(pending_reason, 'missing_storage')
WHERE storage_bucket IS NULL
  AND storage_path IS NULL
  AND (url IS NULL OR url = '');
