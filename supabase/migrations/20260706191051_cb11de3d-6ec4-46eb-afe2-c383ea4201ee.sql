
CREATE TABLE IF NOT EXISTS public.state_centralreach_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('task','escalation','handoff','daily_health_note','manual_metric','other')),
  source_id uuid,
  centralreach_object_type text,
  centralreach_external_id text,
  action_type text NOT NULL CHECK (action_type IN ('needs_mapping','manual_update_required','ready_for_sync','blocked_missing_cr_id','other')),
  sync_status text NOT NULL DEFAULT 'not_connected' CHECK (sync_status IN ('not_connected','pending','synced','error')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_state_cr_outbox_state ON public.state_centralreach_outbox (state_code);
CREATE INDEX IF NOT EXISTS idx_state_cr_outbox_status ON public.state_centralreach_outbox (sync_status);
CREATE INDEX IF NOT EXISTS idx_state_cr_outbox_created ON public.state_centralreach_outbox (created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.state_centralreach_outbox TO authenticated;
GRANT ALL ON public.state_centralreach_outbox TO service_role;

ALTER TABLE public.state_centralreach_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CR outbox: leadership + state-scoped read"
ON public.state_centralreach_outbox FOR SELECT
TO authenticated
USING (
  public.user_is_leadership()
  OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
);

CREATE POLICY "CR outbox: leadership + state-scoped insert"
ON public.state_centralreach_outbox FOR INSERT
TO authenticated
WITH CHECK (
  public.user_is_leadership()
  OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
);

CREATE POLICY "CR outbox: leadership + state-scoped update"
ON public.state_centralreach_outbox FOR UPDATE
TO authenticated
USING (
  public.user_is_leadership()
  OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
)
WITH CHECK (
  public.user_is_leadership()
  OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
);

CREATE POLICY "CR outbox: leadership delete"
ON public.state_centralreach_outbox FOR DELETE
TO authenticated
USING (public.user_is_leadership());

CREATE OR REPLACE FUNCTION public.state_centralreach_outbox_touch()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_state_cr_outbox_touch ON public.state_centralreach_outbox;
CREATE TRIGGER trg_state_cr_outbox_touch
BEFORE UPDATE ON public.state_centralreach_outbox
FOR EACH ROW EXECUTE FUNCTION public.state_centralreach_outbox_touch();
