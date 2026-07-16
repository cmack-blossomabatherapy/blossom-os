REVOKE ALL ON FUNCTION public.search_assignable_employees(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_assignable_employees(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.search_assignable_employees(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_assignable_employees(text, integer) TO service_role;