
REVOKE EXECUTE ON FUNCTION public.is_access_request_reviewer(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_access_request_reviewer(UUID) TO authenticated;
