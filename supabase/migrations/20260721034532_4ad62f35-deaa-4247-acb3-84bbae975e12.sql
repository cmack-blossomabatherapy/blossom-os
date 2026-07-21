REVOKE EXECUTE ON FUNCTION public.report_source_coverage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_source_coverage() TO authenticated;