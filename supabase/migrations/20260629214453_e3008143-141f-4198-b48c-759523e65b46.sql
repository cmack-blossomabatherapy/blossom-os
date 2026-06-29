
REVOKE EXECUTE ON FUNCTION public.has_credentialing_write_access(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_credentialing_read_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_credentialing_write_access(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_credentialing_read_access(uuid) TO authenticated, service_role;
