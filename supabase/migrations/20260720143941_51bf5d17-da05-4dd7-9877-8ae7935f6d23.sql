DO $$
DECLARE tbl record;
BEGIN
  FOR tbl IN
    SELECT c.relname AS table_name
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE c.relkind='r' AND n.nspname='public'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
       WHERE grantee='authenticated' AND table_schema='public' AND table_name=tbl.table_name
         AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE')
    ) THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.table_name);
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
       WHERE grantee='service_role' AND table_schema='public' AND table_name=tbl.table_name
         AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE')
    ) THEN
      EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.table_name);
    END IF;
  END LOOP;
END;
$$;