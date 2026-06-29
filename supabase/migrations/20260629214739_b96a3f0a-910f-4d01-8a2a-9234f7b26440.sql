
-- 1) Saved Views table
CREATE TABLE IF NOT EXISTS public.authorization_saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  scope text NOT NULL DEFAULT 'authorizations' CHECK (scope IN ('authorizations','auth_workspace')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.authorization_saved_views TO authenticated;
GRANT ALL ON public.authorization_saved_views TO service_role;

ALTER TABLE public.authorization_saved_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_saved_views_read_own_or_shared"
  ON public.authorization_saved_views FOR SELECT
  USING (user_id = auth.uid() OR is_shared = true);

CREATE POLICY "auth_saved_views_write_own"
  ON public.authorization_saved_views FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_authorization_saved_views_set_updated_at
  BEFORE UPDATE ON public.authorization_saved_views
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_auth_saved_views_user_scope
  ON public.authorization_saved_views (user_id, scope);

-- 2) Per-user assigned state codes
CREATE OR REPLACE FUNCTION public.user_assigned_state_codes(_user_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(DISTINCT era.state_code) FILTER (WHERE era.state_code IS NOT NULL AND era.is_active),
    ARRAY[]::text[]
  )
  FROM public.employee_role_assignments era
  WHERE era.user_id = _user_id;
$$;

REVOKE EXECUTE ON FUNCTION public.user_assigned_state_codes(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_assigned_state_codes(uuid) TO authenticated, service_role;

-- 3) State-aware authorization access predicate
CREATE OR REPLACE FUNCTION public.has_authorization_state_access(_user_id uuid, _state text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Write-tier roles and broad read-tier roles always see every state.
    WHEN public.has_authorization_write_access(_user_id) THEN true
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = _user_id
        AND ur.role::text IN ('qa','qa_team','qa_director','qa_specialist','bcba','case_manager')
    ) THEN true
    -- State Directors / Assistant State Directors are scoped to their assigned states.
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = _user_id
        AND ur.role::text IN ('state_director','assistant_state_director')
    ) THEN (
      _state IS NULL
      OR cardinality(public.user_assigned_state_codes(_user_id)) = 0
      OR _state = ANY (public.user_assigned_state_codes(_user_id))
    )
    ELSE false
  END;
$$;

REVOKE EXECUTE ON FUNCTION public.has_authorization_state_access(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_authorization_state_access(uuid, text) TO authenticated, service_role;

-- 4) Tighten read policy on overlay to enforce state scoping
DROP POLICY IF EXISTS "auth_read_authorization_operational_records"
  ON public.authorization_operational_records;

CREATE POLICY "auth_read_authorization_operational_records"
  ON public.authorization_operational_records FOR SELECT
  USING (
    public.has_authorization_read_access(auth.uid())
    AND public.has_authorization_state_access(auth.uid(), state)
  );
