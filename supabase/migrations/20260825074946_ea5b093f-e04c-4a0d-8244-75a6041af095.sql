CREATE OR REPLACE FUNCTION public.c2s_is_hr_authority()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    ELSE public.c2s_is_hr_authority(auth.uid())
  END
$$;

REVOKE ALL ON FUNCTION public.c2s_is_hr_authority() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.c2s_is_hr_authority() FROM anon;
GRANT EXECUTE ON FUNCTION public.c2s_is_hr_authority() TO authenticated;