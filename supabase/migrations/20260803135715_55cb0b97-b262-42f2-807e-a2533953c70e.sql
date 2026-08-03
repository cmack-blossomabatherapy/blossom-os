ALTER TABLE public.cr_authorizations
  ADD COLUMN IF NOT EXISTS service_codes text,
  ADD COLUMN IF NOT EXISTS client_labels text,
  ADD COLUMN IF NOT EXISTS is_active boolean,
  ADD COLUMN IF NOT EXISTS actual_start_date date,
  ADD COLUMN IF NOT EXISTS actual_end_date date,
  ADD COLUMN IF NOT EXISTS followup_start_date date,
  ADD COLUMN IF NOT EXISTS followup_end_date date;

CREATE TABLE IF NOT EXISTS public.authorization_weekly_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  event_date date NOT NULL,
  client_name text,
  client_cr_id text,
  authorization_number text,
  payor text,
  state text,
  pause_reason text,
  pause_reason_detail text,
  notes text,
  logged_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.authorization_weekly_events TO authenticated;
GRANT ALL ON public.authorization_weekly_events TO service_role;

ALTER TABLE public.authorization_weekly_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_manage_authorization_events()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'exec')
    OR public.has_role(auth.uid(), 'ops_manager')
    OR public.has_role(auth.uid(), 'auth_team')
    OR public.has_role(auth.uid(), 'qa')
    OR public.has_role(auth.uid(), 'hr_admin')
$$;

CREATE POLICY "auth_weekly_events_read"
  ON public.authorization_weekly_events FOR SELECT TO authenticated
  USING (
    public.can_read_all_states()
    OR logged_by = auth.uid()
    OR state IS NULL
    OR lower(state) = lower(coalesce(public.current_user_state(), ''))
  );

CREATE POLICY "auth_weekly_events_insert"
  ON public.authorization_weekly_events FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_authorization_events());

CREATE POLICY "auth_weekly_events_update"
  ON public.authorization_weekly_events FOR UPDATE TO authenticated
  USING (public.can_manage_authorization_events() OR logged_by = auth.uid())
  WITH CHECK (public.can_manage_authorization_events() OR logged_by = auth.uid());

CREATE POLICY "auth_weekly_events_delete"
  ON public.authorization_weekly_events FOR DELETE TO authenticated
  USING (public.can_manage_authorization_events() OR logged_by = auth.uid());

CREATE INDEX IF NOT EXISTS authorization_weekly_events_date_idx
  ON public.authorization_weekly_events (event_date);
CREATE INDEX IF NOT EXISTS authorization_weekly_events_type_idx
  ON public.authorization_weekly_events (event_type);

CREATE TRIGGER authorization_weekly_events_touch
  BEFORE UPDATE ON public.authorization_weekly_events
  FOR EACH ROW EXECUTE FUNCTION public.cr_touch_updated_at();