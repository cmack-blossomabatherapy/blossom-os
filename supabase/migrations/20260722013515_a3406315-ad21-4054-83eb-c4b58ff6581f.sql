-- Fix SECURITY DEFINER views by switching to security_invoker=on
ALTER VIEW public.v_cr_provider_mapping SET (security_invoker = on);
ALTER VIEW public.v_cr_canonical_sessions SET (security_invoker = on);
ALTER VIEW public.v_clinician_cr_mapping SET (security_invoker = on);
ALTER VIEW public.employee_directory SET (security_invoker = on);

-- Remove materialized view from Data API by revoking role access explicitly
REVOKE ALL ON public.mv_cr_provider_mapping FROM anon, authenticated;
GRANT SELECT ON public.mv_cr_provider_mapping TO service_role;