
CREATE OR REPLACE FUNCTION public.hr_user_role_slugs(_user uuid)
RETURNS text[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  -- GUC names allow letters, digits, underscores, and dots only. Strip hyphens
  -- from the uuid so the key is a valid customized parameter name.
  cache_key text;
  cached    text;
  result    text[];
BEGIN
  IF _user IS NULL THEN
    RETURN ARRAY[]::text[];
  END IF;

  cache_key := 'app.hrrs_' || replace(_user::text, '-', '');

  -- Missing_ok = true → returns NULL if the GUC has never been set this txn.
  cached := current_setting(cache_key, true);
  IF cached IS NOT NULL THEN
    -- Sentinel '-' marks "computed, but empty" so we don't recompute on every row.
    IF cached = '-' THEN
      RETURN ARRAY[]::text[];
    END IF;
    RETURN string_to_array(cached, ',');
  END IF;

  SELECT COALESCE(array_agg(DISTINCT role::text), ARRAY[]::text[])
    INTO result
  FROM public.user_roles
  WHERE user_id = _user;

  -- is_local = true → scope to the current transaction (i.e. this PostgREST request).
  PERFORM set_config(
    cache_key,
    CASE WHEN array_length(result, 1) IS NULL THEN '-' ELSE array_to_string(result, ',') END,
    true
  );

  RETURN result;
END;
$function$;

-- Preserve prior execute grants (anon was already revoked in the prior hardening pass).
REVOKE EXECUTE ON FUNCTION public.hr_user_role_slugs(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hr_user_role_slugs(uuid) TO authenticated, service_role;
