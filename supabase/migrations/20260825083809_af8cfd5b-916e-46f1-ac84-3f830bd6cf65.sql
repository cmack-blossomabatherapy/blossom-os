-- ============================================================
-- Phase 4A1 (3): lock down reporting data access.
-- Additive/permission-only. No data is dropped.
-- ============================================================

DO $$
DECLARE
  obj record;
  -- Authenticated write needs proven in application code (browser client).
  ins_upd text[] := ARRAY[
    'cr_import_batches','cr_schedule_events','cr_authorizations',
    'cr_authorization_utilization','cr_claims','cr_contacts',
    'cr_billing_sessions','cr_billing_session_status','cr_report_data_freshness',
    'cr_sync_runs','cr_client_provider_crosswalk','cr_patient_match_links',
    'cr_provider_match_links','cr_identity_mapping_queue'
  ];
  ins_only text[] := ARRAY['cr_raw_rows','cr_sync_audit','cr_sync_run_errors'];
  upd_only text[] := ARRAY['cr_freshness_config','cr_sync_templates'];
BEGIN
  FOR obj IN
    SELECT c.relname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r','v','m','p')
      AND (
        c.relname LIKE 'cr\_%'
        OR c.relname IN (
          'v_cr_schedule_current','v_cr_authorization_current',
          'authorization_operational_records','authorization_weekly_events',
          'bcba_productivity_snapshots'
        )
      )
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC', obj.relname);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', obj.relname);
    EXECUTE format('REVOKE ALL ON public.%I FROM authenticated', obj.relname);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', obj.relname);

    IF obj.relkind = 'v' OR obj.relkind = 'm' THEN
      -- Curated staff-facing views: read-only.
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated', obj.relname);
    ELSE
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated', obj.relname);
      IF obj.relname = ANY(ins_upd) THEN
        EXECUTE format('GRANT INSERT, UPDATE ON public.%I TO authenticated', obj.relname);
      ELSIF obj.relname = ANY(ins_only) THEN
        EXECUTE format('GRANT INSERT ON public.%I TO authenticated', obj.relname);
      ELSIF obj.relname = ANY(upd_only) THEN
        EXECUTE format('GRANT UPDATE ON public.%I TO authenticated', obj.relname);
      END IF;
    END IF;
  END LOOP;
END $$;

-- Authorization workflow tables keep exactly the writes the app performs.
GRANT SELECT, INSERT, UPDATE ON public.authorization_operational_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.authorization_weekly_events TO authenticated;
-- bcba_productivity_snapshots is read-only in application code.
GRANT SELECT ON public.bcba_productivity_snapshots TO authenticated;

-- ------------------------------------------------------------
-- Helper / maintenance functions must not be directly callable.
-- ------------------------------------------------------------
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'cr_reset_report_data','cr_hub_touch_updated_at','cr_touch_updated_at',
        'cr_touch_billing_session_status','cr_hub_can_manage'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn.sig);
    IF fn.proname IN ('cr_hub_touch_updated_at','cr_touch_updated_at','cr_touch_billing_session_status') THEN
      -- Trigger helpers: only the table owner needs to run them.
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn.sig);
    ELSE
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn.sig);
    END IF;
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- Sensitive tables: admin-only reads (raw payloads, contacts,
-- claims financials, identity mapping, ownership inference).
-- ------------------------------------------------------------
DO $$
DECLARE
  t text;
  sensitive text[] := ARRAY[
    'cr_contacts','cr_claims','cr_billing_session_status',
    'cr_client_provider_crosswalk','cr_patient_match_links',
    'cr_provider_match_links','cr_bcba_ownership_inferred',
    'cr_raw_rows','cr_import_backups'
  ];
BEGIN
  FOREACH t IN ARRAY sensitive LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = t
    ) THEN
      -- Drop broad `USING (true)` read policies.
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_read', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'cr_contacts_read', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'cr_claims_read', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'cr_billing_session_status_read', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'cr_crosswalk_read', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'cr_patient_links_read', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'cr_provider_links_read', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'cr_ownership_read', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'cr_raw_rows_read', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_read_admin', t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.cr_hub_can_manage())',
        t || '_read_admin', t
      );
    END IF;
  END LOOP;
END $$;