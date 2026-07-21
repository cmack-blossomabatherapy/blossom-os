
-- Phase 1a P0-1: Canonical CR client identity — idempotent admin-only promotion.
-- The centralreach_id column and its unique partial index already exist on public.clients.

CREATE OR REPLACE FUNCTION public.promote_canonical_clients()
RETURNS TABLE(inserted_count integer, skipped_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted integer := 0;
  v_skipped integer := 0;
BEGIN
  -- Admin-only: only super_admins may promote canonical clients.
  IF NOT public.has_role(auth.uid(), 'admin'::app_role)
     AND NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'promote_canonical_clients requires admin role';
  END IF;

  WITH src AS (
    SELECT DISTINCT ON (cr_client_id)
      cr_client_id,
      COALESCE(NULLIF(TRIM(client_name), ''), 'Unknown Client') AS child_name
    FROM public.v_cr_canonical_sessions
    WHERE cr_client_id IS NOT NULL
      AND TRIM(cr_client_id) <> ''
    ORDER BY cr_client_id, service_date DESC NULLS LAST
  ),
  ins AS (
    INSERT INTO public.clients (
      centralreach_id,
      child_name,
      parent_name,
      state,
      clinic,
      payor,
      centralreach_sync_status
    )
    SELECT
      s.cr_client_id,
      s.child_name,
      'Unknown',   -- parent_name placeholder; populated later from lead/intake sync
      'Unknown',   -- state placeholder
      'Unknown',   -- clinic placeholder
      '',          -- payor blank until VOB linkage
      'Synced'
    FROM src s
    WHERE NOT EXISTS (
      SELECT 1 FROM public.clients c WHERE c.centralreach_id = s.cr_client_id
    )
    RETURNING 1
  )
  SELECT count(*) INTO v_inserted FROM ins;

  SELECT count(*) INTO v_skipped
  FROM public.v_cr_canonical_sessions v
  WHERE v.cr_client_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.clients c WHERE c.centralreach_id = v.cr_client_id);

  RETURN QUERY SELECT v_inserted, v_skipped;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_canonical_clients() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_canonical_clients() TO authenticated;

-- Read-only resolver: returns the client UUID for a given CentralReach id.
-- Safe for any authenticated user; RLS on public.clients still applies to the
-- returned uuid when it is used in subsequent selects.
CREATE OR REPLACE FUNCTION public.resolve_client_by_cr_id(_cr_id text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.clients WHERE centralreach_id = _cr_id LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_client_by_cr_id(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_client_by_cr_id(text) TO authenticated;
