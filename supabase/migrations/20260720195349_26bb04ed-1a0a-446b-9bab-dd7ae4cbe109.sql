GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_report_datasets TO authenticated;
GRANT ALL ON public.shared_report_datasets TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_productivity_upload_batches TO authenticated;
GRANT ALL ON public.bcba_productivity_upload_batches TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_productivity_billing_rows TO authenticated;
GRANT ALL ON public.bcba_productivity_billing_rows TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_sync_runs TO authenticated;
GRANT ALL ON public.cr_sync_runs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_data_quality_exceptions TO authenticated;
GRANT ALL ON public.cr_data_quality_exceptions TO service_role;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_read_bcba_productivity(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_bcba_productivity_uploads(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cr_sync_freshness() TO authenticated, service_role;