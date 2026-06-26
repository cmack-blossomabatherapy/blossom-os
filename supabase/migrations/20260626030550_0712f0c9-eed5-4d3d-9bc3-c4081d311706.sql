
REVOKE EXECUTE ON FUNCTION public.get_user_role_assignments(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_allowed_states(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_allowed_departments(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_has_hat(uuid, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_state_department(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_manage_role_assignments(uuid) FROM PUBLIC;
