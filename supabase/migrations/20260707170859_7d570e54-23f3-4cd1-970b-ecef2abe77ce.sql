REVOKE ALL ON FUNCTION public.user_is_leadership() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_is_leadership() FROM anon;
GRANT EXECUTE ON FUNCTION public.user_is_leadership() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_leadership() TO service_role;

REVOKE ALL ON FUNCTION public.is_leadership(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_leadership(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_leadership(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_leadership(uuid) TO service_role;