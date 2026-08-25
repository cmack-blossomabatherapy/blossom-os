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
      EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC', v_name);
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', v_name);
      EXECUTE format('REVOKE ALL ON public.%I FROM authenticated', v_name);
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated', v_name);
      EXECUTE format('GRANT ALL ON public.%I TO service_role', v_name);
    END IF;
  END LOOP;
END;
$$;