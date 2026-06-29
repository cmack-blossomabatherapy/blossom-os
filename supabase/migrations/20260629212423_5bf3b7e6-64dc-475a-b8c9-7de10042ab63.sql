
REVOKE EXECUTE ON FUNCTION public.log_recruiting_event(uuid, text, uuid, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recruiting_candidate_stage_changed() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recruiting_child_audit() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_recruiting_event(uuid, text, uuid, text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.recruiting_candidate_stage_changed() TO service_role;
GRANT EXECUTE ON FUNCTION public.recruiting_child_audit() TO service_role;
