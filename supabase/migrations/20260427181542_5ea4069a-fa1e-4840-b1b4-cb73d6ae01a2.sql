REVOKE ALL ON FUNCTION public.sync_active_services_engine() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sync_service_session_engine() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sync_compliance_flag_engine() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_active_services_engine() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_service_session_engine() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_compliance_flag_engine() TO authenticated;