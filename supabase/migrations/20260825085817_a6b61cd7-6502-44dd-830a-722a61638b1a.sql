-- Phase 4A1 audit repair (1b): the CentralReach sync hub is admin-only
-- (/system/centralreach is behind AdminRoute), so no non-admin projection is
-- required. Drop the helper view to keep the reporting surface minimal.
DROP VIEW IF EXISTS public.v_cr_external_record_keys;
