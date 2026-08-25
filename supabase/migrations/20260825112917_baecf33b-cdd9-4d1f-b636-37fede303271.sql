-- Phase 4B4: reporting access hardening (forward-only, additive).
-- Removes leftover PUBLIC/anon privileges on curated reporting views and on the
-- canonical report RPCs. Function bodies and search_path settings are untouched.

DO $$
DECLARE
  v_name text;
  v_views text[] := ARRAY[
    'v_cr_authorization_current',
    'v_cr_schedule_current',
    'v_cr_billing_documentation_status',
    'v_cr_canonical_sessions',
    'v_cr_claims_status',
    'v_cr_provider_mapping'
  ];
BEGIN
  FOREACH v_name IN ARRAY v_views LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = v_name
    ) THEN
      -- No PUBLIC/anon access at all.
      EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC', v_name);
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', v_name);
      -- Signed-in staff: read-only, nothing else.
      EXECUTE format(
        'REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM authenticated',
        v_name
      );
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated', v_name);
      -- Preserve backend/service operation.
      EXECUTE format('GRANT ALL ON public.%I TO service_role', v_name);
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  r record;
  v_fns text[] := ARRAY[
    'canonical_report_totals',
    'canonical_report_client_hours',
    'canonical_report_billing_rows',
    'canonical_report_provider_hours',
    'can_manage_authorization_events'
  ];
BEGIN
  -- Catalog-driven so every overload is covered with its exact signature.
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY (v_fns)
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;