
-- Generic monday raw table generator pattern
CREATE TABLE IF NOT EXISTS public.monday_leads_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monday_item_id text UNIQUE,
  monday_group text,
  name text,
  state text,
  status text,
  owner text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_file text,
  imported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.monday_clients_raw (LIKE public.monday_leads_raw INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.monday_no_oon_raw (LIKE public.monday_leads_raw INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.monday_authorizations_raw (LIKE public.monday_leads_raw INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.monday_auth_approvals_raw (LIKE public.monday_leads_raw INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.monday_denials_raw (LIKE public.monday_leads_raw INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.va_credentialing_raw (LIKE public.monday_leads_raw INCLUDING ALL);

CREATE TABLE IF NOT EXISTS public.monday_subitems_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_board text NOT NULL,
  parent_item_id text,
  parent_item_name text,
  monday_item_id text UNIQUE,
  name text,
  owner text,
  status text,
  due_date date,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_file text,
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.monday_updates_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_board text NOT NULL,
  parent_item_name text,
  author text,
  posted_at timestamptz,
  body text,
  source_file text,
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.monday_import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board text NOT NULL,
  storage_path text NOT NULL,
  rows_inserted int NOT NULL DEFAULT 0,
  rows_updated int NOT NULL DEFAULT 0,
  subitems_inserted int NOT NULL DEFAULT 0,
  updates_inserted int NOT NULL DEFAULT 0,
  error text,
  started_by uuid REFERENCES auth.users(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  duration_ms int
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_monday_leads_state ON public.monday_leads_raw(state);
CREATE INDEX IF NOT EXISTS idx_monday_leads_group ON public.monday_leads_raw(monday_group);
CREATE INDEX IF NOT EXISTS idx_monday_clients_state ON public.monday_clients_raw(state);
CREATE INDEX IF NOT EXISTS idx_monday_clients_group ON public.monday_clients_raw(monday_group);
CREATE INDEX IF NOT EXISTS idx_monday_auths_state ON public.monday_authorizations_raw(state);
CREATE INDEX IF NOT EXISTS idx_monday_auths_group ON public.monday_authorizations_raw(monday_group);
CREATE INDEX IF NOT EXISTS idx_monday_approvals_group ON public.monday_auth_approvals_raw(monday_group);
CREATE INDEX IF NOT EXISTS idx_monday_denials_group ON public.monday_denials_raw(monday_group);
CREATE INDEX IF NOT EXISTS idx_va_cred_group ON public.va_credentialing_raw(monday_group);
CREATE INDEX IF NOT EXISTS idx_monday_subitems_parent ON public.monday_subitems_raw(parent_board, parent_item_id);
CREATE INDEX IF NOT EXISTS idx_monday_updates_parent ON public.monday_updates_raw(parent_board, parent_item_name);

-- Trigger to keep updated_at fresh
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['monday_leads_raw','monday_clients_raw','monday_no_oon_raw','monday_authorizations_raw','monday_auth_approvals_raw','monday_denials_raw','va_credentialing_raw']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_touch_%I ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_touch_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t, t);
  END LOOP;
END $$;

-- Enable RLS + policies
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['monday_leads_raw','monday_clients_raw','monday_no_oon_raw','monday_authorizations_raw','monday_auth_approvals_raw','monday_denials_raw','va_credentialing_raw','monday_subitems_raw','monday_updates_raw','monday_import_runs']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "read_state_scoped" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "admin_all" ON public.%I', t);
  END LOOP;
END $$;

-- State-scoped read for the stateful raw tables
CREATE POLICY "read_state_scoped" ON public.monday_leads_raw FOR SELECT
USING (public.can_read_all_states() OR state = public.current_user_state());
CREATE POLICY "read_state_scoped" ON public.monday_clients_raw FOR SELECT
USING (public.can_read_all_states() OR state = public.current_user_state());
CREATE POLICY "read_state_scoped" ON public.monday_no_oon_raw FOR SELECT
USING (public.can_read_all_states() OR state = public.current_user_state());
CREATE POLICY "read_state_scoped" ON public.monday_authorizations_raw FOR SELECT
USING (public.can_read_all_states() OR state = public.current_user_state());
CREATE POLICY "read_state_scoped" ON public.monday_denials_raw FOR SELECT
USING (public.can_read_all_states() OR state = public.current_user_state());

-- Approvals/credentialing/subitems/updates/audit: readable by any authorized internal role
CREATE POLICY "read_internal" ON public.monday_auth_approvals_raw FOR SELECT
USING (public.can_read_all_states() OR state = public.current_user_state());
CREATE POLICY "read_internal" ON public.va_credentialing_raw FOR SELECT
USING (public.can_read_all_states());
CREATE POLICY "read_internal" ON public.monday_subitems_raw FOR SELECT
USING (public.can_read_all_states());
CREATE POLICY "read_internal" ON public.monday_updates_raw FOR SELECT
USING (public.can_read_all_states());
CREATE POLICY "read_internal" ON public.monday_import_runs FOR SELECT
USING (public.can_read_all_states());

-- Admin write policies (service role bypasses RLS, this is for direct edits)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['monday_leads_raw','monday_clients_raw','monday_no_oon_raw','monday_authorizations_raw','monday_auth_approvals_raw','monday_denials_raw','va_credentialing_raw','monday_subitems_raw','monday_updates_raw','monday_import_runs']
  LOOP
    EXECUTE format('CREATE POLICY "admin_write" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(),''admin'') OR public.has_role(auth.uid(),''ops_manager'')) WITH CHECK (public.has_role(auth.uid(),''admin'') OR public.has_role(auth.uid(),''ops_manager''))', t);
  END LOOP;
END $$;
