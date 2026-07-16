CREATE OR REPLACE FUNCTION public.search_assignable_employees(
  search text DEFAULT NULL,
  max_rows integer DEFAULT 75
)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  job_title text,
  state text,
  user_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.id,
    trim(concat_ws(' ', e.first_name, e.last_name)) AS name,
    e.email,
    e.job_title,
    e.state,
    e.user_id
  FROM public.employees e
  WHERE e.status IN ('active', 'pending_start')
    AND (
      NULLIF(trim(search), '') IS NULL
      OR trim(concat_ws(' ', e.first_name, e.last_name)) ILIKE '%' || trim(search) || '%'
      OR e.email ILIKE '%' || trim(search) || '%'
      OR e.job_title ILIKE '%' || trim(search) || '%'
      OR e.state ILIKE '%' || trim(search) || '%'
    )
  ORDER BY trim(concat_ws(' ', e.first_name, e.last_name)) ASC NULLS LAST, e.email ASC NULLS LAST
  LIMIT LEAST(GREATEST(COALESCE(max_rows, 75), 1), 200);
$$;

REVOKE ALL ON FUNCTION public.search_assignable_employees(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_assignable_employees(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_assignable_employees(text, integer) TO service_role;