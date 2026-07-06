
REVOKE ALL ON FUNCTION public.user_is_leadership() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_is_leadership() FROM anon;
GRANT EXECUTE ON FUNCTION public.user_is_leadership() TO authenticated;

REVOKE ALL ON FUNCTION public.user_state_code() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_state_code() FROM anon;
GRANT EXECUTE ON FUNCTION public.user_state_code() TO authenticated;

REVOKE ALL ON FUNCTION public.user_is_state_scoped_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_is_state_scoped_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.user_is_state_scoped_role() TO authenticated;
