-- 1) Broaden the CR Data Hub manager check to the real admin roles.
CREATE OR REPLACE FUNCTION public.cr_hub_can_manage()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'super_admin'::app_role)
      OR public.has_role(auth.uid(), 'systems_admin'::app_role)
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'operations_leadership'::app_role)
      OR public.has_role(auth.uid(), 'director_of_operations'::app_role);
$function$;

-- 2) Data API grants. RLS still governs row access; without GRANTs PostgREST
--    returns a permission error and no upload can ever write.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_import_batches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_raw_rows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_billing_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_schedule_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_authorizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_authorization_utilization TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_claims TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_report_data_freshness TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_patient_match_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_provider_match_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_client_provider_crosswalk TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_identity_mapping_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_identity_mapping_audit TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_sync_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_sync_audit TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_sync_run_errors TO authenticated;
GRANT SELECT ON public.cr_sync_types TO authenticated;
GRANT SELECT ON public.cr_bcba_ownership_inferred TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_data_quality_exceptions TO authenticated;

GRANT ALL ON public.cr_import_batches TO service_role;
GRANT ALL ON public.cr_raw_rows TO service_role;
GRANT ALL ON public.cr_billing_sessions TO service_role;
GRANT ALL ON public.cr_schedule_events TO service_role;
GRANT ALL ON public.cr_authorizations TO service_role;
GRANT ALL ON public.cr_authorization_utilization TO service_role;
GRANT ALL ON public.cr_claims TO service_role;
GRANT ALL ON public.cr_contacts TO service_role;
GRANT ALL ON public.cr_report_data_freshness TO service_role;
GRANT ALL ON public.cr_patient_match_links TO service_role;
GRANT ALL ON public.cr_provider_match_links TO service_role;
GRANT ALL ON public.cr_client_provider_crosswalk TO service_role;
GRANT ALL ON public.cr_identity_mapping_queue TO service_role;
GRANT ALL ON public.cr_identity_mapping_audit TO service_role;
GRANT ALL ON public.cr_sync_runs TO service_role;
GRANT ALL ON public.cr_sync_audit TO service_role;
GRANT ALL ON public.cr_sync_run_errors TO service_role;
GRANT ALL ON public.cr_sync_types TO service_role;
GRANT ALL ON public.cr_data_quality_exceptions TO service_role;

-- 3) Upload run tracking must be writable by CR Data Hub managers.
DROP POLICY IF EXISTS "cr_runs insert" ON public.cr_sync_runs;
CREATE POLICY "cr_runs insert" ON public.cr_sync_runs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.cr_hub_can_manage()
    AND (uploaded_by IS NULL OR uploaded_by = auth.uid())
  );

DROP POLICY IF EXISTS "cr_runs update" ON public.cr_sync_runs;
CREATE POLICY "cr_runs update" ON public.cr_sync_runs
  FOR UPDATE TO authenticated
  USING (public.cr_hub_can_manage() OR uploaded_by = auth.uid())
  WITH CHECK (public.cr_hub_can_manage() OR uploaded_by = auth.uid());

DROP POLICY IF EXISTS "cr_runs admin read" ON public.cr_sync_runs;
CREATE POLICY "cr_runs admin read" ON public.cr_sync_runs
  FOR SELECT TO authenticated
  USING (public.cr_hub_can_manage() OR uploaded_by = auth.uid());

DROP POLICY IF EXISTS "cr_audit insert self" ON public.cr_sync_audit;
CREATE POLICY "cr_audit insert self" ON public.cr_sync_audit
  FOR INSERT TO authenticated
  WITH CHECK (actor_id IS NULL OR actor_id = auth.uid());

DROP POLICY IF EXISTS "cr_audit admin read" ON public.cr_sync_audit;
CREATE POLICY "cr_audit admin read" ON public.cr_sync_audit
  FOR SELECT TO authenticated
  USING (public.cr_hub_can_manage() OR actor_id = auth.uid());

DROP POLICY IF EXISTS "cr_run_errors admin" ON public.cr_sync_run_errors;
CREATE POLICY "cr_run_errors admin" ON public.cr_sync_run_errors
  FOR ALL TO authenticated
  USING (public.cr_hub_can_manage())
  WITH CHECK (public.cr_hub_can_manage());

-- 4) Freshness upserts need a stable conflict target.
CREATE UNIQUE INDEX IF NOT EXISTS cr_report_data_freshness_key_uidx
  ON public.cr_report_data_freshness(report_key, export_type);

-- 5) Every CentralReach export kind must be representable as a run type.
ALTER TYPE public.cr_sync_type_key ADD VALUE IF NOT EXISTS 'billing';
ALTER TYPE public.cr_sync_type_key ADD VALUE IF NOT EXISTS 'scheduling';
ALTER TYPE public.cr_sync_type_key ADD VALUE IF NOT EXISTS 'utilization';
ALTER TYPE public.cr_sync_type_key ADD VALUE IF NOT EXISTS 'claims';
ALTER TYPE public.cr_sync_type_key ADD VALUE IF NOT EXISTS 'contacts';