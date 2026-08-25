-- Phase 4A1 audit repair (1): raw payload access lockdown for cr_external_records.
-- Additive only; existing Phase 4A1 migrations are untouched.

DROP POLICY IF EXISTS "cr_ext admin" ON public.cr_external_records;
DROP POLICY IF EXISTS cr_external_records_read_admin ON public.cr_external_records;
DROP POLICY IF EXISTS cr_external_records_manage ON public.cr_external_records;

ALTER TABLE public.cr_external_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY cr_external_records_read_admin
  ON public.cr_external_records
  FOR SELECT
  TO authenticated
  USING (public.cr_hub_can_manage());

CREATE POLICY cr_external_records_manage
  ON public.cr_external_records
  FOR ALL
  TO authenticated
  USING (public.cr_hub_can_manage())
  WITH CHECK (public.cr_hub_can_manage());

REVOKE ALL ON public.cr_external_records FROM PUBLIC;
REVOKE ALL ON public.cr_external_records FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.cr_external_records FROM authenticated;
GRANT SELECT ON public.cr_external_records TO authenticated;
GRANT ALL ON public.cr_external_records TO service_role;

-- Safe projection: keys only, never the raw payload. Definer semantics so the
-- existing add/update classification in the CentralReach sync screens keeps
-- working for non-admin operators without any raw payload exposure.
CREATE OR REPLACE VIEW public.v_cr_external_record_keys
WITH (security_invoker = off) AS
  SELECT type_key, external_id, first_seen_at, last_seen_at
  FROM public.cr_external_records;

REVOKE ALL ON public.v_cr_external_record_keys FROM PUBLIC;
REVOKE ALL ON public.v_cr_external_record_keys FROM anon;
REVOKE ALL ON public.v_cr_external_record_keys FROM authenticated;
GRANT SELECT ON public.v_cr_external_record_keys TO authenticated;
GRANT ALL ON public.v_cr_external_record_keys TO service_role;
